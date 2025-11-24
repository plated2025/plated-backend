require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Comment = require('../models/Comment');

const EMAILS_TO_DELETE = [
  'nasser.k1991@gmail.com',
  'nasser_designer@outlook.com',
  'jane.smith@plated.com',
  'john.doe@plated.com'
];

async function deleteAllAccounts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({ email: { $in: EMAILS_TO_DELETE } });
    
    console.log(`📋 Found ${users.length} account(s) to delete:\n`);
    users.forEach(user => {
      console.log(`  👤 ${user.fullName || 'No name'}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Username: ${user.username || 'Not set'}`);
      console.log('');
    });

    console.log('🗑️  Deleting accounts and all related data...\n');

    const userIds = users.map(u => u._id);

    // Delete related data
    const recipesDeleted = await Recipe.deleteMany({ creator: { $in: userIds } });
    console.log(`✅ Deleted ${recipesDeleted.deletedCount} recipes`);

    const commentsDeleted = await Comment.deleteMany({ user: { $in: userIds } });
    console.log(`✅ Deleted ${commentsDeleted.deletedCount} comments`);

    // Delete users
    const usersDeleted = await User.deleteMany({ _id: { $in: userIds } });
    console.log(`✅ Deleted ${usersDeleted.deletedCount} users`);

    console.log('\n🎉 All accounts deleted successfully!');
    console.log('💡 You can now sign up fresh with Google OAuth\n');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
}

deleteAllAccounts();
