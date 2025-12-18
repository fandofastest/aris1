import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listCategories, getCategory, createCategory, updateCategory, removeCategory } from '../models/categories.js';

const router = Router();

// Public
router.get('/', (req, res) => {
  res.json({ items: listCategories() });
});

router.get('/:id', (req, res) => {
  const cat = getCategory(req.params.id);
  if(!cat) return res.status(404).json({ error: 'Category not found' });
  res.json(cat);
});

// Admin protected
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name } = req.body || {};
    const cat = createCategory({ name });
    res.status(201).json(cat);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch('/:id', authMiddleware, (req, res) => {
  const updated = updateCategory(req.params.id, { name: req.body?.name });
  if(!updated) return res.status(404).json({ error: 'Category not found' });
  res.json(updated);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const ok = removeCategory(req.params.id);
  if(!ok) return res.status(404).json({ error: 'Category not found' });
  res.status(204).send();
});

export default router;
