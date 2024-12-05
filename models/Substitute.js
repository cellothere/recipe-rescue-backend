const mongoose = require('mongoose');

const substituteSchema = new mongoose.Schema({
  name: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Substitute', substituteSchema);