const Redis = require('ioredis');

// Create Redis client with TLS for Upstash
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  tls: {
    rejectUnauthorized: false  // Required for Upstash
  },
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
});

// Handle Redis connection events
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

// Cache middleware for GET requests
exports.cache = (duration = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip caching if user is authenticated (for personalized content)
    if (req.user) {
      return next();
    }
    
    // Create cache key from URL and query params
    const key = `cache:${req.originalUrl || req.url}`;
    
    try {
      // Check if data exists in cache
      const cachedResponse = await redis.get(key);
      
      if (cachedResponse) {
        console.log(`🔵 Cache HIT: ${key}`);
        return res.json(JSON.parse(cachedResponse));
      }
      
      console.log(`🔴 Cache MISS: ${key}`);
      
      // Store original res.json
      const originalJson = res.json.bind(res);
      
      // Override res.json to cache the response
      res.json = (body) => {
        // Cache the response
        redis.setex(key, duration, JSON.stringify(body))
          .catch(err => console.error('Redis cache set error:', err));
        
        // Send response
        return originalJson(body);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // If Redis fails, continue without caching
      next();
    }
  };
};

// Clear cache by pattern
exports.clearCache = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`🗑️  Cleared ${keys.length} cache entries matching: ${pattern}`);
    }
  } catch (error) {
    console.error('Clear cache error:', error);
  }
};

// Clear all cache
exports.clearAllCache = async () => {
  try {
    await redis.flushdb();
    console.log('🗑️  All cache cleared');
  } catch (error) {
    console.error('Clear all cache error:', error);
  }
};

// Get cache stats
exports.getCacheStats = async () => {
  try {
    const info = await redis.info('stats');
    const keyspace = await redis.info('keyspace');
    return { info, keyspace };
  } catch (error) {
    console.error('Get cache stats error:', error);
    return null;
  }
};

// Set cache manually
exports.setCache = async (key, value, duration = 300) => {
  try {
    await redis.setex(key, duration, JSON.stringify(value));
  } catch (error) {
    console.error('Set cache error:', error);
  }
};

// Get cache manually
exports.getCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Get cache error:', error);
    return null;
  }
};

module.exports = { redis, ...exports };
