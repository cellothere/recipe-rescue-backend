require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const recipeRoutes = require('./routes/recipeRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const subRoutes = require('./routes/subRoutes')
const newRecipeRoutes = require('./routes/newRecipeRoutes')
const app = express();
app.use(cors());

app.use(bodyParser.json());

app.use('/api/recipes', recipeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/substitute', subRoutes);
app.use('/api/newRecipe', newRecipeRoutes);


mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(5001, () => console.log('Server running on port 5001'));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

