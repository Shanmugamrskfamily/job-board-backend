// models/Education.js
const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  school: { type: String, required: true },
  degree: { type: String, required: true },
  fieldOfStudy: { type: String },
  graduationDate: {
    type: Date,
    required: true,
    validate: {
      validator: function (date) {
        return date <= Date.now(); 
      },
      message: 'Invalid graduation date',
    },
  },
});

const Education = mongoose.model('Education', educationSchema);

module.exports = Education;
