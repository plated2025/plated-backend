# Plated Backend API

Backend REST API for Plated - Food Social Network

## 🚀 Features

- User authentication (JWT)
- User profiles and social features
- Recipe CRUD operations
- Comments and engagement
- Real-time messaging (Socket.IO)
- Meal planning
- Subscriptions
- File uploads (Cloudinary)

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

4. Start MongoDB (if using local):
```bash
mongod
```

5. Start the server:

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/onboarding` - Update onboarding status
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/profile/:userId` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/follow/:userId` - Follow user
- `DELETE /api/users/follow/:userId` - Unfollow user

### Recipes
- `GET /api/recipes` - Get all recipes
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes` - Create recipe (auth required)
- `PUT /api/recipes/:id` - Update recipe (auth required)
- `DELETE /api/recipes/:id` - Delete recipe (auth required)
- `POST /api/recipes/:id/like` - Like/Unlike recipe (auth required)

### Comments
- `GET /api/comments/recipe/:recipeId` - Get comments for recipe
- `POST /api/comments` - Add comment (auth required)

### Other Endpoints
- `GET /api/health` - Health check
- `/api/messages` - Message endpoints (coming soon)
- `/api/notifications` - Notification endpoints (coming soon)
- `/api/planner` - Meal planner endpoints (coming soon)
- `/api/subscriptions` - Subscription endpoints (coming soon)

## 🗄️ Database Models

- **User** - User accounts and profiles
- **Recipe** - Recipe data and metadata
- **Comment** - Comments and replies
- **Follow** - User follow relationships
- *More models coming soon...*

## 🔒 Authentication

Protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🧪 Testing

```bash
npm test
```

## 📝 Environment Variables

See `.env.example` for all available environment variables.

## 🤝 Contributing

Contributions welcome! Please follow the existing code style.

## 📄 License

ISC
