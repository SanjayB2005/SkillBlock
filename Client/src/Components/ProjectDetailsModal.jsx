import React, { useState } from 'react';
import { FiX, FiMessageSquare, FiEye, FiCheckCircle } from 'react-icons/fi';
import { ProposalList } from './ProposalList';

export const ProjectDetailsModal = ({ project, onClose, showNotification }) => {
  const [activeTab, setActiveTab] = useState('details');
  
  const handleAcceptProposal = async (proposal) => {
    // This function would handle updating the project status
    // and potentially notifying the freelancer
    // We'll just close the modal for now
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">
            {project.title}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <div className="flex border-b border-gray-700">
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'details' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Project Details
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'proposals' 
                ? 'text-blue-400 border-b-2 border-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('proposals')}
          >
            Proposals {project.proposals?.length > 0 && `(${project.proposals.length})`}
          </button>
        </div>
        
        <div className="p-6">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              <div>
                <h4 className="text-gray-400 text-sm mb-1">Description</h4>
                <p className="text-white">{project.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Category</h4>
                  <p className="text-white capitalize">{project.category}</p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Status</h4>
                  <p className="text-white capitalize">{project.status || 'pending'}</p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Budget</h4>
                  <p className="text-white">${parseFloat(project.budget).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-gray-400 text-sm mb-1">Deadline</h4>
                  <p className="text-white">{new Date(project.deadline).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-gray-400 text-sm mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {typeof project.skills === 'string' ? 
                    project.skills.split(',').map((skill, i) => (
                      <span key={i} className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
                        {skill.trim()}
                      </span>
                    )) : 
                    Array.isArray(project.skills) ? 
                      project.skills.map((skill, i) => (
                        <span key={i} className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
                          {typeof skill === 'string' ? skill.trim() : skill}
                        </span>
                      )) : 
                      project.skills ? 
                        <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
                          {String(project.skills)}
                        </span> : 
                        <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
                          No skills specified
                        </span>
                  }
                </div>
              </div>
            </div>
          ) : (
            <ProposalList 
              projectId={project._id || project.id} 
              onAcceptProposal={handleAcceptProposal}
              showNotification={showNotification}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsModal;