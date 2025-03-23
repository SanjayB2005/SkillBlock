const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// User Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true // Allows multiple null values (for wallet-only users)
  },
  walletAddress: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true // Allows multiple null values (for email-only users)
  },
  role: {
    type: String,
    enum: ['client', 'freelancer', 'admin'],
    default: 'client'
  },
  bio: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  hourlyRate: {
    type: Number,
    min: 0
  },
  completedProjects: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  availableForHire: {
    type: Boolean,
    default: true
  },
  balance: {
    type: Number,
    default: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  notifications: [{
    type: { type: String, enum: ['message', 'project', 'payment', 'system'] },
    message: { type: String },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Project Schema
const ProjectSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  budget: {
    type: Number,
    required: true
  },
  deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'in_progress', 'under_review', 'completed', 'cancelled', 'disputed'],
    default: 'open'
  },
  paymentType: {
    type: String,
    enum: ['fixed', 'hourly'],
    default: 'fixed'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite_only'],
    default: 'public'
  },
  attachments: [{
    name: { type: String },
    url: { type: String },
    type: { type: String },
    size: { type: Number }
  }],
  contractAddress: {
    type: String,
    trim: true
  },
  escrowAmount: {
    type: Number,
    default: 0
  },
  hiredFreelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  milestones: [{
    title: { type: String, required: true },
    description: { type: String },
    amount: { type: Number, required: true },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'submitted', 'approved', 'rejected'],
      default: 'pending'
    },
    deliverables: [{
      description: { type: String },
      url: { type: String }
    }],
    completedDate: { type: Date }
  }],
  invitedFreelancers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  proposals: [{
    type: Schema.Types.ObjectId,
    ref: 'Proposal'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

// Proposal Schema
// Add this schema after the User schema in your model.js file if it doesn't exist

// Proposal Schema
const ProposalSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  freelancer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  coverLetter: {
    type: String,
    required: true,
    trim: true
  },
  bidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  estimatedDuration: {
    value: {
      type: Number,
      min: 1
    },
    unit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months'],
      default: 'days'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  clientNotes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Transaction Schema
const TransactionSchema = new Schema({
  from: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  milestone: {
    type: Schema.Types.ObjectId
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'ETH'
  },
  txHash: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'payment', 'refund', 'fee'],
    required: true
  },
  description: {
    type: String
  },
  gasUsed: {
    type: Number
  },
  gasFee: {
    type: Number
  },
  platformFee: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

// Review Schema
const ReviewSchema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  reviewer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  reviewType: {
    type: String,
    enum: ['client_to_freelancer', 'freelancer_to_client'],
    required: true
  },
  categories: {
    communication: { type: Number, min: 1, max: 5 },
    quality: { type: Number, min: 1, max: 5 },
    expertise: { type: Number, min: 1, max: 5 },
    timeliness: { type: Number, min: 1, max: 5 },
    professionalism: { type: Number, min: 1, max: 5 }
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Message Schema


// Create models
const User = mongoose.model('User', UserSchema);
const Project = mongoose.model('Project', ProjectSchema);
const Proposal = mongoose.model('Proposal', ProposalSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Review = mongoose.model('Review', ReviewSchema);
// Export models
module.exports = {
  User,
  Project,
  Proposal,
  Transaction,
  Review
};