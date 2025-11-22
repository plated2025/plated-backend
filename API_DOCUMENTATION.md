# 📚 Plated API Documentation

**Base URL:** `http://localhost:5000/api`

---

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 📝 Authentication Endpoints

### Register User
```
POST /auth/register
```

**Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com",
      "username": "johndoe123",
      "avatar": "https://...",
      "userType": "regular",
      "hasCompletedOnboarding": false,
      "hasSelectedUserType": false
    }
  }
}
```

### Login User
```
POST /auth/login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:** Same as Register

### Get Current User
```
GET /auth/me
```
**Protected:** Yes

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john@example.com",
    "username": "johndoe123",
    "userType": "creator",
    "subscriptionTier": "free",
    "followersCount": 150,
    "followingCount": 75,
    "recipesCount": 12
  }
}
```

### Update Onboarding
```
PUT /auth/onboarding
```
**Protected:** Yes

**Body:**
```json
{
  "hasSelectedUserType": true,
  "userType": "creator",
  "interests": ["Italian", "Healthy", "Quick Meals"],
  "hasCompletedOnboarding": true
}
```

---

## 👤 User Endpoints

### Search Users
```
GET /users/search?q=john&limit=10
```

**Query Params:**
- `q` (required): Search query
- `limit` (optional): Max results (default: 10)

### Get User Profile
```
GET /users/profile/:userId
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "username": "johndoe123",
    "avatar": "https://...",
    "bio": "Food lover & chef",
    "followersCount": 150,
    "followingCount": 75,
    "recipesCount": 12,
    "isFollowing": false
  }
}
```

### Update Profile
```
PUT /users/profile
```
**Protected:** Yes

**Body:**
```json
{
  "fullName": "John Doe Updated",
  "bio": "Professional chef",
  "location": "New York",
  "website": "https://johndoe.com",
  "avatar": "https://..."
}
```

### Follow User
```
POST /users/follow/:userId
```
**Protected:** Yes

### Unfollow User
```
DELETE /users/follow/:userId
```
**Protected:** Yes

### Get Followers
```
GET /users/:userId/followers
```

### Get Following
```
GET /users/:userId/following
```

---

## 🍽️ Recipe Endpoints

### Get All Recipes
```
GET /recipes?cuisine=italian&difficulty=easy&page=1&limit=20
```

**Query Params:**
- `cuisine`: Filter by cuisine (e.g., italian, mexican)
- `difficulty`: Filter by difficulty (easy, medium, hard)
- `category`: Filter by category (Breakfast, Lunch, etc.)
- `search`: Text search
- `sort`: Sort order (default: -postedAt)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)

**Response:**
```json
{
  "status": "success",
  "data": {
    "recipes": [...],
    "totalPages": 5,
    "currentPage": 1,
    "total": 100
  }
}
```

### Get Single Recipe
```
GET /recipes/:id
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Spaghetti Carbonara",
    "description": "Classic Italian pasta",
    "image": "https://...",
    "cuisine": "Italian",
    "difficulty": "Medium",
    "cookTime": "30 min",
    "servings": 4,
    "ingredients": [
      {
        "item": "Spaghetti",
        "amount": "400g"
      }
    ],
    "instructions": [
      {
        "step": 1,
        "description": "Boil water..."
      }
    ],
    "nutrition": {
      "calories": 520,
      "protein": 25,
      "carbs": 60,
      "fat": 18
    },
    "likes": 245,
    "saves": 89,
    "views": 1250,
    "creator": {
      "fullName": "Chef Mario",
      "username": "chefmario",
      "avatar": "https://..."
    }
  }
}
```

### Create Recipe
```
POST /recipes
```
**Protected:** Yes

**Body:**
```json
{
  "title": "Spaghetti Carbonara",
  "description": "Classic Italian pasta dish",
  "image": "https://...",
  "cuisine": "Italian",
  "category": "Dinner",
  "difficulty": "Medium",
  "cookTime": "30 min",
  "servings": 4,
  "ingredients": [
    {
      "item": "Spaghetti",
      "amount": "400g"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "description": "Boil water and cook pasta"
    }
  ],
  "nutrition": {
    "calories": 520,
    "protein": 25,
    "carbs": 60,
    "fat": 18
  },
  "tags": ["pasta", "italian", "dinner"],
  "dietaryInfo": ["Vegetarian"]
}
```

### Update Recipe
```
PUT /recipes/:id
```
**Protected:** Yes
**Authorization:** Must be recipe creator

### Delete Recipe
```
DELETE /recipes/:id
```
**Protected:** Yes
**Authorization:** Must be recipe creator

### Like/Unlike Recipe
```
POST /recipes/:id/like
```
**Protected:** Yes

**Response:**
```json
{
  "status": "success",
  "data": {
    "isLiked": true,
    "likes": 246
  }
}
```

### Save/Unsave Recipe
```
POST /recipes/:id/save
```
**Protected:** Yes

### Get User's Recipes
```
GET /recipes/user/:userId
```

### Get Saved Recipes
```
GET /recipes/saved/me
```
**Protected:** Yes

---

## 💬 Comment Endpoints

### Get Recipe Comments
```
GET /comments/recipe/:recipeId
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "text": "Great recipe!",
      "user": {
        "fullName": "Jane Doe",
        "username": "janedoe",
        "avatar": "https://..."
      },
      "likes": 12,
      "repliesCount": 3,
      "createdAt": "2024-11-19T20:00:00.000Z",
      "replies": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "text": "Thank you!",
          "user": {...},
          "likes": 5
        }
      ]
    }
  ]
}
```

### Add Comment
```
POST /comments
```
**Protected:** Yes

**Body:**
```json
{
  "recipe": "507f1f77bcf86cd799439011",
  "text": "Amazing recipe!",
  "parentComment": null // or comment ID for replies
}
```

### Update Comment
```
PUT /comments/:id
```
**Protected:** Yes
**Authorization:** Must be comment owner

**Body:**
```json
{
  "text": "Updated comment text"
}
```

### Delete Comment
```
DELETE /comments/:id
```
**Protected:** Yes
**Authorization:** Must be comment owner

### Like Comment
```
POST /comments/:id/like
```
**Protected:** Yes

---

## ❌ Error Responses

All endpoints may return error responses:

```json
{
  "status": "error",
  "message": "Error description"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not authorized)
- `404` - Not Found
- `500` - Server Error

---

## 📊 Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 100 per IP
- **Header:** `X-RateLimit-Remaining`

---

## 🔒 Security Features

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Helmet.js security headers
- ✅ CORS configured
- ✅ Rate limiting
- ✅ Input validation
- ✅ XSS protection

---

## 🧪 Testing

Use the provided test script:
```bash
powershell -ExecutionPolicy Bypass -File test-api.ps1
```

Or use tools like:
- Postman
- Thunder Client
- curl
- Insomnia

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- IDs are MongoDB ObjectIds
- Pagination uses 1-based indexing
- Default sort is by creation date (newest first)
- File uploads not yet implemented (coming soon)

---

**Last Updated:** November 19, 2024
