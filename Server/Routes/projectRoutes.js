const router = require('express').Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Project, User, Proposal } = require('../models/model');

// Auth middleware for protected routes
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

// Create a new project
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { title, description, budget, deadline, category, skills } = req.body;
    
    // Basic validation
    if (!title || !description || !budget) {
      return res.status(400).json({ message: 'Title, description and budget are required' });
    }
    
    // Only clients can create projects
    const user = await User.findById(req.userId);
    if (user.role !== 'client' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Only clients can create projects' });
    }
    
    // Create the project
    const project = new Project({
      title,
      description,
      budget: Number(budget),
      deadline: deadline ? new Date(deadline) : undefined,
      category: category || 'other',
      skills: Array.isArray(skills) ? skills : skills?.split(',').map(s => s.trim()) || [],
      client: req.userId,
      status: 'open',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    await project.save();
    
    // Populate client info before returning
    const populatedProject = await Project.findById(project._id).populate('client', 'name email');
    
    res.status(201).json({ 
      message: 'Project created successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all projects (with filtering options)
router.get('/', async (req, res) => {
  try {
    const { category, status, search, limit = 20, page = 1 } = req.query;
    
    // Build query
    const query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination and populate client info
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('client', 'name email');
    
    // Get total count for pagination
    const totalProjects = await Project.countDocuments(query);
    
    res.json({
      projects,
      pagination: {
        total: totalProjects,
        pages: Math.ceil(totalProjects / parseInt(limit)),
        current: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get projects created by the logged-in client
router.get('/my-projects', authenticateUser, async (req, res) => {
    try {
      const { status, search, limit = 20, page = 1 } = req.query;
      
      // Build query
      const query = { client: req.userId };
      
      if (status) {
        query.status = status;
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Execute query with pagination
      const projects = await Project.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('hiredFreelancer', 'name email');
      
      // Get total count for pagination
      const totalProjects = await Project.countDocuments(query);
      
      // Get count by status for dashboard stats
      const stats = {
        active: await Project.countDocuments({ client: req.userId, status: { $in: ['open', 'in_progress'] } }),
        completed: await Project.countDocuments({ client: req.userId, status: 'completed' }),
        total: await Project.countDocuments({ client: req.userId }),
        totalBudget: 0 // Default to 0 in case of errors
      };
      
      // Try to get the budget sum with proper error handling
      try {
        const budgetResult = await Project.aggregate([
          { $match: { client: new mongoose.Types.ObjectId(req.userId) } },
          { $group: { _id: null, total: { $sum: '$budget' } } }
        ]);
        
        // Only update if we have a valid result
        if (budgetResult && budgetResult.length > 0 && budgetResult[0].total) {
          stats.totalBudget = budgetResult[0].total;
        }
      } catch (aggError) {
        console.error('Error in budget aggregation:', aggError);
        // Fallback to a different method if aggregation fails
        const allProjects = await Project.find({ client: req.userId });
        stats.totalBudget = allProjects.reduce((sum, project) => sum + (project.budget || 0), 0);
      }
      
      res.json({
        projects,
        stats,
        pagination: {
          total: totalProjects,
          pages: Math.ceil(totalProjects / parseInt(limit)),
          current: parseInt(page)
        }
      });
    } catch (error) {
      console.error('Get my projects error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  });

// Get available projects for freelancers
router.get('/available', authenticateUser, async (req, res) => {
  try {
    const { category, skill, search, limit = 10, page = 1 } = req.query;
    
    // Build query - only return open projects
    const query = { status: 'open' };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (skill) {
      query.skills = { $regex: skill, $options: 'i' };
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination and populate client info
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('client', 'name email');
    
    // Get total count for pagination
    const totalProjects = await Project.countDocuments(query);
    
    res.json({
      projects,
      pagination: {
        total: totalProjects,
        pages: Math.ceil(totalProjects / parseInt(limit)),
        current: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get available projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get projects assigned to me as a freelancer
router.get('/my-assignments', authenticateUser, async (req, res) => {
  try {
    const { status, search, limit = 10, page = 1 } = req.query;
    
    // Build query - only return projects where I'm the hired freelancer
    const query = { hiredFreelancer: req.userId };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination and populate client info
    const projects = await Project.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('client', 'name email');
    
    // Get total count for pagination
    const totalProjects = await Project.countDocuments(query);
    
    // Get count by status for dashboard stats
    const stats = {
      active: await Project.countDocuments({ 
        hiredFreelancer: req.userId, 
        status: { $in: ['open', 'in_progress'] } 
      }),
      completed: await Project.countDocuments({ 
        hiredFreelancer: req.userId, 
        status: 'completed' 
      }),
      // Calculate total earnings from completed projects
      totalEarned: await (async () => {
        try {
          const result = await Project.aggregate([
            { 
              $match: { 
                hiredFreelancer: new mongoose.Types.ObjectId(req.userId),
                status: 'completed'
              } 
            },
            { 
              $group: { 
                _id: null, 
                total: { $sum: '$budget' } 
              } 
            }
          ]);
          return result[0]?.total || 0;
        } catch (aggError) {
          console.error('Error in totalEarned aggregation:', aggError);
          return 0; // Default to 0 in case of errors
        }
      })()
    };
    
    res.json({
      projects,
      stats,
      pagination: {
        total: totalProjects,
        pages: Math.ceil(totalProjects / parseInt(limit)),
        current: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get my assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email')
      .populate('hiredFreelancer', 'name email');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a project
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { title, description, budget, deadline, category, skills, status } = req.body;
    
    // Find the project
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if the user is the project owner
    if (project.client.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only update your own projects' });
    }
    
    // Check if project is in a state that can be updated
    if (['cancelled', 'completed'].includes(project.status)) {
      return res.status(400).json({ message: `Cannot update a ${project.status} project` });
    }
    
    // Update the project
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        title: title || project.title,
        description: description || project.description,
        budget: budget ? Number(budget) : project.budget,
        deadline: deadline ? new Date(deadline) : project.deadline,
        category: category || project.category,
        skills: Array.isArray(skills) ? skills : skills?.split(',').map(s => s.trim()) || project.skills,
        status: status || project.status,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).populate('client', 'name email');
    
    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete a project (for clients)
router.put('/:id/complete', authenticateUser, async (req, res) => {
  try {
    // Find the project
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if the user is the project owner
    if (project.client.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only complete your own projects' });
    }
    
    // Check if project is in progress
    if (project.status !== 'in_progress') {
      return res.status(400).json({ message: `Only in-progress projects can be completed` });
    }
    
    // Check if a freelancer is assigned
    if (!project.hiredFreelancer) {
      return res.status(400).json({ message: 'No freelancer has been assigned to this project' });
    }
    
    // Update the project status
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        status: 'completed',
        completedAt: Date.now(),
        updatedAt: Date.now()
      },
      { new: true }
    )
    .populate('client', 'name email')
    .populate('hiredFreelancer', 'name email');
    
    // Update freelancer's completed projects count
    await User.findByIdAndUpdate(
      project.hiredFreelancer,
      { 
        $inc: { completedProjects: 1 },
        updatedAt: Date.now()
      }
    );
    
    // Here you would also handle any payment processing or release of funds
    
    res.json({
      message: 'Project marked as completed successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Complete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit work for a project (for freelancers)
router.post('/:id/submit', authenticateUser, async (req, res) => {
  try {
    const { deliverables, comments } = req.body;
    
    // Find the project
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if the user is the hired freelancer
    if (!project.hiredFreelancer || project.hiredFreelancer.toString() !== req.userId) {
      return res.status(403).json({ message: 'You are not assigned to this project' });
    }
    
    // Check if project is in progress
    if (project.status !== 'in_progress') {
      return res.status(400).json({ message: `Only in-progress projects can have work submitted` });
    }
    
    // Add the submission to the project
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          submissions: {
            deliverables,
            comments,
            submittedAt: Date.now()
          }
        },
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    // Notify the client about the submission
    // In a real app, you would create a notification in the database
    
    res.json({
      message: 'Work submitted successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Submit work error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel a project (for clients)
router.put('/:id/cancel', authenticateUser, async (req, res) => {
  try {
    const { reason } = req.body;
    
    // Find the project
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if the user is the project owner
    if (project.client.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only cancel your own projects' });
    }
    
    // Check if project can be cancelled
    if (!['open', 'in_progress'].includes(project.status)) {
      return res.status(400).json({ message: `Cannot cancel a ${project.status} project` });
    }
    
    // Update the project status
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledAt: Date.now(),
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    // If a freelancer was assigned, notify them about the cancellation
    if (project.hiredFreelancer) {
      // In a real app, you would create a notification in the database
    }
    
    res.json({
      message: 'Project cancelled successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Cancel project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a project
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    // Find the project
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if the user is the project owner
    if (project.client.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only delete your own projects' });
    }
    
    // Check if project can be deleted
    if (['in_progress', 'completed'].includes(project.status)) {
      return res.status(400).json({ 
        message: `Cannot delete a ${project.status} project. Please contact support if needed.` 
      });
    }
    
    // Delete all proposals for this project
    await Proposal.deleteMany({ project: req.params.id });
    
    // Delete the project
    await Project.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project statistics for admin dashboard
router.get('/admin/stats', authenticateUser, async (req, res) => {
  try {
    // Ensure user is an admin
    const user = await User.findById(req.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    // Get project stats
    const stats = {
      totalProjects: await Project.countDocuments({}),
      openProjects: await Project.countDocuments({ status: 'open' }),
      inProgressProjects: await Project.countDocuments({ status: 'in_progress' }),
      completedProjects: await Project.countDocuments({ status: 'completed' }),
      cancelledProjects: await Project.countDocuments({ status: 'cancelled' }),
      
      // Total value of all projects
      totalProjectValue: await Project.aggregate([
        { $group: { _id: null, total: { $sum: '$budget' } } }
      ]).then(result => (result[0]?.total || 0)),
      
      // Total value of completed projects
      completedProjectValue: await Project.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$budget' } } }
      ]).then(result => (result[0]?.total || 0)),
      
      // Projects by category
      categoryCounts: await Project.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      
      // Recent projects
      recentProjects: await Project.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('client', 'name email')
        .populate('hiredFreelancer', 'name email')
    };
    
    res.json({ stats });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;