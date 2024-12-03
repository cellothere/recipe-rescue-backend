const express = require('express');
const recipeController = require('../controllers/recipeController');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');

router.post('/generate', recipeController.generateRecipe);
router.post('/save', recipeController.saveRecipe);
router.post('/substitute', recipeController.substituteIngredient);
router.post('/updateServings', recipeController.updateServings);
router.patch('/:recipeId/remove-user', recipeController.deleteUserFromRecipe);
router.get('/:id', recipeController.getRecipe);


module.exports = router;
