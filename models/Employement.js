// models/Employment.js
const mongoose = require('mongoose');

const employmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  position: { type: String, required: true },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    validate: {
      validator: function (date) {
        // Allow null or a date that is greater than or equal to the startDate
        return date === null || date >= this.startDate; 
      },
      message: 'Invalid end date',
    },
  },
});

const Employment = mongoose.model('Employment', employmentSchema);

module.exports = Employment;
