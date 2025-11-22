const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a recipe title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  image: {
    type: String,
    required: [true, 'Please provide an image']
  },
  images: [{
    type: String
  }],
  video: {
    type: String
  },
  
  // Recipe Details
  cuisine: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage', 'Appetizer', 'Side Dish']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  cookTime: {
    type: String,
    required: true
  },
  prepTime: {
    type: String
  },
  totalTime: {
    type: String
  },
  servings: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Ingredients
  ingredients: [{
    item: {
      type: String,
      required: true
    },
    amount: {
      type: String,
      required: true
    },
    unit: {
      type: String
    }
  }],
  
  // Instructions
  instructions: [{
    step: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    image: {
      type: String
    },
    duration: {
      type: String
    }
  }],
  
  // Nutrition Info
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number
  },
  
  // Tags & Dietary
  tags: [{
    type: String
  }],
  dietaryInfo: [{
    type: String,
    enum: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Paleo', 'Low-Carb', 'High-Protein', 'Halal', 'Kosher']
  }],
  allergens: [{
    type: String
  }],
  
  // Engagement Stats
  likes: {
    type: Number,
    default: 0
  },
  likesUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  saves: {
    type: Number,
    default: 0
  },
  savesUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  shares: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  
  // Additional Info
  tips: [{
    type: String
  }],
  equipmentNeeded: [{
    type: String
  }],
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  postedAt: {
    type: Date,
    default: Date.now
  },
  lastEditedAt: {
    type: Date
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
RecipeSchema.index({ creator: 1, postedAt: -1 });
RecipeSchema.index({ cuisine: 1, difficulty: 1 });
RecipeSchema.index({ tags: 1 });
RecipeSchema.index({ likes: -1, postedAt: -1 });
RecipeSchema.index({ title: 'text', description: 'text' });
// Additional performance indices
RecipeSchema.index({ views: -1 }); // For popular/trending recipes
RecipeSchema.index({ saves: -1 }); // For most saved recipes
RecipeSchema.index({ category: 1, postedAt: -1 }); // For category filtering
RecipeSchema.index({ isFeatured: 1, likes: -1 }); // For featured recipes
RecipeSchema.index({ status: 1, postedAt: -1 }); // For published recipes

// Virtual for comments
RecipeSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'recipe',
  justOne: false
});

// Update creator's recipe count
RecipeSchema.post('save', async function() {
  if (this.status === 'published') {
    await this.model('User').findByIdAndUpdate(this.creator, {
      $inc: { recipesCount: 1 }
    });
  }
});

module.exports = mongoose.model('Recipe', RecipeSchema);
