import { MongoClient } from 'mongodb';

let client;

export async function getDb() {
  if (!process.env.MONGODB_URI) return null;
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }
  return client.db('uwugaming');
}
