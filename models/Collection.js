const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Collection name is required'],
    trim: true,
    maxlength: [50, 'Collection name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  recipes: [{
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  coverImage: {
    type: String, // URL of cover image (first recipe image or custom)
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  icon: {
    type: String,
    default: 'bookmark' // Icon name for frontend (ChefHat, Heart, Bookmark, etc.)
  },
  color: {
    type: String,
    default: 'primary' // Color theme for the collection
  },
  sortOrder: {
    type: Number,
    default: 0 // For custom ordering by user
  }
}, {
  timestamps: true
});

// Index for efficient querying
collectionSchema.index({ user: 1, sortOrder: 1 });
collectionSchema.index({ user: 1, name: 1 });
collectionSchema.index({ isPublic: 1 });

// Virtual for recipe count
collectionSchema.virtual('recipeCount').get(function() {
  return this.recipes ? this.recipes.length : 0;
});

// Ensure virtuals are included in JSON
collectionSchema.set('toJSON', { virtuals: true });
collectionSchema.set('toObject', { virtuals: true });

// Method to add recipe to collection
collectionSchema.methods.addRecipe = async function(recipeId) {
  // Check if recipe already in collection
  const alreadyExists = this.recipes.some(item => 
    item.recipe.toString() === recipeId.toString()
  );
  
  if (!alreadyExists) {
    this.recipes.push({ recipe: recipeId });
    await this.save();
  }
  
  return this;
};

// Method to remove recipe from collection
collectionSchema.methods.removeRecipe = async function(recipeId) {
  this.recipes = this.recipes.filter(item => 
    item.recipe.toString() !== recipeId.toString()
  );
  await this.save();
  return this;
};

// Method to update cover image (use first recipe's image)
collectionSchema.methods.updateCoverImage = async function() {
  if (this.recipes.length > 0) {
    const Recipe = mongoose.model('Recipe');
    const firstRecipe = await Recipe.findById(this.recipes[0].recipe);
    if (firstRecipe && firstRecipe.image) {
      this.coverImage = firstRecipe.image;
      await this.save();
    }
  }
  return this;
};

// Static method to get user collections
collectionSchema.statics.getUserCollections = function(userId) {
  return this.find({ user: userId })
    .populate({
      path: 'recipes.recipe',
      select: 'title image likes createdAt'
    })
    .sort({ sortOrder: 1, createdAt: -1 });
};

// Static method to get public collections
collectionSchema.statics.getPublicCollections = function() {
  return this.find({ isPublic: true })
    .populate('user', 'name username avatar verified')
    .populate({
      path: 'recipes.recipe',
      select: 'title image likes'
    })
    .sort({ createdAt: -1 })
    .limit(20);
};

// Pre-save middleware to set cover image
collectionSchema.pre('save', async function(next) {
  if (this.isModified('recipes') && this.recipes.length > 0 && !this.coverImage) {
    await this.updateCoverImage();
  }
  next();
});

module.exports = mongoose.model('Collection', collectionSchema);
