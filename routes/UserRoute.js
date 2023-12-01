//UserRoute.js
const express = require('express');
const router = express.Router();
const PersonalData = require('../models/PersonalData');
const User = require('../models/User');
const Skills = require('../models/Skills');
const Education = require('../models/Education');
const Employment = require('../models/Employement');


// Route to add user personal data
router.post('/add-personal-data', async (req, res) => {
  try {
    // Assuming the authenticated user's ID is available in req.user.userId
    const userId = req.user.userId;

    // Check if personal data already exists for the user
    const existingPersonalData = await PersonalData.findOne({ userId });

    if (existingPersonalData) {
      return res.status(400).json({ message: 'Personal data already exists for this user.' });
    }

    // Create personal data for the user
    const newPersonalData = new PersonalData({
      userId,
      fullName: req.body.fullName,
      dateOfBirth: req.body.dateOfBirth,
      address: req.body.address,
      // Add more fields as needed
    });

    // Save the personal data to the database
    const savedPersonalData = await newPersonalData.save();

    // Update the user document with the personal data's _id
    const user = await User.findByIdAndUpdate(userId, { personalData: savedPersonalData._id }, { new: true });

    res.json({ message: 'Personal data added successfully.', user });
  } catch (error) {
    console.error('Error adding personal data:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Route to get user personal data
router.get('/get-personal-data', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Retrieve personal data for the user
    const userPersonalData = await PersonalData.findOne({ userId });

    res.json({ userPersonalData });
  } catch (error) {
    console.error('Error getting personal data:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Route to edit user personal data
router.put('/edit-personal-data', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if personal data already exists for the user
    const existingPersonalData = await PersonalData.findOne({ userId });

    if (!existingPersonalData) {
      return res.status(404).json({ message: 'Personal data not found for this user.' });
    }

    // Update personal data for the user
    existingPersonalData.fullName = req.body.fullName || existingPersonalData.fullName;
    existingPersonalData.dateOfBirth = req.body.dateOfBirth || existingPersonalData.dateOfBirth;
    existingPersonalData.address = req.body.address || existingPersonalData.address;
    // Add more fields as needed

    // Save the updated personal data to the database
    const updatedPersonalData = await existingPersonalData.save();

    res.json({ message: 'Personal data updated successfully.', updatedPersonalData });
  } catch (error) {
    console.error('Error editing personal data:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Route to add user education data
router.post('/add-education', async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Create education data for the user
      const newEducation = new Education({
        userId,
        school: req.body.school,
        degree: req.body.degree,
        fieldOfStudy: req.body.fieldOfStudy,
        graduationDate: req.body.graduationDate,
      });
  
      // Save the education data to the database
      const savedEducation = await newEducation.save();
  
      // Update the user document with the education data's _id
      const user = await User.findByIdAndUpdate(userId, { $push: { educations: savedEducation._id } }, { new: true });
  
      res.json({ message: 'Education data added successfully.', user });
    } catch (error) {
      console.error('Error adding education data:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

  // Route to get user education data
router.get('/get-education', async (req, res) => {

  try {
    const userId = req.user.userId;

    // Retrieve education data for the user
    const userEducation = await Education.find({ userId });

    res.json({ userEducation });
  } catch (error) {
    console.error('Error getting education data:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Route to get specific user education data
router.get('/get-education/:educationId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const educationId = req.params.educationId;

    // Check if the education data belongs to the user
    const userEducation = await Education.findOne({ _id: educationId, userId });

    if (!userEducation) {
      return res.status(404).json({ message: 'Education data not found for this user.' });
    }

    res.json({ userEducation });
  } catch (error) {
    console.error('Error getting education data:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});  

// Route to edit a user's education entry
router.put('/edit-education/:educationId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const educationId = req.params.educationId;

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the education entry exists
    const educationIndex = user.educations.findIndex(edu => edu.equals(educationId));

    if (educationIndex === -1) {
      return res.status(404).json({ message: 'Education entry not found' });
    }

    // Update the education entry using the request body
    const updatedEducation = await Education.findByIdAndUpdate(educationId, req.body, { new: true });

    // Replace the old education entry with the updated one
    user.educations.splice(educationIndex, 1, updatedEducation);

    // Save the updated user document
    await user.save();

    res.json({ message: 'Education entry edited successfully.', user });
  } catch (error) {
    console.error('Error editing education entry:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Route to delete a user's education entry
router.delete('/delete-education/:educationId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const educationId = req.params.educationId;

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the education entry exists
    const educationIndex = user.educations.findIndex(edu => edu.equals(educationId));

    if (educationIndex === -1) {
      return res.status(404).json({ message: 'Education entry not found' });
    }

    // Remove the education entry reference from the user
    user.educations.splice(educationIndex, 1);

    // Remove the education entry from the Education collection
    await Education.findByIdAndDelete(educationId);

    // Save the updated user document
    await user.save();

    res.json({ message: 'Education entry deleted successfully.', user });
  } catch (error) {
    console.error('Error deleting education entry:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Route to post user skills
router.post('/post-skills', async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Check if skills already exist for the user
      const existingSkills = await Skills.findOne({ userId });
  
      if (existingSkills) {
        return res.status(400).json({ message: 'Skills already exist for this user.' });
      }
  
      // Convert skills string to an array
      const skillsArray = req.body.skills.split(';').map(skill => skill.trim());
  
      // Create skills for the user
      const newSkills = new Skills({
        userId,
        skills: skillsArray, // Convert skills string to an array
      });
  
      // Save the skills to the database
      const savedSkills = await newSkills.save();
  
      // Update the user document with the skills' _id
      const user = await User.findByIdAndUpdate(userId, { skills: savedSkills._id }, { new: true });
  
      res.json({ message: 'Skills posted successfully.', user });
    } catch (error) {
      console.error('Error posting skills:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });
  
  // Route to get user skills
  router.get('/get-skills', async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Find the skills for the user
      const userSkills = await Skills.findOne({ userId });
  
      if (!userSkills) {
        return res.status(404).json({ message: 'Skills not found for this user.' });
      }
  
      res.json({ skills: userSkills.skills });
    } catch (error) {
      console.error('Error getting skills:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }); 
  
  
  // Route to edit user skills
router.put('/edit-skills', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find the skills for the user
    const userSkills = await Skills.findOne({ userId });

    if (!userSkills) {
      return res.status(404).json({ message: 'Skills not found for this user.' });
    }

    // Convert skills string to an array
    const skillsArray = req.body.skills.split(';').map(skill => skill.trim());

    // Update the skills
    userSkills.skills = skillsArray; // Convert skills string to an array
    const updatedSkills = await userSkills.save();

    res.json({ message: 'Skills updated successfully.', skills: updatedSkills.skills });
  } catch (error) {
    console.error('Error editing skills:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Route to add user employment data
router.post('/add-employment', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Set default endDate to null if not provided
    const endDate = req.body.endDate || null;

    // Create employment data for the user
    const newEmployment = new Employment({
      userId,
      company: req.body.company,
      position: req.body.position,
      startDate: req.body.startDate,
      endDate, // Use the provided endDate or null
    });

    // Save the employment data to the database
    const savedEmployment = await newEmployment.save();

    // Update the user document with the employment data's _id
    const user = await User.findByIdAndUpdate(userId, { $push: { employments: savedEmployment._id } }, { new: true });

    res.json({ message: 'Employment data added successfully.', user });
  } catch (error) {
    console.error('Error adding employment data:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});


    
  // Route to get user employment data
router.get('/get-employment', async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Retrieve employment data for the user
      const userEmployment = await Employment.find({ userId });
  
      res.json({ userEmployment });
    } catch (error) {
      console.error('Error getting employment data:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

  // Route to get specific user employment data
router.get('/get-employment/:employmentId', async (req, res) => {
    try {
      const userId = req.user.userId;
      const employmentId = req.params.employmentId;
  
      // Check if the employment data belongs to the user
      const userEmployment = await Employment.findOne({ _id: employmentId, userId });
  
      if (!userEmployment) {
        return res.status(404).json({ message: 'Employment data not found for this user.' });
      }
  
      res.json({ userEmployment });
    } catch (error) {
      console.error('Error getting employment data:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

// Route to edit a user's employment entry
router.put('/edit-employment/:employmentId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const employmentId = req.params.employmentId;

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the employment entry exists
    const employmentIndex = user.employments.findIndex(emp => emp.equals(employmentId));

    if (employmentIndex === -1) {
      return res.status(404).json({ message: 'Employment entry not found' });
    }

    // Update the employment entry using the request body
    const updatedEmployment = await Employment.findByIdAndUpdate(employmentId, req.body, { new: true });

    // Replace the old employment entry with the updated one
    user.employments.splice(employmentIndex, 1, updatedEmployment);

    // Save the updated user document
    await user.save();

    res.json({ message: 'Employment entry edited successfully.', user });
  } catch (error) {
    console.error('Error editing employment entry:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});


  // Route to delete a user's employment entry
  router.delete('/delete-employment/:employmentId', async (req, res) => {
    try {
      const userId = req.user.userId;
      const employmentId = req.params.employmentId;
  
      // Find the user
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Check if the employment entry exists
      const employmentIndex = user.employments.findIndex(emp => emp.equals(employmentId));
  
      if (employmentIndex === -1) {
        return res.status(404).json({ message: 'Employment entry not found' });
      }
  
      // Remove the employment entry reference from the user
      user.employments.splice(employmentIndex, 1);
  
      // Remove the employment entry from the Employment collection
      await Employment.findByIdAndDelete(employmentId);
  
      // Save the updated user document
      await user.save();
  
      res.json({ message: 'Employment entry deleted successfully.', user });
    } 
    catch (error) {
      console.error('Error deleting employment entry:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

  // Route to check if a user has RecruiterData and PersonalData filled
router.get('/check-recruiter-data-filled', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if the user has both RecruiterData and PersonalData
    const userData = await User.findById(userId)
      .populate('recruiterData')
      .populate('personalData');

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasRecruiterData = userData.recruiterData ? true : false;
    const hasPersonalData = userData.personalData ? true : false;

    res.json({ hasRecruiterData, hasPersonalData });
  } catch (error) {
    console.error('Error checking user data:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Route to check if a user has PersonalData and EducationData filled
router.get('/check-jobseeker-data-filled', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if the user has both PersonalData and at least one Education entry
    const userData = await User.findById(userId)
      .populate('personalData')
      .populate('educations');

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasPersonalData = userData.personalData ? true : false;
    const hasEducationData = userData.educations && userData.educations.length > 0 ? true : false;

    res.json({ hasPersonalData, hasEducationData });
  } catch (error) {
    console.error('Error checking user education data:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

  // Route to get user's profile picture URL
router.get('/get-profile-picture-url', async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Retrieve the user's profile picture URL
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const profilePictureUrl = user.profilePictureUrl;
  
      res.json({ profilePictureUrl });
    } catch (error) {
      console.error('Error getting profile picture URL:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

  // Route to replace user's profile picture URL
  router.put('/replace-profile-picture', async (req, res) => {
    try {
      const userId = req.user.userId;
      const { newProfilePictureUrl } = req.body;
  
      // Update the user's profile picture URL
      const updatedUser = await User.findByIdAndUpdate(userId, { profilePictureUrl: newProfilePictureUrl }, { new: true });
  
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.json({ message: 'Profile picture URL replaced successfully.', updatedUser });
    } catch (error) {
      console.error('Error replacing profile picture URL:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

  // Route to set or replace user's resume URL
router.put('/set-resume-url', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { newResumeUrl } = req.body;

    // Update the user's resume URL
    const updatedUser = await User.findByIdAndUpdate(userId, { resumeUrl: newResumeUrl }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Resume URL set successfully.', updatedUser });
  } catch (error) {
    console.error('Error setting resume URL:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

  // Route to get user's resume URL
router.get('/get-resume-url', async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Retrieve the user's resume URL
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const resumeUrl = user.resumeUrl;
  
      res.json({ resumeUrl });
    } catch (error) {
      console.error('Error getting resume URL:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });
    
  
  // Route to set job preferences for a job seeker
router.post('/set-job-preference', async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Check if the user is a job seeker
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (user.role !== 'jobSeeker') {
        return res.status(403).json({ message: 'User is not a job seeker' });
      }
  
      // Extract job titles from the request body (comma-separated string)
      const jobTitles = req.body.jobTitles.split(',').map(title => title.trim());
  
      // Update the job preferences in the user document
      user.jobPreferences = jobTitles;
      await user.save();
  
      res.json({ message: 'Job preferences set successfully.', user });
    } catch (error) {
      console.error('Error setting job preferences:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

  // Route to push user job preferences
router.post('/push-job-preferences', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if the user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Extract job preferences from the request body
    const jobPreferences = req.body.jobPreferences;

    // Push job preferences to the user's document
    user.jobPreferences.push(jobPreferences);

    // Save the updated user document
    const updatedUser = await user.save();

    res.json({ message: 'Job preferences updated successfully.', user: updatedUser });
  } catch (error) {
    console.error('Error pushing job preferences:', error.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

  // Route to get job preferences of a user
router.get('/get-job-preferences', async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Find the user
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Extract job preferences
      const jobPreferences = user.jobPreferences || [];
  
      res.json({ jobPreferences });
    } catch (error) {
      console.error('Error getting job preferences:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });

  // Route to edit job preferences of a user
router.put('/edit-job-preferences', async (req, res) => {
    try {
      const userId = req.user.userId;
  
      // Find the user
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Update job preferences
      const jobPreferences = req.body.jobPreferences;
  
      // Check if jobPreferences is a string and split it into an array
      user.jobPreferences = typeof jobPreferences === 'string' ? jobPreferences.split(',').map(pref => pref.trim()) : jobPreferences || [];
  
      // Save the updated user document
      await user.save();
  
      res.json({ message: 'Job preferences updated successfully.', user });
    } catch (error) {
      console.error('Error editing job preferences:', error.message);
      res.status(500).json({ message: 'Server Error' });
    }
  });  


module.exports = router;
