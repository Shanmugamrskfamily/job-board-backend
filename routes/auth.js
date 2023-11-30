// In routes/auth.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { authenticateJWT } = require('../config/middleware');
const { verifyEmail } = require('../controllers/authController');

const generateVerificationToken = () => {
  return Math.random().toString(14).substring(2, 15) + Math.random().toString(14).substring(2, 15);
};

// Route for user signup
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

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
    });

    // Save the user to the database
    await newUser.save();

    // Send verification email
    const transporter = nodemailer.createTransport({
      service: 'outlook',
      auth: {
        user: process.env.E_MAIL, // Your Gmail email address
        pass: process.env.E_PASS, // Your Gmail email password
      },
    });

    const verificationLink = `http://localhost:5000/verify/${verificationToken}`;
    
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
    const { email, password } = req.body;
  
    try {
      // Check if the user exists
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      // Check if the email is verified
      if (!user.isEmailVerified) {
        return res.status(401).json({ message: 'Email not verified. Please check your email for verification instructions.' });
      }
  
      // Compare passwords
      const isPasswordMatch = await bcrypt.compare(password, user.password);
  
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
  
      // Generate a JWT
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.json({ token });
    } catch (error) {
      console.error('Error during login:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });


module.exports = router;
