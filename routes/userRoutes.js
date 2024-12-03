const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Routes for user operations
router.route('/')
    .get(userController.getAllUsers) // GET all users
    .post(userController.createUser) // POST create a new user

router.route('/:id')
    .get(userController.getUserById) // GET a user by ID
    .patch(userController.updateUser) // PATCH update a user by ID
    .delete(userController.deleteUser) // DELETE a user by ID

router.route('/username/:username')
    .get(userController.getUserIdByUsername); // GET user ID by username

router.route('/:userid/recipes')
    .get(userController.getUserRecipes); // GET user ID by username

module.exports = router;
