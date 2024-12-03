const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: String, required: false },
  measurement: { type: String, required: false },
});

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: { type: [String], default: ['User'] },
    allergens: { type: [String], required: false },
    active: { type: Boolean, default: true },
    kitchen: { type: [ingredientSchema], default: [] }, // Use the ingredient schema
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
