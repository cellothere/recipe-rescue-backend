const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  name: String,
  ingredients: [String],
  instructions: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Recipe', RecipeSchema);