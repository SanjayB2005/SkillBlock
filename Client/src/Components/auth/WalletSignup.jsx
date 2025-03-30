import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, User, Check, AlertCircle } from 'lucide-react';

// Use the correct environment variable or fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
  // Add missing serverStatus state
  const [serverStatus, setServerStatus] = useState('idle'); // 'idle', 'connecting', 'connected', 'error'

  // Check if wallet address is available on component mount
  useEffect(() => {
    const checkWallet = async () => {
      if (!walletAddress) {
        navigate('/');
        return;
      }
  
      try {
        setServerStatus('connecting');
        console.log(`Attempting to connect to: ${API_URL}/users/wallet-auth`);
        
        const response = await axios.post(`${API_URL}/users/wallet-auth`, {
          walletAddress
        }, { 
          timeout: 10000, // Increase timeout for slower connections
          headers: {
            'Content-Type': 'application/json'
          }
        });
  
        setServerStatus('connected');
        console.log('Server connection successful:', response.data);
        
        if (response.data.exists) {
          // Wallet already registered, store token and redirect
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('userRole', response.data.user.role);
          localStorage.setItem('walletAddress', walletAddress);
          
          navigate(response.data.user.role === 'freelancer' 
            ? '/freelancer-dashboard' 
            : '/client-dashboard'
          );
        }
      } catch (error) {
        console.error('Error checking wallet:', error);
        setServerStatus('error');
        
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
          setError(`Cannot connect to server at ${API_URL}. Please check that the backend server is running and try again.`);
        } else if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else {
          setError('An error occurred while checking your wallet. Please try again.');
        }
      }
    };
  
    checkWallet();
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
      console.log(`Attempting to register wallet at: ${API_URL}/users/wallet-register`);
      console.log('Registration payload:', { walletAddress, name, email, role: userRole });
      
      const response = await axios.post(`${API_URL}/users/wallet-register`, {
        walletAddress,
        name,
        email,
        role: userRole
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // Increase timeout for registration
      });
      
      console.log('Registration response:', response.data);
      
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
        errorMessage = `Cannot connect to server at ${API_URL}. Please try again later.`;
      } else if (error.response) {
        // The server responded with an error status
        if (error.response.status === 500) {
          errorMessage = 'The server encountered an error. Please try again later.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setError(errorMessage);
      setServerStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Select role function
  const selectRole = (role) => {
    setUserRole(role);
  };

  // Retry connection to server
  const retryConnection = () => {
    setError('');
    setServerStatus('connecting');
    window.location.reload();
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
          
          {/* Server status indicator */}
          <div className="mt-2 flex items-center text-xs">
            {serverStatus === 'idle' && (
              <span className="flex items-center text-gray-400">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                Waiting to connect...
              </span>
            )}
            {serverStatus === 'connecting' && (
              <span className="flex items-center text-yellow-400">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                Connecting to server...
              </span>
            )}
            {serverStatus === 'connected' && (
              <span className="flex items-center text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Connected to server
              </span>
            )}
            {serverStatus === 'error' && (
              <span className="flex items-center text-red-400">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                Server connection error
              </span>
            )}
          </div>
          
          <div className="mt-1 text-xs text-gray-400">
            API: {API_URL}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
            <div className="flex items-start">
              <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">{error}</p>
                
                {serverStatus === 'error' && (
                  <div className="mt-2 text-sm">
                    <button 
                      onClick={retryConnection}
                      className="mt-2 bg-red-800 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
                    >
                      Retry Connection
                    </button>
                  </div>
                )}
              </div>
            </div>
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
                disabled={serverStatus === 'error'}
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
                disabled={serverStatus === 'error'}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg text-white font-medium transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={serverStatus === 'error'}
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
                onClick={() => serverStatus !== 'error' && selectRole('freelancer')}
                className={`cursor-pointer bg-gray-700 hover:bg-gray-600 transition-all p-6 rounded-lg border-2 ${
                  userRole === 'freelancer' ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-600'
                } ${serverStatus === 'error' ? 'opacity-70 cursor-not-allowed' : ''} text-center`}
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
                onClick={() => serverStatus !== 'error' && selectRole('client')}
                className={`cursor-pointer bg-gray-700 hover:bg-gray-600 transition-all p-6 rounded-lg border-2 ${
                  userRole === 'client' ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-gray-600'
                } ${serverStatus === 'error' ? 'opacity-70 cursor-not-allowed' : ''} text-center`}
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
                disabled={isLoading || !userRole || serverStatus === 'error'}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg text-white font-medium transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Complete Sign Up'}
              </button>
              
              <button
                onClick={() => setStep(1)}
                className="w-full mt-3 py-2 px-4 bg-transparent border border-gray-600 hover:border-gray-500 rounded-lg text-gray-400 hover:text-gray-300 font-medium transition-all"
                disabled={serverStatus === 'error'}
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