// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  verificationToken: String,
  educations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Education' }],
  employments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employment' }],
  personalData: { type: mongoose.Schema.Types.ObjectId, ref: 'PersonalData' },
  role: { type: String, enum: ['jobSeeker', 'recruiter'], required: true },
  recruiterData: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruiterData' },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  skills: { type: mongoose.Schema.Types.ObjectId, ref: 'Skills' }, // Reference to the user's skills
  profilePictureUrl: String,
  resumeUrl: String,
  jobPreferences: [{ type: String }],
  appliedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }], // Array of applied job IDs
});

const User = mongoose.model('User', userSchema);

module.exports = User;
