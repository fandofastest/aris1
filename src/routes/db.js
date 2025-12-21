import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDb } from '../lib/mongo.js';

const router = Router();

// Export full DB (protected)
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const db = await getDb();
    const [songs, categories, playlists] = await Promise.all([
      db.collection('songs').find({}).toArray(),
      db.collection('categories').find({}).toArray(),
      db.collection('playlists').find({}).toArray(),
    ]);
    const data = { songs, categories, playlists };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="db-export.json"');
    res.status(200).send(JSON.stringify(data, null, 2));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Import full DB (protected) - replaces current data
router.post('/import', authMiddleware, async (req, res) => {
  try {
    const payload = (req.body && req.body.data) ? req.body.data : req.body;
    if(!payload || typeof payload !== 'object'){
      return res.status(400).json({ error: 'Invalid payload' });
    }
    const data = {
      songs: Array.isArray(payload.songs) ? payload.songs : [],
      categories: Array.isArray(payload.categories) ? payload.categories : [],
      playlists: Array.isArray(payload.playlists) ? payload.playlists : [],
    };
    const db = await getDb();
    // Replace collections entirely
    await Promise.all([
      db.collection('songs').deleteMany({}),
      db.collection('categories').deleteMany({}),
      db.collection('playlists').deleteMany({}),
    ]);
    const results = await Promise.all([
      data.songs.length ? db.collection('songs').insertMany(data.songs) : Promise.resolve({ insertedCount: 0 }),
      data.categories.length ? db.collection('categories').insertMany(data.categories) : Promise.resolve({ insertedCount: 0 }),
      data.playlists.length ? db.collection('playlists').insertMany(data.playlists) : Promise.resolve({ insertedCount: 0 }),
    ]);
    res.json({ ok: true, counts: { songs: data.songs.length, categories: data.categories.length, playlists: data.playlists.length } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
