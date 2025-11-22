/**
 * Database Cleanup Script
 * Removes all sample/test data to prepare for production
 * 
 * Usage: node scripts/cleanupDatabase.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Message = require('../models/Message');

const SAMPLE_EMAILS = [
  'john@example.com',
  'jane@example.com',
  'chef@example.com',
  'foodie@example.com',
  'test@example.com',
  'demo@example.com',
  'sample@example.com'
];

const SAMPLE_USERNAMES = [
  'john_doe',
  'jane_smith',
  'chef_master',
  'foodie_lover',
  'test_user',
  'demo_user',
  'sample_user'
];

async function cleanupDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // 1. Find and delete sample users
    console.log('🔍 Finding sample users...');
    const sampleUsers = await User.find({
      $or: [
        { email: { $in: SAMPLE_EMAILS } },
        { username: { $in: SAMPLE_USERNAMES } }
      ]
    });
    
    const sampleUserIds = sampleUsers.map(user => user._id);
    console.log(`   Found ${sampleUsers.length} sample users`);
    
    if (sampleUsers.length > 0) {
      console.log('   Sample users:', sampleUsers.map(u => u.email || u.username).join(', '));
      
      // Delete sample users
      const deletedUsers = await User.deleteMany({ _id: { $in: sampleUserIds } });
      console.log(`   ✅ Deleted ${deletedUsers.deletedCount} sample users\n`);
    } else {
      console.log('   ✅ No sample users found\n');
    }

    // 2. Delete posts/recipes created by sample users
    console.log('🔍 Finding sample recipes...');
    const deletedRecipes = await Recipe.deleteMany({ author: { $in: sampleUserIds } });
    console.log(`   ✅ Deleted ${deletedRecipes.deletedCount} sample recipes\n`);

    // 3. Delete posts (reels) created by sample users
    console.log('🔍 Finding sample posts/reels...');
    const deletedPosts = await Post.deleteMany({ author: { $in: sampleUserIds } });
    console.log(`   ✅ Deleted ${deletedPosts.deletedCount} sample posts\n`);

    // 4. Delete comments by sample users
    console.log('🔍 Finding sample comments...');
    const deletedComments = await Comment.deleteMany({ user: { $in: sampleUserIds } });
    console.log(`   ✅ Deleted ${deletedComments.deletedCount} sample comments\n`);

    // 5. Delete notifications for/from sample users
    console.log('🔍 Finding sample notifications...');
    const deletedNotifications = await Notification.deleteMany({
      $or: [
        { recipient: { $in: sampleUserIds } },
        { sender: { $in: sampleUserIds } }
      ]
    });
    console.log(`   ✅ Deleted ${deletedNotifications.deletedCount} sample notifications\n`);

    // 6. Delete messages to/from sample users
    console.log('🔍 Finding sample messages...');
    const deletedMessages = await Message.deleteMany({
      $or: [
        { sender: { $in: sampleUserIds } },
        { recipient: { $in: sampleUserIds } }
      ]
    });
    console.log(`   ✅ Deleted ${deletedMessages.deletedCount} sample messages\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 CLEANUP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Users deleted:         ${sampleUsers.length}`);
    console.log(`✅ Recipes deleted:       ${deletedRecipes.deletedCount}`);
    console.log(`✅ Posts deleted:         ${deletedPosts.deletedCount}`);
    console.log(`✅ Comments deleted:      ${deletedComments.deletedCount}`);
    console.log(`✅ Notifications deleted: ${deletedNotifications.deletedCount}`);
    console.log(`✅ Messages deleted:      ${deletedMessages.deletedCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('💡 Your database is now clean and ready for production!');
    console.log('💡 All sample data has been removed.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Optional: More aggressive cleanup (deletes ALL data except admin users)
async function cleanupAllData(keepAdminEmails = []) {
  try {
    console.log('⚠️  WARNING: This will delete ALL data!');
    console.log('⏳ Starting in 5 seconds... Press Ctrl+C to cancel\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Delete all except admin users
    const deletedUsers = await User.deleteMany({ 
      email: { $nin: keepAdminEmails } 
    });
    console.log(`✅ Deleted ${deletedUsers.deletedCount} users (kept admin users)`);

    // Delete all recipes
    const deletedRecipes = await Recipe.deleteMany({});
    console.log(`✅ Deleted ${deletedRecipes.deletedCount} recipes`);

    // Delete all posts
    const deletedPosts = await Post.deleteMany({});
    console.log(`✅ Deleted ${deletedPosts.deletedCount} posts`);

    // Delete all comments
    const deletedComments = await Comment.deleteMany({});
    console.log(`✅ Deleted ${deletedComments.deletedCount} comments`);

    // Delete all notifications
    const deletedNotifications = await Notification.deleteMany({});
    console.log(`✅ Deleted ${deletedNotifications.deletedCount} notifications`);

    // Delete all messages
    const deletedMessages = await Message.deleteMany({});
    console.log(`✅ Deleted ${deletedMessages.deletedCount} messages`);

    console.log('\n🎉 Complete database wipe finished!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--all')) {
  console.log('⚠️  Running FULL database cleanup...\n');
  cleanupAllData();
} else if (args.includes('--help')) {
  console.log(`
Database Cleanup Script
======================

Usage:
  node scripts/cleanupDatabase.js           # Remove sample data only
  node scripts/cleanupDatabase.js --all     # Remove ALL data (dangerous!)
  node scripts/cleanupDatabase.js --help    # Show this help

Examples:
  # Remove sample users and their content
  npm run cleanup

  # Complete database wipe (keeps admin users in code)
  node scripts/cleanupDatabase.js --all
  `);
  process.exit(0);
} else {
  cleanupDatabase();
}
