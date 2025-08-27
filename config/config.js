require('dotenv').config();
const { MongoClient } = require('mongodb');

let dbInstance = null;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    dbInstance = client.db('geekratings');
    console.log('✅ Connected to MongoDB successfully');
    
    // Crear índices
    await dbInstance.collection('users').createIndex({ email: 1 }, { unique: true });
    await dbInstance.collection('movies').createIndex({ title: 1 }, { unique: true });
    await dbInstance.collection('categories').createIndex({ name: 1 }, { unique: true });
    
    return dbInstance;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

const getDB = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return dbInstance;
};

module.exports = {
  port: process.env.PORT || 3000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE,
  nodeEnv: process.env.NODE_ENV,
  rateLimit: parseInt(process.env.API_RATE_LIMIT) || 100,
  rateLimitWindow: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 900000,
  connectDB,
  getDB
};