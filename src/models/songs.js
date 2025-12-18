import { v4 as uuidv4 } from 'uuid';
import { readDB, writeDB } from '../filedb.js';

export function getAllSongs() {
  const db = readDB();
  return [...db.songs].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export function getSongById(id) {
  const db = readDB();
  return db.songs.find(s => s.id === id) || null;
}

export function addSong({ url, title, durationSeconds = null, thumbnail = null, source = 'youtube', categoryId = null }) {
  const db = readDB();
  const now = new Date().toISOString();
  const song = { id: uuidv4(), url, title, durationSeconds, thumbnail, source, categoryId, createdAt: now, updatedAt: now };
  db.songs.push(song);
  writeDB(db);
  return song;
}

export function updateSong(id, patch) {
  const db = readDB();
  const idx = db.songs.findIndex(s => s.id === id);
  if (idx === -1) return null;
  db.songs[idx] = { ...db.songs[idx], ...patch, updatedAt: new Date().toISOString() };
  writeDB(db);
  return db.songs[idx];
}

export function removeSong(id) {
  const db = readDB();
  const before = db.songs.length;
  db.songs = db.songs.filter(s => s.id !== id);
  writeDB(db);
  return db.songs.length < before;
}
