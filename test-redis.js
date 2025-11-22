const Redis = require('ioredis');

const redis = new Redis('redis://localhost:6379');

redis.on('connect', () => {
  console.log('✅ Redis connected successfully!');
  
  // Test set and get
  redis.set('test', 'Hello Redis!', (err) => {
    if (err) {
      console.error('❌ Error setting value:', err);
      process.exit(1);
    }
    
    redis.get('test', (err, result) => {
      if (err) {
        console.error('❌ Error getting value:', err);
        process.exit(1);
      }
      
      console.log('✅ Redis test successful! Value:', result);
      process.exit(0);
    });
  });
});

redis.on('error', (err) => {
  console.error('❌ Redis connection failed:', err.message);
  console.log('\n💡 Make sure Redis is installed and running!');
  console.log('Options:');
  console.log('1. Install Memurai (Windows): https://www.memurai.com/get-memurai');
  console.log('2. Install Docker Desktop: https://www.docker.com/products/docker-desktop/');
  console.log('3. Use cloud Redis: https://upstash.com/');
  process.exit(1);
});

setTimeout(() => {
  console.log('⏳ Redis connection timeout');
  process.exit(1);
}, 5000);
