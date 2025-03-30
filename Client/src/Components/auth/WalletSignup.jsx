import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, User, Check } from 'lucide-react';

const API_URL = import.meta.env.API_URL ||'http://localhost:5000/api';

const WalletSignup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState(location.state?.walletAddress || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // Step 1: Basic info, Step 2: Role selection

  // Check if wallet address is available on component mount
  useEffect(() => {
    if (!walletAddress) {
      navigate('/');
    }
  }, [walletAddress, navigate]);

  // Handle next step
  const handleNextStep = (e) => {
    e.preventDefault();
    if (!name) {
      setError('Please enter your name to continue');
      return;
    }
    setError('');
    setStep(2); // Move to role selection
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userRole) {
      setError('Please select your role to continue');
      return;
    }
    
    setIsLoading(true);
    setError('');
  
    try {
      const response = await axios.post(`${API_URL}/users/wallet-register`, {
        walletAddress,
        name,
        email,
        role: userRole
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('walletAddress', walletAddress);
        
        // Clear any wallet disconnection flag
        localStorage.removeItem('walletDisconnected');
        
        // Redirect based on user role
        navigate(userRole === 'freelancer' ? '/freelancer-dashboard' : '/client-dashboard');
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Select role function
  const selectRole = (role) => {
    setUserRole(role);
  };

  // If no wallet address is available, don't render the form
  if (!walletAddress) {
    return null;
  }

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col items-center bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 rounded-xl p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {step === 1 ? 'Complete Your Profile' : 'Choose Your Role'}
        </h2>
        
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <p className="text-gray-300 text-sm">Connected Wallet</p>
          <p className="text-white font-mono break-all">{walletAddress}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {step === 1 ? (
          // Step 1: Basic Information
          <form onSubmit={handleNextStep} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-gray-300 mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-gray-300 mb-2">
                Email (optional)
              </label>
              <input
                id="email"
                type="email"
                className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg text-white font-medium transition-all transform hover:scale-105"
            >
              Continue to Role Selection
            </button>
          </form>
        ) : (
          // Step 2: Role Selection
          <div className="space-y-6">
            <p className="text-gray-300 text-center mb-4">
              Select your role on the platform. This will determine what features you'll have access to.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div 
                onClick={() => selectRole('freelancer')}
                className={`cursor-pointer bg-gray-700 hover:bg-gray-600 transition-all p-6 rounded-lg border-2 ${
                  userRole === 'freelancer' ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-600'
                } text-center`}
              >
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User size={30} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Freelancer</h3>
                <p className="text-gray-400 text-sm">
                  Showcase your skills, browse jobs and get hired for projects
                </p>
                {userRole === 'freelancer' && (
                  <div className="absolute top-2 right-2">
                    <Check size={20} className="text-blue-500" />
                  </div>
                )}
              </div>
              
              <div 
                onClick={() => selectRole('client')}
                className={`cursor-pointer bg-gray-700 hover:bg-gray-600 transition-all p-6 rounded-lg border-2 ${
                  userRole === 'client' ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-600'
                } text-center`}
              >
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase size={30} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Client</h3>
                <p className="text-gray-400 text-sm">
                  Post jobs, hire skilled freelancers and manage your projects
                </p>
                {userRole === 'client' && (
                  <div className="absolute top-2 right-2">
                    <Check size={20} className="text-blue-500" />
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={isLoading || !userRole}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg text-white font-medium transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Complete Sign Up'}
              </button>
              
              <button
                onClick={() => setStep(1)}
                className="w-full mt-3 py-2 px-4 bg-transparent border border-gray-600 hover:border-gray-500 rounded-lg text-gray-400 hover:text-gray-300 font-medium transition-all"
              >
                Back to Profile Info
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletSignup;