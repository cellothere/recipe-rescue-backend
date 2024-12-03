⚙️ Installation
1. Clone the Repository
bash
Copy code
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
2. Install Dependencies
Using Yarn:

bash
Copy code
yarn install
Or using npm:

bash
Copy code
npm install

🗂 Environment Variables
Create a .env file in the root of the project with the following keys:

plaintext
Copy code
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
OPENAI_API_KEY=your_openai_api_key
Replace your_mongodb_connection_string with your MongoDB URI.
Generate secure secrets for ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET (e.g., using randomkeygen.com).
Get your OPENAI_API_KEY from OpenAI's platform.

▶️ Running the Server
1. Start the Development Server
Using Yarn:

bash
Copy code
yarn dev
Or using npm:

bash
Copy code
npm run dev
The server will start on http://localhost:5001 by default.

2. Set Up Your Front-End
Ensure your front-end is configured to connect to this server. Update the API_BASE_URL in your front-end code to match the back-end URL.

🧪 Testing
Sample Endpoints
Health Check:

bash
Copy code
GET /api/health
Returns:

json
Copy code
{ "status": "API is running!" }
User Authentication:

POST /api/auth/register: Register a new user.
POST /api/auth/login: Authenticate a user and receive tokens.
Recipe Management:

POST /api/recipes/generate: Generate a recipe using OpenAI.
POST /api/recipes/save: Save a recipe to the database.
GET /api/recipes/:id: Fetch a recipe by its ID.
Saved Recipes:

GET /api/users/:userId/recipes: Get all saved recipes for a user.
PATCH /api/recipes/:recipeId/remove-user: Remove a user from a saved recipe.

📁 Project Structure
plaintext
Copy code
.
├── controllers/                # Controller logic for handling API requests
├── middleware/                 # Custom middleware (e.g., JWT verification)
├── models/                     # Mongoose models for MongoDB
├── routes/                     # API route definitions
├── utils/                      # Helper functions and utilities
├── .env.example                # Example environment variables file
├── server.js                   # Server entry point
└── README.md                   # Documentation
🔧 Common Issues
MongoDB Connection Fails
Ensure your MONGODB_URI in .env is correct.
Verify your MongoDB instance is running (local or cloud).
JWT Errors
Make sure ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET are consistent across your app.
Regenerate the secrets if necessary.
OpenAI API Issues
Verify your OPENAI_API_KEY is valid and has sufficient quota.
Ensure the OpenAI models you use are supported.
