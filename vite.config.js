import { defineConfig } from 'vite';
import express from 'express';
import cors from 'cors';
import { logRequest, logResponse, logError } from './src/utils/logger.js';

// Import database functions with try/catch to handle errors gracefully
let db = null;
try {
  db = await import('./src/db.js');
  if (db.initializeDatabase) {
    console.log('Initializing database...');
    db.initializeDatabase();
  }
} catch (error) {
  console.error('Error initializing database:', error);
}

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@': '/src',
      '@demos': '/demos'
    }
  },
  server: {
    port: 5173,
    proxy: {
      // No need for proxy anymore, API endpoints will be served by Vite
    }
  },
  plugins: [
    {
      name: 'api-server',
      configureServer(server) {
        if (!db) {
          console.warn('Database not initialized. API will not be fully functional.');
          return;
        }
        
        // Setup Express middleware and routes
        const app = server.middlewares;
        
        app.use(cors());
        app.use(express.json());
        
        // Logging middleware
        app.use((req, res, next) => {
          // Only log API requests
          if (req.url.startsWith('/api')) {
            try {
              logRequest(req);
              const originalEnd = res.end;
              res.end = function(...args) {
                try {
                  logResponse(req, res);
                } catch (error) {
                  console.error('Error logging response:', error);
                }
                return originalEnd.apply(res, args);
              };
            } catch (error) {
              console.error('Error in logging middleware:', error);
            }
          }
          next();
        });
        
        // Error handling middleware
        app.use((err, req, res, next) => {
          if (req.url.startsWith('/api')) {
            try {
              logError(err);
            } catch (error) {
              console.error('Error logging error:', error);
            }
            res.statusCode = 500;
            res.end(JSON.stringify({ success: false, error: err.message }));
          } else {
            next(err);
          }
        });
        
        // API Routes
        
        // Test endpoint
        app.use('/api/test', (req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', message: 'Server is running' }));
        });
        
        // Save logs
        app.use('/api/save-logs', (req, res, next) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const result = db.saveLogs(JSON.parse(body));
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, count: result.count }));
              } catch (error) {
                console.error('Error saving logs:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: error.message }));
              }
            });
          } else {
            next();
          }
        });
        
        // Get logs
        app.use('/api/logs', (req, res, next) => {
          if (req.method === 'GET') {
            try {
              const urlParams = new URL(req.url, 'http://localhost').searchParams;
              const options = {
                startTime: urlParams.get('startTime') ? parseInt(urlParams.get('startTime')) : undefined,
                endTime: urlParams.get('endTime') ? parseInt(urlParams.get('endTime')) : undefined,
                stepName: urlParams.get('step'),
                limit: urlParams.get('limit') ? parseInt(urlParams.get('limit')) : undefined,
                offset: urlParams.get('offset') ? parseInt(urlParams.get('offset')) : undefined
              };
              const logs = db.getLogs(options);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, logs }));
            } catch (error) {
              console.error('Error getting logs:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
          } else {
            next();
          }
        });
        
        // Get stats
        app.use('/api/stats', (req, res, next) => {
          if (req.method === 'GET') {
            try {
              const stats = db.getStepStats();
              const controlRanges = db.getControlRanges();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ 
                success: true, 
                stats,
                controlRanges
              }));
            } catch (error) {
              console.error('Error getting stats:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
          } else {
            next();
          }
        });
        
        // Save game state
        app.use('/api/game-state', (req, res, next) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const result = db.saveGameState(JSON.parse(body));
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, count: result.count }));
              } catch (error) {
                console.error('Error saving game state:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ success: false, error: error.message }));
              }
            });
          } else {
            next();
          }
        });
        
        // Get game states
        app.use('/api/game-states', (req, res, next) => {
          if (req.method === 'GET') {
            try {
              const urlParams = new URL(req.url, 'http://localhost').searchParams;
              const limit = urlParams.get('limit') ? parseInt(urlParams.get('limit')) || 100 : 100;
              const states = db.getLatestGameStates(limit);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, states }));
            } catch (error) {
              console.error('Error getting game states:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
          } else {
            next();
          }
        });
        
        // Clear logs
        app.use('/api/clear-logs', (req, res, next) => {
          if (req.method === 'POST') {
            try {
              const result = db.clearAllData();
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (error) {
              console.error('Error clearing data:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: error.message }));
            }
          } else {
            next();
          }
        });
        
        // Clear DB on server start
        try {
          db.clearAllData();
          console.log('Cleared all previous logs and data');
        } catch (error) {
          console.error('Error clearing database on startup:', error);
        }
        
        // Graceful shutdown handler
        process.on('SIGINT', () => {
          console.log('Shutting down gracefully...');
          try {
            const database = db.getDatabase();
            if (database && typeof database.close === 'function') {
              database.close();
              console.log('Database connection closed');
            }
          } catch (err) {
            console.error('Error closing database:', err);
          }
          process.exit(0);
        });
      }
    }
  ]
}); 