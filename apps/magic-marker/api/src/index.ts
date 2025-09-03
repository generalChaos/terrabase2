import dotenv from 'dotenv';
import path from 'path';

// Load environment variables first, before any other imports
dotenv.config({ path: path.join(__dirname, '../.env') });

// Environment check (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Environment check:');
  console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
  console.log('OPENAI_API_KEY starts with sk-:', process.env.OPENAI_API_KEY?.startsWith('sk-') || false);
}

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import { testSupabaseConnection, initSupabaseTables } from './database/supabase';

async function startServer() {
  // Test Supabase connection
  const isConnected = await testSupabaseConnection();
  if (!isConnected) {
    console.error('❌ Failed to connect to Supabase. Exiting...');
    process.exit(1);
  }
  
  // Initialize Supabase tables
  await initSupabaseTables();

  const app = express();
  const PORT = process.env.PORT || 3003;

  // Middleware
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Note: Images are now served from frontend/public/uploads via Vite

  // Import routes after environment is loaded
  const { uploadRouter } = await import('./routes/upload');
  const { imagesRouter } = await import('./routes/images');

  // Routes
  app.use('/api/upload', uploadRouter);
  app.use('/api/images', imagesRouter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Error handling
  app.use(errorHandler);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}

startServer().catch(console.error);
