import React, { useState, useEffect, useRef } from 'react';
import { Wallet, Zap, LogOut, ChevronDown } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BlockchainService from '../../services/BlockchainService';

const API_URL = import.meta.env.API_URL ||'http://localhost:5000/api';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const [blockchainConnected, setBlockchainConnected] = useState(false);
const [blockchainNetwork, setBlockchainNetwork] = useState('');
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Handle clicks outside of dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const checkBlockchainConnection = async () => {
    try {
      const isConnected = await BlockchainService.init();
      setBlockchainConnected(isConnected);
    } catch (error) {
      console.error('Error checking blockchain connection:', error);
      setBlockchainConnected(false);
    }
  };
  
  // Check wallet in database
  const checkWalletInDatabase = async (walletAddress) => {
    try {
      const response = await axios.post(`${API_URL}/users/wallet-auth`, {
        walletAddress
      });

      console.log('Wallet check response:', response.data);
      
      if (response.data.exists) {
        // User exists - set user data and auth token
        setUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.user.role || 'client');
        return true;
      } else {
        // User doesn't exist
        return false;
      }
    } catch (error) {
      console.error('Error checking wallet:', error);
      return false;
    }
  };

  // Check if MetaMask is installed and connected
  const checkIfWalletIsConnected = async () => {
    try {
      // Check if user has explicitly disconnected
      const isDisconnected = localStorage.getItem('walletDisconnected') === 'true';
      
      // If user has disconnected, don't auto-connect
      if (isDisconnected) {
        console.log("User previously disconnected wallet");
        return;
      }
      
      const { ethereum } = window;
      
      if (!ethereum) {
        console.log("Make sure you have MetaMask installed!");
        return;
      }
      
      // Check if we're authorized to access the user's wallet
      const accounts = await ethereum.request({ method: "eth_accounts" });
      
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setAccount(account);
        
        // Check if wallet is in database
        const userExists = await checkWalletInDatabase(account);
        if (!userExists) {
          console.log("Wallet not registered in database");
        }
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Connect wallet function
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      const { ethereum } = window;
      
      if (!ethereum) {
        alert("Get MetaMask to connect your wallet!");
        window.open("https://metamask.io/download/", "_blank");
        setIsConnecting(false);
        return;
      }
      
      // Clear the disconnected flag when user explicitly connects
      localStorage.removeItem('walletDisconnected');
      
      // Request account access
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      const walletAddress = accounts[0];
      
      console.log("Connected to wallet: ", walletAddress);
      setAccount(walletAddress);
      
      // Check if wallet exists in database
      const userExists = await checkWalletInDatabase(walletAddress);
      
      if (!userExists) {
        // Wallet not in database - redirect to signup
        navigate('/wallet-signup', { 
          state: { walletAddress: walletAddress } 
        });
      }
      
      setIsConnecting(false);
    } catch (error) {
      console.error(error);
      setIsConnecting(false);
    }
  };
  
  // Disconnect wallet function
  const disconnectWallet = () => {
    // Clear local state
    setAccount(null);
    setUser(null);
    setDropdownOpen(false);
    
    // Clear auth data
    localStorage.removeItem('token');
    
    // Store disconnection state in localStorage
    localStorage.setItem('walletDisconnected', 'true');
    
    console.log("Wallet disconnected");
  };

  // Handle account changes in MetaMask
  useEffect(() => {
    const handleAccountsChanged = async (accounts) => {
      // Check if disconnected by user preference
      const isDisconnected = localStorage.getItem('walletDisconnected') === 'true';
      if (isDisconnected) {
        // If user has disconnected, reset state and don't reconnect
        setAccount(null);
        setUser(null);
        return;
      }
      
      if (accounts.length === 0) {
        // User has disconnected all accounts from MetaMask
        setAccount(null);
        setUser(null);
        console.log('No accounts connected');
      } else if (accounts[0] !== account) {
        // User switched accounts
        const newAccount = accounts[0];
        console.log('Account switched to:', newAccount);
        setAccount(newAccount);
        
        // Check if new wallet is in database
        await checkWalletInDatabase(newAccount);
      }
    };

    // Setup listener for account changes if window.ethereum exists
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
    
    // Cleanup listener on component unmount
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [account]); // Add account as dependency to track changes

  // Check for wallet on component mount
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  
  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gray-900/80 backdrop-blur-md py-3 shadow-xl' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">SkillBlock</span>
        </div>
        <div className="hidden md:flex space-x-8">
          <NavLink 
            to="/"
            className={({ isActive }) =>
              `text-gray-300 hover:text-white transition ${isActive ? 'text-white' : ''}`
            }
          >
            Home
          </NavLink>
          
          <NavLink 
            to={localStorage.getItem('userRole') === "freelancer" ? "/freelancer-dashboard" : "/client-dashboard"}
            className={({ isActive }) =>
              `text-gray-300 hover:text-white transition ${isActive ? 'text-white' : ''}`
            }
          >
            Dashboard
          </NavLink>
        </div>
        
        {account ? (
          // Connected wallet with dropdown
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105"
            >
              <Wallet size={18} />
              <span>{user?.name || formatAddress(account)}</span>
              <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-10">
                {user && (
                  <div className="px-4 py-2 text-sm text-gray-400">
                    Signed in as {user.name}
                  </div>
                )}
                <div className="px-4 py-2 text-xs text-gray-500 overflow-hidden overflow-ellipsis">
                  {account}
                </div>
                <div className="border-t border-gray-700 my-1"></div>
                <NavLink 
                  to="/dashboard" 
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  Dashboard
                </NavLink>
                <NavLink 
                  to="/profile" 
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                  onClick={() => setDropdownOpen(false)}
                >
                  Profile
                </NavLink>
                <div className="border-t border-gray-700 my-1"></div>
                <button 
                  onClick={disconnectWallet}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                >
                  <LogOut size={16} className="mr-2" />
                  Disconnect
                </button>
              </div>
            )}
          </div>
        ) : (
          // Connect wallet button
          <button 
            onClick={connectWallet}
            disabled={isConnecting}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-70"
          >
            <Wallet size={18} />
            <span>
              {isConnecting ? 'Connecting...' : 'Connect'}
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;