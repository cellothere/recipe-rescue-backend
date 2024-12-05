const User = require('../models/Substitute');
const bcrypt = require('bcrypt');
const { OpenAI } = require('openai');
const asyncHandler = require('express-async-handler');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Set your API key here
  });

const generateSubstitute = asyncHandler(async (req, res) => {
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
        { role: "user", content: `Provide 5 unique substitutes for this ingredient: ${ingredient}. ${allergyNotice} ${alreadyUsedNotice} Your answer should only include the substitute names and measurements (if applicable), and no other words or text. Substitutes should be listed using a numerical list 1. 2. 3. 4. 5.` },
      ],
      max_tokens: 50,
    });
  
    const substitute = response.choices[0]?.message?.content?.trim();
    if (!substitute) {
      return res.status(500).json({ message: 'Failed to generate a substitute.' });
    }
  
    res.json({ substitute });
  });


  module.exports = {
    generateSubstitute
};