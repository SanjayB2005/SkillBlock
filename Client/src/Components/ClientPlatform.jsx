import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiBriefcase, FiPenTool, FiCode, FiTrendingUp, FiMessageSquare, 
  FiPlus, FiX, FiEdit2, FiTrash2, FiAlertCircle, FiSend, 
  FiCheckCircle, FiUser, FiCalendar, FiClock, FiAward, FiEye
} from 'react-icons/fi';

// API URLs
const API_URL = 'http://localhost:5000/api';

function ClientPlatform() {
  // State for projects and UI
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ 
    title: "", 
    description: "", 
    budget: "", 
    deadline: "", 
    category: "development",
    skills: ""
  });
  const [notification, setNotification] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    current: 1
  });
  
  // State for handling proposals
  const [proposalsModalOpen, setProposalsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectProposals, setSelectedProjectProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(false);
  const [proposalError, setProposalError] = useState(null);
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(true); // State to toggle auto-accept feature
  
  // New state for project details modal
  const [projectDetailsModalOpen, setProjectDetailsModalOpen] = useState(false);
  const [projectDetailsData, setProjectDetailsData] = useState(null);
  
  // Real-time stats state
  const [stats, setStats] = useState({
    active: 0,
    completed: 0,
    total: 0,
    totalBudget: 0
  });
  
  // Categories with icons
  const categories = [
    { id: "all", label: "All Projects", icon: <FiBriefcase /> },
    { id: "design", label: "Design", icon: <FiPenTool /> },
    { id: "development", label: "Development", icon: <FiCode /> },
    { id: "marketing", label: "Marketing", icon: <FiTrendingUp /> },
    { id: "writing", label: "Writing", icon: <FiMessageSquare /> },
    { id: "other", label: "Other", icon: <FiBriefcase /> }
  ];
  
  // Fetch projects from the API
  const fetchProjects = async (page = 1) => {
    try {
      setLoading(true);
      
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
      
      // Fetch projects and stats
      const response = await axios.get(`${API_URL}/projects/my-projects?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProjects(response.data.projects);
      setStats(response.data.stats);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Auto-accept lowest bid proposal
  const autoAcceptLowestBid = async (projectId, proposals) => {
    try {
      // Only proceed if auto-accept is enabled and we have exactly 5 proposals
      if (!autoAcceptEnabled || proposals.length !== 5) {
        return;
      }
      
      // Check if all proposals are pending
      const pendingProposals = proposals.filter(p => p.status === 'pending');
      if (pendingProposals.length !== 5) {
        return; // Some proposals already accepted/rejected
      }
      
      // Find the proposal with the lowest bid amount
      const lowestBidProposal = proposals.reduce((lowest, current) => {
        return (current.bidAmount < lowest.bidAmount) ? current : lowest;
      }, proposals[0]);
      
      // Auto-accept the lowest bid proposal
      if (lowestBidProposal && lowestBidProposal._id) {
        // Set selectedProject if it's not already set (this is what's causing the error)
        if (!selectedProject || selectedProject._id !== projectId) {
          const project = projects.find(p => p._id === projectId);
          setSelectedProject(project);
        }
        
        await handleAcceptProposal(lowestBidProposal._id, true);
      }
    } catch (error) {
      console.error('Auto-accept error:', error);
      showNotification('Failed to auto-accept proposal', 'error');
    }
  };

  // New function to fetch proposals for a project
  const fetchProjectProposals = async (projectId) => {
    try {
      setProposalsLoading(true);
      setProposalError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_URL}/proposals/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const proposals = response.data.proposals || [];
      setSelectedProjectProposals(proposals);
      
      // Check for auto-accept conditions
      const project = projects.find(p => p._id === projectId);
      if (project?.status === 'open' && proposals.length === 5) {
        await autoAcceptLowestBid(projectId, proposals);
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
      setProposalError('Failed to load proposals. Please try again.');
    } finally {
      setProposalsLoading(false);
    }
  };
  
  // Handle opening the proposals modal
  const handleViewProposals = async (project) => {
    setSelectedProject(project);
    setProposalsModalOpen(true);
    await fetchProjectProposals(project._id);
  };
  
  // Handle viewing project details
  const handleViewProjectDetails = (project) => {
    setProjectDetailsData(project);
    setProjectDetailsModalOpen(true);
  };
  
  // Handle accepting a proposal
  const handleAcceptProposal = async (proposalId, isAutoAccept = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await axios.put(`${API_URL}/proposals/${proposalId}/status`, 
        { status: 'accepted' },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Refresh proposal list and projects
      await fetchProjectProposals(selectedProject._id);
      await fetchProjects();
      
      // Only show notification if it's not auto-accepted or if it is auto-accepted and we want to show that too
      if (!isAutoAccept) {
        showNotification('Proposal accepted successfully! The freelancer has been hired.', 'success');
      } else {
        const acceptedProposal = selectedProjectProposals.find(p => p._id === proposalId);
        showNotification(
          `Auto-accepted proposal from ${acceptedProposal?.freelancer?.name || 'Freelancer'} with the lowest bid of ${formatCurrency(acceptedProposal?.bidAmount || 0)}`, 
          'success'
        );
      }
    } catch (err) {
      console.error('Error accepting proposal:', err);
      showNotification(err.response?.data?.message || 'Failed to accept proposal', 'error');
    }
  };
  
  // Handle rejecting a proposal
  const handleRejectProposal = async (proposalId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await axios.put(`${API_URL}/proposals/${proposalId}/status`, 
        { 
          status: 'rejected',
          clientNotes: 'Your proposal does not meet our requirements at this time.'
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Refresh proposal list
      await fetchProjectProposals(selectedProject._id);
      
      showNotification('Proposal rejected successfully.', 'success');
    } catch (err) {
      console.error('Error rejecting proposal:', err);
      showNotification(err.response?.data?.message || 'Failed to reject proposal', 'error');
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchProjects();
  }, [selectedCategory, searchTerm]);
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Show notification
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  // Reset form
  const resetForm = () => {
    setNewProject({ 
      title: "", 
      description: "", 
      budget: "", 
      deadline: "", 
      category: "development",
      skills: ""
    });
    setEditingProject(null);
  };

  // Handle form submission for new or edited projects
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const formData = {
        ...newProject,
        skills: newProject.skills.split(',').map(skill => skill.trim())
      };
      
      let response;
      
      if (editingProject) {
        // Update existing project
        response = await axios.put(`${API_URL}/projects/${editingProject._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('Project updated successfully!', 'success');
      } else {
        // Create new project
        response = await axios.post(`${API_URL}/projects`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('Project created successfully!', 'success');
      }
      
      // Refresh projects list
      fetchProjects();
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving project:', err);
      showNotification(err.response?.data?.message || 'Failed to save project', 'error');
    }
  };
  
  // Handle project deletion
  const handleDeleteProject = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      await axios.delete(`${API_URL}/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showNotification('Project deleted successfully', 'success');
      fetchProjects();
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      showNotification(err.response?.data?.message || 'Failed to delete project', 'error');
    }
  };
  
  // Open edit modal with project data
  const handleEditProject = (project) => {
    setEditingProject(project);
    setNewProject({
      title: project.title,
      description: project.description,
      budget: project.budget,
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
      category: project.category,
      skills: Array.isArray(project.skills) ? project.skills.join(', ') : ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Project modal component
  const ProjectModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </h3>
          <button 
            onClick={() => {
              setIsModalOpen(false);
              resetForm();
            }}
            className="text-gray-400 hover:text-white"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-1" htmlFor="title">Project Title</label>
              <input 
                type="text" 
                id="title"
                name="title"
                value={newProject.title}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1" htmlFor="description">Description</label>
              <textarea 
                id="description"
                name="description"
                value={newProject.description}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white h-24"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-1" htmlFor="budget">Budget (USD)</label>
                <input 
                  type="number" 
                  id="budget"
                  name="budget"
                  value={newProject.budget}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                  min="1"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-1" htmlFor="deadline">Deadline</label>
                <input 
                  type="date" 
                  id="deadline"
                  name="deadline"
                  value={newProject.deadline}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1" htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={newProject.category}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                {categories.filter(cat => cat.id !== 'all').map(category => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-400 mb-1" htmlFor="skills">Skills Required (comma separated)</label>
              <input 
                type="text" 
                id="skills"
                name="skills"
                value={newProject.skills}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="e.g. React, Node.js, UI Design"
              />
            </div>
          </div>
          
          <div className="mt-6 flex space-x-3">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
            >
              {editingProject ? 'Update Project' : 'Create Project'}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // New Project Details Modal component
  const ProjectDetailsModal = () => {
    if (!projectDetailsData) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
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
                  <h5 className="text-gray-400 text-sm mb-1">Proposals</h5>
                  <div className="text-white">
                    {projectDetailsData.proposalCount || '0'} received
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
              
              {/* Freelancer info if hired */}
              {projectDetailsData.hiredFreelancer && (
                <div>
                  <h4 className="text-lg font-medium text-white mb-2">Hired Freelancer</h4>
                  <div className="bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold mr-3">
                        {projectDetailsData.hiredFreelancer.name?.charAt(0).toUpperCase() || 'F'}
                      </div>
                      <div>
                        <div className="font-medium text-white">{projectDetailsData.hiredFreelancer.name}</div>
                        <div className="text-sm text-gray-400">{projectDetailsData.hiredFreelancer.email}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={() => {
                    handleViewProposals(projectDetailsData);
                    setProjectDetailsModalOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white flex items-center space-x-2"
                >
                  <FiSend size={16} />
                  <span>View Proposals</span>
                </button>
                
                {projectDetailsData.status === 'open' && (
                  <button
                    onClick={() => {
                      handleEditProject(projectDetailsData);
                      setProjectDetailsModalOpen(false);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white flex items-center space-x-2"
                  >
                    <FiEdit2 size={16} />
                    <span>Edit Project</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Proposals Modal component
  const ProposalsModal = () => {
    if (!selectedProject) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white">
              Proposals for "{selectedProject.title}"
            </h3>
            <button 
              onClick={() => setProposalsModalOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="p-6">
            {/* Project status info */}
            <div className="mb-4 p-4 rounded-lg bg-gray-700/50">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white font-medium">Project Status</h4>
                  <p className="text-gray-400 text-sm">
                    {selectedProject.status === 'open' 
                      ? 'This project is open for proposals.' 
                      : selectedProject.status === 'in_progress'
                      ? 'This project is in progress. You have already hired a freelancer.'
                      : selectedProject.status === 'completed'
                      ? 'This project has been completed.'
                      : 'This project is no longer accepting proposals.'}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  selectedProject.status === 'open' 
                    ? 'bg-blue-900/60 text-blue-300' 
                    : selectedProject.status === 'in_progress'
                    ? 'bg-yellow-900/60 text-yellow-300'
                    : selectedProject.status === 'completed'
                    ? 'bg-green-900/60 text-green-300'
                    : 'bg-gray-900/60 text-gray-300'
                }`}>
                  {selectedProject.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              {selectedProject.hiredFreelancer && (
                <div className="mt-2 p-3 rounded-lg bg-green-900/20 text-green-300">
                  <div className="flex items-center">
                    <FiUser className="mr-2" />
                    <span className="font-medium">Hired Freelancer:</span>
                    <span className="ml-2">{selectedProject.hiredFreelancer.name}</span>
                  </div>
                </div>
              )}
              
              {/* Auto-accept toggle */}
              {selectedProject.status === 'open' && (
                <div className="mt-3 p-3 rounded-lg bg-blue-900/20 text-blue-300 flex justify-between items-center">
                  <div className="flex items-center">
                    <FiAward className="mr-2" />
                    <span>Auto-accept lowest bid when 5 proposals are received</span>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={autoAcceptEnabled}
                      onChange={() => setAutoAcceptEnabled(!autoAcceptEnabled)}
                    />
                    <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              )}
            </div>
            
            {/* Loading state */}
            {proposalsLoading && (
              <div className="flex justify-center py-10">
                <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
            
            {/* Error state */}
            {proposalError && !proposalsLoading && (
              <div className="bg-red-900/30 text-red-200 p-4 rounded-lg text-center my-6">
                <FiAlertCircle size={24} className="mx-auto mb-2" />
                <p>{proposalError}</p>
                <button
                  onClick={() => fetchProjectProposals(selectedProject._id)}
                  className="mt-3 px-4 py-1 bg-red-700 hover:bg-red-800 rounded"
                >
                  Retry
                </button>
              </div>
            )}
            
            {/* Auto-accept notification for 5 proposals */}
            {!proposalsLoading && !proposalError && 
             selectedProjectProposals.length === 5 && 
             selectedProjectProposals.filter(p => p.status === 'pending').length === 5 &&
             selectedProject.status === 'open' && 
             autoAcceptEnabled && (
              <div className="bg-blue-900/30 text-blue-200 p-4 rounded-lg text-center my-4">
                <div className="flex items-center justify-center mb-2">
                  <FiAward size={20} className="mr-2" />
                  <span className="font-medium">Auto-Accept Activated</span>
                </div>
                <p>This project has reached 5 proposals. The lowest bid will be automatically accepted.</p>
              </div>
            )}
            
            {/* Proposals list */}
            {!proposalsLoading && !proposalError && selectedProjectProposals.length > 0 ? (
              <div className="space-y-6">
                {selectedProjectProposals.map(proposal => (
                  <div key={proposal._id} className="bg-gray-700 p-5 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold mr-3">
                          {proposal.freelancer?.name?.charAt(0).toUpperCase() || 'F'}
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-white">{proposal.freelancer?.name || 'Freelancer'}</h4>
                          <span className="text-gray-400 text-sm">{proposal.freelancer?.email || 'No email provided'}</span>
                        </div>
                      </div>
                      
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        proposal.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : proposal.status === 'accepted'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {proposal.status.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-gray-400 text-sm">Bid Amount</div>
                        <div className="text-lg font-semibold text-white">{formatCurrency(proposal.bidAmount)}</div>
                      </div>
                      
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-gray-400 text-sm">Estimated Duration</div>
                        <div className="text-lg font-semibold text-white">
                          {proposal.estimatedDuration?.value || 'N/A'} {proposal.estimatedDuration?.unit || ''}
                        </div>
                      </div>
                      
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-gray-400 text-sm">Submitted</div>
                        <div className="text-lg font-semibold text-white">
                          {new Date(proposal.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <div className="text-gray-400 mb-1">Cover Letter</div>
                      <div className="bg-gray-800/50 p-3 rounded-lg text-white">
                        {proposal.coverLetter}
                      </div>
                    </div>
                    
                    {proposal.status === 'pending' && selectedProject.status === 'open' && (
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => handleAcceptProposal(proposal._id)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white flex items-center space-x-2"
                        >
                          <FiCheckCircle size={16} />
                          <span>Accept & Hire</span>
                        </button>
                        
                        <button
                          onClick={() => handleRejectProposal(proposal._id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white flex items-center space-x-2"
                        >
                          <FiX size={16} />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              !proposalsLoading && !proposalError && (
                <div className="text-center py-8">
                  <FiSend size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No proposals have been submitted for this project yet.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Confirmation modal
  const ConfirmationModal = ({ project }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
        <div className="text-center mb-6">
          <FiAlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Delete Project</h3>
          <p className="text-gray-400">
            Are you sure you want to delete "{project.title}"? This action cannot be undone.
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => handleDeleteProject(project._id)}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
          >
            Delete
          </button>
          
          <button
            onClick={() => setConfirmDelete(null)}
            className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
  
  // Stats card component
  const StatCard = ({ icon, label, value, prefix = "" }) => (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg transition-all duration-300 hover:shadow-blue-500/10 hover:bg-gray-800/80">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          <h3 className="text-2xl font-bold text-white">{prefix}{value}</h3>
        </div>
        <div className="text-blue-500 opacity-80">{icon}</div>
      </div>
    </div>
  );
  
  // Main component render
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Client Dashboard</h1>
      
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
        <StatCard 
          icon={<FiBriefcase size={24} />} 
          label="Active Projects" 
          value={stats.active} 
        />
        <StatCard 
          icon={<FiTrendingUp size={24} />} 
          label="Total Budget" 
          value={formatCurrency(stats.totalBudget)} 
        />
        <StatCard 
          icon={<FiCode size={24} />} 
          label="Total Projects" 
          value={stats.total} 
        />
        <StatCard 
          icon={<FiMessageSquare size={24} />} 
          label="Completed Projects" 
          value={stats.completed} 
        />
      </div>
      
      {/* Project Management Section */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Your Projects</h2>
          <button 
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white flex items-center space-x-2"
          >
            <FiPlus />
            <span>New Project</span>
          </button>
        </div>
        
        {/* Project filtering */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  selectedCategory === category.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category.icon}
                <span>{category.label}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
        
        {/* Error state */}
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
        
        {/* Projects list */}
        {!loading && !error && projects.length > 0 ? (
          <div className="space-y-4">
            {projects.map(project => (
              <div key={project._id} className="p-4 bg-gray-700 rounded-lg hover:bg-gray-700/80 transition">
                <div className="flex justify-between flex-wrap">
                  <h3 className="text-white font-semibold">{project.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    project.status === 'open' 
                      ? 'bg-blue-900/60 text-blue-300' 
                      : project.status === 'in_progress'
                      ? 'bg-yellow-900/60 text-yellow-300'
                      : project.status === 'completed'
                      ? 'bg-green-900/60 text-green-300'
                      : 'bg-gray-900/60 text-gray-300'
                  }`}>
                    {project.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <p className="text-gray-400 mt-2">{project.description}</p>
                
                <div className="flex flex-wrap justify-between items-center mt-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-blue-400">{formatCurrency(project.budget)}</span>
                    <span className="text-gray-400">
                      {project.deadline 
                        ? `Due: ${new Date(project.deadline).toLocaleDateString()}` 
                        : 'No deadline'}
                    </span>
                    <span className="text-gray-400 capitalize">
                      {project.category}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap space-x-2 mt-2 sm:mt-0">
                    {/* View Details Button */}
                    <button
                      onClick={() => handleViewProjectDetails(project)}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm flex items-center space-x-1"
                    >
                      <FiEye size={14} />
                      <span>View Details</span>
                    </button>
                    
                    {/* View Proposals Button */}
                    <button
                      onClick={() => handleViewProposals(project)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm flex items-center space-x-1"
                    >
                      <FiSend size={14} />
                      <span>Proposals {project.proposalCount > 0 ? `(${project.proposalCount})` : ''}</span>
                    </button>
                    
                    <button
                      onClick={() => handleEditProject(project)}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm flex items-center space-x-1"
                      disabled={['completed', 'cancelled'].includes(project.status)}
                    >
                      <FiEdit2 size={14} />
                      <span>Edit</span>
                    </button>
                    
                    <button
                      onClick={() => setConfirmDelete(project)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm flex items-center space-x-1"
                      disabled={['in_progress', 'completed'].includes(project.status)}
                    >
                      <FiTrash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
                
                {project.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {project.skills.map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
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
          !loading && !error && (
            <div className="text-center py-12">
              <FiBriefcase size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">No projects found matching your criteria.</p>
              <button 
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                Create Your First Project
              </button>
            </div>
          )
        )}
      </div>
      
      {/* Modals */}
      {isModalOpen && <ProjectModal />}
      {confirmDelete && <ConfirmationModal project={confirmDelete} />}
      {proposalsModalOpen && <ProposalsModal />}
      {projectDetailsModalOpen && <ProjectDetailsModal />}
    </div>
  );
}

export default ClientPlatform;