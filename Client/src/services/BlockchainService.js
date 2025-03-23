import FreelancePlatformContract from "../../contract";

class BlockchainService {
  constructor() {
    this.contract = new FreelancePlatformContract();
    this.initialized = false;
  }

  // Initialize the contract connection
  async init() {
    if (!this.initialized) {
      this.initialized = await this.contract.init();
    }
    return this.initialized;
  }

  // Get current wallet address
  async getCurrentWallet() {
    await this.init();
    return await this.contract.getAccount();
  }

  // Create a new project on the blockchain
  async createProject(deadline, budget) {
    try {
      await this.init();
      
      // Convert deadline from string or Date to UNIX timestamp
      let deadlineTimestamp;
      if (typeof deadline === 'string') {
        deadlineTimestamp = Math.floor(new Date(deadline).getTime() / 1000);
      } else if (deadline instanceof Date) {
        deadlineTimestamp = Math.floor(deadline.getTime() / 1000);
      } else {
        deadlineTimestamp = Math.floor(deadline / 1000);
      }
      
      const result = await this.contract.createProject(deadlineTimestamp, budget);
      return {
        success: true,
        txHash: result.hash,
        message: 'Project created successfully on blockchain'
      };
    } catch (error) {
      console.error('Error creating blockchain project:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fetch all projects from blockchain
  async getAllProjects() {
    try {
      await this.init();
      const projects = await this.contract.getAllProjects();
      return {
        success: true,
        data: projects
      };
    } catch (error) {
      console.error('Error fetching blockchain projects:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get active projects
  async getActiveProjects() {
    try {
      await this.init();
      const projects = await this.contract.getActiveProjects();
      return {
        success: true,
        data: projects
      };
    } catch (error) {
      console.error('Error fetching active projects:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get projects by client address
  async getProjectsByClient(clientAddress) {
    try {
      await this.init();
      const projects = await this.contract.getProjectsByClient(clientAddress);
      return {
        success: true,
        data: projects
      };
    } catch (error) {
      console.error('Error fetching client projects:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get projects by freelancer address
  async getProjectsByFreelancer(freelancerAddress) {
    try {
      await this.init();
      const projects = await this.contract.getProjectsByFreelancer(freelancerAddress);
      return {
        success: true,
        data: projects
      };
    } catch (error) {
      console.error('Error fetching freelancer projects:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Place a bid on a project
  async placeBid(projectId, bidAmount) {
    try {
      await this.init();
      const result = await this.contract.placeBid(projectId, bidAmount);
      return {
        success: true,
        txHash: result.hash,
        message: 'Bid placed successfully'
      };
    } catch (error) {
      console.error('Error placing bid:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Submit work for a project (GitHub link)
  async submitWork(projectId, githubLink) {
    try {
      await this.init();
      const result = await this.contract.submitWork(projectId, githubLink);
      return {
        success: true,
        txHash: result.hash,
        message: 'Work submitted successfully'
      };
    } catch (error) {
      console.error('Error submitting work:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Approve work and release payment
  async approveWork(projectId) {
    try {
      await this.init();
      const result = await this.contract.approveWork(projectId);
      return {
        success: true,
        txHash: result.hash,
        message: 'Work approved and payment released'
      };
    } catch (error) {
      console.error('Error approving work:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Request refund for expired project
  async refundExpiredProject(projectId) {
    try {
      await this.init();
      const result = await this.contract.refundIfExpired(projectId);
      return {
        success: true,
        txHash: result.hash,
        message: 'Refund requested successfully'
      };
    } catch (error) {
      console.error('Error requesting refund:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get project details
  async getProjectDetails(projectId) {
    try {
      await this.init();
      const details = await this.contract.getProjectDetails(projectId);
      return {
        success: true,
        data: details
      };
    } catch (error) {
      console.error('Error getting project details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Check if user has bid on a project
  async hasUserBid(projectId, userAddress) {
    try {
      await this.init();
      const hasBid = await this.contract.hasUserBid(projectId, userAddress);
      return {
        success: true,
        data: hasBid
      };
    } catch (error) {
      console.error('Error checking if user has bid:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get bid amount for a specific freelancer
  async getBidAmount(projectId, freelancerAddress) {
    try {
      await this.init();
      const bidAmount = await this.contract.getBidAmount(projectId, freelancerAddress);
      return {
        success: true,
        data: bidAmount
      };
    } catch (error) {
      console.error('Error getting bid amount:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get lowest bid for a project
  async getLowestBid(projectId) {
    try {
      await this.init();
      const lowestBid = await this.contract.getLowestBid(projectId);
      return {
        success: true,
        data: lowestBid
      };
    } catch (error) {
      console.error('Error getting lowest bid:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Format blockchain project to MongoDB format for UI compatibility
  formatBlockchainProject(project) {
    // Add default values and map blockchain data structure to MongoDB format
    return {
      _id: project.id,
      title: `Project #${project.id}`,
      description: `Blockchain project with ${project.stakedAmount} ETH budget`,
      budget: project.stakedAmount,
      deadline: new Date(Number(project.deadline) * 1000),
      client: project.client,
      freelancer: project.freelancer,
      status: this.mapBlockchainStatus(project.status),
      isCompleted: project.isCompleted,
      githubLink: project.githubLink || "",
      bidCount: project.bidCount,
      lowestBid: project.lowestBid,
      lowestBidder: project.lowestBidder,
      createdAt: new Date(),
      category: "blockchain",
      skills: ["Smart Contracts", "Blockchain"],
      proposalCount: project.bidCount
    };
  }

  // Map blockchain status to MongoDB status
  mapBlockchainStatus(blockchainStatus) {
    switch(blockchainStatus.toLowerCase()) {
      case 'open for bidding': return 'open';
      case 'in progress': return 'in_progress';
      case 'completed': return 'completed';
      case 'expired': return 'expired';
      default: return 'open';
    }
  }

  // Check if wallet is connected to MetaMask
  async isWalletConnected() {
    if (!window.ethereum) return false;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      return accounts.length > 0;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }

  // Get current chain ID
  async getChainId() {
    if (!window.ethereum) return null;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return chainId;
    } catch (error) {
      console.error('Error getting chain ID:', error);
      return null;
    }
  }

  // Check if on EDU testnet
  async isOnEduChain() {
    const chainId = await this.getChainId();
    return chainId === '0x96'; // EDU Testnet chain ID
  }
}

export default new BlockchainService();