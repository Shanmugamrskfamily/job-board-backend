const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  employmentType: { type: String, required: true }, // Full-time, Part-time, Contract, etc.
  requirements: { type: [String], default: [] }, // Array of required skills or qualifications
  responsibilities: { type: [String], default: [] }, // Array of job responsibilities
  salary: { type: Number }, // Salary information
  postedAt: { type: Date, default: Date.now }, // Date when the job was posted
  // ... other job-related fields
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
