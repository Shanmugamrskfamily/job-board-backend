// models/Employement.js
const mongoose = require('mongoose');

const employmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  position: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
});

const Employment = mongoose.model('Employment', employmentSchema);

module.exports = Employment;
