// In controllers/authController.js

const User = require('../models/User');

const verifyEmail = async (verificationToken) => {
  try {
    // Find the user with the verification token
    const user = await User.findOne({ verificationToken });

    if (!user) {
      throw new Error('User not found or already verified');
    }

    // Update the user's email verification status
    user.isEmailVerified = true;
    user.verificationToken = undefined; // Clear the verification token
    await user.save();

    return { success: true, message: 'Email verification successful. You can now log in.' };
  } catch (error) {
    console.error('Error verifying email:', error.message);
    return { success: false, message: 'Error verifying email. Please try again.' };
  }
};

module.exports = {
  verifyEmail,
};
