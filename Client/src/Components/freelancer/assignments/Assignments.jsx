import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiBriefcase, FiHexagon, FiCalendar, FiCheckCircle,
  FiAlertCircle, FiUser, FiEye, FiX, FiArrowLeft
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.API_URL ||'http://localhost:5000/api';

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [completeInProgress, setCompleteInProgress] = useState(false);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETH',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount).replace('ETH', 'ETH');
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_URL}/projects/my-assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let assignmentsData = [];
      if (Array.isArray(response.data)) {
        assignmentsData = response.data;
      } else if (response.data?.assignments) {
        assignmentsData = response.data.assignments;
      } else if (response.data?.projects) {
        assignmentsData = response.data.projects;
      } else {
        throw new Error('Unexpected response format from server');
      }
      
      setAssignments(assignmentsData);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  // Handle marking a project as complete
  const handleMarkAsComplete = async (assignment) => {
    if (!assignment?._id) return;
    
    try {
      setCompleteInProgress(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      try {
        await axios.put(
          `${API_URL}/projects/${assignment._id}/freelancer-complete`,
          { completedAt: new Date().toISOString() },
          { headers: { Authorization: `Bearer ${token}` }}
        );
      } catch (firstError) {
        if (firstError.response?.status === 404) {
          await axios.put(
            `${API_URL}/projects/${assignment._id}/complete`,
            { completedAt: new Date().toISOString() },
            { headers: { Authorization: `Bearer ${token}` }}
          );
        } else {
          throw firstError;
        }
      }

      setAssignments(prev => 
        prev.map(a => a._id === assignment._id ? {...a, status: 'completed'} : a)
      );

      if (selectedAssignment?._id === assignment._id) {
        setSelectedAssignment({...selectedAssignment, status: 'completed'});
      }

      showNotification('Project marked as complete!', 'success');
    } catch (err) {
      console.error('Error marking project as complete:', err);
      const errorMessage = err.response?.status === 403
        ? 'You do not have permission to complete this project'
        : err.response?.data?.message || 'Failed to mark project as complete';
      showNotification(errorMessage, 'error');
    } finally {
      setCompleteInProgress(false);
    }
  };

  // Handle opening the details modal
  const handleViewDetails = (assignment) => {
    if (assignment) {
      setSelectedAssignment(assignment);
      setDetailsModalOpen(true);
    }
  };

  // Load assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, []);

  // Assignment Details Modal Component
  const AssignmentDetailsModal = () => {
    if (!selectedAssignment) return null;

    const canComplete = selectedAssignment.status !== 'completed';

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Modal content */}
          {/* ... Your existing modal content ... */}
          <button 
            onClick={() => setDetailsModalOpen(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <FiX size={24} />
          </button>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link to="/freelancer-dashboard" className="text-blue-400 hover:text-blue-300 mr-4">
          <FiArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold text-white">My Active Jobs</h1>
      </div>

      {notification && (
        <div className={`p-4 mb-4 rounded-lg ${
          notification.type === 'error' ? 'bg-red-900/50 text-red-200' :
          notification.type === 'success' ? 'bg-green-900/50 text-green-200' :
          'bg-blue-900/50 text-blue-200'
        }`}>
          {notification.message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 text-red-200 p-4 rounded-lg text-center my-6">
          <FiAlertCircle size={24} className="mx-auto mb-2" />
          <p>{error}</p>
          <button 
            onClick={fetchAssignments}
            className="mt-3 px-4 py-1 bg-red-700 hover:bg-red-800 rounded"
          >
            Retry
          </button>
        </div>
      ) : assignments.length > 0 ? (
        <div className="space-y-6">
          {assignments.map(assignment => assignment && (
            <div 
              key={assignment._id || Math.random()} 
              className={`bg-gray-800 p-5 rounded-lg hover:bg-gray-800/90 transition-colors
                ${assignment.status === 'completed' ? 'border-l-4 border-blue-500' : ''}`}
            >
              {/* Assignment card content */}
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-medium text-white">
                      {assignment.title || 'Untitled Assignment'}
                    </h3>
                    {assignment.status === 'completed' && (
                      <span className="bg-blue-900/40 text-blue-200 px-2 py-0.5 rounded-full text-xs">
                        COMPLETED
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 line-clamp-2">
                    {assignment.description || 'No description available'}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-blue-400">
                    <FiHexagon size={16} className="mr-1" />
                    <span className="font-bold">{formatCurrency(assignment.budget || 0)}</span>
                  </div>
                  
                  {assignment.deadline && (
                    <div className="flex items-center text-amber-400">
                      <FiCalendar size={16} className="mr-1" />
                      <span>{new Date(assignment.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-between mt-4">
                <div className="flex items-center text-gray-400 text-sm">
                  <FiUser size={14} className="mr-1" />
                  <span>Client: {assignment.client?.name || 'Anonymous'}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  {assignment.status !== 'completed' && (
                    <button
                      onClick={() => handleMarkAsComplete(assignment)}
                      disabled={completeInProgress}
                      className={`px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-white text-sm flex items-center
                        ${completeInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <FiCheckCircle className="mr-1" /> Complete
                    </button>
                  )}
                  <button
                    onClick={() => handleViewDetails(assignment)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm flex items-center"
                  >
                    <FiEye className="mr-1" /> Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 p-8 rounded-lg text-center">
          <FiBriefcase size={48} className="mx-auto mb-4 text-gray-500" />
          <h3 className="text-xl font-medium text-white mb-2">No Active Jobs</h3>
          <p className="text-gray-400 mb-6">
            You don't have any active jobs at the moment. Check back later or find new projects to bid on.
          </p>
          <Link to="/freelancer-dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded inline-flex items-center">
            <FiBriefcase className="mr-2" /> Find Work
          </Link>
        </div>
      )}
      
      {detailsModalOpen && <AssignmentDetailsModal />}
    </div>
  );
}

export default Assignments;