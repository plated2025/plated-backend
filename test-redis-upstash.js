require('dotenv').config();
const Redis = require('ioredis');

console.log('🔍 Testing Upstash Redis Connection...\n');

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.error('❌ REDIS_URL not found in .env file!');
  process.exit(1);
}

console.log('✅ REDIS_URL found in .env');

// Parse the URL
const url = new URL(redisUrl);
const maskedPassword = url.password ? url.password.substring(0, 4) + '****' : 'none';
console.log('📍 Host:', url.hostname);
console.log('🔑 Password:', maskedPassword);
console.log('');

// Upstash requires TLS
const redis = new Redis(redisUrl, {
  tls: {
    rejectUnauthorized: false  // Required for Upstash
  },
  connectTimeout: 10000,
  retryStrategy(times) {
    if (times > 3) {
      return null;
    }
    return Math.min(times * 500, 2000);
  }
});

redis.on('connect', () => {
  console.log('🔗 Connecting to Upstash Redis...');
});

redis.on('ready', () => {
  console.log('✅ Connected successfully!\n');
  
  // Test operations
  console.log('🧪 Testing Redis operations...');
  
  redis.set('test', 'Hello from Upstash!', (err) => {
    if (err) {
      console.error('❌ Error setting value:', err.message);
      redis.disconnect();
      process.exit(1);
    }
    
    console.log('✅ SET operation successful');
    
    redis.get('test', (err, result) => {
      if (err) {
        console.error('❌ Error getting value:', err.message);
        redis.disconnect();
        process.exit(1);
      }
      
      console.log('✅ GET operation successful');
      console.log('📦 Value retrieved:', result);
      console.log('\n🎉 Your Upstash Redis is working perfectly!\n');
      console.log('✅ Backend caching is ready to use!');
      console.log('🚀 Start your server with: npm start\n');
      
      redis.disconnect();
      process.exit(0);
    });
  });
});

redis.on('error', (err) => {
  console.error('\n❌ Connection Error:', err.message);
  console.log('\n💡 Troubleshooting:');
  console.log('1. Check your Upstash dashboard: https://console.upstash.com/');
  console.log('2. Verify your database is ACTIVE (not paused)');
  console.log('3. Copy the connection string again from Upstash');
  console.log('4. Make sure .env has: REDIS_URL=redis://default:PASSWORD@HOST:6379');
  console.log('');
  process.exit(1);
});

setTimeout(() => {
  console.log('\n⏰ Connection timeout');
  console.log('💡 This might mean:');
  console.log('  - Firewall/network blocking the connection');
  console.log('  - Upstash database is paused or deleted');
  console.log('  - Wrong password in the connection URL\n');
  process.exit(1);
}, 15000);
