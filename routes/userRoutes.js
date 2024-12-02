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

module.exports = router;
