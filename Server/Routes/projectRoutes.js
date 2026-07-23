const router = require('express').Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');
const { Project, User, Proposal } = require('../models/model');
const { pinJson, pinFile } = require('../services/pinataService');

const upload = multer({ storage: multer.memoryStorage() });

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

// Pin deliverable JSON/content to Pinata and return CID
router.post('/:id/proof/pin-deliverable', authenticateUser, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name')
      .populate('hiredFreelancer', 'name walletAddress');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAssignedFreelancer =
      project.hiredFreelancer && project.hiredFreelancer._id.toString() === req.userId;
    const isProjectClient = project.client && project.client._id.toString() === req.userId;
    const isAdmin = req.userRole === 'admin';

    if (!isAssignedFreelancer && !isProjectClient && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to pin deliverables for this project' });
    }

    const { deliverable, title, submissionType } = req.body;
    if (!deliverable) {
      return res.status(400).json({ message: 'deliverable is required' });
    }

    const payload = {
      projectId: project._id.toString(),
      projectTitle: project.title,
      submissionType: submissionType || 'proof-deliverable',
      submittedBy: req.userId,
      submittedAt: new Date().toISOString(),
      deliverable,
    };

    const pinName = `skillblock-deliverable-${project._id}-${Date.now()}`;
    const pinned = await pinJson(payload, title || pinName);

    res.json({
      message: 'Deliverable pinned successfully',
      cid: pinned.cid,
      ipfsUri: pinned.ipfsUri,
      gatewayUrl: pinned.gatewayUrl,
    });
  } catch (error) {
    console.error('Pin deliverable error:', error);
    res.status(500).json({ message: 'Failed to pin deliverable', error: error.message });
  }
});

// Upload proof image to Pinata and return CID
router.post('/:id/proof/pin-image', authenticateUser, upload.single('image'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name')
      .populate('hiredFreelancer', 'name walletAddress');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAssignedFreelancer =
      project.hiredFreelancer && project.hiredFreelancer._id.toString() === req.userId;
    const isProjectClient = project.client && project.client._id.toString() === req.userId;
    const isAdmin = req.userRole === 'admin';

    if (!isAssignedFreelancer && !isProjectClient && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to upload proof images for this project' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    const pinned = await pinFile(req.file.buffer, req.file.originalname, req.file.mimetype);

    res.json({
      message: 'Proof image uploaded successfully',
      cid: pinned.cid,
      ipfsUri: pinned.ipfsUri,
      gatewayUrl: pinned.gatewayUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
  } catch (error) {
    console.error('Pin image error:', error);
    res.status(500).json({ message: 'Failed to upload proof image', error: error.message });
  }
});

// Generate and pin proof-of-work NFT metadata to Pinata
router.post('/:id/proof/prepare', authenticateUser, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name')
      .populate('hiredFreelancer', 'name walletAddress');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAssignedFreelancer =
      project.hiredFreelancer && project.hiredFreelancer._id.toString() === req.userId;
    const isProjectClient = project.client && project.client._id.toString() === req.userId;
    const isAdmin = req.userRole === 'admin';

    if (!isAssignedFreelancer && !isProjectClient && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to prepare proof for this project' });
    }

    const {
      imageCid,
      workDeliverableCid,
      clientRating,
      externalUrl,
      category,
      skillsUsed,
      completionDate,
      name,
      description,
    } = req.body;

    if (!workDeliverableCid) {
      return res.status(400).json({ message: 'workDeliverableCid is required' });
    }

    if (!imageCid) {
      return res.status(400).json({ message: 'imageCid is required' });
    }

    const completionTimestamp = completionDate
      ? Math.floor(new Date(completionDate).getTime() / 1000)
      : Math.floor(Date.now() / 1000);

    const normalizedSkills = Array.isArray(skillsUsed)
      ? skillsUsed.join(', ')
      : (skillsUsed || project.skills?.join(', ') || 'Not specified');

    const ratingValue = typeof clientRating === 'number'
      ? clientRating
      : Number(clientRating || 0);

    const metadata = {
      name: name || `Proof of Work: ${project.title} #${project._id}`,
      description:
        description ||
        `Verified completion of ${project.title} on SkillBlock.`,
      image: `ipfs://${imageCid}`,
      external_url: externalUrl || `https://skillblock.app/verify/${project._id}`,
      attributes: [
        {
          trait_type: 'Category',
          value: category || project.category || 'General',
        },
        {
          trait_type: 'Skills Used',
          value: normalizedSkills,
        },
        {
          trait_type: 'Client Rating',
          value: ratingValue,
        },
        {
          trait_type: 'Completion Date',
          display_type: 'date',
          value: completionTimestamp,
        },
        {
          trait_type: 'Work Deliverable CID',
          value: workDeliverableCid,
        },
      ],
    };

    const pinName = `skillblock-proof-${project._id}`;
    const pinned = await pinJson(metadata, pinName);

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'proofOfWork.metadataCid': pinned.cid,
          'proofOfWork.metadataUri': pinned.ipfsUri,
          'proofOfWork.metadataGatewayUrl': pinned.gatewayUrl,
          'proofOfWork.workDeliverableCid': workDeliverableCid,
          'proofOfWork.imageCid': imageCid,
          'proofOfWork.clientRating': ratingValue,
        },
        $push: {
          submissions: {
            deliverables: workDeliverableCid,
            comments: 'Proof prepared and metadata pinned to IPFS',
            workDeliverableCid,
            metadataCid: pinned.cid,
            metadataUri: pinned.ipfsUri,
            submittedAt: Date.now(),
          },
        },
        $setOnInsert: {
          updatedAt: Date.now(),
        },
      },
      { new: true }
    );

    res.json({
      message: 'Proof metadata pinned successfully',
      metadata,
      proof: {
        metadataCid: pinned.cid,
        metadataUri: pinned.ipfsUri,
        metadataGatewayUrl: pinned.gatewayUrl,
        workDeliverableCid,
        imageCid,
      },
      project: updatedProject,
    });
  } catch (error) {
    console.error('Prepare proof error:', error);
    res.status(500).json({ message: 'Failed to prepare proof metadata', error: error.message });
  }
});

// Record minted NFT details after on-chain transaction
router.put('/:id/proof/mint-record', authenticateUser, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isAssignedFreelancer =
      project.hiredFreelancer && project.hiredFreelancer.toString() === req.userId;
    const isProjectClient = project.client && project.client.toString() === req.userId;
    const isAdmin = req.userRole === 'admin';

    if (!isAssignedFreelancer && !isProjectClient && !isAdmin) {
      return res.status(403).json({ message: 'You are not authorized to record mint data for this project' });
    }

    const { tokenId, txHash, nftContractAddress, mintedAt } = req.body;

    if (!tokenId || !txHash || !nftContractAddress) {
      return res.status(400).json({ message: 'tokenId, txHash, and nftContractAddress are required' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'proofOfWork.nftTokenId': String(tokenId),
          'proofOfWork.nftMintTxHash': txHash,
          'proofOfWork.nftContractAddress': nftContractAddress,
          'proofOfWork.mintedAt': mintedAt ? new Date(mintedAt) : new Date(),
          'proofOfWork.mintedBy': req.userId,
          updatedAt: Date.now(),
        },
      },
      { new: true }
    )
      .populate('client', 'name email walletAddress')
      .populate('hiredFreelancer', 'name email walletAddress')
      .populate('proofOfWork.mintedBy', 'name email walletAddress');

    res.json({
      message: 'Mint record saved successfully',
      proofOfWork: updatedProject.proofOfWork,
      project: updatedProject,
    });
  } catch (error) {
    console.error('Mint record error:', error);
    res.status(500).json({ message: 'Failed to record mint data', error: error.message });
  }
});

// Get proof-of-work details for a project
router.get('/:id/proof', authenticateUser, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .select('title status category skills proofOfWork client hiredFreelancer')
      .populate('client', 'name email walletAddress')
      .populate('hiredFreelancer', 'name email walletAddress')
      .populate('proofOfWork.mintedBy', 'name email walletAddress');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({
      projectId: project._id,
      title: project.title,
      status: project.status,
      proofOfWork: project.proofOfWork || null,
      participants: {
        client: project.client,
        freelancer: project.hiredFreelancer,
      },
    });
  } catch (error) {
    console.error('Get proof error:', error);
    res.status(500).json({ message: 'Failed to fetch proof data', error: error.message });
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

// Add this new route at the end of your projectRoutes.js file
// Mark project as complete by freelancer (for freelancers)
router.put('/:id/freelancer-complete', authenticateUser, async (req, res) => {
  try {
    // Find the project
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if the user is the assigned freelancer
    if (!project.hiredFreelancer || project.hiredFreelancer.toString() !== req.userId) {
      return res.status(403).json({ message: 'You are not assigned to this project' });
    }
    
    // Check if project is in progress
    if (project.status !== 'in_progress') {
      return res.status(400).json({ message: 'Only in-progress projects can be marked as completed' });
    }
    
    // Update the project status to indicate freelancer has completed work
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
    
    // Notify client that the project has been marked as complete by the freelancer
    // This would typically involve creating a notification in a real app
    
    res.json({
      message: 'Project marked as completed successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Freelancer complete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;