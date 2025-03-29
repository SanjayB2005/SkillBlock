import React from 'react';

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex justify-center mt-8">
      <div className="flex space-x-2">
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => onPageChange(i + 1)}
            className={`w-10 h-10 rounded-md flex items-center justify-center ${
              currentPage === i + 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Pagination;