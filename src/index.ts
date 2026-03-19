import { createApp } from './app.js';
import { env } from './config/env.js';
import { closePool } from './config/database.js';
import { initScheduler, stopScheduler } from './jobs/scheduler.js';

const app = createApp();

const server = app.listen(parseInt(env.PORT), () => {
  console.log(`Server running on port ${env.PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);

  // Initialize the price check scheduler
  initScheduler();
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  stopScheduler();
  server.close(async () => {
    await closePool();
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  stopScheduler();
  server.close(async () => {
    await closePool();
    console.log('Server closed');
    process.exit(0);
  });
});
