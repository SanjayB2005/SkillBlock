import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProofOfWorkNFTService from '../../../services/ProofOfWorkNFTService';
import { 
  FiBriefcase, FiHexagon, FiCalendar, FiCheckCircle,
  FiAlertCircle, FiUser, FiEye, FiX, FiArrowLeft
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL ||'http://localhost:5000/api';

function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [proofForm, setProofForm] = useState({
    githubLink: '',
    documentation: '',
    clientRating: '5',
  });
  const [proofImageFile, setProofImageFile] = useState(null);
  const [proofImagePreview, setProofImagePreview] = useState('');
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [completeInProgress, setCompleteInProgress] = useState(false);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETH',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount).replace('ETH', 'ETH');
  };

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const openProofModal = (assignment) => {
    setSelectedAssignment(assignment);
    setProofForm({
      githubLink: assignment?.proofOfWork?.githubLink || '',
      documentation: assignment?.proofOfWork?.documentation || '',
      clientRating: assignment?.proofOfWork?.clientRating?.toString?.() || '5',
    });
    setProofImageFile(null);
    setProofImagePreview('');
    setImageUploadProgress(0);
    setProofModalOpen(true);
  };

  const closeProofModal = () => {
    setProofModalOpen(false);
    setImageUploadProgress(0);
  };

  useEffect(() => {
    return () => {
      if (proofImagePreview) {
        URL.revokeObjectURL(proofImagePreview);
      }
    };
  }, [proofImagePreview]);

  // Fetch assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_URL}/projects/my-assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let assignmentsData = [];
      if (Array.isArray(response.data)) {
        assignmentsData = response.data;
      } else if (response.data?.assignments) {
        assignmentsData = response.data.assignments;
      } else if (response.data?.projects) {
        assignmentsData = response.data.projects;
      } else {
        throw new Error('Unexpected response format from server');
      }
      
      setAssignments(assignmentsData);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  // Handle marking a project as complete
  const handleMarkAsComplete = async (assignment) => {
    if (!assignment?._id) return;
    
    try {
      setCompleteInProgress(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const githubLink = proofForm.githubLink.trim();
      const documentation = proofForm.documentation.trim();
      const clientRating = Number(proofForm.clientRating);

      if (!githubLink) {
        showNotification('GitHub link is required', 'error');
        return;
      }

      if (!documentation) {
        showNotification('Documentation is required', 'error');
        return;
      }

      if (!proofImageFile) {
        showNotification('Proof image file is required', 'error');
        return;
      }

      const pinnedImageFormData = new FormData();
      pinnedImageFormData.append('image', proofImageFile);

      const pinnedImage = await axios.post(
        `${API_URL}/projects/${assignment._id}/proof/pin-image`,
        pinnedImageFormData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setImageUploadProgress(progress);
            }
          },
        }
      );

      const imageCid = pinnedImage.data?.cid;
      if (!imageCid) {
        throw new Error('Could not upload proof image to IPFS');
      }

      const pinnedDeliverable = await axios.post(
        `${API_URL}/projects/${assignment._id}/proof/pin-deliverable`,
        {
          deliverable: {
            type: 'proof-work-package',
            githubLink,
            documentation,
          },
          title: `Deliverable-${assignment._id}`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const workDeliverableCid = pinnedDeliverable.data?.cid;
      if (!workDeliverableCid) {
        throw new Error('Could not pin deliverable to IPFS');
      }

      const preparePayload = {
        workDeliverableCid,
        imageCid,
        clientRating: Number.isFinite(clientRating) ? Math.max(0, Math.min(5, clientRating)) : 0,
        category: assignment.category || 'General',
        skillsUsed: Array.isArray(assignment.skills)
          ? assignment.skills
          : (typeof assignment.skills === 'string' ? assignment.skills.split(',').map((s) => s.trim()) : []),
        completionDate: new Date().toISOString(),
        name: `Proof of Work: ${assignment.title || 'Project'} #${assignment._id}`,
        description:
          assignment.description ||
          `Verified completion for project ${assignment.title || assignment._id} on SkillBlock.`,
      };

      const prepareResponse = await axios.post(
        `${API_URL}/projects/${assignment._id}/proof/prepare`,
        preparePayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const metadataUri = prepareResponse.data?.proof?.metadataUri;
      if (!metadataUri) {
        throw new Error('Metadata URI was not returned after proof preparation');
      }

      const freelancerWallet = localStorage.getItem('walletAddress');
      if (!freelancerWallet) {
        throw new Error('Wallet address not found. Reconnect your wallet and try again.');
      }

      const mintResult = await ProofOfWorkNFTService.mintProof(freelancerWallet, metadataUri);

      await axios.put(
        `${API_URL}/projects/${assignment._id}/proof/mint-record`,
        {
          tokenId: mintResult.tokenId || 'unknown',
          txHash: mintResult.txHash,
          nftContractAddress: mintResult.nftContractAddress,
          mintedAt: new Date().toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      try {
        await axios.put(
          `${API_URL}/projects/${assignment._id}/freelancer-complete`,
          { completedAt: new Date().toISOString() },
          { headers: { Authorization: `Bearer ${token}` }}
        );
      } catch (firstError) {
        if (firstError.response?.status === 404) {
          await axios.put(
            `${API_URL}/projects/${assignment._id}/complete`,
            { completedAt: new Date().toISOString() },
            { headers: { Authorization: `Bearer ${token}` }}
          );
        } else {
          throw firstError;
        }
      }

      setAssignments(prev => 
        prev.map(a => a._id === assignment._id ? {...a, status: 'completed'} : a)
      );

      if (selectedAssignment?._id === assignment._id) {
        setSelectedAssignment({...selectedAssignment, status: 'completed'});
      }

      closeProofModal();
      setProofForm({ githubLink: '', documentation: '', clientRating: '5' });
      setProofImageFile(null);
      setProofImagePreview('');
      setImageUploadProgress(0);

      const metadataCid = prepareResponse.data?.proof?.metadataCid;
      const proofSummary = metadataCid
        ? ` Metadata CID: ${metadataCid}`
        : '';
      showNotification(`Project completed and proof NFT minted.${proofSummary}`, 'success');
    } catch (err) {
      console.error('Error marking project as complete:', err);
      const errorMessage = err.response?.status === 403
        ? 'You do not have permission to complete this project'
        : err.response?.data?.message || 'Failed to mark project as complete';
      showNotification(errorMessage, 'error');
    } finally {
      setCompleteInProgress(false);
    }
  };

  // Handle opening the details modal
  const handleViewDetails = (assignment) => {
    if (assignment) {
      setSelectedAssignment(assignment);
      setDetailsModalOpen(true);
    }
  };

  // Load assignments on component mount
  useEffect(() => {
    fetchAssignments();
  }, []);

  // Assignment Details Modal Component
  const AssignmentDetailsModal = () => {
    if (!selectedAssignment) return null;

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-white">{selectedAssignment.title || 'Assignment Details'}</h3>
              <p className="text-gray-400 text-sm mt-1">
                {selectedAssignment.status || 'open'}
              </p>
            </div>
            <button 
              onClick={() => setDetailsModalOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6 text-gray-200">
            <div>
              <h4 className="text-gray-400 text-sm mb-1">Description</h4>
              <p>{selectedAssignment.description || 'No description available'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-gray-400 text-sm mb-1">Budget</h4>
                <p>{formatCurrency(selectedAssignment.budget || 0)}</p>
              </div>
              <div>
                <h4 className="text-gray-400 text-sm mb-1">Deadline</h4>
                <p>{selectedAssignment.deadline ? new Date(selectedAssignment.deadline).toLocaleDateString() : 'No deadline'}</p>
              </div>
            </div>

            {selectedAssignment.proofOfWork && (
              <div className="border border-blue-500/30 bg-blue-950/20 rounded-lg p-4 space-y-3">
                <h4 className="text-white font-medium">Proof of Work NFT</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Metadata CID</p>
                    <p className="break-all text-blue-300">{selectedAssignment.proofOfWork.metadataCid || 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Deliverable CID</p>
                    <p className="break-all text-blue-300">{selectedAssignment.proofOfWork.workDeliverableCid || 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Token ID</p>
                    <p>{selectedAssignment.proofOfWork.nftTokenId || 'Pending mint'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Mint Tx</p>
                    <p className="break-all">{selectedAssignment.proofOfWork.nftMintTxHash || 'Pending mint'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              {selectedAssignment.status !== 'completed' && (
                <button
                  onClick={() => openProofModal(selectedAssignment)}
                  disabled={completeInProgress}
                  className={`px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm flex items-center
                    ${completeInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FiCheckCircle className="mr-2" /> Complete and Mint NFT
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link to="/freelancer-dashboard" className="text-blue-400 hover:text-blue-300 mr-4">
          <FiArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold text-white">My Active Jobs</h1>
      </div>

      {notification && (
        <div className={`p-4 mb-4 rounded-lg ${
          notification.type === 'error' ? 'bg-red-900/50 text-red-200' :
          notification.type === 'success' ? 'bg-green-900/50 text-green-200' :
          'bg-blue-900/50 text-blue-200'
        }`}>
          {notification.message}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 text-red-200 p-4 rounded-lg text-center my-6">
          <FiAlertCircle size={24} className="mx-auto mb-2" />
          <p>{error}</p>
          <button 
            onClick={fetchAssignments}
            className="mt-3 px-4 py-1 bg-red-700 hover:bg-red-800 rounded"
          >
            Retry
          </button>
        </div>
      ) : assignments.length > 0 ? (
        <div className="space-y-6">
          {assignments.map(assignment => assignment && (
            <div 
              key={assignment._id || Math.random()} 
              className={`bg-gray-800 p-5 rounded-lg hover:bg-gray-800/90 transition-colors
                ${assignment.status === 'completed' ? 'border-l-4 border-blue-500' : ''}`}
            >
              {/* Assignment card content */}
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-medium text-white">
                      {assignment.title || 'Untitled Assignment'}
                    </h3>
                    {assignment.status === 'completed' && (
                      <span className="bg-blue-900/40 text-blue-200 px-2 py-0.5 rounded-full text-xs">
                        COMPLETED
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 line-clamp-2">
                    {assignment.description || 'No description available'}
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-blue-400">
                    <FiHexagon size={16} className="mr-1" />
                    <span className="font-bold">{formatCurrency(assignment.budget || 0)}</span>
                  </div>
                  
                  {assignment.deadline && (
                    <div className="flex items-center text-amber-400">
                      <FiCalendar size={16} className="mr-1" />
                      <span>{new Date(assignment.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-between mt-4">
                <div className="flex items-center text-gray-400 text-sm">
                  <FiUser size={14} className="mr-1" />
                  <span>Client: {assignment.client?.name || 'Anonymous'}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  {assignment.status !== 'completed' && (
                    <button
                      onClick={() => openProofModal(assignment)}
                      disabled={completeInProgress}
                      className={`px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-white text-sm flex items-center
                        ${completeInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <FiCheckCircle className="mr-1" /> Complete
                    </button>
                  )}
                  <button
                    onClick={() => handleViewDetails(assignment)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm flex items-center"
                  >
                    <FiEye className="mr-1" /> Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 p-8 rounded-lg text-center">
          <FiBriefcase size={48} className="mx-auto mb-4 text-gray-500" />
          <h3 className="text-xl font-medium text-white mb-2">No Active Jobs</h3>
          <p className="text-gray-400 mb-6">
            You don't have any active jobs at the moment. Check back later or find new projects to bid on.
          </p>
          <Link to="/freelancer-dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded inline-flex items-center">
            <FiBriefcase className="mr-2" /> Find Work
          </Link>
        </div>
      )}
      
      {detailsModalOpen && <AssignmentDetailsModal />}

      {proofModalOpen && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold text-white">Submit Proof of Work</h3>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedAssignment.title || 'Assignment'}
                </p>
              </div>
              <button
                onClick={closeProofModal}
                className="text-gray-400 hover:text-white"
                disabled={completeInProgress}
              >
                <FiX size={24} />
              </button>
            </div>

            <form
              className="p-6 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                handleMarkAsComplete(selectedAssignment);
              }}
            >
              <div>
                <label className="block text-gray-300 mb-2" htmlFor="githubLink">
                  GitHub Link
                </label>
                <input
                  id="githubLink"
                  type="url"
                  value={proofForm.githubLink}
                  onChange={(e) => setProofForm((prev) => ({ ...prev, githubLink: e.target.value }))}
                  placeholder="https://github.com/yourname/project-repo"
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2" htmlFor="documentation">
                  Documentation
                </label>
                <textarea
                  id="documentation"
                  value={proofForm.documentation}
                  onChange={(e) => setProofForm((prev) => ({ ...prev, documentation: e.target.value }))}
                  placeholder="Describe what was delivered, how to verify it, and any notes for the client."
                  rows={6}
                  className="w-full rounded-lg bg-gray-700 border border-gray-600 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="proofImage">
                    Proof Image
                  </label>
                  <input
                    id="proofImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;

                      if (proofImagePreview) {
                        URL.revokeObjectURL(proofImagePreview);
                      }

                      setProofImageFile(file);
                      setImageUploadProgress(0);
                      setProofImagePreview(file ? URL.createObjectURL(file) : '');
                    }}
                    className="w-full rounded-lg bg-gray-700 border border-gray-600 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-2 text-xs text-gray-400">
                    Upload a visual proof card or screenshot. The backend will pin it to IPFS and use the returned CID.
                  </p>
                  {proofImagePreview && (
                    <div className="mt-4 rounded-lg border border-gray-600 bg-gray-700/40 p-3">
                      <p className="text-xs text-gray-400 mb-2">Preview</p>
                      <img
                        src={proofImagePreview}
                        alt="Proof preview"
                        className="w-full max-h-56 object-contain rounded-md bg-black/20"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-300 mb-2" htmlFor="clientRating">
                    Client Rating
                  </label>
                  <input
                    id="clientRating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={proofForm.clientRating}
                    onChange={(e) => setProofForm((prev) => ({ ...prev, clientRating: e.target.value }))}
                    className="w-full rounded-lg bg-gray-700 border border-gray-600 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-blue-950/20 border border-blue-500/20 p-4 text-sm text-blue-200">
                The GitHub link, documentation, and uploaded image will be pinned to IPFS first, then used to generate the NFT metadata.
              </div>

              {completeInProgress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Uploading proof image</span>
                    <span>{imageUploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${imageUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeProofModal}
                  className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500 hover:text-white"
                  disabled={completeInProgress}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completeInProgress}
                  className={`px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white flex items-center ${completeInProgress ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <FiCheckCircle className="mr-2" />
                  {completeInProgress ? 'Processing...' : 'Submit and Mint NFT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assignments;