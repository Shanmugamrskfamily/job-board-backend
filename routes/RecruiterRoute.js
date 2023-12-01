//RecruiterRoute.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Skills = require('../models/Skills');
const Education = require('../models/Education');
const Employment = require('../models/Employement');
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

  // Route to search for users based on a single search text
router.get('/search-users/:searchText', async (req, res) => {
  try {
      const searchText = req.params.searchText;

      // Search for users based on username
      const usersByUsername = await User.find({
          username: { $regex: searchText, $options: 'i' } // Case-insensitive search for username
      });

      // Search for users based on education degree
      const usersByEducation = await Education.find({
          degree: { $regex: searchText, $options: 'i' } // Case-insensitive search for education degree
      }).populate('userId', 'username email'); // Populate user details

      // Search for users based on skills
      const usersBySkills = await Skills.find({
          skills: { $in: [new RegExp(searchText, 'i')] } // Case-insensitive search for skills
      }).populate('userId', 'username email'); // Populate user details

      // Search for users based on employment position
      const usersByEmployment = await Employment.find({
          position: { $regex: searchText, $options: 'i' } // Case-insensitive search for employment position
      }).populate('userId', 'username email'); // Populate user details

      // Combine and remove duplicates
      const allUsers = [
          ...usersByUsername,
          ...usersByEducation.map(edu => edu.userId),
          ...usersBySkills.map(skill => skill.userId),
          ...usersByEmployment.map(emp => emp.userId)
      ];

      // Remove duplicates based on userId
      const uniqueUsers = Array.from(new Set(allUsers.map(user => user._id)))
          .map(userId => allUsers.find(user => user._id === userId));

      res.json({ users: uniqueUsers });
  } catch (error) {
      console.error('Error searching users:', error.message);
      res.status(500).json({ message: 'Server Error' });
  }
});

// Route to get details of all job seekers for recruiters
router.get('/get-all-job-seekers', async (req, res) => {
  try {
      // Check if the user is a recruiter
      const userId = req.user.userId;
      const recruiter = await User.findById(userId);

      if (!recruiter) {
          return res.status(404).json({ message: 'Recruiter not found' });
      }

      if (recruiter.role !== 'recruiter') {
          return res.status(403).json({ message: 'User is not a recruiter' });
      }

      // Get all job seekers
      const jobSeekers = await User.find({ role: 'jobSeeker' });

      // Fetch additional details for each job seeker
      const jobSeekerDetails = await Promise.all(jobSeekers.map(async (jobSeeker) => {
          // Get skills
          const skills = await Skills.findOne({ userId: jobSeeker._id }).select('skills');

          // Get education data
          const educationData = await Education.find({ userId: jobSeeker._id }).select('school degree fieldOfStudy graduationDate');

          // Get employment data
          const employmentData = await Employment.find({ userId: jobSeeker._id }).select('company position startDate endDate');

          return {
              userId: jobSeeker._id,
              username: jobSeeker.username,
              fullname: jobSeeker.fullname,
              email: jobSeeker.email,
              skills: skills ? skills.skills : [],
              education: educationData,
              employment: employmentData,
          };
      }));

      res.json({ jobSeekers: jobSeekerDetails });
  } catch (error) {
      console.error('Error getting job seekers:', error.message);
      res.status(500).json({ message: 'Server Error' });
  }
});



module.exports = router;
