import { Router } from 'express';
import { config } from '../config.js';
import { authMiddleware, generateToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === config.admin.username && password === config.admin.password) {
    const token = generateToken({ sub: username, role: 'admin' });
    return res.json({ token, token_type: 'Bearer', expires_in: config.jwt.expiresIn });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

export default router;
