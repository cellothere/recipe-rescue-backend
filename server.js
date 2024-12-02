require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const recipeRoutes = require('./routes/recipeRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());

app.use(bodyParser.json());

app.use('/api/recipes', recipeRoutes);
app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => app.listen(5001, () => console.log('Server running on port 5001')))
  .catch(err => console.error(err));
