import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../lib/mongo.js';

export async function listPlaylists(){
  const db = await getDb();
  const items = await db.collection('playlists').find({}).sort({ name: 1 }).toArray();
  return items;
}

export async function getPlaylist(id){
  const db = await getDb();
  const pl = await db.collection('playlists').findOne({ id });
  return pl || null;
}

export async function createPlaylist({ name, description = '' }){
  if(!name) throw new Error('name required');
  const db = await getDb();
  const now = new Date().toISOString();
  const pl = { id: uuidv4(), name, description, items: [], createdAt: now, updatedAt: now };
  await db.collection('playlists').insertOne(pl);
  return pl;
}

export async function updatePlaylist(id, patch){
  const db = await getDb();
  const res = await db.collection('playlists').findOneAndUpdate(
    { id },
    { $set: { ...patch, updatedAt: new Date().toISOString() } },
    { returnDocument: 'after' }
  );
  return res.value || null;
}

export async function removePlaylist(id){
  const db = await getDb();
  await db.collection('playlists').deleteOne({ id });
  return true;
}

export async function addItem(playlistId, songId){
  const db = await getDb();
  const res = await db.collection('playlists').findOneAndUpdate(
    { id: playlistId },
    { $addToSet: { items: songId }, $set: { updatedAt: new Date().toISOString() } },
    { returnDocument: 'after' }
  );
  return res.value || null;
}

export async function removeItem(playlistId, songId){
  const db = await getDb();
  const res = await db.collection('playlists').findOneAndUpdate(
    { id: playlistId },
    { $pull: { items: songId }, $set: { updatedAt: new Date().toISOString() } },
    { returnDocument: 'after' }
  );
  return res.value || null;
}
