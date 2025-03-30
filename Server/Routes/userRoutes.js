const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/model');

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
      return res.status(400).json({ message: 'Wallet address is required' });
    }

    // Normalize wallet address (make lowercase and remove whitespace)
    walletAddress = walletAddress.toLowerCase().trim();
    console.log('Normalized wallet address:', walletAddress);

    // Check if wallet already registered
    let user = await User.findOne({ walletAddress });
    if (user) {
      return res.status(400).json({ message: 'Wallet already registered' });
    }

    // Create new user with wallet
    user = new User({
      name: name || 'Wallet User', // Default name if not provided
      email: email || '',
      walletAddress,
      walletProvider: 'metamask', // You can make this dynamic if needed
      role: role || 'client' // Default to client if no role provided
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role
      }
    });

    console.log('User saved with wallet address:', user.walletAddress);
  } catch (error) {
    console.error('Wallet registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    res.status(201).json({
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
      return res.status(400).json({ message: 'Wallet address is required' });
    }

    // Check if user with wallet address exists
    const user = await User.findOne({ walletAddress });
    
    if (user) {
      // User exists, create JWT token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1h' }
      );
      
      return res.json({
        exists: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          walletAddress: user.walletAddress,
          role: user.role
        }
      });
    } else {
      // User doesn't exist
      return res.json({
        exists: false,
        message: 'Wallet not registered'
      });
    }
  } catch (error) {
    console.error('Wallet auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Wallet Registration


router.get('/profile', async (req, res) => {
  try {
    // Verify JWT token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      const userId = decoded.userId;
      
      // Get wallet address either from query or header
      const walletAddress = req.query.walletAddress || req.headers['x-wallet-address'];
      
      console.log('Looking up profile for userId:', userId);
      if (walletAddress) {
        console.log('Wallet address from request:', walletAddress);
      }
      
      // Find user by ID
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify wallet address ownership if provided (just log warning, don't block)
      if (walletAddress && user.walletAddress && 
          user.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        console.warn('Wallet address mismatch', {
          tokenUserId: userId,
          requestWallet: walletAddress,
          userWallet: user.walletAddress
        });
      }
      
      res.json({ user });
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    // Verify JWT token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const userId = decoded.userId;
    
    // Find and update user
    const { name, email, bio, skills, role } = req.body; // Add role to destructuring
    
    console.log('Update profile request:', { name, email, bio, skills, role });
    
    // If email is being updated, check if it already exists
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Update user data - include role in the update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        name,
        email,
        bio,
        skills,
        role, // Add role to the update
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update the token with the new role if it changed
    let newToken = token;
    if (role && updatedUser.role !== decoded.role) {
      newToken = jwt.sign(
        { userId: updatedUser._id, role: updatedUser.role },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1h' }
      );
    }
    
    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser,
      token: newToken !== token ? newToken : undefined
    });
  } catch (error) {
    console.error('Profile update error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/verify-token', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    res.json({ 
      valid: true, 
      decoded,
      message: 'Token is valid' 
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      valid: false, 
      message: 'Invalid token',
      error: error.message
    });
  }
});

router.get('/test', (req, res) => {
  res.json({ success: true, message: 'User routes are working' });
});

module.exports = router;