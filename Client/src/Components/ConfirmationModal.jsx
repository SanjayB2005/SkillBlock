import React from 'react';
import { FiAlertCircle, FiX, FiCheckCircle } from 'react-icons/fi';

export const ConfirmationModal = ({ 
  project, 
  onConfirm, 
  onCancel, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?" 
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FiAlertCircle className="text-yellow-500 text-2xl" />
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {title}
            </h2>
          </div>
          <button 
            onClick={onCancel} 
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX />
          </button>
        </div>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>
        
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors flex items-center"
          >
            <FiCheckCircle className="mr-2" />
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;