const mongoose = require('mongoose');

const newRecipeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ingredients: { type: [String], required: true },
  instructions: { type: String, required: true },
  savedBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
}, { timestamps: true });

module.exports = mongoose.model('NewRecipe', newRecipeSchema);