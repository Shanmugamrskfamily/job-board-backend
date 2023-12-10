// models/PersonalData.js
const mongoose = require('mongoose');

const personalDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function (date) {
        return date <= Date.now(); 
      },
      message: 'Invalid date of birth',
    },
  },
  address: { type: String },
  // Add more fields as needed for personal data
});

const PersonalData = mongoose.model('PersonalData', personalDataSchema);

module.exports = PersonalData;
