import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { readDB, writeDB } from '../filedb.js';

const router = Router();

// Export full DB (protected)
router.get('/export', authMiddleware, (req, res) => {
  const data = readDB();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="db-export.json"');
  res.status(200).send(JSON.stringify(data, null, 2));
});

// Import full DB (protected) - replaces current data
router.post('/import', authMiddleware, (req, res) => {
  const payload = (req.body && req.body.data) ? req.body.data : req.body;
  if(!payload || typeof payload !== 'object'){
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const data = {
    songs: Array.isArray(payload.songs) ? payload.songs : [],
    categories: Array.isArray(payload.categories) ? payload.categories : [],
    playlists: Array.isArray(payload.playlists) ? payload.playlists : [],
  };
  writeDB(data);
  res.json({ ok: true, counts: { songs: data.songs.length, categories: data.categories.length, playlists: data.playlists.length } });
});

export default router;
