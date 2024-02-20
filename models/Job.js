// models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  requirements: { type: [String], default: [] }, // Array of requirements
  skills: { type: [String], default: [] }, // Array of skills
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
},
{ timestamps: true });
const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
