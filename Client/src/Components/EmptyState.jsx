import React from 'react';
import { FiPlus } from 'react-icons/fi';

export const EmptyState = ({ 
  icon, 
  title, 
  message, 
  buttonText, 
  onButtonClick 
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-8 text-center">
      <div className="text-gray-400 text-5xl mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-medium text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6">{message}</p>
      <button
        onClick={onButtonClick}
        className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-md inline-flex items-center"
      >
        <FiPlus className="mr-2" />
        {buttonText}
      </button>
    </div>
  );
};

export default EmptyState;