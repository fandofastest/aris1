import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.warn('[mongo] MONGODB_URI is not set. Set it in your environment.');
}

let client;
let clientPromise;

export async function getMongoClient() {
  if (!clientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      appName: 'aris1-api',
    });
    clientPromise = client.connect().then(async (c) => {
      const db = c.db(process.env.MONGODB_DB || 'newkasir');
      // Ensure indexes
      await Promise.all([
        db.collection('songs').createIndex({ createdAt: -1 }),
        db.collection('songs').createIndex({ title: 1 }),
        db.collection('categories').createIndex({ name: 1 }),
        db.collection('playlists').createIndex({ name: 1 }),
      ]).catch(() => {});
      return c;
    });
  }
  return clientPromise;
}

export async function getDb() {
  const c = await getMongoClient();
  return c.db(process.env.MONGODB_DB || 'newkasir');
}
