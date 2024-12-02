const express = require('express');
const { OpenAI } = require('openai');
const Recipe = require('../models/Recipe');

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set your API key here
});

// Generate recipe
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


// Save recipe
router.post('/save', async (req, res) => {
  try {
    const { name, ingredients, instructions } = req.body;
    const recipe = new Recipe({ name, ingredients, instructions });
    await recipe.save();
    res.json({ message: 'Recipe saved successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
