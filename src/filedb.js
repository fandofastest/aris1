import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'local.db');

function ensureFile() {
  if (!fs.existsSync(dbPath)) {
    const initial = { songs: [], categories: [], playlists: [] };
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
  }
}

export function readDB() {
  ensureFile();
  const raw = fs.readFileSync(dbPath, 'utf-8');
  try {
    const json = JSON.parse(raw);
    if (typeof json !== 'object' || !json) return { songs: [], categories: [], playlists: [] };
    if (!Array.isArray(json.songs)) json.songs = [];
    if (!Array.isArray(json.categories)) json.categories = [];
    if (!Array.isArray(json.playlists)) json.playlists = [];
    return json;
  } catch (_) {
    return { songs: [], categories: [], playlists: [] };
  }
}

export function writeDB(db) {
  const data = {
    songs: Array.isArray(db.songs) ? db.songs : [],
    categories: Array.isArray(db.categories) ? db.categories : [],
    playlists: Array.isArray(db.playlists) ? db.playlists : [],
  };
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}
