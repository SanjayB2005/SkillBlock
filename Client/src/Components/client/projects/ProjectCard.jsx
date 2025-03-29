import React from 'react';
import { 
  FiEdit2, FiTrash2, FiUser, FiCalendar, FiClock,
  FiHexagon, FiEye
} from 'react-icons/fi';

export const ProjectCard = ({ 
  project, 
  onEdit, 
  onDelete, 
  onViewDetails,
  formatCurrency 
}) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-blue-900/20 transition-all duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {project.title}
            </h3>
            <div className="flex items-center space-x-4 mb-3">
              <span className={`px-2 py-1 rounded text-xs font-medium
                ${project.category === 'design' ? 'bg-purple-900/40 text-purple-200' :
                  project.category === 'development' ? 'bg-blue-900/40 text-blue-200' :
                  project.category === 'marketing' ? 'bg-green-900/40 text-green-200' :
                  project.category === 'writing' ? 'bg-yellow-900/40 text-yellow-200' :
                  'bg-gray-700 text-gray-300'}`}>
                {project.category}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium
                ${project.status === 'active' ? 'bg-green-900/40 text-green-200' :
                  project.status === 'pending' ? 'bg-yellow-900/40 text-yellow-200' :
                  project.status === 'completed' ? 'bg-blue-900/40 text-blue-200' :
                  'bg-gray-700 text-gray-300'}`}>
                {project.status || 'pending'}
              </span>
            </div>
            <p className="text-gray-400 line-clamp-2 mb-4">
              {project.description}
            </p>
          </div>
          <div className="flex space-x-2">
            <button 
              className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-full"
              onClick={() => onEdit(project)}
            >
              <FiEdit2 size={18} />
            </button>
            <button 
              className="p-2 text-red-400 hover:bg-red-900/30 rounded-full"
              onClick={() => onDelete(project)}
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="flex items-center">
            <FiHexagon className="text-gray-500 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Budget</p>
              <p className="text-white font-medium">{formatCurrency(project.budget)}</p>
            </div>
          </div>
          <div className="flex items-center">
            <FiCalendar className="text-gray-500 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Deadline</p>
              <p className="text-white font-medium">
                {new Date(project.deadline).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <FiUser className="text-gray-500 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Proposals</p>
              <p className="text-white font-medium">{project.proposals?.length || 0}</p>
            </div>
          </div>
          <div className="flex items-center">
            <FiClock className="text-gray-500 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Posted</p>
              <p className="text-white font-medium">
                {new Date(project.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 p-4 flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          {typeof project.skills === 'string' ? 
            project.skills.split(',').map((skill, i) => (
              <span key={i} className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300">
                {skill.trim()}
              </span>
            )) : 
            Array.isArray(project.skills) ? 
              project.skills.map((skill, i) => (
                <span key={i} className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300">
                  {typeof skill === 'string' ? skill.trim() : skill}
                </span>
              )) : 
              project.skills ? 
                <span className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300">
                  {String(project.skills)}
                </span> : 
                <span className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300">
                  No skills specified
                </span>
          }
        </div>
        <button 
          className="flex items-center text-sm text-blue-400 hover:text-blue-300"
          onClick={() => onViewDetails(project)}
        >
          <FiEye className="mr-1" />
          View Details
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;