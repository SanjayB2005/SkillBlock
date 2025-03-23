import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiBriefcase, FiDollarSign, FiCalendar, FiClock, FiCheckCircle,
  FiMessageSquare, FiAlertCircle, FiUser, FiFileText, FiStar,
  FiArrowLeft, FiChevronRight, FiPaperclip, FiSend, FiEye, FiX
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const API_URL = 'https://skillblock.onrender.com/api';

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

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
      
      setAssignments(response.data.assignments || []);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      let errorMessage = 'Failed to load assignments. Please try again.';
      
      if (err.response) {
        errorMessage = err.response.data.message || errorMessage;
      } else if (err.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle opening the details modal
  const handleViewDetails = (assignment) => {
    setSelectedAssignment(assignment);
    setDetailsModalOpen(true);
  };

  // Assignment Details Modal
  const AssignmentDetailsModal = () => {
    if (!selectedAssignment) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white">
              Assignment Details
            </h3>
            <button 
              onClick={() => setDetailsModalOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{selectedAssignment.title}</h2>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-full text-xs bg-green-900/60 text-green-300">
                    IN PROGRESS
                  </span>
                  <span className="text-gray-400 capitalize">
                    {selectedAssignment.category}
                  </span>
                </div>
              </div>
              
              <div className="text-2xl font-bold text-blue-400">
                {formatCurrency(selectedAssignment.budget)}
              </div>
            </div>
            
            {/* Project Details */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Description</h4>
                <div className="bg-gray-700/50 p-4 rounded-lg text-gray-300 whitespace-pre-wrap">
                  {selectedAssignment.description}
                </div>
              </div>
              
              {/* Client Info */}
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Client</h4>
                <div className="bg-gray-700/50 p-4 rounded-lg flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-lg font-bold mr-3">
                    {selectedAssignment.client?.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <div className="font-medium text-white">{selectedAssignment.client?.name || 'Client'}</div>
                    <div className="text-sm text-gray-400">{selectedAssignment.client?.email || ''}</div>
                  </div>
                </div>
              </div>
              
              {/* Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h5 className="text-gray-400 text-sm mb-1">Started On</h5>
                  <div className="text-white">
                    {new Date(selectedAssignment.startDate || selectedAssignment.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h5 className="text-gray-400 text-sm mb-1">Deadline</h5>
                  <div className="text-white">
                    {selectedAssignment.deadline 
                      ? new Date(selectedAssignment.deadline).toLocaleDateString() 
                      : 'No deadline'}
                  </div>
                </div>
                
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h5 className="text-gray-400 text-sm mb-1">Duration</h5>
                  <div className="text-white">
                    {selectedAssignment.proposal?.estimatedDuration?.value} {selectedAssignment.proposal?.estimatedDuration?.unit}
                  </div>
                </div>
              </div>
              
              {/* Skills */}
              {selectedAssignment.skills?.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAssignment.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Your Proposal */}
              {selectedAssignment.proposal && (
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Your Accepted Proposal</h4>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <div className="text-blue-400 font-semibold">Your Bid: {formatCurrency(selectedAssignment.proposal.bidAmount)}</div>
                      <div className="bg-green-900/20 text-green-300 px-2 py-1 rounded-full text-xs">ACCEPTED</div>
                    </div>
                    <div className="text-gray-300 whitespace-pre-wrap mb-2">
                      {selectedAssignment.proposal.coverLetter}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-32">
      {/* Header with title */}
      <div className="flex items-center mb-6">
        <Link to="/freelancer-dashboard" className="text-blue-400 hover:text-blue-300 mr-4">
          <FiArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold text-white">My Active Jobs</h1>
      </div>
      
      {/* Notification */}
      {notification && (
        <div className={`p-4 mb-4 rounded-lg ${
          notification.type === 'error' ? 'bg-red-900/50 text-red-200' :
          notification.type === 'success' ? 'bg-green-900/50 text-green-200' :
          'bg-blue-900/50 text-blue-200'
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
      
      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-900/30 text-red-200 p-4 rounded-lg text-center my-6">
          <FiAlertCircle size={24} className="mx-auto mb-2" />
          <p>{error}</p>
          <button 
            onClick={() => fetchAssignments()}
            className="mt-3 px-4 py-1 bg-red-700 hover:bg-red-800 rounded"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Assignments List */}
      {!loading && !error && assignments.length > 0 ? (
        <div className="space-y-6">
          {assignments.map(assignment => (
            <div key={assignment._id} className="bg-gray-800 p-5 rounded-lg hover:bg-gray-800/90 transition-colors">
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">{assignment.title}</h3>
                  <p className="text-gray-400 line-clamp-2">{assignment.description}</p>
                </div>
                
                <div className="flex items-center">
                  <div className="flex items-center text-blue-400 mr-4">
                    <FiDollarSign size={16} className="mr-1" />
                    <span className="font-bold">{formatCurrency(assignment.budget)}</span>
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
                
                <button
                  onClick={() => handleViewDetails(assignment)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm flex items-center"
                >
                  <FiEye className="mr-1" /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && !error && (
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
        )
      )}
      
      {/* Details Modal */}
      {detailsModalOpen && <AssignmentDetailsModal />}
    </div>
  );
}

export default Assignments;