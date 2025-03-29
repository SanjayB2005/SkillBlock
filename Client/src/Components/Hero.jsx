import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Shield, Zap, Users, 
  Globe, Database, Code 
} from 'lucide-react';

const Hero = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    checkWalletConnection();
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('disconnect', handleDisconnect);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    setIsWalletConnected(accounts.length > 0);
    if (accounts.length > 0) {
      localStorage.setItem('walletAddress', accounts[0]);
    } else {
      localStorage.removeItem('walletAddress');
    }
  };

  const handleDisconnect = () => {
    setIsWalletConnected(false);
    localStorage.removeItem('walletAddress');
  };

  const checkWalletConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setIsWalletConnected(accounts.length > 0);
        if (accounts.length > 0) {
          localStorage.setItem('walletAddress', accounts[0]);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      setIsWalletConnected(false);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to continue!");
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length > 0) {
        setIsWalletConnected(true);
        localStorage.setItem('walletAddress', accounts[0]);
        navigate('/wallet-signup');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="min-h-screen pt-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-gray-900 z-0"></div>
        
        {/* Animated circles */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-indigo-500/10 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              <span className="inline-block">Decentralized Freelancing</span>
              <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Powered by SkillBlock
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-10 max-w-3xl">
              Connect with skilled professionals, exchange services, and collaborate on projects—all secured by blockchain technology.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-16">
              {isWalletConnected ? (
                <Link 
                  to={userRole === 'client' ? '/client-dashboard' : '/freelancer-dashboard'} 
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-semibold shadow-lg hover:shadow-blue-500/20 transition transform hover:scale-105"
                >
                  Explore Marketplace
                </Link>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-semibold shadow-lg hover:shadow-blue-500/20 transition transform hover:scale-105 disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  {!isConnecting && <ArrowRight className="ml-2 inline" size={20} />}
                </button>
              )}
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 text-center">
              <div>
                <p className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">2,500+</p>
                <p className="text-gray-400 mt-2">Freelancers</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">1,800+</p>
                <p className="text-gray-400 mt-2">Clients</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">5,400+</p>
                <p className="text-gray-400 mt-2">Projects</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">$2.5M+</p>
                <p className="text-gray-400 mt-2">Paid Out</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowRight size={24} className="rotate-90 text-gray-400" />
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why Choose SkillBlock?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our platform combines the best of freelancing with the security and transparency of blockchain technology.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-800 rounded-xl p-8 hover:shadow-lg hover:shadow-blue-500/5 transition">
              <div className="w-14 h-14 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6">
                <Shield className="text-blue-400" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Secure Transactions</h3>
              <p className="text-gray-400">
                All payments are secured through smart contracts, ensuring both freelancers and clients are protected.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-gray-800 rounded-xl p-8 hover:shadow-lg hover:shadow-purple-500/5 transition">
              <div className="w-14 h-14 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6">
                <Zap className="text-purple-400" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Fast Payments</h3>
              <p className="text-gray-400">
                Get paid instantly once work is approved, without the delays of traditional payment systems.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-gray-800 rounded-xl p-8 hover:shadow-lg hover:shadow-indigo-500/5 transition">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-6">
                <Users className="text-indigo-400" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Skill Exchange</h3>
              <p className="text-gray-400">
                Trade skills and services with other professionals in a decentralized marketplace.
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-gray-800 rounded-xl p-8 hover:shadow-lg hover:shadow-green-500/5 transition">
              <div className="w-14 h-14 bg-green-500/10 rounded-lg flex items-center justify-center mb-6">
                <Globe className="text-green-400" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Global Community</h3>
              <p className="text-gray-400">
                Connect with talented professionals from around the world without geographical limitations.
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="bg-gray-800 rounded-xl p-8 hover:shadow-lg hover:shadow-red-500/5 transition">
              <div className="w-14 h-14 bg-red-500/10 rounded-lg flex items-center justify-center mb-6">
                <Database className="text-red-400" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Transparent Records</h3>
              <p className="text-gray-400">
                All transactions and reviews are stored on the blockchain, creating a trusted reputation system.
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="bg-gray-800 rounded-xl p-8 hover:shadow-lg hover:shadow-yellow-500/5 transition">
              <div className="w-14 h-14 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-6">
                <Code className="text-yellow-400" size={28} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Smart Contracts</h3>
              <p className="text-gray-400">
                Agreements are enforced through code, eliminating the need for intermediaries and reducing disputes.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section - Only show when wallet is not connected */}
      {!isWalletConnected && (
        <div className="py-20 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
              Join thousands of freelancers and clients already using SkillBlock to connect, collaborate, and create.
            </p>
            <button 
              onClick={connectWallet}
              disabled={isConnecting}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-semibold shadow-lg hover:shadow-blue-500/20 transition transform hover:scale-105 disabled:opacity-50"
            >
              <span>{isConnecting ? 'Connecting...' : 'Connect Your Wallet'}</span>
              {!isConnecting && <ArrowRight size={20} />}
            </button>
          </div>
        </div>
      )}
      
      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: scale(1); }
          33% { transform: scale(1.1); }
          66% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Hero;