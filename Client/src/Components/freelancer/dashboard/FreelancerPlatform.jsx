import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { FiEye } from 'react-icons/fi';
import { 
  FiBriefcase, FiHexagon, FiCalendar, FiClock, FiCheckCircle,
  FiSearch, FiFilter, FiUser, FiSend, FiPlus, FiAlertCircle,
  FiCode, FiPenTool, FiTrendingUp, FiFileText, FiClipboard, FiUsers, 
  FiMoreHorizontal, FiArrowRight, FiStar, FiAward, FiThumbsUp, FiX
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

// API URLs
const API_URL = import.meta.env.VITE_API_URL ||'http://localhost:5000/api';

function FreelancerPlatform() {

  // Add at the top with other state variables
const [proposalDetailsModalOpen, setProposalDetailsModalOpen] = useState(false);
const [proposalDetailsData, setProposalDetailsData] = useState(null);
  // State for projects and UI
  const [projects, setProjects] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    current: 1
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [newProposal, setNewProposal] = useState({
    coverLetter: "",
    bidAmount: "",
    estimatedDuration: {
      value: 1,
      unit: "days"
    }
  });

  const [projectDetailsModalOpen, setProjectDetailsModalOpen] = useState(false);
  const [projectDetailsData, setProjectDetailsData] = useState(null);
  
  // Stats for dashboard
  const [stats, setStats] = useState({
    pendingProposals: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalEarned: 0
  });
  
  // Refs for the proposal form
  const coverLetterRef = useRef(null);
  const bidAmountRef = useRef(null);
  const durationValueRef = useRef(null);
  const durationUnitRef = useRef(null);
  
  // Categories with icons
  const categories = [
    { id: "all", label: "All Categories", icon: <FiBriefcase /> },
    { id: "development", label: "Development", icon: <FiCode /> },
    { id: "design", label: "Design", icon: <FiPenTool /> },
    { id: "marketing", label: "Marketing", icon: <FiTrendingUp /> },
    { id: "writing", label: "Writing", icon: <FiFileText /> },
    { id: "admin", label: "Admin Support", icon: <FiClipboard /> },
    { id: "customer_service", label: "Customer Service", icon: <FiUsers /> },
    { id: "other", label: "Other", icon: <FiMoreHorizontal /> }
  ];
  // Add with other handler functions
const handleViewProposalDetails = (proposal) => {
  setProposalDetailsData(proposal);
  setProposalDetailsModalOpen(true);
};

  const handleViewProjectDetails = (project) => {
    setProjectDetailsData(project);
    setProjectDetailsModalOpen(true);
  };

  const ProjectDetailsModal = () => {
    if (!projectDetailsData) return null;
    
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white">
              Project Details
            </h3>
            <button 
              onClick={() => setProjectDetailsModalOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="p-6">
            {/* Project Header */}
            <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{projectDetailsData.title}</h2>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    projectDetailsData.status === 'open' 
                      ? 'bg-blue-900/60 text-blue-300' 
                      : projectDetailsData.status === 'in_progress'
                      ? 'bg-yellow-900/60 text-yellow-300'
                      : projectDetailsData.status === 'completed'
                      ? 'bg-green-900/60 text-green-300'
                      : 'bg-gray-900/60 text-gray-300'
                  }`}>
                    {projectDetailsData.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-gray-400 capitalize">
                    {projectDetailsData.category}
                  </span>
                </div>
              </div>
              
              <div className="text-2xl font-bold text-blue-400">
                {formatCurrency(projectDetailsData.budget)}
              </div>
            </div>
            
            {/* Project Details */}
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Description</h4>
                <div className="bg-gray-700/50 p-4 rounded-lg text-gray-300 whitespace-pre-wrap">
                  {projectDetailsData.description}
                </div>
              </div>
              
              {/* Client Info */}
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Client</h4>
                <div className="bg-gray-700/50 p-4 rounded-lg flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-lg font-bold mr-3">
                    {projectDetailsData.client?.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <div className="font-medium text-white">{projectDetailsData.client?.name || 'Client'}</div>
                  </div>
                </div>
              </div>
              
              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h5 className="text-gray-400 text-sm mb-1">Posted</h5>
                  <div className="text-white">
                    {new Date(projectDetailsData.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h5 className="text-gray-400 text-sm mb-1">Deadline</h5>
                  <div className="text-white">
                    {projectDetailsData.deadline 
                      ? new Date(projectDetailsData.deadline).toLocaleDateString() 
                      : 'No deadline'}
                  </div>
                </div>
                
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h5 className="text-gray-400 text-sm mb-1">Proposal Status</h5>
                  <div className="text-white">
                    {hasSubmittedProposal(projectDetailsData._id) ? 'Proposal Submitted' : 'Not Applied'}
                  </div>
                </div>
              </div>
              
              {/* Skills */}
              {projectDetailsData.skills?.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Required Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {projectDetailsData.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                {!hasSubmittedProposal(projectDetailsData._id) && projectDetailsData.status === 'open' && (
                  <button
                    onClick={() => {
                      handleOpenProposalModal(projectDetailsData);
                      setProjectDetailsModalOpen(false);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white flex items-center space-x-2"
                  >
                    <FiSend size={16} />
                    <span>Submit Proposal</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Format currency helper
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETH',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount).replace('ETH', 'ETH');
  };

  // Show notification helper 
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch available projects
  const fetchProjects = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', 10);
      
      if (selectedCategory !== 'all') {
        queryParams.append('category', selectedCategory);
      }
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      // Fetch available projects
      const response = await axios.get(`${API_URL}/projects/available?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProjects(response.data.projects || []);
      setPagination(response.data.pagination || { total: 0, pages: 1, current: 1 });
      
    } catch (err) {
      console.error('Error fetching projects:', err);
      let errorMessage = 'Failed to load projects. Please try again.';
      
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

  // Fetch my proposals and stats
  const fetchMyProposals = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_URL}/proposals/my-proposals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMyProposals(response.data.proposals || []);
      
      // Update stats
      if (response.data.stats) {
        setStats(prev => ({
          ...prev,
          pendingProposals: response.data.stats.pending || 0
        }));
      }
      
    } catch (err) {
      console.error('Error fetching proposals:', err);
    }
  };

  // Fetch my assignments (active jobs) and stats
  const fetchMyAssignments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_URL}/projects/my-assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update stats from assignments
      if (response.data.stats) {
        setStats(prev => ({
          ...prev,
          activeJobs: response.data.stats.active || 0,
          completedJobs: response.data.stats.completed || 0,
          totalEarned: response.data.stats.totalEarned || 0
        }));
      }
      
    } catch (err) {
      console.error('Error fetching assignments:', err);
      // Don't show notification for this error as it's not critical
      // Just keep existing stats
    }
  };

  // Load initial data
  useEffect(() => {
    fetchProjects();
    fetchMyProposals();
    
    // Use a try-catch to prevent assignment fetch from breaking page
    (async () => {
      try {
        await fetchMyAssignments();
      } catch (err) {
        console.error('Error loading assignments:', err);
        // Set default stats to prevent UI from breaking
        setStats(prev => ({
          ...prev,
          activeJobs: prev.activeJobs || 0,
          completedJobs: prev.completedJobs || 0,
          totalEarned: prev.totalEarned || 0
        }));
      }
    })();
  }, [selectedCategory, searchTerm]);

  // Handle opening the proposal modal
  const handleOpenProposalModal = (project) => {
    setSelectedProject(project);
    setIsProposalModalOpen(true);
  };

  // Handle proposal submission
  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Get data from refs
      const proposalData = {
        project: selectedProject._id,
        coverLetter: coverLetterRef.current.value,
        bidAmount: bidAmountRef.current.value,
        estimatedDuration: {
          value: durationValueRef.current.value,
          unit: durationUnitRef.current.value
        }
      };
      
      // Validation
      if (!proposalData.coverLetter.trim()) {
        showNotification('Cover letter is required', 'error');
        return;
      }
      
      if (!proposalData.bidAmount || isNaN(proposalData.bidAmount) || Number(proposalData.bidAmount) <= 0) {
        showNotification('Please enter a valid bid amount', 'error');
        return;
      }
      
      // Submit proposal
      const response = await axios.post(`${API_URL}/proposals`, proposalData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Close modal and reset form
      setIsProposalModalOpen(false);
      setSelectedProject(null);
      setNewProposal({
        coverLetter: "",
        bidAmount: "",
        estimatedDuration: {
          value: 1,
          unit: "days"
        }
      });
      
      // Update proposal list and stats
      fetchMyProposals();
      
      showNotification('Proposal submitted successfully!', 'success');
    } catch (err) {
      console.error('Error submitting proposal:', err);
      
      // Check for specific errors
      if (err.response?.status === 400 && err.response?.data?.message?.includes('already submitted')) {
        showNotification('You have already submitted a proposal for this project', 'error');
      } else {
        showNotification(err.response?.data?.message || 'Failed to submit proposal', 'error');
      }
    }
  };

  // Check if user has already submitted a proposal for the project
  const hasSubmittedProposal = (projectId) => {
    return myProposals.some(proposal => 
      proposal.project && proposal.project._id === projectId
    );
  };

  // Proposal form modal component
  const ProposalFormModal = () => {
    if (!selectedProject) return null;
    
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white">
              Submit Proposal
            </h3>
            <button 
              onClick={() => {
                setIsProposalModalOpen(false);
                setSelectedProject(null);
              }}
              className="text-gray-400 hover:text-white"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="p-6 border-b border-gray-700">
            <h4 className="text-lg font-medium text-white mb-2">{selectedProject.title}</h4>
            <div className="text-gray-400 mb-4">{selectedProject.description}</div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center text-blue-400 mr-4">
              <FiHexagon size={16} className="mr-1" />
              <span className="font-bold">{formatCurrency(selectedProject?.budget || 0)}</span>
            </div>
              
              {selectedProject.deadline && (
                <div className="flex items-center text-amber-400">
                  <FiCalendar size={16} className="mr-1" />
                  <span>Due: {new Date(selectedProject.deadline).toLocaleDateString()}</span>
                </div>
              )}
              
              <div className="flex items-center text-purple-400">
                <FiClock size={16} className="mr-1" />
                <span>Posted: {new Date(selectedProject.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            {selectedProject.skills && selectedProject.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedProject.skills.map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <form className="p-6 space-y-4" onSubmit={handleSubmitProposal}>
            <div>
              <label htmlFor="bidAmount" className="block text-gray-400 mb-1">Your Bid Amount (ETH)</label>
              <input 
                id="bidAmount"
                ref={bidAmountRef}
                type="number" 
                name="bidAmount"
                defaultValue={newProposal.bidAmount}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="e.g. 500"
                min="0"
                step="any"
              />
              {selectedProject.budget && (
                <p className="text-xs text-gray-400 mt-1">
                  Client's budget: {formatCurrency(selectedProject.budget)}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="durationValue" className="block text-gray-400 mb-1">Estimated Duration</label>
                <input 
                  id="durationValue"
                  ref={durationValueRef}
                  type="number" 
                  name="durationValue"
                  defaultValue={newProposal.estimatedDuration.value}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="Duration"
                  min="1"
                />
              </div>
              
              <div>
                <label htmlFor="durationUnit" className="block text-gray-400 mb-1">Time Unit</label>
                <select
                  id="durationUnit"
                  ref={durationUnitRef}
                  name="durationUnit"
                  defaultValue={newProposal.estimatedDuration.unit}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="coverLetter" className="block text-gray-400 mb-1">Cover Letter</label>
              <textarea 
                id="coverLetter"
                ref={coverLetterRef}
                name="coverLetter"
                defaultValue={newProposal.coverLetter}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white h-40"
                placeholder="Introduce yourself, explain why you're a good fit for this project, and describe your relevant experience..."
              />
            </div>
            
            <div className="flex justify-end pt-4 space-x-3">
              <button
                type="button"
                onClick={() => {
                  setIsProposalModalOpen(false);
                  setSelectedProject(null);
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white flex items-center"
              >
                <FiSend className="mr-2" /> Submit Proposal
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ProposalDetailsModal = () => {
    if (!proposalDetailsData) return null;
    
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white">
              Proposal Details
            </h3>
            <button 
              onClick={() => setProposalDetailsModalOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="p-6">
            {/* Header with project title and status */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {proposalDetailsData.project?.title || "Project"}
                </h2>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  proposalDetailsData.status === "pending"
                    ? "bg-yellow-500/20 text-yellow-300"
                    : proposalDetailsData.status === "accepted"
                    ? "bg-green-500/20 text-green-300"
                    : "bg-red-500/20 text-red-300"
                }`}>
                  {proposalDetailsData.status.toUpperCase()}
                </div>
              </div>
              
              <div className="flex items-center text-blue-400 mr-4">
                <FiHexagon size={16} className="mr-1" />
                <span className="font-bold">{formatCurrency(proposalDetailsData?.bidAmount || 0)}</span>
              </div>
            </div>
            
            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h5 className="text-gray-400 text-sm mb-1">Estimated Duration</h5>
                <div className="text-white">
                  {proposalDetailsData.estimatedDuration?.value} {proposalDetailsData.estimatedDuration?.unit}
                </div>
              </div>
              
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h5 className="text-gray-400 text-sm mb-1">Submitted On</h5>
                <div className="text-white">
                  {new Date(proposalDetailsData.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h5 className="text-gray-400 text-sm mb-1">Project Budget</h5>
                <div className="text-white">
                  {proposalDetailsData.project?.budget 
                    ? formatCurrency(proposalDetailsData.project.budget)
                    : 'Not specified'}
                </div>
              </div>
            </div>
            
            {/* Cover Letter */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-white mb-2">Your Cover Letter</h4>
              <div className="bg-gray-700/50 p-4 rounded-lg text-gray-300 whitespace-pre-wrap">
                {proposalDetailsData.coverLetter}
              </div>
            </div>
            
            {/* Client Notes (if any) */}
            {proposalDetailsData.clientNotes && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-white mb-2">Client Response</h4>
                <div className="bg-gray-700/50 p-4 rounded-lg text-gray-300">
                  {proposalDetailsData.clientNotes}
                </div>
              </div>
            )}
            
            {/* Status-specific messages */}
            {proposalDetailsData.status === 'accepted' && (
              <div className="bg-green-900/20 p-4 rounded-lg mb-6">
                <div className="flex items-center text-green-300">
                  <FiCheckCircle size={20} className="mr-2" />
                  <span>Congratulations! Your proposal has been accepted. The client has hired you for this project.</span>
                </div>
              </div>
            )}
            
            {proposalDetailsData.status === 'rejected' && (
              <div className="bg-red-900/20 p-4 rounded-lg mb-6">
                <div className="flex items-center text-red-300">
                  <FiX size={20} className="mr-2" />
                  <span>This proposal was not accepted by the client. Don't be discouraged - keep submitting quality proposals!</span>
                </div>
              </div>
            )}
            
            {/* Project Description if available */}
            {proposalDetailsData.project?.description && (
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Project Description</h4>
                <div className="bg-gray-700/50 p-4 rounded-lg text-gray-300 whitespace-pre-wrap">
                  {proposalDetailsData.project.description}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with title */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Freelancer Dashboard</h1>
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
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-400 text-sm">Pending Proposals</h3>
              <p className="text-2xl font-bold text-white mt-1">{stats.pendingProposals}</p>
            </div>
            <div className="bg-blue-500/20 p-2 rounded">
              <FiSend className="text-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-400 text-sm">Active Jobs</h3>
              <p className="text-2xl font-bold text-white mt-1">{stats.activeJobs}</p>
            </div>
            <div className="bg-green-500/20 p-2 rounded">
              <FiBriefcase className="text-green-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-400 text-sm">Completed Jobs</h3>
              <p className="text-2xl font-bold text-white mt-1">{stats.completedJobs}</p>
            </div>
            <div className="bg-purple-500/20 p-2 rounded">
              <FiCheckCircle className="text-purple-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-400 text-sm">Total Earned</h3>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(stats.totalEarned)}</p>
            </div>
            <div className="bg-amber-500/20 p-2 rounded">
              <FiHexagon className="text-amber-500" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold text-white mb-6">Find Work</h2>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col md:flex-row gap-2 w-full">
            <div className="relative flex-grow">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-full"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white md:w-48"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
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
              onClick={() => fetchProjects()}
              className="mt-3 px-4 py-1 bg-red-700 hover:bg-red-800 rounded"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Projects List */}
        {!loading && !error && projects.length > 0 ? (
          <div className="space-y-6">
            {projects.map(project => (
              <div key={project._id} className="bg-gray-700 p-5 rounded-lg hover:bg-gray-700/80 transition-colors">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-1">{project.title}</h3>
                    <p className="text-gray-300 mt-1 line-clamp-2">{project.description}</p>
                  </div>
                  
                  <div className="flex items-center">
                  <div className="flex items-center text-blue-400 mr-4">
                    
                    <span className="font-bold">{formatCurrency(project?.budget || 0)}</span>
                  </div>
                    
                    {project.deadline && (
                      <div className="flex items-center text-amber-400">
                        <FiCalendar size={16} className="mr-1" />
                        <span>{new Date(project.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Project skills */}
                {project.skills && project.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {project.skills.map((skill, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Project metadata */}
                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center text-gray-400">
                    <FiClock size={16} className="mr-1" />
                    <span>Posted: {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-400">
                    <FiUser size={16} className="mr-1" />
                    <span>Client: {project.client?.name || 'Anonymous'}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-400">
                    <FiBriefcase size={16} className="mr-1" />
                    <span className="capitalize">{project.category}</span>
                  </div>
                </div>
                
                {/* Project actions */}
                <div className="flex justify-between items-center mt-5">
                <button
                  onClick={() => handleViewProjectDetails(project)}
                  className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm flex items-center"
                >
                  <FiEye className="mr-1" /> View Details
                </button>
                                  
                  <button
                    onClick={() => handleOpenProposalModal(project)}
                    disabled={hasSubmittedProposal(project._id)}
                    className={`px-4 py-2 rounded text-white text-sm flex items-center ${
                      hasSubmittedProposal(project._id)
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {hasSubmittedProposal(project._id) ? (
                      <>Proposal Submitted <FiCheckCircle className="ml-2" /></>
                    ) : (
                      <>Submit Proposal <FiSend className="ml-2" /></>
                    )}
                  </button>
                </div>
              </div>
            ))}
            
            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => fetchProjects(page)}
                    className={`px-3 py-1 rounded ${
                      pagination.current === page
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Empty state
          !loading && !error && (
            <div className="bg-gray-700 p-8 rounded-lg text-center">
              <FiBriefcase size={48} className="mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-medium text-white mb-2">No Projects Found</h3>
              <p className="text-gray-400 mb-6">
                We couldn't find any projects matching your criteria. Try adjusting your filters or check back later.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchTerm('');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center mx-auto"
              >
                <FiFilter className="mr-2" /> Clear Filters
              </button>
            </div>
          )
        )}
      </div>
      
      {/* My Proposals Section */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold text-white mb-6">My Recent Proposals</h2>
        
        {myProposals.length > 0 ? (
          <div className="space-y-4">
            {myProposals.slice(0, 5).map(proposal => (
              <div key={proposal._id} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      {proposal.project?.title || "Project"}
                    </h3>
                    
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                      proposal.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : proposal.status === "accepted"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-red-500/20 text-red-300"
                    }`}>
                      {proposal.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-blue-400">
                    
                    <span>{formatCurrency(proposal.bidAmount)}</span>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-400 text-sm mt-2">
                  <FiClock size={14} className="mr-1" />
                  <span>Submitted: {new Date(proposal.createdAt).toLocaleDateString()}</span>
                </div>
                
                <button
                    onClick={() => handleViewProposalDetails(proposal)}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm mt-3 flex items-center"
                  >
                    <FiEye className="mr-1" /> View Details
                  </button>
              </div>
            ))}
            
            {myProposals.length > 5 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => window.open('/proposals', '_blank')}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                >
                  View All Proposals ({myProposals.length})
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-700 p-6 rounded-lg text-center">
            <FiSend size={48} className="mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-medium text-white mb-2">No Proposals Yet</h3>
            <p className="text-gray-400">
              You haven't submitted any proposals yet. Find projects that match your skills and start bidding!
            </p>
          </div>
        )}
      </div>
      
      {/* My Active Jobs Section */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold text-white mb-6">My Active Jobs</h2>
        
        {stats.activeJobs > 0 ? (
          <div className="text-center">
          <Link
              to="/assignments"
              className="bg-gray-700 hover:bg-gray-600 p-5 rounded-lg shadow-md flex items-center justify-center space-x-3 mx-auto transition-all duration-300 group w-full max-w-md"
            >
              <div className="bg-green-500/20 p-3 rounded-full group-hover:bg-green-500/30 transition-all">
                <FiBriefcase className="text-green-500" size={24} />
              </div>
              <div className="text-left">
                <span className="block text-white font-medium">View My Active Jobs</span>
                <span className="text-green-400 text-sm">{stats.activeJobs} projects in progress</span>
              </div>
              <div className="ml-auto">
                <FiArrowRight className="text-gray-400 group-hover:text-white transition-colors" />
              </div>
          </Link>
          </div>
        ) : (
          <div className="bg-gray-700 p-6 rounded-lg text-center">
            <FiBriefcase size={48} className="mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-medium text-white mb-2">No Active Jobs</h3>
            <p className="text-gray-400">
              You don't have any active jobs at the moment. Submit proposals to find work!
            </p>
          </div>
        )}
      </div>
      
      {/* Proposal form modal */}
      {isProposalModalOpen && <ProposalFormModal />}
      {projectDetailsModalOpen && <ProjectDetailsModal />}
      {proposalDetailsModalOpen && <ProposalDetailsModal />}
    </div>
  );
}

export default FreelancerPlatform;