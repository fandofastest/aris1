import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../lib/mongo.js';

export async function listCategories() {
  const db = await getDb();
  const items = await db.collection('categories').find({}).sort({ name: 1 }).toArray();
  return items;
}

export async function getCategory(id){
  const db = await getDb();
  const cat = await db.collection('categories').findOne({ id });
  return cat || null;
}

export async function createCategory({ name }){
  if(!name) throw new Error('name required');
  const db = await getDb();
  const now = new Date().toISOString();
  const cat = { id: uuidv4(), name, createdAt: now, updatedAt: now };
  await db.collection('categories').insertOne(cat);
  return cat;
}

export async function updateCategory(id, patch){
  const db = await getDb();
  const res = await db.collection('categories').findOneAndUpdate(
    { id },
    { $set: { ...patch, updatedAt: new Date().toISOString() } },
    { returnDocument: 'after' }
  );
  return res.value || null;
}

export async function removeCategory(id){
  const db = await getDb();
  // remove category
  await db.collection('categories').deleteOne({ id });
  // clear category on songs referencing it
  await db.collection('songs').updateMany(
    { categoryId: id },
    { $set: { categoryId: null, updatedAt: new Date().toISOString() } }
  );
  return true;
}
