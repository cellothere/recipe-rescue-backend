const express = require('express');
const newRecipeController = require('../controllers/newRecipeController');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');

router.post('/generate', newRecipeController.generateRecipe);
// router.post('/save', newRecipeController.saveRecipe);
// router.post('/substitute', newRecipeController.substituteIngredient);
// router.post('/updateServings', newRecipeController.updateServings);
// router.patch('/:recipeId/remove-user', newRecipeController.deleteUserFromRecipe);
// router.get('/:id', newRecipeController.getRecipe);


module.exports = router;