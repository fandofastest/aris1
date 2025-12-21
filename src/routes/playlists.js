import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listPlaylists, getPlaylist, createPlaylist, updatePlaylist, removePlaylist, addItem, removeItem } from '../models/playlists.js';

const router = Router();

// Public
router.get('/', async (req, res) => {
  try {
    const items = await listPlaylists();
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pl = await getPlaylist(req.params.id);
    if(!pl) return res.status(404).json({ error: 'Playlist not found' });
    res.json(pl);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin protected
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description = '' } = req.body || {};
    const pl = await createPlaylist({ name, description });
    res.status(201).json(pl);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await updatePlaylist(req.params.id, { name: req.body?.name, description: req.body?.description });
    if(!updated) return res.status(404).json({ error: 'Playlist not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const ok = await removePlaylist(req.params.id);
    if(!ok) return res.status(404).json({ error: 'Playlist not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/:id/items', authMiddleware, async (req, res) => {
  try {
    const { songId } = req.body || {};
    if(!songId) return res.status(400).json({ error: 'songId required' });
    const updated = await addItem(req.params.id, songId);
    if(!updated) return res.status(404).json({ error: 'Playlist not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id/items/:songId', authMiddleware, async (req, res) => {
  try {
    const updated = await removeItem(req.params.id, req.params.songId);
    if(!updated) return res.status(404).json({ error: 'Playlist not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
