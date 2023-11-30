// In models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isEmailVerified: { type: Boolean, default: false },
  verificationToken: String, 
  bio: {
    firstName: { type: String },
    lastName: { type: String },
    dateOfBirth: { type: Date },
    education: [
      {
        institution: { type: String},
        degree: { type: String},
        graduationYear: { type: Number },
      },
    ],
    employment: [
      {
        company: { type: String },
        position: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
      },
    ],
    
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
