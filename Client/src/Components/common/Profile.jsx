import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Edit, Save, Copy, Check, Mail, Wallet, Calendar, Briefcase, Award, Shield, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL ||'http://localhost:5000/api';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    skills: [],
    role: 'client'
  });
  

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getErrorMessage = (error) => {
    if (!navigator.onLine) {
      return 'You are currently offline. Please check your internet connection.';
    }
  
    if (error.response) {
      switch (error.response.status) {
        case 401:
          return 'Your session has expired. Please reconnect your wallet.';
        case 403:
          return 'You do not have permission to access this profile.';
        case 404:
          return 'Profile not found. Please complete your registration.';
        case 400:
          return error.response.data?.message || 'Invalid request. Please check your details.';
        default:
          return `Server error (${error.response.status}). Please try again later.`;
      }
    }
  
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
  
    if (error.code === 'ERR_NETWORK') {
      return 'Unable to connect to the server. Please check your connection.';
    }
  
    return error.message || 'An unexpected error occurred. Please try again.';
  };

  // Fetch user data with improved error handling
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        const walletAddress = localStorage.getItem('walletAddress');
        
        if (!token && !walletAddress) {
          navigate('/');
          return;
        }
        
        console.log('Fetching profile with:', {
          token: token ? 'Present' : 'Not present',
          walletAddress: walletAddress || 'Not present',
          apiUrl: API_URL
        });
        
        // Try wallet-based authentication first if we have a wallet address
        if (walletAddress) {
          try {
            console.log(`Authenticating with wallet: ${walletAddress}`);
            
            const walletAuthResponse = await axios.post(`${API_URL}/users/wallet-auth`, {
              walletAddress
            }, { 
              timeout: 10000,
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            console.log('Wallet auth response:', walletAuthResponse.data);
            
            if (walletAuthResponse.data.success) {
              // Update token if needed
              if (walletAuthResponse.data.token) {
                localStorage.setItem('token', walletAuthResponse.data.token);
              }
              
              // Set user data from the wallet auth response
              setUser(walletAuthResponse.data.user);
              setFormData({
                name: walletAuthResponse.data.user.name || '',
                email: walletAuthResponse.data.user.email || '',
                bio: walletAuthResponse.data.user.bio || '',
                skills: walletAuthResponse.data.user.skills || [],
                role: walletAuthResponse.data.user.role || 'client'
              });
              
              setLoading(false);
              return; // Exit early since we got the user data
            }
          } catch (walletError) {
            console.warn('Wallet auth failed, falling back to token auth:', walletError.message);
            // Continue to token-based auth if wallet auth fails
          }
        }
        
        // Token-based authentication as fallback
        if (token) {
          const response = await axios.get(`${API_URL}/users/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          });
          
          console.log('Profile response:', response.data);
          
          if (!response.data?.user) {
            throw new Error('Invalid response format from server');
          }
          
          setUser(response.data.user);
          setFormData({
            name: response.data.user.name || '',
            email: response.data.user.email || '',
            bio: response.data.user.bio || '',
            skills: response.data.user.skills || [],
            role: response.data.user.role || 'client'
          });
        } else {
          throw new Error('No authentication method available');
        }
        
      } catch (error) {
        console.error('Profile Error Details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          endpoint: `${API_URL}/users/profile`,
          auth: {
            hasToken: !!localStorage.getItem('token'),
            hasWallet: !!localStorage.getItem('walletAddress')
          }
        });
        
        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
        
        // Handle authentication errors
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, [navigate]); // Added navigate to dependency array


  // Copy wallet address to clipboard
  const copyToClipboard = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevFormData => {
      console.log('Previous form data:', prevFormData);
      const updatedFormData = {
        ...prevFormData,
        [name]: value
      };
      // Log the updated form data after the state change
      console.log(`${name} changed to:`, value);
      console.log('Updated form data will be:', updatedFormData);

      return updatedFormData;
    });
  };

  // Handle skill changes
  const handleSkillChange = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      if (!formData.skills.includes(e.target.value)) {
        setFormData({
          ...formData,
          skills: [...formData.skills, e.target.value]
        });
      }
      e.target.value = '';
      e.preventDefault();
    }
  };

  // Remove a skill
  const removeSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  // Save profile changes
  const saveChanges = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      // Check if role has changed before making the API call
      const roleChanged = user.role !== formData.role;

      // Update the user profile in the database
      const response = await axios.put(`${API_URL}/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Update response:', response.data);

      if (response.data && response.data.user) {
        setUser(response.data.user);

        // If a new token is provided (due to role change), update it
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }

        // If role changed, update in localStorage and redirect
        if (roleChanged) {
          const newRole = formData.role;
          localStorage.setItem('userRole', newRole);

          // Trigger a storage event since we're in the same window
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'userRole',
            newValue: newRole
          }));

          // Show success message before redirecting
          setError(null);
          setEditing(false);

          // Redirect to the appropriate dashboard after a short delay
          setTimeout(() => {
            const dashboardPath = newRole === 'freelancer' 
              ? '/freelancer-dashboard' 
              : '/client-dashboard';
            window.location.href = dashboardPath;
          }, 1000);

          return; // Return early since we're redirecting
        }

        setError(null);
        setEditing(false);
      } else {
        setError('Failed to update profile: Invalid server response');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error updating profile:', error);

      // Error handling code remains the same
      if (error.response) {
        console.error('Server response:', error.response.data);

        if (error.response.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (error.response.status === 400) {
          // Validation errors
          setError(`Update failed: ${error.response.data.message}`);
        } else {
          setError(`Error ${error.response.status}: ${error.response.data.message || 'Server error'}`);
        }
      } else if (error.request) {
        setError('No response from server. Please check your connection.');
      } else {
        setError(`Request error: ${error.message}`);
      }

      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
    

      setLoading(false);
    }
  };
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
        <div className="bg-gray-800 rounded-xl p-8 text-center max-w-md">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg text-gray-300">Loading your profile...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const isNetworkError = error.includes('offline') || error.includes('connect');
    
    return (
      <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-xl text-white font-semibold mb-2">
            {isNetworkError ? 'Connection Error' : 'Error'}
          </div>
          <div className="text-red-300">{error}</div>
          <div className="mt-6 flex flex-col md:flex-row justify-center gap-3">
            {isNetworkError ? (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                Try Again
              </button>
            ) : error.includes('token') || error.includes('session') || error.includes('authentication') ? (
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
              >
                Log Out & Reset
              </button>
            ) : (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No user state
  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
        <div className="bg-gray-800 rounded-xl p-8 text-center max-w-md">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-xl text-white font-semibold mb-2">Profile Not Found</div>
          <div className="text-gray-400">We couldn't find your profile information.</div>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-32 md:h-48"></div>

          <div className="relative px-4 sm:px-6 lg:px-8 pb-8">
            {/* Profile Picture */}
            <div className="absolute -mt-16 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl md:text-5xl font-bold border-4 border-gray-800">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>

            {/* Edit Button */}
            <div className="flex justify-end mt-4">
              {editing ? (
                <button
                  onClick={saveChanges}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white"
                >
                  <Save size={16} />
                  <span>Save Changes</span>
                </button>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white"
                >
                  <Edit size={16} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {/* Main Profile Info */}
            <div className="mt-16 md:mt-20">
              {editing ? (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-gray-400 mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Add Role Selector */}
                  <div>
                    <label htmlFor="role" className="block text-gray-400 mb-2">Account Type</label>
                    <select
                      name="role"
                      id="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      disabled
                      className="w-full p-3 rounded-lg bg-gray-700 text-gray-600 border border-gray-600 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="client">Client</option>
                      <option value="freelancer">Freelancer</option>
                    </select>
                    <p className="mt-1 text-sm text-blue-400">
                      {formData.role === "client"
                        ? "As a client, you can post projects and hire freelancers."
                        : "As a freelancer, you can bid on projects and offer your services."}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-gray-400 mb-2">Bio</label>
                    <textarea
                      name="bio"
                      id="bio"
                      rows="3"
                      value={formData.bio || ''}
                      onChange={handleInputChange}
                      className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                    ></textarea>
                  </div>

                  <div>
                    <label htmlFor="skills" className="block text-gray-400 mb-2">Skills (press Enter to add)</label>
                    <input
                      type="text"
                      id="skills"
                      onKeyDown={handleSkillChange}
                      className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                      placeholder="Add a skill and press Enter"
                    />

                    <div className="flex flex-wrap gap-2 mt-3">
                      {(formData.skills || []).map((skill, index) => (
                        <div key={index} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full flex items-center">
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="ml-2 text-gray-400 hover:text-gray-200"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-white">{user.name || 'Anonymous User'}</h1>
                  <p className="text-blue-400 mt-1">{user.role === 'freelancer' ? 'Freelancer' : 'Client'}</p>

                  <div className="mt-6 space-y-4">
                    {user.email && (
                      <div className="flex items-center text-gray-300">
                        <Mail className="w-5 h-5 mr-3 text-gray-400" />
                        <span>{user.email}</span>
                      </div>
                    )}

                    {user.walletAddress && (
                      <div className="flex items-center text-gray-300">
                        <Wallet className="w-5 h-5 mr-3 text-gray-400" />
                        <span className="font-mono">
                          {user.walletAddress.substring(0, 8)}...{user.walletAddress.substring(user.walletAddress.length - 8)}
                        </span>
                        <button
                          onClick={copyToClipboard}
                          className="ml-2 text-gray-400 hover:text-blue-400 transition-colors"
                          title="Copy to clipboard"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    )}

                    <div className="flex items-start text-gray-300">
                      <User className="w-5 h-5 mr-3 text-gray-400 mt-1" />
                      <div>
                        <p>{user.bio || 'No bio available. Click "Edit Profile" to add one.'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  {user.skills?.length > 0 && (
                    <div className="mt-6">
                      <h2 className="text-xl font-semibold text-white mb-3">Skills</h2>
                      <div className="flex flex-wrap gap-2">
                        {user.skills.map((skill, index) => (
                          <span key={index} className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Stats Section */}
            {!editing && (
              <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-400 mb-2">
                    <Calendar className="w-5 h-5" />
                    <span>Joined</span>
                  </div>
                  <p className="text-xl font-semibold text-white">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-400 mb-2">
                    <Briefcase className="w-5 h-5" />
                    <span>Projects</span>
                  </div>
                  <p className="text-xl font-semibold text-white">{user.completedProjects || 0}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-400 mb-2">
                    <Award className="w-5 h-5" />
                    <span>Rating</span>
                  </div>
                  <p className="text-xl font-semibold text-white">{user.rating || 'N/A'}</p>
                </div>

                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-gray-400 mb-2">
                    <Shield className="w-5 h-5" />
                    <span>Account Type</span>
                  </div>
                  <p className="text-xl font-semibold text-white capitalize">{user.role || 'User'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;