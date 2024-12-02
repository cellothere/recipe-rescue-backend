const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyJWT = require('../middleware/verifyJWT'); // Import the middleware

// Public route for login
router.route('/login')
    .post(authController.login);

// Secured route for logout
router.route('/logout')
    .post(authController.logout); // Add middleware here

module.exports = router;
