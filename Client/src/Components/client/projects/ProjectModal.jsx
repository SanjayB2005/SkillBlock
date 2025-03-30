import React from 'react';
import { FiX } from 'react-icons/fi';

export const ProjectModal = ({
  newProject,
  setNewProject,
  handleInputChange,
  setIsModalOpen,
  categories,
  editingProject = null,
  onSubmit
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">
            {editingProject ? 'Edit Project' : 'Create New Project'}
          </h3>
          <button 
            onClick={() => setIsModalOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Project Title */}
            <div>
              <label className="block text-gray-400 mb-1" htmlFor="title">Project Title</label>
              <input 
                type="text" 
                id="title"
                name="title"
                value={newProject.title}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a descriptive title"
                required
              />
            </div>
            
            {/* Project Category */}
            <div>
              <label className="block text-gray-400 mb-1" htmlFor="category">Category</label>
              <select
                id="category"
                name="category"
                value={newProject.category}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Project Description */}
            <div>
              <label className="block text-gray-400 mb-1" htmlFor="description">Description</label>
              <textarea 
                id="description"
                name="description"
                value={newProject.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your project requirements in detail"
                required
              />
            </div>
            
            {/* Budget and Deadline Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Budget */}
              <div>
                <label className="block text-gray-400 mb-1" htmlFor="budget">Budget (ETH)</label>
                <input 
                  type="number" 
                  id="budget"
                  name="budget"
                  value={newProject.budget}
                  onChange={handleInputChange}
                  min="0"
                  step="any"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your budget"
                  required
                />
              </div>
              
              {/* Deadline */}
              <div>
                <label className="block text-gray-400 mb-1" htmlFor="deadline">Deadline</label>
                <input 
                  type="date" 
                  id="deadline"
                  name="deadline"
                  value={newProject.deadline}
                  onChange={handleInputChange}
                  min={today}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            {/* Skills */}
            <div>
              <label className="block text-gray-400 mb-1" htmlFor="skills">Required Skills</label>
              <input 
                type="text" 
                id="skills"
                name="skills"
                value={newProject.skills}
                onChange={handleInputChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. React, Node.js, UI/UX (comma separated)"
              />
              <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
            </div>
            
            {/* Status (Only for editing) */}
            {editingProject && (
              <div>
                <label className="block text-gray-400 mb-1" htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={newProject.status || 'pending'}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="mt-8 flex space-x-3">
              <button
                type="submit"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors font-medium"
              >
                {editingProject ? 'Update Project' : 'Create Project'}
              </button>
              
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;