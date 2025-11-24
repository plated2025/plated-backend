const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const User = require('../models/User');
require('dotenv').config();

const sampleRecipes = [
  {
    title: "Classic Margherita Pizza",
    description: "Traditional Italian pizza with fresh mozzarella, basil, and tomato sauce",
    ingredients: [
      { item: "Pizza dough", amount: "1", unit: "ball" },
      { item: "Tomato sauce", amount: "1/2", unit: "cup" },
      { item: "Fresh mozzarella", amount: "200", unit: "g" },
      { item: "Fresh basil leaves", amount: "10", unit: "leaves" },
      { item: "Olive oil", amount: "2", unit: "tbsp" }
    ],
    instructions: [
      { step: 1, description: "Preheat oven to 475°F (245°C)" },
      { step: 2, description: "Roll out pizza dough into a round shape" },
      { step: 3, description: "Spread tomato sauce evenly" },
      { step: 4, description: "Add torn mozzarella pieces" },
      { step: 5, description: "Bake for 12-15 minutes until crust is golden" },
      { step: 6, description: "Top with fresh basil and drizzle with olive oil" }
    ],
    cookTime: "25 min",
    prepTime: "15 min",
    servings: 4,
    difficulty: "Easy",
    cuisine: "Italian",
    category: "Dinner",
    tags: ["vegetarian", "italian", "pizza", "comfort-food"],
    image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800"
  },
  {
    title: "Chicken Pad Thai",
    description: "Authentic Thai stir-fried noodles with chicken, peanuts, and tamarind sauce",
    ingredients: [
      { item: "Rice noodles", amount: "400", unit: "g" },
      { item: "Chicken breast", amount: "500", unit: "g" },
      { item: "Eggs", amount: "3", unit: "pieces" },
      { item: "Bean sprouts", amount: "1", unit: "cup" },
      { item: "Peanuts", amount: "1/2", unit: "cup" },
      { item: "Tamarind paste", amount: "3", unit: "tbsp" }
    ],
    instructions: [
      { step: 1, description: "Soak rice noodles in warm water for 30 minutes" },
      { step: 2, description: "Cut chicken into bite-sized pieces" },
      { step: 3, description: "Heat oil in wok and cook chicken" },
      { step: 4, description: "Push chicken aside, scramble eggs" },
      { step: 5, description: "Add noodles and sauce, stir-fry for 3 minutes" },
      { step: 6, description: "Add bean sprouts and peanuts, toss well" }
    ],
    cookTime: "20 min",
    prepTime: "35 min",
    servings: 4,
    difficulty: "Medium",
    cuisine: "Asian",
    category: "Dinner",
    tags: ["thai", "noodles", "chicken", "stir-fry"],
    image: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800"
  },
  {
    title: "Greek Salad",
    description: "Fresh Mediterranean salad with tomatoes, cucumber, feta, and olives",
    ingredients: [
      { item: "Tomatoes", amount: "4", unit: "large" },
      { item: "Cucumber", amount: "1", unit: "large" },
      { item: "Red onion", amount: "1", unit: "small" },
      { item: "Feta cheese", amount: "200", unit: "g" },
      { item: "Kalamata olives", amount: "1", unit: "cup" },
      { item: "Olive oil", amount: "1/4", unit: "cup" }
    ],
    instructions: [
      { step: 1, description: "Chop tomatoes and cucumber into large chunks" },
      { step: 2, description: "Slice red onion thinly" },
      { step: 3, description: "Combine vegetables in a large bowl" },
      { step: 4, description: "Add olives and crumbled feta" },
      { step: 5, description: "Drizzle with olive oil and oregano" },
      { step: 6, description: "Toss gently and serve immediately" }
    ],
    cookTime: "0 min",
    prepTime: "15 min",
    servings: 4,
    difficulty: "Easy",
    cuisine: "Mediterranean",
    category: "Lunch",
    tags: ["vegetarian", "salad", "greek", "healthy", "cold"],
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800"
  },
  {
    title: "Beef Tacos",
    description: "Spicy Mexican beef tacos with fresh toppings",
    ingredients: [
      { item: "Ground beef", amount: "500", unit: "g" },
      { item: "Taco shells", amount: "8", unit: "pieces" },
      { item: "Lettuce", amount: "2", unit: "cups" },
      { item: "Tomatoes", amount: "2", unit: "medium" },
      { item: "Cheddar cheese", amount: "1", unit: "cup" },
      { item: "Sour cream", amount: "1/2", unit: "cup" }
    ],
    instructions: [
      { step: 1, description: "Brown ground beef in a skillet" },
      { step: 2, description: "Add taco seasoning and water" },
      { step: 3, description: "Simmer for 5 minutes" },
      { step: 4, description: "Warm taco shells in oven" },
      { step: 5, description: "Fill shells with beef" },
      { step: 6, description: "Top with lettuce, tomatoes, cheese, and sour cream" }
    ],
    cookTime: "15 min",
    prepTime: "10 min",
    servings: 4,
    difficulty: "Easy",
    cuisine: "Mexican",
    category: "Dinner",
    tags: ["mexican", "beef", "tacos", "quick"],
    image: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800"
  },
  {
    title: "Creamy Mushroom Risotto",
    description: "Rich Italian risotto with mixed mushrooms and parmesan",
    ingredients: [
      { item: "Arborio rice", amount: "2", unit: "cups" },
      { item: "Mixed mushrooms", amount: "400", unit: "g" },
      { item: "Vegetable stock", amount: "6", unit: "cups" },
      { item: "Parmesan cheese", amount: "1", unit: "cup" },
      { item: "White wine", amount: "1/2", unit: "cup" },
      { item: "Butter", amount: "3", unit: "tbsp" }
    ],
    instructions: [
      { step: 1, description: "Sauté mushrooms in butter until golden" },
      { step: 2, description: "Add rice and toast for 2 minutes" },
      { step: 3, description: "Add wine and stir until absorbed" },
      { step: 4, description: "Add stock one ladle at a time, stirring constantly" },
      { step: 5, description: "Continue for 20 minutes until rice is creamy" },
      { step: 6, description: "Stir in parmesan and butter, season to taste" }
    ],
    cookTime: "30 min",
    prepTime: "10 min",
    servings: 4,
    difficulty: "Medium",
    cuisine: "Italian",
    category: "Dinner",
    tags: ["vegetarian", "italian", "risotto", "comfort-food"],
    image: "https://images.unsplash.com/photo-1476124369491-c6c281cd202b?w=800"
  },
  {
    title: "Chocolate Chip Cookies",
    description: "Classic homemade cookies with gooey chocolate chips",
    ingredients: [
      { item: "All-purpose flour", amount: "2 1/4", unit: "cups" },
      { item: "Butter", amount: "1", unit: "cup" },
      { item: "Brown sugar", amount: "3/4", unit: "cup" },
      { item: "Eggs", amount: "2", unit: "large" },
      { item: "Chocolate chips", amount: "2", unit: "cups" },
      { item: "Vanilla extract", amount: "2", unit: "tsp" }
    ],
    instructions: [
      { step: 1, description: "Preheat oven to 375°F (190°C)" },
      { step: 2, description: "Cream butter and sugars together" },
      { step: 3, description: "Beat in eggs and vanilla" },
      { step: 4, description: "Mix in flour, baking soda, and salt" },
      { step: 5, description: "Fold in chocolate chips" },
      { step: 6, description: "Bake for 10-12 minutes until golden" }
    ],
    cookTime: "12 min",
    prepTime: "15 min",
    servings: 24,
    difficulty: "Easy",
    cuisine: "American",
    category: "Dessert",
    tags: ["dessert", "cookies", "chocolate", "baking"],
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800"
  },
  {
    title: "Sushi Rolls",
    description: "Fresh homemade sushi with salmon and avocado",
    ingredients: [
      { item: "Sushi rice", amount: "3", unit: "cups" },
      { item: "Nori sheets", amount: "10", unit: "sheets" },
      { item: "Fresh salmon", amount: "400", unit: "g" },
      { item: "Avocado", amount: "2", unit: "pieces" },
      { item: "Cucumber", amount: "1", unit: "piece" },
      { item: "Rice vinegar", amount: "1/4", unit: "cup" }
    ],
    instructions: [
      { step: 1, description: "Cook sushi rice and season with vinegar" },
      { step: 2, description: "Cut salmon, avocado, and cucumber into strips" },
      { step: 3, description: "Place nori on bamboo mat" },
      { step: 4, description: "Spread rice evenly, leaving 1 inch at top" },
      { step: 5, description: "Add fillings and roll tightly" },
      { step: 6, description: "Slice into 8 pieces with sharp wet knife" }
    ],
    cookTime: "0 min",
    prepTime: "45 min",
    servings: 5,
    difficulty: "Hard",
    cuisine: "Japanese",
    category: "Lunch",
    tags: ["japanese", "sushi", "seafood", "healthy"],
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800"
  },
  {
    title: "French Onion Soup",
    description: "Classic French soup with caramelized onions and melted gruyere",
    ingredients: [
      { item: "Yellow onions", amount: "6", unit: "large" },
      { item: "Beef stock", amount: "8", unit: "cups" },
      { item: "Gruyere cheese", amount: "2", unit: "cups" },
      { item: "French bread", amount: "1", unit: "loaf" },
      { item: "Butter", amount: "4", unit: "tbsp" },
      { item: "Thyme", amount: "2", unit: "tsp" }
    ],
    instructions: [
      { step: 1, description: "Slice onions thinly" },
      { step: 2, description: "Caramelize onions in butter for 40 minutes" },
      { step: 3, description: "Add beef stock and thyme, simmer 30 minutes" },
      { step: 4, description: "Toast bread slices" },
      { step: 5, description: "Ladle soup into oven-safe bowls" },
      { step: 6, description: "Top with bread and cheese, broil until bubbly" }
    ],
    cookTime: "80 min",
    prepTime: "15 min",
    servings: 6,
    difficulty: "Medium",
    cuisine: "French",
    category: "Lunch",
    tags: ["french", "soup", "comfort-food", "cheese"],
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800"
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get or create a demo user
    let demoUser = await User.findOne({ email: 'demo@plated.com' });
    
    if (!demoUser) {
      console.log('👤 Creating demo user...');
      demoUser = await User.create({
        fullName: 'Chef Demo',
        username: 'chefdemo',
        email: 'demo@plated.com',
        password: 'Demo12345', // Will be hashed by pre-save hook
        accountType: 'creator',
        bio: 'Professional chef sharing delicious recipes',
        avatar: 'https://i.pravatar.cc/150?img=33'
      });
      console.log('✅ Demo user created\n');
    } else {
      console.log('✅ Using existing demo user\n');
    }

    // Clear existing recipes
    const deleteResult = await Recipe.deleteMany({});
    console.log(`🗑️  Cleared ${deleteResult.deletedCount} existing recipes\n`);

    // Create sample recipes
    console.log('📝 Creating sample recipes...\n');
    
    const recipesWithUser = sampleRecipes.map(recipe => ({
      ...recipe,
      creator: demoUser._id,
      likes: Math.floor(Math.random() * 5000) + 500, // Random likes between 500-5500
      views: Math.floor(Math.random() * 10000) + 1000, // Random views
      bookmarks: Math.floor(Math.random() * 1000) + 100,
      rating: {
        average: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
        count: Math.floor(Math.random() * 500) + 50
      }
    }));

    const createdRecipes = await Recipe.insertMany(recipesWithUser);
    
    console.log(`✅ Created ${createdRecipes.length} recipes:\n`);
    createdRecipes.forEach((recipe, index) => {
      console.log(`   ${index + 1}. ${recipe.title} (${recipe.likes} likes, ${recipe.views} views)`);
    });

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - User: ${demoUser.fullName} (${demoUser.email})`);
    console.log(`   - Recipes: ${createdRecipes.length}`);
    console.log(`   - Total Likes: ${recipesWithUser.reduce((sum, r) => sum + r.likes, 0)}`);
    console.log(`   - Total Views: ${recipesWithUser.reduce((sum, r) => sum + r.views, 0)}\n`);

    console.log('🚀 You can now:');
    console.log('   1. Refresh your web app');
    console.log('   2. See recipes in the feed');
    console.log('   3. Check trending section');
    console.log('   4. Try weather recommendations');
    console.log('   5. Test all smart features!\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run the seeder
seedDatabase();
