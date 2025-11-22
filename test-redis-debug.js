require('dotenv').config();
const Redis = require('ioredis');

console.log('🔍 Debugging Redis Connection...\n');

// Check if REDIS_URL is loaded
const redisUrl = process.env.REDIS_URL;
console.log('REDIS_URL from .env:', redisUrl ? '✅ Found' : '❌ Not found');

if (redisUrl) {
  // Mask password for security
  const maskedUrl = redisUrl.replace(/:(.*?)@/, ':****@');
  console.log('Connection URL:', maskedUrl);
  console.log('');
  
  const redis = new Redis(redisUrl, {
    connectTimeout: 10000,
    retryStrategy(times) {
      console.log(`⏳ Retry attempt ${times}...`);
      if (times > 3) {
        return null; // Stop retrying
      }
      return Math.min(times * 200, 2000);
    }
  });

  redis.on('connect', () => {
    console.log('🔗 Connecting to Redis...');
  });

  redis.on('ready', () => {
    console.log('✅ Redis connected successfully!\n');
    
    // Test set and get
    redis.set('test', 'Hello from Upstash!', (err) => {
      if (err) {
        console.error('❌ Error setting value:', err.message);
        process.exit(1);
      }
      
      redis.get('test', (err, result) => {
        if (err) {
          console.error('❌ Error getting value:', err.message);
          process.exit(1);
        }
        
        console.log('✅ Redis test successful!');
        console.log('📦 Stored value:', result);
        console.log('\n🎉 Your Upstash Redis is working perfectly!\n');
        redis.disconnect();
        process.exit(0);
      });
    });
  });

  redis.on('error', (err) => {
    console.error('\n❌ Redis connection error:', err.message);
    console.log('\n💡 Troubleshooting steps:');
    console.log('1. Check your .env file has: REDIS_URL=redis://...');
    console.log('2. Verify the URL is correct in Upstash dashboard');
    console.log('3. Make sure there are no spaces or quotes around the URL');
    console.log('4. Check if Upstash database is active\n');
    process.exit(1);
  });

  setTimeout(() => {
    console.log('\n⏰ Connection timeout (10 seconds)');
    console.log('Please check your Upstash Redis URL and try again.\n');
    process.exit(1);
  }, 10000);
} else {
  console.error('\n❌ REDIS_URL not found in .env file!\n');
  console.log('📝 Please add this line to your .env file:');
  console.log('REDIS_URL=redis://default:password@hostname.upstash.io:6379\n');
  console.log('Get your URL from: https://console.upstash.com/\n');
  process.exit(1);
}
