// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FreelancePlatform {
    // Project structure
    struct Project {
        address client;
        uint256 stakedAmount;
        uint256 deadline;
        address payable freelancer;
        bool isCompleted;
        string githubLink;
        uint256 bidCount;
        mapping(address => uint256) bids; // Freelancer address -> bid amount
        address lowestBidder;
        uint256 lowestBid;
    }

    // Mapping to store all projects
    mapping(uint256 => Project) public projects;
    uint256 public projectCount;

    // Events for tracking
    event ProjectCreated(uint256 projectId, address client, uint256 stakedAmount, uint256 deadline);
    event BidPlaced(uint256 projectId, address freelancer, uint256 bidAmount);
    event FreelancerSelected(uint256 projectId, address freelancer, uint256 bidAmount);
    event WorkSubmitted(uint256 projectId, string githubLink);
    event ProjectCompleted(uint256 projectId, address freelancer, uint256 amount);

    // Create a new project
    function createProject(uint256 _deadline) external payable {
        require(msg.value > 0, "Stake amount must be greater than 0");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        projectCount++;
        Project storage newProject = projects[projectCount];
        newProject.client = msg.sender;
        newProject.stakedAmount = msg.value;
        newProject.deadline = _deadline;
        newProject.isCompleted = false;
        newProject.bidCount = 0;
        newProject.lowestBid = type(uint256).max; // Set to max initially

        emit ProjectCreated(projectCount, msg.sender, msg.value, _deadline);
    }

    // Place a bid on a project
    function placeBid(uint256 _projectId, uint256 _bidAmount) external {
        Project storage project = projects[_projectId];
        require(project.client != address(0), "Project does not exist");
        require(block.timestamp < project.deadline, "Bidding period has ended");
        require(project.freelancer == address(0), "Freelancer already selected");
        require(_bidAmount <= project.stakedAmount, "Bid exceeds staked amount");
        require(project.bids[msg.sender] == 0, "You have already bid");

        project.bids[msg.sender] = _bidAmount;
        project.bidCount++;

        // Update lowest bid
        if (_bidAmount < project.lowestBid) {
            project.lowestBid = _bidAmount;
            project.lowestBidder = msg.sender;
        }

        emit BidPlaced(_projectId, msg.sender, _bidAmount);

        // Auto-select freelancer after 3 bids
        if (project.bidCount >= 3) {
            project.freelancer = payable(project.lowestBidder);
            emit FreelancerSelected(_projectId, project.freelancer, project.lowestBid);
        }
    }

    // Submit work (GitHub link)
    function submitWork(uint256 _projectId, string memory _githubLink) external {
        Project storage project = projects[_projectId];
        require(msg.sender == project.freelancer, "Only assigned freelancer can submit");
        require(block.timestamp <= project.deadline, "Deadline has passed");
        require(!project.isCompleted, "Project already completed");

        project.githubLink = _githubLink;
        emit WorkSubmitted(_projectId, _githubLink);
    }

    // Approve work and release funds
    function approveWork(uint256 _projectId) external {
        Project storage project = projects[_projectId];
        require(msg.sender == project.client, "Only client can approve");
        require(project.freelancer != address(0), "No freelancer assigned");
        require(!project.isCompleted, "Project already completed");

        project.isCompleted = true;
        project.freelancer.transfer(project.stakedAmount);

        emit ProjectCompleted(_projectId, project.freelancer, project.stakedAmount);
    }

    // Refund client if deadline passes without completion
    function refundIfExpired(uint256 _projectId) external {
        Project storage project = projects[_projectId];
        require(msg.sender == project.client, "Only client can request refund");
        require(block.timestamp > project.deadline, "Deadline not yet passed");
        require(!project.isCompleted, "Project already completed");

        project.isCompleted = true;
        payable(project.client).transfer(project.stakedAmount);
    }

    // Get project details (for frontend use)
    function getProject(uint256 _projectId) external view returns (
        address client,
        uint256 stakedAmount,
        uint256 deadline,
        address freelancer,
        bool isCompleted,
        string memory githubLink,
        uint256 bidCount
    ) {
        Project storage project = projects[_projectId];
        return (
            project.client,
            project.stakedAmount,
            project.deadline,
            project.freelancer,
            project.isCompleted,
            project.githubLink,
            project.bidCount
        );
    }
}