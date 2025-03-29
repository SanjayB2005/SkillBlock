import React from 'react';
import { FiPlus, FiBriefcase } from 'react-icons/fi';
import PropTypes from 'prop-types';

export const EmptyState = ({ 
  icon = <FiBriefcase />, 
  title = "No Content", 
  message = "No items to display", 
  buttonText, 
  onButtonClick,
  customClass = ""
}) => {
  return (
    <div className={`bg-gray-800 rounded-lg p-8 text-center ${customClass}`}>
      <div className="text-gray-400 text-5xl mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-medium text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-400 mb-6">
        {message}
      </p>
      {buttonText && onButtonClick && (
        <button
          onClick={onButtonClick}
          className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-md inline-flex items-center transition-colors duration-200"
        >
          <FiPlus className="mr-2" />
          {buttonText}
        </button>
      )}
    </div>
  );
};

// PropTypes for better development experience
EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  message: PropTypes.string,
  buttonText: PropTypes.string,
  onButtonClick: PropTypes.func,
  customClass: PropTypes.string
};

export default EmptyState;