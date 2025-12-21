import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getAllSongs, getSongById, addSong, updateSong, removeSong } from '../models/songs.js';
import { extractYouTubeId, fetchYouTubeOEmbed, buildYouTubeThumbnail } from '../utils/youtube.js';

const router = Router();

// Public: list and get
router.get('/', async (req, res) => {
  try {
    const items = await getAllSongs();
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Public: search by query string in title or url
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if(!q) return res.status(400).json({ error: 'q is required' });
    const needle = q.toLowerCase();
    const all = await getAllSongs();
    const items = all.filter(s => {
      const title = (s.title || '').toLowerCase();
      const url = (s.url || '').toLowerCase();
      return title.includes(needle) || url.includes(needle);
    });
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const song = await getSongById(req.params.id);
    if (!song) return res.status(404).json({ error: 'Song not found' });
    res.json(song);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Protected: create/update/delete
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { url, title, durationSeconds = null, thumbnail = null, source = 'manual', categoryId = null } = req.body || {};
    if (!url || !title) return res.status(400).json({ error: 'url and title are required' });
    const song = await addSong({ url, title, durationSeconds, thumbnail, source, categoryId });
    res.status(201).json(song);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const allowed = ['url', 'title', 'durationSeconds', 'thumbnail', 'source', 'categoryId'];
    const patch = {};
    for (const k of allowed) if (k in req.body) patch[k] = req.body[k];
    const updated = await updateSong(req.params.id, patch);
    if (!updated) return res.status(404).json({ error: 'Song not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const ok = await removeSong(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Song not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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

    const song = await addSong({
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
