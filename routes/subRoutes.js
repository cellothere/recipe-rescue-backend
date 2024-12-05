const express = require('express');
const subController = require('../controllers/subController');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');

router.post('/generate', subController.generateSubstitute);

module.exports = router;