const User = require('../models/User');
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');

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

module.exports = {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser
};
