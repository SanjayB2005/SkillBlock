import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  FiBriefcase, FiPenTool, FiCode, FiTrendingUp, FiMessageSquare, 
  FiPlus, FiX, FiEdit2, FiTrash2, FiAlertCircle, FiUser, 
  FiCalendar, FiClock, FiEye, FiHexagon, FiCheckSquare, 
  FiLoader, FiSearch
} from 'react-icons/fi';

// Import subcomponents
import { StatCard } from './StatCard';
import { ProjectModal } from './ProjectModal';
import { ConfirmationModal } from './ConfirmationModal';
import { ProjectDetailsModal } from './ProjectDetailsModal';
import { ProjectCard } from './ProjectCard';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

// API URLs
const API_URL = 'http://localhost:5000/api';

function ClientPlatform() {
  // State management
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
  const [projectDetailsModalOpen, setProjectDetailsModalOpen] = useState(false);
  const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1,
    current: 1
  });
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalBudget: 0
  });

  // Input change handler
  const handleInputChange = useCallback((e) => {
    const { name, value, type } = e.target;
    
    setNewProject(prev => ({
      ...prev,
      [name]: type === 'number' ? 
        (value === '' ? '' : parseFloat(value) || 0) : 
        value
    }));
  }, []);

  // Categories with icons
  const categories = [
    { id: "all", label: "All Projects", icon: <FiBriefcase /> },
    { id: "design", label: "Design", icon: <FiPenTool /> },
    { id: "development", label: "Development", icon: <FiCode /> },
    { id: "marketing", label: "Marketing", icon: <FiTrendingUp /> },
    { id: "writing", label: "Writing", icon: <FiMessageSquare /> },
    { id: "other", label: "Other", icon: <FiBriefcase /> }
  ];

  // Utility functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETH',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount).replace('ETH', 'Ξ');
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Calculate dashboard stats
  const calculateStats = (projectsList) => {
    const active = projectsList.filter(p => p.status === 'active').length;
    const completed = projectsList.filter(p => p.status === 'completed').length;
    const totalBudget = projectsList.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0);
    
    setStats({
      totalProjects: projectsList.length,
      activeProjects: active,
      completedProjects: completed,
      totalBudget
    });
  };

  // Main fetch projects function
  const fetchProjects = async (page = 1) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page);
      queryParams.append('limit', 10);
      
      if (selectedCategory !== 'all') {
        queryParams.append('category', selectedCategory);
      }
      
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }
      
      const response = await axios.get(`${API_URL}/projects/my-projects?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProjects(response.data.projects);
      setPagination(response.data.pagination);
      calculateStats(response.data.projects);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Handle project creation
  const handleCreateProject = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.post(`${API_URL}/projects`, newProject, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProjects(prev => [response.data, ...prev]);
      calculateStats([...projects, response.data]);
      setIsModalOpen(false);
      showNotification('Project created successfully!', 'success');
      
      // Reset form
      setNewProject({
        title: "", 
        description: "", 
        budget: "", 
        deadline: "", 
        category: "development",
        skills: ""
      });
      
    } catch (err) {
      console.error('Error creating project:', err);
      showNotification(err.response?.data?.message || 'Failed to create project', 'error');
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
      
      const updatedProjects = projects.filter(p => p._id !== projectId);
      setProjects(updatedProjects);
      calculateStats(updatedProjects);
      setConfirmDelete(null);
      showNotification('Project deleted successfully!', 'success');
      
    } catch (err) {
      console.error('Error deleting project:', err);
      showNotification(err.response?.data?.message || 'Failed to delete project', 'error');
    }
  };

  // Handle edit project button click
  const handleEditProject = (project) => {
    setEditingProject(project);
    setNewProject(project);
    setIsModalOpen(true);
  };

  // Handle view project details
  const handleViewProjectDetails = (project) => {
    setSelectedProjectDetails(project);
    setProjectDetailsModalOpen(true);
  };

  // Initial and dependent effects
  useEffect(() => {
    fetchProjects();
  }, [selectedCategory, searchTerm]);

  // Main render
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Client Dashboard</h1>
      
      {/* Notification component */}
      {notification && (
        <div className={`p-4 mb-4 rounded-lg ${
          notification.type === 'error' ? 'bg-red-900/50 text-red-200' :
          notification.type === 'success' ? 'bg-green-900/50 text-green-200' :
          'bg-blue-900/50 text-blue-200'
        }`}>
          {notification.message}
        </div>
      )}
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          icon={<FiBriefcase size={24} />} 
          label="Total Projects" 
          value={stats.totalProjects} 
        />
        <StatCard 
          icon={<FiLoader size={24} />} 
          label="Active Projects" 
          value={stats.activeProjects} 
        />
        <StatCard 
          icon={<FiCheckSquare size={24} />} 
          label="Completed" 
          value={stats.completedProjects} 
        />
        <StatCard 
          icon={<FiHexagon size={24} />} 
          label="Total Budget" 
          value={formatCurrency(stats.totalBudget)}
          prefix="" 
        />
      </div>
      
      {/* Controls Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        {/* Category Filter */}
        <div className="flex overflow-x-auto pb-2 space-x-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-md flex items-center whitespace-nowrap ${
                selectedCategory === category.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
        
        <div className="flex w-full md:w-auto space-x-2">
          {/* Search Bar */}
          <div className="relative flex-grow md:w-64">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          {/* Create Project Button */}
          <button
            onClick={() => {
              setEditingProject(null);
              setNewProject({
                title: "", 
                description: "", 
                budget: "", 
                deadline: "", 
                category: "development",
                skills: ""
              });
              setIsModalOpen(true);
            }}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
          >
            <FiPlus className="mr-2" />
            New Project
          </button>
        </div>
      </div>
      
      {/* Projects List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 text-red-200 p-4 rounded-md flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState 
          icon={<FiBriefcase className="mx-auto" />}
          title="No projects found"
          message={selectedCategory !== 'all' || searchTerm 
            ? "Try changing your filters or search term"
            : "Create your first project to get started"
          }
          buttonText="Create Project"
          onButtonClick={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {projects.map(project => (
            <ProjectCard 
              key={project._id || project.id}
              project={project}
              onEdit={handleEditProject}
              onDelete={() => setConfirmDelete(project)}
              onViewDetails={handleViewProjectDetails}
              formatCurrency={formatCurrency}
            />
          ))}
          
          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <Pagination 
              currentPage={pagination.current}
              totalPages={pagination.pages}
              onPageChange={fetchProjects}
            />
          )}
        </div>
      )}
      
      {/* Modals */}
      {isModalOpen && (
        <ProjectModal 
          newProject={newProject}
          setNewProject={setNewProject}
          handleInputChange={handleInputChange}
          setIsModalOpen={setIsModalOpen}
          categories={categories.filter(c => c.id !== 'all')}
          editingProject={editingProject}
          onSubmit={handleCreateProject}
        />
      )}
      
      {confirmDelete && (
        <ConfirmationModal 
          project={confirmDelete} 
          onConfirm={() => handleDeleteProject(confirmDelete._id || confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
          title="Delete Project"
          message={`Are you sure you want to delete "${confirmDelete.title}"? This action cannot be undone.`}
        />
      )}

      {projectDetailsModalOpen && selectedProjectDetails && (
        <ProjectDetailsModal 
          project={selectedProjectDetails}
          onClose={() => setProjectDetailsModalOpen(false)}
          showNotification={showNotification}
        />
      )}
    </div>
  );
}

export default ClientPlatform;