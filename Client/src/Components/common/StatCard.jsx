import React from 'react';
import { FiBriefcase, FiTrendingUp, FiCode, FiMessageSquare } from 'react-icons/fi';

export const StatCard = ({ icon, label, value, prefix = "" }) => (
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