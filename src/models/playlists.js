import { v4 as uuidv4 } from 'uuid';
import { readDB, writeDB } from '../filedb.js';

export function listPlaylists(){
  const db = readDB();
  return [...db.playlists].sort((a,b)=> (a.name||'').localeCompare(b.name||''));
}

export function getPlaylist(id){
  const db = readDB();
  return db.playlists.find(p=>p.id===id) || null;
}

export function createPlaylist({ name, description = '' }){
  if(!name) throw new Error('name required');
  const db = readDB();
  const now = new Date().toISOString();
  const pl = { id: uuidv4(), name, description, items: [], createdAt: now, updatedAt: now };
  db.playlists.push(pl);
  writeDB(db);
  return pl;
}

export function updatePlaylist(id, patch){
  const db = readDB();
  const idx = db.playlists.findIndex(p=>p.id===id);
  if(idx===-1) return null;
  db.playlists[idx] = { ...db.playlists[idx], ...patch, updatedAt: new Date().toISOString() };
  writeDB(db);
  return db.playlists[idx];
}

export function removePlaylist(id){
  const db = readDB();
  db.playlists = db.playlists.filter(p=>p.id!==id);
  writeDB(db);
  return true;
}

export function addItem(playlistId, songId){
  const db = readDB();
  const idx = db.playlists.findIndex(p=>p.id===playlistId);
  if(idx===-1) return null;
  const items = new Set(db.playlists[idx].items || []);
  items.add(songId);
  db.playlists[idx].items = Array.from(items);
  db.playlists[idx].updatedAt = new Date().toISOString();
  writeDB(db);
  return db.playlists[idx];
}

export function removeItem(playlistId, songId){
  const db = readDB();
  const idx = db.playlists.findIndex(p=>p.id===playlistId);
  if(idx===-1) return null;
  db.playlists[idx].items = (db.playlists[idx].items || []).filter(id=>id!==songId);
  db.playlists[idx].updatedAt = new Date().toISOString();
  writeDB(db);
  return db.playlists[idx];
}
