import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listCategories, getCategory, createCategory, updateCategory, removeCategory } from '../models/categories.js';

const router = Router();

// Public
router.get('/', async (req, res) => {
  try {
    const items = await listCategories();
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cat = await getCategory(req.params.id);
    if(!cat) return res.status(404).json({ error: 'Category not found' });
    res.json(cat);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin protected
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body || {};
    const cat = await createCategory({ name });
    res.status(201).json(cat);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await updateCategory(req.params.id, { name: req.body?.name });
    if(!updated) return res.status(404).json({ error: 'Category not found' });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const ok = await removeCategory(req.params.id);
    if(!ok) return res.status(404).json({ error: 'Category not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
