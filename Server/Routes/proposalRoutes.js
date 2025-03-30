const router = require('express').Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Proposal, Project, User } = require('../models/model');

// Auth middleware for protected routes - Move this to the top
const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Get all proposals - Now middleware is defined before use
router.get('/', authenticateUser, async (req, res) => {
  try {
    const proposals = await Proposal.find()
      .populate('freelancer', 'name email')
      .populate('project', 'title');
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ...rest of your existing routes...


// Create a new proposal
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { project, coverLetter, bidAmount, estimatedDuration } = req.body;
    
    // Basic validation
    if (!project || !coverLetter || !bidAmount) {
      return res.status(400).json({ message: 'Project, cover letter and bid amount are required' });
    }
    
    // Check if project exists and is open
    const projectData = await Project.findById(project);
    
    if (!projectData) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (projectData.status !== 'open') {
      return res.status(400).json({ message: 'This project is no longer accepting proposals' });
    }
    
    // Check if user is a freelancer
    const user = await User.findById(req.userId);
    if (user.role !== 'freelancer' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Only freelancers can submit proposals' });
    }
    
    // Check if user already submitted a proposal for this project
    const existingProposal = await Proposal.findOne({ 
      project: project,
      freelancer: req.userId
    });
    
    if (existingProposal) {
      return res.status(400).json({ message: 'You have already submitted a proposal for this project' });
    }
    
    // Create the proposal
    const proposal = new Proposal({
      project,
      freelancer: req.userId,
      coverLetter,
      bidAmount: Number(bidAmount),
      estimatedDuration,
      status: 'pending'
    });
    
    await proposal.save();
    
    // Add this proposal to the project's proposals array
    await Project.findByIdAndUpdate(
      project,
      { $push: { proposals: proposal._id } }
    );
    
    // Populate freelancer info before returning
    const populatedProposal = await Proposal.findById(proposal._id)
      .populate('freelancer', 'name email')
      .populate({
        path: 'project',
        select: 'title budget client',
        populate: {
          path: 'client',
          select: 'name email'
        }
      });
    
    res.status(201).json({ 
      message: 'Proposal submitted successfully',
      proposal: populatedProposal
    });
  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my proposals (for freelancers)
router.get('/my-proposals', authenticateUser, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Ensure user is a freelancer
    const user = await User.findById(req.userId);
    if (user.role !== 'freelancer' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Only freelancers can access their proposals' });
    }
    
    // Get proposals submitted by this freelancer
    const proposals = await Proposal.find({ freelancer: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'project',
        select: 'title budget deadline client status',
        populate: {
          path: 'client',
          select: 'name email'
        }
      });
    
    // Get total count for pagination
    const totalProposals = await Proposal.countDocuments({ freelancer: req.userId });
    
    // Get count by status for dashboard stats
    const pendingCount = await Proposal.countDocuments({ 
      freelancer: req.userId,
      status: 'pending'
    });
    
    res.json({
      proposals,
      stats: {
        pending: pendingCount,
        total: totalProposals
      },
      pagination: {
        total: totalProposals,
        pages: Math.ceil(totalProposals / limit),
        current: page
      }
    });
  } catch (error) {
    console.error('Get my proposals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get proposals for my project (for clients)
router.get('/project/:projectId', authenticateUser, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Find the project
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if the user is the project owner
    if (project.client.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only view proposals for your own projects' });
    }
    
    // Get all proposals for this project
    const proposals = await Proposal.find({ project: projectId })
      .sort({ createdAt: -1 })
      .populate('freelancer', 'name email bio skills rating completedProjects');
    
    res.json({ proposals });
  } catch (error) {
    console.error('Get project proposals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update proposal status (for clients)
router.put('/:id/status', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, clientNotes } = req.body;
    
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Find the proposal
    const proposal = await Proposal.findById(id);
    
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }
    
    // Find the project
    const project = await Project.findById(proposal.project);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if the user is the project owner
    if (project.client.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only update proposals for your own projects' });
    }
    
    // If accepting proposal
    if (status === 'accepted') {
      // Check if project already has a hired freelancer
      if (project.hiredFreelancer) {
        return res.status(400).json({ message: 'Project already has a hired freelancer' });
      }
      
      // Update project with hired freelancer and set status to in_progress
      await Project.findByIdAndUpdate(
        proposal.project,
        { 
          hiredFreelancer: proposal.freelancer,
          status: 'in_progress',
          updatedAt: Date.now()
        }
      );
      
      // Reject all other proposals for this project
      await Proposal.updateMany(
        { 
          project: proposal.project,
          _id: { $ne: proposal._id }
        },
        { 
          status: 'rejected',
          clientNotes: 'Another freelancer was selected for this project'
        }
      );
    }
    
    // Update the proposal
    const updatedProposal = await Proposal.findByIdAndUpdate(
      id,
      { 
        status,
        clientNotes,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate('freelancer', 'name email')
     .populate({
       path: 'project',
       select: 'title budget client status',
       populate: {
         path: 'client',
         select: 'name email'
       }
     });
    
    res.json({
      message: 'Proposal status updated successfully',
      proposal: updatedProposal
    });
  } catch (error) {
    console.error('Update proposal status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Simple notification endpoint for testing
router.get('/notifications', authenticateUser, (req, res) => {
  res.json({ 
    notifications: [
      {
        _id: '1',
        message: 'Your proposal was accepted',
        read: false,
        createdAt: new Date()
      }
    ]
  });
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateUser, (req, res) => {
  res.json({ success: true });
});

// Mark all notifications as read
router.put('/notifications/mark-all-read', authenticateUser, (req, res) => {
  res.json({ success: true });
});

module.exports = router;