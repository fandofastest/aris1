import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { authMiddleware } from './middleware/auth.js';
import authRouter from './routes/auth.js';
import songsRouter from './routes/songs.js';
import categoriesRouter from './routes/categories.js';
import playlistsRouter from './routes/playlists.js';

const app = express();

app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https:"],
      "connect-src": ["'self'", "https:"],
    },
  },
}));
app.use(express.json());
app.use(morgan('dev'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin', 'index.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin', 'dashboard.html'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', env: config.nodeEnv });
});

app.use('/api/auth', authRouter);
app.use('/api/songs', songsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/playlists', playlistsRouter);

app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'protected content', user: req.user });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const server = app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
