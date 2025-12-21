import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../lib/mongo.js';

export async function getAllSongs() {
  const db = await getDb();
  const items = await db
    .collection('songs')
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  return items;
}

export async function getSongById(id) {
  const db = await getDb();
  const song = await db.collection('songs').findOne({ id });
  return song || null;
}

export async function addSong({ url, title, durationSeconds = null, thumbnail = null, source = 'youtube', categoryId = null }) {
  const db = await getDb();
  const now = new Date().toISOString();
  const song = { id: uuidv4(), url, title, durationSeconds, thumbnail, source, categoryId, createdAt: now, updatedAt: now };
  await db.collection('songs').insertOne(song);
  return song;
}

export async function updateSong(id, patch) {
  const db = await getDb();
  const update = { ...patch, updatedAt: new Date().toISOString() };
  const res = await db.collection('songs').findOneAndUpdate(
    { id },
    { $set: update },
    { returnDocument: 'after' }
  );
  return res.value || null;
}

export async function removeSong(id) {
  const db = await getDb();
  const res = await db.collection('songs').deleteOne({ id });
  return res.deletedCount > 0;
}
