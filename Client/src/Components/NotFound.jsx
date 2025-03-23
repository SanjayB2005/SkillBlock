import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowRight } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-900/20 mb-8">
          <span className="text-5xl">404</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Page Not Found</h1>
        
        <p className="text-gray-400 text-lg max-w-lg mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved. Let's get you back on track.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            to="/"
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 w-full sm:w-auto justify-center"
          >
            <Home size={18} />
            <span>Back to Home</span>
          </Link>
          
          <Link 
            to="/dashboard"
            className="flex items-center space-x-2 bg-transparent border border-gray-700 hover:border-gray-600 px-6 py-3 rounded-lg font-medium transition-all w-full sm:w-auto justify-center"
          >
            <span>Go to Dashboard</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;