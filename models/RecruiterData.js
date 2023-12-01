// models/RecruiterData.js
const mongoose = require('mongoose');

const recruiterDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String, required: true },
  companySize: { type: Number },
  companyAddress:{ type: String },
  industry: { type: String },
  // Add more fields as needed for recruiter data
});

const RecruiterData = mongoose.model('RecruiterData', recruiterDataSchema);

module.exports = RecruiterData;
