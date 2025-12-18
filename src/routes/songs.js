import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAllSongs, getSongById, addSong, updateSong, removeSong } from '../models/songs.js';
import { extractYouTubeId, fetchYouTubeOEmbed, buildYouTubeThumbnail } from '../utils/youtube.js';

const router = Router();

// Public: list and get
router.get('/', (req, res) => {
  res.json({ items: getAllSongs() });
});

router.get('/:id', (req, res) => {
  const song = getSongById(req.params.id);
  if (!song) return res.status(404).json({ error: 'Song not found' });
  res.json(song);
});

// Protected: create/update/delete
router.post('/', authMiddleware, (req, res) => {
  const { url, title, durationSeconds = null, thumbnail = null, source = 'manual', categoryId = null } = req.body || {};
  if (!url || !title) return res.status(400).json({ error: 'url and title are required' });
  const song = addSong({ url, title, durationSeconds, thumbnail, source, categoryId });
  res.status(201).json(song);
});

router.patch('/:id', authMiddleware, (req, res) => {
  const allowed = ['url', 'title', 'durationSeconds', 'thumbnail', 'source', 'categoryId'];
  const patch = {};
  for (const k of allowed) if (k in req.body) patch[k] = req.body[k];
  const updated = updateSong(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: 'Song not found' });
  res.json(updated);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const ok = removeSong(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Song not found' });
  res.status(204).send();
});

// Protected: import from YouTube
router.post('/import', authMiddleware, async (req, res) => {
  try {
    const { youtubeUrl } = req.body || {};
    if (!youtubeUrl) return res.status(400).json({ error: 'youtubeUrl is required' });

    const videoId = extractYouTubeId(youtubeUrl);
    const meta = await fetchYouTubeOEmbed(youtubeUrl);

    const thumbnail = meta.thumbnail || buildYouTubeThumbnail(videoId);
    const title = meta.title || 'Untitled';

    const song = addSong({
      url: youtubeUrl,
      title,
      durationSeconds: null, // Durasi tidak tersedia dari oEmbed tanpa API YouTube Data
      thumbnail,
      source: 'youtube'
    });
    res.status(201).json(song);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
