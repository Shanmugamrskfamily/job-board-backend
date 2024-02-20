//JobRoute.js
const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'outlook',
    auth: {
      user: process.env.E_MAIL,
      pass: process.env.E_PASS,
    },
  });

// Route to post a job
router.post('/post-job', async (req, res) => {
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

      // Convert skills and requirements string to an array
      const skillsArray = req.body.skills.split(';').map(skill => skill.trim());
      const requirementsArray = req.body.requirements.split(';').map(requirements => requirements.trim());

      // Create a job
      const newJob = new Job({
          title: req.body.title,
          description: req.body.description,
          company: req.body.company,
          location: req.body.location,
          requirements: requirementsArray,
          skills: skillsArray, // Convert skills string to an array
          postedBy: userId,
      });

      // Save the job to the database
      const savedJob = await newJob.save();

      // Find users who have added the job title as job preferences
      const usersWithJobPreference = await User.find({ jobPreferences: { $in: [req.body.title] } });

      // Send email notifications to users
      usersWithJobPreference.forEach(async (user) => {
          const mailOptions = {
              from: process.env.E_MAIL,
              to: user.email,
              subject: 'New Job Notification - Job Board',
              html: `
                  <p>Dear ${user.username},</p>
                  <p>We are excited to inform you about a new job opportunity that matches your preferences:</p>
                  <ul>
                      <li><strong>Title:</strong> ${req.body.title}</li>
                      <li><strong>Company:</strong> ${req.body.company}</li>
                      <li><strong>Description:</strong> ${req.body.description}</li>
                      <li><strong>Location:</strong> ${req.body.location}</li>
                  </ul>
                  <p>Apply now to kickstart your career!</p>
                  <p>Best regards,<br>Job Board Team</p>
              `,
          };

          // Send the email
          await transporter.sendMail(mailOptions);
      });

      res.json({ message: 'Job posted successfully.', job: savedJob });
  } catch (error) {
      console.error('Error posting job:', error.message);
      res.status(500).json({ message: 'Server Error' });
  }
});

  


router.get('/get-all-jobs', async (req, res) => {
  try {
    const userId = req.user.userId; // Retrieve the user ID from the authenticated user

    // Retrieve all jobs with user details and check if the user has applied for each job
    const allJobs = await Job.find()
      .populate({
        path: 'postedBy',
        select: 'username userId',
        model: User,
      })
      .populate({
        path: 'applicants',
        select: 'username userId',
        model: User,
      })
      .select('title description company location updatedAt skills requirements postedBy applicants');

    // Sort jobs based on updatedAt in descending order
    const sortedJobs = allJobs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const jobsWithAppliedStatus = sortedJobs.map(job => {
      // Check if the user has applied for the current job
      const hasApplied = job.applicants.some(applicant => applicant._id.toString() === userId);

      return { ...job._doc, applied: hasApplied };
    });

    res.json({ jobs: jobsWithAppliedStatus });
  } catch (error) {
    console.error('Error getting all jobs:', error.message);
    console.log(error);
    res.status(500).json({ message: 'Server Error' });
  }
});


  // Route to get all jobs posted by a specific user
router.get('/get-jobs-by-user/:userId', async (req, res) => {
    try {
      const targetUserId = req.params.userId;
  
      // Retrieve all jobs posted by the specific user
      const userJobs = await Job.find({ postedBy: targetUserId })
        .populate({
          path: 'postedBy',
          select: 'username userId', // Select only username and userId from the postedBy field
          model: User,
        })
        .select('title description company location skills requirements postedBy');
  
      res.json({ jobs: userJobs });
    } catch (error) {
      console.error('Error getting user jobs:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

// Route to get a specific job by ID
router.get('/get-job/:jobId', async (req, res) => {
    try {
      const jobId = req.params.jobId;
  
      // Retrieve the specific job by ID with user details
      const job = await Job.findById(jobId)
        .populate({
          path: 'postedBy',
          select: 'username userId', // Select only username and userId from the postedBy field
          model: User,
        })
        .select('title description company location skills requirements postedBy applicants');
  
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
  
      res.json({ job });
    } catch (error) {
      console.error('Error getting specific job:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });
  
// Route to edit a specific job by ID
router.put('/edit-job/:jobId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const jobId = req.params.jobId;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.postedBy.toString() !== userId || req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'You are not authorized to edit this job' });
    }

    const originalJobTitle = job.title;

    job.title = req.body.title || job.title;
    job.description = req.body.description || job.description;
    job.company = req.body.company || job.company;
    job.location = req.body.location || job.location;
    job.requirements = req.body.requirements ? req.body.requirements.split(';').map(requirement => requirement.trim()) : job.requirements;
    job.skills = req.body.skills ? req.body.skills.split(';').map(skill => skill.trim()) : job.skills;

    const updatedJob = await job.save();

    if (originalJobTitle !== updatedJob.title) {
      const usersWithJobPreference = await User.find({ jobPreferences: { $in: [originalJobTitle] } });

      usersWithJobPreference.forEach(async (user) => {
        const mailOptions = {
          from: process.env.E_MAIL,
          to: user.email,
          subject: 'Job Title Update Notification',
          html: `
            <p>Dear ${user.username},</p>
            <p>The job title you added as a preference has been updated:</p>
            <ul>
              <li><strong>New Title:</strong> ${updatedJob.title}</li>
              <li><strong>Description:</strong> ${updatedJob.description}</li>
              <li><strong>Company:</strong> ${updatedJob.company}</li>
              <li><strong>Job Location:</strong> ${updatedJob.location}</li>
            </ul>
            <p>Thank you for using our Job Board service.</p>
            <p>Best regards,<br>Your Job Board Team</p>
          `,
        };

        await transporter.sendMail(mailOptions);
      });
    }

    res.json({ message: 'Job updated successfully', job: updatedJob });
  } catch (error) {
    console.error('Error editing job:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

  
  
  // Route to delete a specific job by ID
  router.delete('/delete-job/:jobId', async (req, res) => {
    try {
      const userId = req.user.userId; // Get the user ID from the authenticated user
      const jobId = req.params.jobId;
  
      // Find the job to check if the user is the one who posted it
      const job = await Job.findById(jobId);
  
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
  
      // Check if the user deleting the job is the one who posted it (only recruiters can delete their jobs)
      if (job.postedBy.toString() !== userId || req.user.role !== 'recruiter') {
        return res.status(403).json({ message: 'You are not authorized to delete this job' });
      }
  
      // Delete the job
      await Job.findByIdAndDelete(jobId);
  
      res.json({ message: 'Job deleted successfully' });
    } catch (error) {
      console.error('Error deleting job:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

  // Route to apply for a job
router.post('/apply-for-job/:jobId', async (req, res) => {
  try {
      const userId = req.user.userId;
      const jobId = req.params.jobId;

      // Check if the job exists
      const job = await Job.findById(jobId).populate('postedBy', 'email'); // Populate the 'postedBy' field with the recruiter's email

      if (!job) {
          return res.status(404).json({ message: 'Job not found' });
      }

      // Check if the user has already applied for the job
      if (job.applicants.includes(userId)) {
          return res.status(400).json({ message: 'User has already applied for this job' });
      }

      // Add the jobId to the user's appliedJobs array
      const user = await User.findByIdAndUpdate(userId, { $push: { appliedJobs: jobId } }, { new: true });

      // Add the userId to the job's applicants array
      job.applicants.push(userId);
      await job.save();

      // Send notification email to the recruiter
      const recruiterEmail = job.postedBy.email; // Assuming 'email' is the field in User model that stores the email address
      const mailOptions = {
          from: process.env.E_MAIL,
          to: recruiterEmail,
          subject: 'Job Application Notification',
          html: `
              <p>Dear Recruiter,</p>
              <p>A job seeker has applied for the job:</p>
              <ul>
                  <li><strong>Job Title:</strong> ${job.title}</li>
                  <li><strong>Applicant:</strong> ${user.username}</li>
                  <li><strong>Email:</strong> ${user.email}</li>
              </ul>
              <p>Thank you for using our Job Board service.</p>
              <p>Best regards,<br>Your Job Board Team</p>
          `,
      };

      // Send the email
      await transporter.sendMail(mailOptions);

      res.json({ message: 'Job applied successfully.', user });
  } catch (error) {
      console.error('Error applying for job:', error.message);
      res.status(500).json({ message: 'Server Error' });
  }
});


  // Route to get users who applied for a specific job
router.get('/get-applicants/:jobId', async (req, res) => {
    try {
      const jobId = req.params.jobId;
  
      // Check if the job exists
      const job = await Job.findById(jobId);
  
      if (!job) {
        return res.status(404).json({ message: 'Job not found' });
      }
  
      // Retrieve the users who applied for the job
      const applicants = await User.find({ appliedJobs: jobId })
        .select('username email'); // Add more fields as needed
  
      res.json({ applicants });
    } catch (error) {
      console.error('Error getting applicants:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

  // Route to get jobs applied by a specific user
router.get('/get-applied-jobs', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find the user to check if they exist
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find jobs where the user has applied
    const appliedJobs = await Job.find({ applicants: userId }).populate('postedBy', 'username userId');

    res.json({ appliedJobs });
  } catch (error) {
    console.error('Error getting applied jobs:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

  // Route to search jobs based on search text
router.get('/search-jobs/:searchText', async (req, res) => {
    try {
      const searchText = req.params.searchText;
  
      // Search jobs based on title, skills, and description
      const matchingJobs = await Job.find({
        $or: [
          { title: { $regex: searchText, $options: 'i' } }, // Case-insensitive search for title
          { skills: { $in: [new RegExp(searchText, 'i')] } }, // Case-insensitive search for skills
          { description: { $regex: searchText, $options: 'i' } }, // Case-insensitive search for description
        ],
      }).populate('postedBy', 'username userId');
  
      res.json({ jobs: matchingJobs });
    } catch (error) {
      console.error('Error searching jobs:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });
  

  module.exports = router;  