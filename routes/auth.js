//routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../models/User');
const { verifyEmail } = require('../controllers/authController');


const generateVerificationToken = () => {
  return Math.random().toString(14).substring(2, 15) + Math.random().toString(14).substring(2, 15);
};

// Route for user signup
router.post('/signup', async (req, res) => {
    const { username, email, password, role, profilePictureUrl } = req.body;
  
    try {
      // Check if the user already exists
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Generate a verification token
      const verificationToken = generateVerificationToken();
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        verificationToken,
        role,
        profilePictureUrl, // Add the profile picture URL
      });
  
      // Save the user to the database
      await newUser.save();
  
      // Send verification email
      const transporter = nodemailer.createTransport({
        service: 'outlook',
        auth: {
          user: process.env.E_MAIL,
          pass: process.env.E_PASS,
        },
      });
  
      const verificationLink = `http://localhost:5000/api/auth/verify/${verificationToken}`;
  
      const mailOptions = {
        from: process.env.E_MAIL,
        to: email,
        subject: 'Job Board-Verify Your Email',
        html: `<p>Please click the following link to verify your email: <a href="${verificationLink}">${verificationLink}</a></p>`,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending verification email:', error.message);
          return res.status(500).json({ message: 'Server Error' });
        }
        console.log('Verification email sent:', info.response);
        res.json({ message: 'Signup successful. Check your email for verification.' });
      });
    } catch (error) {
      console.error('Error signing up:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

router.get('/verify/:token', async (req, res) => {
    const verificationToken = req.params.token;
  
    const verificationResult = await verifyEmail(verificationToken);
  
    if (verificationResult.success) {
      res.send(verificationResult.message);
    } else {
      res.status(400).json({ message: verificationResult.message });
    }
  });

  // Route for user login
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body;
  
    try {
      // Check if the user exists by email or username
      const user = await User.findOne({
        $or: [{ email: identifier }, { username: identifier }],
      });
  
      if (!user) {
        return res.status(401).json({ message: 'Invalid email, username, or password' });
      }
  
      // Check if the email is verified
      if (!user.isEmailVerified) {
        return res.status(401).json({
          message: 'Email not verified. Please check your email for verification instructions.',
        });
      }
  
      // Compare passwords
      const isPasswordMatch = await bcrypt.compare(password, user.password);
  
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Invalid email, username, or password' });
      }
  
      // Generate a JWT
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Send additional user information in the response
      res.json({
        userId: user._id,
        profilePictureUrl: user.profilePictureUrl,
        username: user.username,
        role: user.role,
        token,
      });
    } catch (error) {
      console.error('Error during login:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });
  
  
  const generateResetToken = () => {
    return crypto.randomBytes(32).toString('hex');
  };
  
  // Store the reset token and its expiration time in the user document
  const setResetToken = (user, token) => {
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour (milliseconds)
  };
  
  // Route for initiating the forgot password process
  router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
  
    try {
      // Find the user with the provided email
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Generate a unique reset token
      const resetToken = generateResetToken();
  
      // Set the reset token and its expiration time in the user document
      setResetToken(user, resetToken);
  
      // Save the user document with the reset token
      await user.save();
  
      // Send password reset email
      const transporter = nodemailer.createTransport({
        service: 'outlook',
        auth: {
          user: process.env.E_MAIL, // Your Outlook email address
          pass: process.env.E_PASS, // Your Outlook email password
        },
      });
  
      const resetLink = `http://localhost:5000/api/auth/reset-password/${resetToken}`;
  
      const mailOptions = {
        from: process.env.E_MAIL,
        to: email,
        subject: 'Job Board-Password Reset',
        html: `<p>You have requested a password reset. Click the following link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending password reset email:', error.message);
          return res.status(500).json({ message: 'Server Error' });
        }
        console.log('Password reset email sent:', info.response);
        res.json({ message: 'Password reset email sent. Check your email for instructions.' });
      });
    } catch (error) {
      console.error('Error initiating password reset:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

// Route for handling the password reset form
router.get('/reset-password/:token', async (req, res) => {
    const resetToken = req.params.token;
  
    try {
      // Find the user with the provided reset token
      const user = await User.findOne({
        resetPasswordToken: resetToken,
        resetPasswordExpires: { $gt: Date.now() }, // Check if the token is still valid
      });
  
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
  
      // Token is valid
      res.json({ message: 'Token verified successfully' });
    } catch (error) {
      console.error('Error verifying password reset token:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });
  
// Route for processing the password reset form
router.post('/reset-password/:token', async (req, res) => {
    const resetToken = req.params.token;
    const { newPassword } = req.body;
  
    try {
      // Find the user with the provided reset token
      const user = await User.findOne({
        resetPasswordToken: resetToken,
        resetPasswordExpires: { $gt: Date.now() }, // Check if the token is still valid
      });
  
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
  
      // Update the user's password and reset token fields
      user.password = await bcrypt.hash(newPassword, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
  
      // Save the updated user document
      await user.save();
  
      res.json({ message: 'Password reset successful. You can now log in with your new password.' });
    } catch (error) {
      console.error('Error resetting password:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

  
module.exports = router;
