const { OpenAI } = require('openai');
const newRecipe = require('../models/NewRecipe');
const asyncHandler = require('express-async-handler');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Set your API key here
  });


  const generateRecipe = asyncHandler(async (req, res) => {
    const { recipeName, allergies = [], servings } = req.body;
  
    if (!recipeName || typeof recipeName !== 'string' || recipeName.trim().length === 0) {
      return res.status(400).json({ message: 'A valid recipe recipeName is required.' });
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
          content: `Create a recipe for ${recipeName}. ${allergyNotice} ${servingsNotice} Do not give an introduction paragraph. Just the recipeName, ingredients, and instructions. Give numbered instructions: 1. 2. 3. etc.
          If the user presents an unrelated question or a recipeName that is unsafe or unedible, please respond with "No Recipes Found."`
        }
      );
  
      const run = await openai.beta.threads.runs.createAndPoll(
        thread.id,
        { 
          assistant_id: process.env.OPENAI_GEN_ASST_KEY,
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
  
  module.exports = {
     generateRecipe
  };
  