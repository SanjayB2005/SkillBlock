const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/model');
const verifyToken = require('../middleware/auth');

router.get('/test', (req, res) => {
  res.json({ 
    message: 'User routes are working',
    timestamp: new Date(),
    env: process.env.NODE_ENV
  });
});

router.get('/', async (req, res) => {
  try {
    // You might want to add authentication here
    const users = await User.find()
      .select('-password') // Exclude password from response
      .sort({ createdAt: -1 }); // Sort by newest first
    
    res.json({
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a route to get a specific user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this test endpoint (remove in production)
router.post('/wallet-register', async (req, res) => {
  try {
    let { walletAddress, name, email, role } = req.body;

    console.log('Received registration request:', { walletAddress, name, email, role });

    if (!walletAddress) {
      return res.status(400).json({ 
        success: false,
        message: 'Wallet address is required' 
      });
    }

    // Normalize wallet address
    walletAddress = walletAddress.toLowerCase().trim();

    // Check if wallet already registered
    let user = await User.findOne({ walletAddress });
    if (user) {
      return res.status(400).json({ 
        success: false,
        message: 'Wallet already registered' 
      });
    }

    // Create new user with wallet
    user = new User({
      name: name || 'Wallet User',
      email: email || '',
      walletAddress,
      walletProvider: 'metamask',
      role: role || 'client',
      createdAt: Date.now()
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        walletAddress: user.walletAddress 
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role
      }
    });

    console.log('User registered successfully:', user.walletAddress);
  } catch (error) {
    console.error('Wallet registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration'
    });
  }
});


// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Check wallet address
router.post('/wallet-auth', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false,
        message: 'Wallet address is required' 
      });
    }

    const normalizedWalletAddress = walletAddress.toLowerCase().trim();
    const user = await User.findOne({ walletAddress: normalizedWalletAddress })
      .select('-password');
    
    if (!user) {
      return res.json({
        success: true,
        exists: false,
        message: 'Wallet not registered',
        walletAddress: normalizedWalletAddress
      });
    }

    // Generate token with role information
    const token = jwt.sign(
      { 
        userId: user._id,
        role: user.role,
        walletAddress: user.walletAddress
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    return res.json({
      success: true,
      exists: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
        bio: user.bio,
        skills: user.skills
      }
    });

  } catch (error) {
    console.error('Wallet auth error:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false,
      message: 'Server error during wallet authentication'
    });
  }
});

// Wallet Registration


router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const walletAddress = req.query.walletAddress;

    if (!token && !walletAddress) {
      return res.status(400).json({
        message: 'Authentication required - provide either token or wallet address'
      });
    }

    let query = {};
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        query = { _id: decoded.userId };
      } catch (jwtError) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
    } else if (walletAddress) {
      query = { walletAddress: walletAddress.toLowerCase() };
    }

    const user = await User.findOne(query).select('-password');
    
    if (!user) {
      return res.status(404).json({
        message: token ? 'User not found' : 'Wallet not registered'
      });
    }

    res.json({
      user,
      message: 'Profile retrieved successfully'
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, bio, skills, role } = req.body;
    const userId = req.user.userId;

    // Email uniqueness check
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        name,
        email,
        bio,
        skills,
        role,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only generate new token if role changed
    let newToken;
    if (role && updatedUser.role !== req.user.role) {
      newToken = jwt.sign(
        { userId: updatedUser._id, role: updatedUser.role },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1h' }
      );
    }

    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser,
      ...(newToken && { token: newToken })
    });

  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});





module.exports = router;