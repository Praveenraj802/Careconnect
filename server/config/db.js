const mongoose = require('mongoose');

let mongodInstance = null;

// Allow ample time for first-time binary launch on Windows
process.env.MONGOMS_LAUNCH_TIMEOUT = '120000';
process.env.MONGOMS_SPAWN_TIMEOUT = '120000';
process.env.MONGOMS_DOWNLOAD_TIMEOUT = '120000';

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  // Try standard connection first if provided
  if (mongoUri) {
    try {
      console.log(`[DB] Attempting connection to MongoDB at: ${mongoUri.replace(/:([^:@]{3,})@/, ':****@')}`);
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 2500, // Quick fail if local daemon is not running
      });
      console.log(`[DB] MongoDB Connected to external/local instance: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`[DB] Could not connect to primary MONGO_URI (${err.message}).`);
      console.log('[DB] Initializing integrated embedded MongoDB runner for seamless execution...');
    }
  }

  // Fallback to in-memory MongoDB runner
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create({
      instance: {
        dbName: 'careconnect',
        launchTimeout: 120000,
      },
    });
    const memoryUri = mongodInstance.getUri();
    console.log(`[DB] In-Memory MongoDB Server started at: ${memoryUri}`);

    const conn = await mongoose.connect(memoryUri);
    console.log(`[DB] MongoDB Connected to integrated embedded instance: ${conn.connection.host}`);
    return conn;
  } catch (memoryErr) {
    console.error(`[DB] Failed to initialize embedded MongoDB: ${memoryErr.message}`);
    process.exit(1);
  }
};

const closeDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

module.exports = { connectDB, closeDB };
