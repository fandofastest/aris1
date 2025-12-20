import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine DB directory and file
const isVercel = !!process.env.VERCEL;
const dbDir = process.env.DB_DIR || (isVercel ? '/tmp' : path.join(__dirname, '..'));
const dbFile = process.env.DB_FILE || 'local.db';
const dbPath = path.join(dbDir, dbFile);

function ensureFile() {
  try{
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    if (!fs.existsSync(dbPath)) {
      const initial = { songs: [], categories: [], playlists: [] };
      fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
    }
  } catch(_){ /* ignore to allow readDB to fallback */ }
}

export function readDB() {
  ensureFile();
  try{
    const raw = fs.readFileSync(dbPath, 'utf-8');
    const json = JSON.parse(raw);
    if (typeof json !== 'object' || !json) return { songs: [], categories: [], playlists: [] };
    if (!Array.isArray(json.songs)) json.songs = [];
    if (!Array.isArray(json.categories)) json.categories = [];
    if (!Array.isArray(json.playlists)) json.playlists = [];
    return json;
  } catch (_){
    return { songs: [], categories: [], playlists: [] };
  }
}

export function writeDB(db) {
  const data = {
    songs: Array.isArray(db.songs) ? db.songs : [],
    categories: Array.isArray(db.categories) ? db.categories : [],
    playlists: Array.isArray(db.playlists) ? db.playlists : [],
  };
  ensureFile();
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}
