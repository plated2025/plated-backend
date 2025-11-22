const mongoose = require('mongoose');

const MealPlanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Please add a meal plan title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date']
  },
  meals: [{
    date: {
      type: Date,
      required: true
    },
    mealType: {
      type: String,
      required: true,
      enum: ['breakfast', 'lunch', 'dinner', 'snack']
    },
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    },
    recipeName: String, // In case recipe is deleted
    servings: {
      type: Number,
      default: 1
    },
    notes: String,
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  shoppingList: [{
    item: {
      type: String,
      required: true
    },
    amount: String,
    category: {
      type: String,
      enum: ['produce', 'meat', 'dairy', 'pantry', 'frozen', 'bakery', 'other'],
      default: 'other'
    },
    isPurchased: {
      type: Boolean,
      default: false
    },
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    }
  }],
  totalCalories: {
    type: Number,
    default: 0
  },
  totalProtein: {
    type: Number,
    default: 0
  },
  totalCarbs: {
    type: Number,
    default: 0
  },
  totalFat: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [String]
}, {
  timestamps: true
});

// Indexes for efficient queries
MealPlanSchema.index({ user: 1, startDate: -1 });
MealPlanSchema.index({ user: 1, isActive: 1 });
MealPlanSchema.index({ isPublic: 1, createdAt: -1 });

// Virtual for duration
MealPlanSchema.virtual('duration').get(function() {
  if (this.startDate && this.endDate) {
    const diff = this.endDate - this.startDate;
    return Math.ceil(diff / (1000 * 60 * 60 * 24)); // days
  }
  return 0;
});

// Method to generate shopping list from meals
MealPlanSchema.methods.generateShoppingList = async function() {
  const Recipe = mongoose.model('Recipe');
  const ingredients = {};

  for (const meal of this.meals) {
    if (meal.recipe) {
      const recipe = await Recipe.findById(meal.recipe);
      if (recipe && recipe.ingredients) {
        recipe.ingredients.forEach(ing => {
          const key = ing.item.toLowerCase();
          if (ingredients[key]) {
            ingredients[key].amount += ` + ${ing.amount}`;
          } else {
            ingredients[key] = {
              item: ing.item,
              amount: ing.amount,
              recipe: recipe._id
            };
          }
        });
      }
    }
  }

  this.shoppingList = Object.values(ingredients);
  return this.shoppingList;
};

// Method to calculate total nutrition
MealPlanSchema.methods.calculateNutrition = async function() {
  const Recipe = mongoose.model('Recipe');
  let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  for (const meal of this.meals) {
    if (meal.recipe) {
      const recipe = await Recipe.findById(meal.recipe);
      if (recipe && recipe.nutrition) {
        totals.calories += recipe.nutrition.calories || 0;
        totals.protein += recipe.nutrition.protein || 0;
        totals.carbs += recipe.nutrition.carbs || 0;
        totals.fat += recipe.nutrition.fat || 0;
      }
    }
  }

  this.totalCalories = totals.calories;
  this.totalProtein = totals.protein;
  this.totalCarbs = totals.carbs;
  this.totalFat = totals.fat;

  return totals;
};

module.exports = mongoose.model('MealPlan', MealPlanSchema);
