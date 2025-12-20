import 'dotenv/config';
import { config } from './config.js';
import app from './app.js';

const server = app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
