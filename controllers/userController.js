const User = require('../models/User');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const Recipe = require('../models/Recipe');

// @desc Get all users
// @route GET /api/users
// @access Private (Add authentication middleware later)
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean(); // Exclude password
    if (!users?.length) {
        return res.status(404).json({ message: 'No users found' });
    }
    res.json(users);
});

// @desc Create a new user
// @route POST /api/users
// @access Private (Add authentication middleware later)
const createUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const duplicate = await User.findOne({ username }).lean().exec();
    if (duplicate) {
        return res.status(409).json({ message: 'Username already exists' });
    }

    const hashedPwd = await bcrypt.hash(password, 10); // Encrypt password
    const userObject = { username, password: hashedPwd, roles: roles || ['User'] };

    const user = await User.create(userObject);

    if (user) {
        res.status(201).json({ message: `New user ${username} created` });
    } else {
        res.status(400).json({ message: 'Invalid user data received' });
    }
});

// @desc Get user by ID
// @route GET /api/users/:id
// @access Private (Add authentication middleware later)
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
});

// @desc Update a user
// @route PATCH /api/users/:id
// @access Private (Add authentication middleware later)
const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { username, roles, active } = req.body;

    const user = await User.findById(id).exec();
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (username) user.username = username;
    if (roles) user.roles = roles;
    if (typeof active === 'boolean') user.active = active;

    const updatedUser = await user.save();
    res.json({ message: `User ${updatedUser.username} updated` });
});

// @desc Delete a user
// @route DELETE /api/users/:id
// @access Private (Add authentication middleware later)
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id).exec();
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const result = await user.deleteOne();
    res.json({ message: `User ${result.username} deleted` });
});

// Get a user ID by username
const getUserIdByUsername = async (req, res) => {
    try {
      const { username } = req.params;
  
      if (!username) {
        return res.status(400).json({ error: 'Username is required.' });
      }
  
      const user = await User.findOne({ username });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
  
      res.json({ userId: user._id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  const getUserRecipes = asyncHandler(async (req, res) => {
    const { userid } = req.params;

    if (!userid) {
        return res.status(400).json({ message: 'User ID is required.' });
    }

    try {
        // Find recipes where the user ID is in the `savedBy` array
        const recipes = await Recipe.find({ savedBy: userid }).lean();

        if (!recipes || recipes.length === 0) {
            return res.status(404).json({ message: 'No recipes found for this user.' });
        }

        res.json(recipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const createIngredient = asyncHandler(async (req, res) => {
    const { userid } = req.params; // Extract user ID from URL
    const { name, amount, measurement } = req.body; // Ingredient details
  
    if (!name) {
      return res.status(400).json({ message: 'Ingredient name is required.' });
    }
  
    const newIngredient = { name, amount, measurement };
  
    try {
      const user = await User.findById(userid);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      user.kitchen.push(newIngredient);
      await user.save();
  
      res.status(201).json({ message: 'Ingredient added successfully.', kitchen: user.kitchen });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to add ingredient.' });
    }
  });
  

  const deleteIngredient = asyncHandler(async (req, res) => {
    const { userid, ingredientId } = req.params;
  
    try {
      const user = await User.findById(userid);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      const ingredientIndex = user.kitchen.findIndex(
        (ingredient) => ingredient._id.toString() === ingredientId
      );
  
      if (ingredientIndex === -1) {
        return res.status(404).json({ message: 'Ingredient not found.' });
      }
  
      user.kitchen.splice(ingredientIndex, 1);
      await user.save();
  
      res.status(200).json({ message: 'Ingredient removed successfully.', kitchen: user.kitchen });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to remove ingredient.' });
    }
  });
  

  const updateIngredient = asyncHandler(async (req, res) => {
    const { userid, ingredientId } = req.params;
    const { name, amount, measurement } = req.body;
  
    try {
      const user = await User.findById(userid);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      const ingredient = user.kitchen.find(
        (ingredient) => ingredient._id.toString() === ingredientId
      );
  
      if (!ingredient) {
        return res.status(404).json({ message: 'Ingredient not found.' });
      }
  
      // Update ingredient details
      if (name) ingredient.name = name;
      if (amount) ingredient.amount = amount;
      if (measurement) ingredient.measurement = measurement;
  
      await user.save();
  
      res.status(200).json({ message: 'Ingredient updated successfully.', kitchen: user.kitchen });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update ingredient.' });
    }
  });

  const getUserIngredients = asyncHandler(async (req, res) => {
    const { userid } = req.params; // Extract user ID from the URL
  
    try {
      // Find the user by ID
      const user = await User.findById(userid).lean(); // Use .lean() for better performance if no modification is needed
  
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }
  
      res.status(200).json({ kitchen: user.kitchen }); // Return the kitchen ingredients as JSON
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      // Handle invalid MongoDB ObjectID error
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid user ID format.' });
      }
      res.status(500).json({ message: 'Failed to fetch ingredients.' });
    }
  });
  
  
  
module.exports = {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    getUserIdByUsername,
    getUserRecipes,
    createIngredient,
    deleteIngredient,
    updateIngredient,
    getUserIngredients
};
