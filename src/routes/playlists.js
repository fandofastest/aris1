import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listPlaylists, getPlaylist, createPlaylist, updatePlaylist, removePlaylist, addItem, removeItem } from '../models/playlists.js';

const router = Router();

// Public
router.get('/', (req, res) => {
  res.json({ items: listPlaylists() });
});

router.get('/:id', (req, res) => {
  const pl = getPlaylist(req.params.id);
  if(!pl) return res.status(404).json({ error: 'Playlist not found' });
  res.json(pl);
});

// Admin protected
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, description = '' } = req.body || {};
    const pl = createPlaylist({ name, description });
    res.status(201).json(pl);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch('/:id', authMiddleware, (req, res) => {
  const updated = updatePlaylist(req.params.id, { name: req.body?.name, description: req.body?.description });
  if(!updated) return res.status(404).json({ error: 'Playlist not found' });
  res.json(updated);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const ok = removePlaylist(req.params.id);
  if(!ok) return res.status(404).json({ error: 'Playlist not found' });
  res.status(204).send();
});

router.post('/:id/items', authMiddleware, (req, res) => {
  const { songId } = req.body || {};
  if(!songId) return res.status(400).json({ error: 'songId required' });
  const updated = addItem(req.params.id, songId);
  if(!updated) return res.status(404).json({ error: 'Playlist not found' });
  res.json(updated);
});

router.delete('/:id/items/:songId', authMiddleware, (req, res) => {
  const updated = removeItem(req.params.id, req.params.songId);
  if(!updated) return res.status(404).json({ error: 'Playlist not found' });
  res.json(updated);
});

export default router;
