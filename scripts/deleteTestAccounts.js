require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Comment = require('../models/Comment');

// Test accounts to delete (add emails you want to remove)
const TEST_EMAILS = [
  // Add your test account emails here
  // Example: 'test@example.com',
];

// Test usernames to delete
const TEST_USERNAMES = [
  // Add test usernames here if you remember them
  // Example: 'testuser123',
];

async function deleteTestAccounts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find test accounts
    const query = {
      $or: []
    };

    if (TEST_EMAILS.length > 0) {
      query.$or.push({ email: { $in: TEST_EMAILS } });
    }

    if (TEST_USERNAMES.length > 0) {
      query.$or.push({ username: { $in: TEST_USERNAMES } });
    }

    // If no specific emails/usernames, ask for confirmation
    if (query.$or.length === 0) {
      console.log('⚠️  No test emails or usernames specified!');
      console.log('');
      console.log('📋 OPTIONS:');
      console.log('');
      console.log('1️⃣  List all accounts (to see what to delete):');
      console.log('   node scripts/deleteTestAccounts.js --list');
      console.log('');
      console.log('2️⃣  Delete by email:');
      console.log('   node scripts/deleteTestAccounts.js --email test@example.com');
      console.log('');
      console.log('3️⃣  Delete by username:');
      console.log('   node scripts/deleteTestAccounts.js --username testuser');
      console.log('');
      console.log('4️⃣  Delete all OAuth test accounts:');
      console.log('   node scripts/deleteTestAccounts.js --oauth');
      console.log('');
      console.log('5️⃣  Edit this file and add emails to TEST_EMAILS array');
      console.log('');
      process.exit(0);
    }

    const users = await User.find(query);

    if (users.length === 0) {
      console.log('❌ No matching users found');
      process.exit(0);
    }

    console.log(`\n📋 Found ${users.length} test account(s):\n`);
    users.forEach(user => {
      console.log(`  👤 ${user.fullName || 'No name'}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Username: ${user.username || 'Not set'}`);
      console.log(`     Auth: ${user.authProvider || 'email'}`);
      console.log(`     Created: ${user.createdAt}`);
      console.log('');
    });

    // Confirm deletion
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('⚠️  Delete these accounts? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        console.log('\n🗑️  Deleting accounts and related data...\n');

        const userIds = users.map(u => u._id);

        // Delete related data
        const recipesDeleted = await Recipe.deleteMany({ creator: { $in: userIds } });
        console.log(`✅ Deleted ${recipesDeleted.deletedCount} recipes`);

        const commentsDeleted = await Comment.deleteMany({ user: { $in: userIds } });
        console.log(`✅ Deleted ${commentsDeleted.deletedCount} comments`);

        // Delete users
        const usersDeleted = await User.deleteMany({ _id: { $in: userIds } });
        console.log(`✅ Deleted ${usersDeleted.deletedCount} users`);

        console.log('\n🎉 Cleanup complete!');
      } else {
        console.log('❌ Deletion cancelled');
      }

      readline.close();
      mongoose.connection.close();
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--list')) {
  // List all accounts
  (async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({}).sort({ createdAt: -1 }).limit(50);
    
    console.log(`\n📋 All accounts (last 50):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. 👤 ${user.fullName || 'No name'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username || 'Not set'}`);
      console.log(`   Auth: ${user.authProvider || 'email'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
    
    mongoose.connection.close();
  })();
} else if (args.includes('--email')) {
  const emailIndex = args.indexOf('--email');
  const email = args[emailIndex + 1];
  
  if (!email) {
    console.log('❌ Please provide an email: --email test@example.com');
    process.exit(1);
  }
  
  TEST_EMAILS.push(email);
  deleteTestAccounts();
} else if (args.includes('--username')) {
  const usernameIndex = args.indexOf('--username');
  const username = args[usernameIndex + 1];
  
  if (!username) {
    console.log('❌ Please provide a username: --username testuser');
    process.exit(1);
  }
  
  TEST_USERNAMES.push(username);
  deleteTestAccounts();
} else if (args.includes('--oauth')) {
  // Delete OAuth test accounts
  (async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const users = await User.find({ 
      authProvider: { $in: ['google', 'apple'] }
    }).sort({ createdAt: -1 });
    
    console.log(`\n📋 Found ${users.length} OAuth account(s):\n`);
    users.forEach(user => {
      console.log(`  👤 ${user.fullName || 'No name'}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Auth: ${user.authProvider}`);
      console.log(`     Created: ${user.createdAt}`);
      console.log('');
    });
    
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('⚠️  Delete all OAuth accounts? (yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        const userIds = users.map(u => u._id);
        
        const recipesDeleted = await Recipe.deleteMany({ creator: { $in: userIds } });
        console.log(`✅ Deleted ${recipesDeleted.deletedCount} recipes`);
        
        const commentsDeleted = await Comment.deleteMany({ user: { $in: userIds } });
        console.log(`✅ Deleted ${commentsDeleted.deletedCount} comments`);
        
        const usersDeleted = await User.deleteMany({ _id: { $in: userIds } });
        console.log(`✅ Deleted ${usersDeleted.deletedCount} users`);
        
        console.log('\n🎉 Cleanup complete!');
      } else {
        console.log('❌ Deletion cancelled');
      }
      
      readline.close();
      mongoose.connection.close();
    });
  })();
} else {
  deleteTestAccounts();
}
