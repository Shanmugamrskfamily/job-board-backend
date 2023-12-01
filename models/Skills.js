// models/Skills.js
const mongoose = require('mongoose');

const skillsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  skills: [{ type: String }],
});

const Skills = mongoose.model('Skills', skillsSchema);

module.exports = Skills;
