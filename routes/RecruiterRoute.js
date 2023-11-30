//RecruiterRoute.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RecruiterData = require('../models/RecruiterData');


// Route to post recruiter data
router.post('/post-recruiter-data', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if the user is a recruiter
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'recruiter') {
      return res.status(403).json({ message: 'User is not a recruiter' });
    }

    // Check if recruiter data already exists for the user
    if (user.recruiterData) {
      return res.status(400).json({ message: 'Recruiter data already exists for this user.' });
    }

    // Create recruiter data for the user
    const newRecruiterData = new RecruiterData({
      userId,
      companyName: req.body.companyName,
      companyAddress: req.body.companyAddress,
      industry: req.body.industry,
      // Add more fields as needed
    });

    // Save the recruiter data to the database
    const savedRecruiterData = await newRecruiterData.save();

    // Update the user document with the recruiter data's _id
    user.recruiterData = savedRecruiterData._id;
    await user.save();

    res.json({ message: 'Recruiter data posted successfully.', user });
  } catch (error) {
    console.error('Error posting recruiter data:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Route to get recruiter data
router.get('/get-recruiter-data', async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Check if the user is a recruiter
      const user = await User.findById(userId).populate('recruiterData');
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (user.role !== 'recruiter') {
        return res.status(403).json({ message: 'User is not a recruiter' });
      }
  
      // Check if recruiter data exists for the user
      if (!user.recruiterData) {
        return res.status(404).json({ message: 'Recruiter data not found for this user.' });
      }
  
      // Send the recruiter data in the response
      res.json({ recruiterData: user.recruiterData });
    } catch (error) {
      console.error('Error getting recruiter data:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

  // Route to update recruiter data
router.put('/update-recruiter-data', async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Check if the user is a recruiter
      const user = await User.findById(userId).populate('recruiterData');
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (user.role !== 'recruiter') {
        return res.status(403).json({ message: 'User is not a recruiter' });
      }
  
      // Check if recruiter data exists for the user
      if (!user.recruiterData) {
        return res.status(404).json({ message: 'Recruiter data not found for this user.' });
      }
  
      // Update recruiter data fields
      user.recruiterData.companyName = req.body.companyName || user.recruiterData.companyName;
      user.recruiterData.companyAddress = req.body.companyAddress || user.recruiterData.companyAddress;
      user.recruiterData.industry = req.body.industry || user.recruiterData.industry;
      // Add more fields as needed
  
      // Save the updated recruiter data to the database
      await user.recruiterData.save();
  
      res.json({ message: 'Recruiter data updated successfully.', recruiterData: user.recruiterData });
    } catch (error) {
      console.error('Error updating recruiter data:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

module.exports = router;
