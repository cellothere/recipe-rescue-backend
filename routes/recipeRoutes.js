const express = require('express');
const { OpenAI } = require('openai');
const Recipe = require('../models/Recipe');
const verifyJWT = require('../middleware/verifyJWT');

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set your API key here
});

// Generate recipe
router.post('/generate', async (req, res) => {
  try {
    const { ingredients, allergies = [], servings } = req.body;
    const allergyNotice = allergies.length > 0 
      ? `Avoid using these allergens: ${allergies.join(", ")}.` 
      : '';
    const servingsNotice = servings 
      ? `The recipe should be enough for ${servings} people.` 
      : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Replace with your preferred model
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates recipes.",
        },
        {
          role: "user",
          content: `Create a recipe using these ingredients: ${ingredients.join(", ")}. ${allergyNotice} ${servingsNotice} Do not give an introduction paragraph. Just the title, ingredients, and instructions. Give numbered instructions: 1. 2. 3. etc.`,
        },
      ],
    });

    // Extract the content of the recipe and send it back in the JSON response
    const recipe = response.choices[0]?.message?.content?.trim();
    res.json({ recipe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Substitute ingredient
router.post('/substitute', async (req, res) => {
  try {
    const { ingredient, allergies = [], alreadyUsed = [] } = req.body;

    const allergyNotice = allergies.length > 0 
      ? `The substitute should not include these allergens: ${allergies.join(", ")}.` 
      : '';
    const alreadyUsedNotice = alreadyUsed.length > 0 
      ? `The substitute should not be one of the following: ${alreadyUsed.join(", ")}.` 
      : '';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates recipes.",
        },
        {
          role: "user",
          content: `Provide a substitute for this ingredient: ${ingredient}. ${allergyNotice} ${alreadyUsedNotice} Your answer should only include the ingredient name and the measurement and no other words.`,
        },
      ],
      max_tokens: 50,
    });

    const substitute = response.choices[0]?.message?.content?.trim();
    res.json({ substitute });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update servings
router.post('/updateServings', async (req, res) => {
  try {
    const { recipe, servings } = req.body;

    if (!recipe || !servings) {
      return res.status(400).json({ error: 'Recipe and servings are required.' });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Replace with your preferred model
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that adjusts recipes.",
        },
        {
          role: "user",
          content: `Adjust this recipe to serve ${servings} people. Do not rewrite the title, just adjust the ingredient amounts and instructions accordingly:\n\n${recipe}`,
        },
      ],
    });

    const updatedRecipe = response.choices[0]?.message?.content?.trim();
    if (!updatedRecipe) {
      return res.status(500).json({ error: 'Failed to update the recipe.' });
    }

    res.json({ updatedRecipe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save or create recipe
router.post('/save', async (req, res) => {
  try {
    const { name, ingredients, instructions, userId } = req.body;

    if (!name || !ingredients || !instructions || !userId) {
      return res.status(400).json({ error: 'Recipe name, ingredients, instructions, and user ID are required.' });
    }

    // Find recipe with exact match on name and ingredients
    let recipe = await Recipe.findOne({ 
      name: name.trim(), 
      ingredients: { $size: ingredients.length, $all: ingredients.map(ing => ing.trim()) }
    });

    if (recipe) {
      // Recipe exists, add user to savedBy if not already there
      if (!recipe.savedBy.includes(userId)) {
        recipe.savedBy.push(userId);
        await recipe.save();
        return res.json({ message: 'User added to existing recipe successfully!' });
      } else {
        return res.json({ message: 'Recipe already saved by this user.' });
      }
    } else {
      // Recipe doesn't exist, create new recipe
      recipe = new Recipe({
        name: name.trim(),
        ingredients: ingredients.map(ing => ing.trim()),
        instructions: instructions.trim(),
        savedBy: [userId],
      });
      await recipe.save();
      return res.status(201).json({ message: 'Recipe created and saved successfully!', recipe });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Update user in recipe
router.patch('/:id/add-user', async (req, res) => {
  try {
    const { userId } = req.body; // User ID from the request body
    const { id } = req.params;  // Recipe MongoDB ObjectID from URL

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const recipe = await Recipe.findById(id); // Find recipe by ObjectID

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Ensure savedBy is an array
    if (!Array.isArray(recipe.savedBy)) {
      recipe.savedBy = [];
    }

    if (!recipe.savedBy.includes(userId)) {
      recipe.savedBy.push(userId); // Add user ID if not already saved
      await recipe.save();
    }

    res.json({ message: 'User added to recipe successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
