import { ethers } from 'ethers';
import { contractABI } from '../contracts/contractabi';

class FreelancePlatformContract {
  constructor() {
    this.contractAddress = '0xb14dd02ec57ab9aa38b25c984f4cead92a2452a6';
    this.contractABI = contractABI;
    this.contract = null;
    this.signer = null;
    this.provider = null;
  }

  // Initialize the contract connection
  async init() {
    try {
      // Check if MetaMask is installed
      if (window.ethereum) {
        // Create provider and connect to MetaMask
        this.provider = new ethers.BrowserProvider(window.ethereum);
        
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Get the signer
        this.signer = await this.provider.getSigner();
        
        // Create contract instance
        this.contract = new ethers.Contract(
          this.contractAddress,
          this.contractABI,
          this.signer
        );
        
        return true;
      } else {
        console.error('MetaMask not installed');
        return false;
      }
    } catch (error) {
      console.error('Error initializing contract:', error);
      return false;
    }
  }

  // Get current connected account
  async getAccount() {
    try {
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Error getting account:', error);
      return null;
    }
  }

  // Create a new project
  async createProject(deadline, stakeAmount) {
    try {
      const tx = await this.contract.createProject(deadline, {
        value: ethers.parseEther(stakeAmount.toString())
      });
      return await tx.wait();
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  // Place a bid on a project
  async placeBid(projectId, bidAmount) {
    try {
      const tx = await this.contract.placeBid(projectId, ethers.parseEther(bidAmount.toString()));
      return await tx.wait();
    } catch (error) {
      console.error('Error placing bid:', error);
      throw error;
    }
  }

  // Submit work (GitHub link)
  async submitWork(projectId, githubLink) {
    try {
      const tx = await this.contract.submitWork(projectId, githubLink);
      return await tx.wait();
    } catch (error) {
      console.error('Error submitting work:', error);
      throw error;
    }
  }

  // Approve work and release funds
  async approveWork(projectId) {
    try {
      const tx = await this.contract.approveWork(projectId);
      return await tx.wait();
    } catch (error) {
      console.error('Error approving work:', error);
      throw error;
    }
  }

  // Refund if project is expired
  async refundIfExpired(projectId) {
    try {
      const tx = await this.contract.refundIfExpired(projectId);
      return await tx.wait();
    } catch (error) {
      console.error('Error refunding project:', error);
      throw error;
    }
  }

  // Get all projects
  async getAllProjects() {
    try {
      const projectIds = await this.contract.getAllProjects();
      const projects = [];
      
      for (const id of projectIds) {
        const projectDetails = await this.getProjectDetails(id);
        projects.push({
          id: id.toString(),
          ...projectDetails
        });
      }
      
      return projects;
    } catch (error) {
      console.error('Error getting all projects:', error);
      return [];
    }
  }

  // Get active projects
  async getActiveProjects() {
    try {
      const projectIds = await this.contract.getActiveProjects();
      const projects = [];
      
      for (const id of projectIds) {
        const projectDetails = await this.getProjectDetails(id);
        projects.push({
          id: id.toString(),
          ...projectDetails
        });
      }
      
      return projects;
    } catch (error) {
      console.error('Error getting active projects:', error);
      return [];
    }
  }

  // Get projects by client
  async getProjectsByClient(clientAddress) {
    try {
      const projectIds = await this.contract.getProjectsByClient(clientAddress);
      const projects = [];
      
      for (const id of projectIds) {
        const projectDetails = await this.getProjectDetails(id);
        projects.push({
          id: id.toString(),
          ...projectDetails
        });
      }
      
      return projects;
    } catch (error) {
      console.error('Error getting client projects:', error);
      return [];
    }
  }

  // Get projects by freelancer
  async getProjectsByFreelancer(freelancerAddress) {
    try {
      const projectIds = await this.contract.getProjectsByFreelancer(freelancerAddress);
      const projects = [];
      
      for (const id of projectIds) {
        const projectDetails = await this.getProjectDetails(id);
        projects.push({
          id: id.toString(),
          ...projectDetails
        });
      }
      
      return projects;
    } catch (error) {
      console.error('Error getting freelancer projects:', error);
      return [];
    }
  }

  // Get project details
  async getProjectDetails(projectId) {
    try {
      const details = await this.contract.getProjectDetails(projectId);
      
      return {
        client: details[0],
        stakedAmount: ethers.formatEther(details[1]),
        deadline: new Date(Number(details[2]) * 1000),
        freelancer: details[3],
        isCompleted: details[4],
        githubLink: details[5],
        bidCount: details[6].toString(),
        lowestBidder: details[7],
        lowestBid: ethers.formatEther(details[8]),
        status: details[9]
      };
    } catch (error) {
      console.error(`Error getting project details for ID ${projectId}:`, error);
      return null;
    }
  }

  // Get bid amount for a specific freelancer on a project
  async getBidAmount(projectId, freelancerAddress) {
    try {
      const bidAmount = await this.contract.getBidAmount(projectId, freelancerAddress);
      return ethers.formatEther(bidAmount);
    } catch (error) {
      console.error('Error getting bid amount:', error);
      return '0';
    }
  }

  // Get lowest bid details for a project
  async getLowestBid(projectId) {
    try {
      const [address, amount] = await this.contract.getLowestBid(projectId);
      return {
        bidder: address,
        amount: ethers.formatEther(amount)
      };
    } catch (error) {
      console.error('Error getting lowest bid:', error);
      return { bidder: null, amount: '0' };
    }
  }

  // Check if user has bid on a project
  async hasUserBid(projectId, userAddress) {
    try {
      return await this.contract.hasUserBid(projectId, userAddress);
    } catch (error) {
      console.error('Error checking if user has bid:', error);
      return false;
    }
  }

  // Get contract balance
  async getContractBalance() {
    try {
      const balance = await this.contract.getContractBalance();
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting contract balance:', error);
      return '0';
    }
  }

  // Get project status
  async getProjectStatus(projectId) {
    try {
      return await this.contract.getProjectStatus(projectId);
    } catch (error) {
      console.error('Error getting project status:', error);
      return 'Unknown';
    }
  }

  // Get project count
  async getProjectCount() {
    try {
      const count = await this.contract.projectCount();
      return count.toString();
    } catch (error) {
      console.error('Error getting project count:', error);
      return '0';
    }
  }

  // Format timestamp to readable date
  formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleString();
  }
}

export default FreelancePlatformContract;