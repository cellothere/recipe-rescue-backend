const { OpenAI } = require('openai');
const Recipe = require('../models/Recipe');
const asyncHandler = require('express-async-handler');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set your API key here
});

// @desc get a recipe
// @route GET /api/recipes/:id
// @access Public
const getRecipe = asyncHandler(async (req, res) => {
    const { id } = req.params; // Extract recipe ID from the URL
  
    try {
      // Find the recipe by ID
      const recipe = await Recipe.findById(id).lean(); // Use .lean() for better performance if no modification is needed
  
      if (!recipe) {
        return res.status(404).json({ message: 'Recipe not found.' });
      }
  
      res.json(recipe); // Return the recipe as JSON
    } catch (error) {
      console.error('Error fetching recipe:', error);
      // Handle invalid MongoDB ObjectID error
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid recipe ID format.' });
      }
      res.status(500).json({ message: 'Failed to fetch the recipe.' });
    }
  });
  

// @desc Generate a recipe
// @route POST /api/recipes/generate
// @access Public
const generateRecipe = asyncHandler(async (req, res) => {
  const { ingredients, allergies = [], servings } = req.body;

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ message: 'Ingredients are required and must be an array.' });
  }

  const allergyNotice = allergies.length > 0
    ? `Avoid using these allergens: ${allergies.join(', ')}.` 
    : '';
  const servingsNotice = servings 
    ? `The recipe should be enough for ${servings} people.` 
    : '';

  try {
    const thread = await openai.beta.threads.create();
    console.log('Thread created:', thread);

    const message = await openai.beta.threads.messages.create(
      thread.id,
      {
        role: "user",
        content: `Create a recipe using these ingredients: ${ingredients.join(', ')}. ${allergyNotice} ${servingsNotice} Do not give an introduction paragraph. Just the title, ingredients, and instructions. Give numbered instructions: 1. 2. 3. etc.`
      }
    );

    const run = await openai.beta.threads.runs.createAndPoll(
      thread.id,
      { 
        assistant_id: process.env.OPENAI_ASST_KEY,
        instructions: "Please be concise."
      }
    );

    let recipe = '';

    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(
        run.thread_id
      );
      for (const message of messages.data.reverse()) {
        recipe = `${message.role} > ${message.content[0].text.value}`;
      }
    } else {
      console.log(run.status);
    }

    res.json({ recipe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while generating the recipe.' });
  }
});


// @desc Save or create a recipe
// @route POST /api/recipes/save
// @access Public
const saveRecipe = asyncHandler(async (req, res) => {
  const { name, ingredients, instructions, userId } = req.body;

  if (!name || !ingredients || !instructions || !userId) {
    return res.status(400).json({ message: 'Name, ingredients, instructions, and userId are required.' });
  }

  let recipe = await Recipe.findOne({
    name: name.trim(),
    ingredients: { $size: ingredients.length, $all: ingredients.map(ing => ing.trim()) },
  });

  if (recipe) {
    if (!recipe.savedBy.includes(userId)) {
      recipe.savedBy.push(userId);
      await recipe.save();
      return res.json({ message: 'User added to existing recipe successfully!' });
    } else {
      return res.json({ message: 'Recipe already saved by this user.' });
    }
  } else {
    recipe = new Recipe({
      name: name.trim(),
      ingredients: ingredients.map(ing => ing.trim()),
      instructions: instructions.trim(),
      savedBy: [userId],
    });
    await recipe.save();
    res.status(201).json({ message: 'Recipe created and saved successfully!', recipe });
  }
});

// @desc Provide a substitute for an ingredient
// @route POST /api/recipes/substitute
// @access Public
const substituteIngredient = asyncHandler(async (req, res) => {
  const { ingredient, allergies = [], alreadyUsed = [] } = req.body;

  if (!ingredient) {
    return res.status(400).json({ message: 'Ingredient is required.' });
  }

  const allergyNotice = allergies.length > 0 
    ? `The substitute should not include these allergens: ${allergies.join(', ')}.` 
    : '';
  const alreadyUsedNotice = alreadyUsed.length > 0 
    ? `The substitute should not be one of the following: ${alreadyUsed.join(', ')}.` 
    : '';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: "system", content: "You are a helpful assistant that provides ingredient substitutions." },
      { role: "user", content: `Provide a substitute for this ingredient: ${ingredient}. ${allergyNotice} ${alreadyUsedNotice} Your answer should only include the ingredient name and measurement, and no other words.` },
    ],
    max_tokens: 50,
  });

  const substitute = response.choices[0]?.message?.content?.trim();
  if (!substitute) {
    return res.status(500).json({ message: 'Failed to generate a substitute.' });
  }

  res.json({ substitute });
});

// @desc Update servings in a recipe
// @route POST /api/recipes/updateServings
// @access Public
const updateServings = asyncHandler(async (req, res) => {
  const { recipe, servings } = req.body;

  if (!recipe || !servings) {
    return res.status(400).json({ message: 'Recipe and servings are required.' });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful assistant that adjusts recipes." },
      { role: "user", content: `Adjust this recipe to serve ${servings} people. Do not rewrite the title, just adjust the ingredient amounts and instructions accordingly:\n\n${recipe}` },
    ],
  });

  const updatedRecipe = response.choices[0]?.message?.content?.trim();
  if (!updatedRecipe) {
    return res.status(500).json({ message: 'Failed to update the recipe.' });
  }

  res.json({ updatedRecipe });
});

// @desc Delete user from a recipe. If the recipe has no users, delete the recipe
// @route DELETE /api/recipes/:recipeId/remove-user
// @access Public
const deleteUserFromRecipe = asyncHandler(async (req, res) => {
    const { recipeId } = req.params; // Recipe ID from the URL
    const { userId } = req.body;    // User ID from the request body
  
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
  
    try {
      // Find the recipe by ID
      const recipe = await Recipe.findById(recipeId);
  
      if (!recipe) {
        return res.status(404).json({ message: 'Recipe not found.' });
      }
  
      // Check if the user ID is in the `savedBy` array
      if (!recipe.savedBy.includes(userId)) {
        return res.status(400).json({ message: 'User not associated with this recipe.' });
      }
  
      // Remove the user ID from the `savedBy` array
      recipe.savedBy = recipe.savedBy.filter((id) => id.toString() !== userId);
  
      // If there are no more users, delete the recipe
      if (recipe.savedBy.length === 0) {
        await recipe.deleteOne();
        return res.json({ message: 'Recipe deleted as no users are associated with it.' });
      }
  
      // Otherwise, save the updated recipe
      await recipe.save();
      res.json({ message: 'User removed from recipe successfully.' });
    } catch (error) {
      console.error('Error removing user from recipe:', error);
      res.status(500).json({ message: 'Failed to remove user from recipe.' });
    }
  });

module.exports = {
  getRecipe,
   generateRecipe,
  saveRecipe,
  substituteIngredient,
  updateServings,
  deleteUserFromRecipe
};
