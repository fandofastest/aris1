import { v4 as uuidv4 } from 'uuid';
import { readDB, writeDB } from '../filedb.js';

export function listCategories() {
  const db = readDB();
  return [...db.categories].sort((a,b)=> (a.name||'').localeCompare(b.name||''));
}

export function getCategory(id){
  const db = readDB();
  return db.categories.find(c=>c.id===id) || null;
}

export function createCategory({ name }){
  if(!name) throw new Error('name required');
  const db = readDB();
  const now = new Date().toISOString();
  const cat = { id: uuidv4(), name, createdAt: now, updatedAt: now };
  db.categories.push(cat);
  writeDB(db);
  return cat;
}

export function updateCategory(id, patch){
  const db = readDB();
  const idx = db.categories.findIndex(c=>c.id===id);
  if(idx===-1) return null;
  db.categories[idx] = { ...db.categories[idx], ...patch, updatedAt: new Date().toISOString() };
  writeDB(db);
  return db.categories[idx];
}

export function removeCategory(id){
  const db = readDB();
  db.categories = db.categories.filter(c=>c.id!==id);
  // Also clear on songs that reference this category
  if(Array.isArray(db.songs)){
    db.songs = db.songs.map(s => s.categoryId===id ? { ...s, categoryId: null, updatedAt: new Date().toISOString() } : s);
  }
  writeDB(db);
  return true;
}
