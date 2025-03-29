import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUser, FiClock, FiCheck, FiHexagon, FiCalendar, FiToggleRight, FiToggleLeft } from 'react-icons/fi';

const API_URL = 'http://localhost:5000/api';

export const ProposalList = ({ projectId, onAcceptProposal, showNotification }) => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoAccept, setAutoAccept] = useState(false); // Toggle state for auto acceptance
  const [maxBidsReceived, setMaxBidsReceived] = useState(false);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await axios.get(`${API_URL}/proposals/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Make sure response.data is an array before sorting
        const proposalsArray = Array.isArray(response.data) 
          ? response.data 
          : response.data.proposals || [];
        
        // Sort by bid amount (lowest first)
        const sortedProposals = [...proposalsArray].sort((a, b) => 
          parseFloat(a.bidAmount) - parseFloat(b.bidAmount)
        );
        
        setProposals(sortedProposals);
        
        // Check if we've hit exactly 5 proposals
        const hasExactlyFiveBids = sortedProposals.length === 5;
        setMaxBidsReceived(hasExactlyFiveBids);
        
        // Auto-accept lowest bid ONLY if: 
        // 1. Auto accept is enabled
        // 2. We have exactly 5 proposals
        // 3. No proposal is already accepted
        if (autoAccept && 
            hasExactlyFiveBids && 
            !sortedProposals.some(p => p.status === 'accepted')) {
          const lowestBidProposal = sortedProposals[0];
          handleAcceptProposal(lowestBidProposal);
        }
      } catch (err) {
        console.error('Error fetching proposals:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch proposals');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProposals();
    }
  }, [projectId]); // Removed autoAccept from dependency array to prevent re-fetching on toggle

  // Toggle auto-accept mode
  const toggleAutoAccept = () => {
    const newValue = !autoAccept;
    setAutoAccept(newValue);
    
    // If turning on auto-accept AND we already have exactly 5 proposals,
    // and none are accepted yet, accept the lowest bid immediately
    if (newValue && 
        maxBidsReceived && 
        proposals.length === 5 &&
        !proposals.some(p => p.status === 'accepted')) {
      const lowestBidProposal = proposals[0];
      handleAcceptProposal(lowestBidProposal);
    }

    // Show notification about the mode change
    showNotification(
      newValue 
        ? 'Auto-accept mode enabled. The lowest bid will be automatically accepted when 5 proposals are received.' 
        : 'Auto-accept mode disabled. You can manually select proposals.',
      'info'
    );
  };

  const handleAcceptProposal = async (proposal) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Make API call to accept the proposal
      await axios.put(`${API_URL}/proposals/${proposal._id}/status`, 
        { status: 'accepted' },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Update local state without closing the modal
      setProposals(prev => 
        prev.map(p => ({
          ...p,
          status: p._id === proposal._id ? 'accepted' : 'rejected'
        }))
      );

      // Notify user but don't call onAcceptProposal which would close the modal
      showNotification('Proposal accepted successfully!', 'success');
      
      // Only call the parent's onAcceptProposal if we want to close the modal
      // onAcceptProposal && onAcceptProposal(proposal);
    } catch (err) {
      console.error('Error accepting proposal:', err);
      showNotification(err.response?.data?.message || 'Failed to accept proposal', 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/30 text-red-200 p-4 rounded-md">
        {error}
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400">No proposals received yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-800/50 p-4 rounded-lg mb-2 flex justify-between items-center">
        <p className="text-gray-300 text-sm">
          {proposals.length === 5 && autoAccept && proposals.some(p => p.status === 'accepted')
            ? "Maximum number of proposals (5) received. The lowest bid has been automatically selected."
            : proposals.length === 5
            ? "Maximum number of proposals (5) received."
            : `Showing ${proposals.length} proposal${proposals.length !== 1 ? 's' : ''}`
          }
        </p>
        
        {/* Auto-accept toggle button */}
        <div className="flex items-center">
          <span className="text-sm text-gray-400 mr-2">Auto-accept lowest bid:</span>
          <button
            onClick={toggleAutoAccept}
            className={`text-2xl transition-colors duration-300 ${
              autoAccept ? 'text-green-400' : 'text-gray-500'
            }`}
            title={autoAccept ? "Disable auto-accept" : "Enable auto-accept"}
          >
            {autoAccept ? <FiToggleRight size={28} /> : <FiToggleLeft size={28} />}
          </button>
        </div>
      </div>
      
      {/* Information tooltip when auto-accept is on */}
      {autoAccept && (
        <div className="bg-blue-900/30 text-blue-200 p-3 rounded-lg text-sm mb-4 flex items-start">
          <div className="mr-2 mt-0.5"><FiCheck /></div>
          <div>
            With auto-accept enabled, the system will automatically accept the lowest bid when 5 proposals are received.
            Turn off this feature to manually select which proposal to accept.
          </div>
        </div>
      )}
      
      {/* Waiting for more proposals message */}
      {autoAccept && proposals.length < 5 && (
        <div className="bg-amber-900/30 text-amber-200 p-3 rounded-lg text-sm mb-4 flex items-start">
          <div className="mr-2 mt-0.5"><FiClock /></div>
          <div>
            Waiting for more proposals. Auto-accept will trigger when 5 proposals are received.
            Currently {proposals.length} of 5 proposals received.
          </div>
        </div>
      )}
      
      {proposals.map((proposal) => (
        <div 
          key={proposal._id} 
          className={`bg-gray-800 rounded-lg p-4 ${
            proposal.status === 'accepted' ? 'border-2 border-green-500' : 
            proposal.status === 'rejected' ? 'opacity-60' : ''
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center">
              <div className="bg-gray-700 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                <FiUser className="text-gray-300" />
              </div>
              <div>
                <h3 className="font-medium text-white">{proposal.freelancer?.name || 'Freelancer'}</h3>
                <p className="text-gray-400 text-sm">{proposal.freelancer?.email || 'Unknown'}</p>
              </div>
            </div>
            <div className={`text-right ${
              proposal.status === 'accepted' ? 'text-green-400' : 
              proposal.status === 'rejected' ? 'text-red-400' : 
              'text-blue-400'
            }`}>
              <div className="font-bold">
                {proposal.status === 'accepted' ? 'Accepted' : 
                 proposal.status === 'rejected' ? 'Rejected' : 
                 'Pending'}
              </div>
              <div className="text-xs text-gray-400">
                {new Date(proposal.createdAt || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center">
              <FiHexagon className="text-gray-500 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Bid Amount</p>
                <p className="text-white font-medium">
                  ETH {parseFloat(proposal.bidAmount || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <FiCalendar className="text-gray-500 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-white font-medium">
                  {proposal.estimatedDuration?.value || 0} {proposal.estimatedDuration?.unit || 'days'}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <FiClock className="text-gray-500 mr-2" />
              <div>
                <p className="text-xs text-gray-500">Submitted</p>
                <p className="text-white font-medium">
                  {new Date(proposal.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-3 mt-3">
            <p className="text-sm text-gray-300 mb-4">{proposal.coverLetter || 'No cover letter provided'}</p>
            
            {/* Only show accept button for pending proposals when auto-accept is off */}
            {proposal.status !== 'accepted' && 
             proposal.status !== 'rejected' && 
             !proposals.some(p => p.status === 'accepted') && (
              <div className="flex justify-end">
                <button 
                  onClick={() => handleAcceptProposal(proposal)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
                >
                  <FiCheck className="mr-2" />
                  Accept Proposal
                </button>
              </div>
            )}
            
            {/* Indicator for lowest bid */}
            {proposals.indexOf(proposal) === 0 && (
              <div className="bg-amber-900/30 text-amber-200 px-3 py-1 rounded-md text-xs inline-block mt-2">
                Lowest Bid
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProposalList;