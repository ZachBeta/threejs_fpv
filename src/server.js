import express from 'express';
import cors from 'cors';
import { saveLogs, getLogs, getStepStats, getControlRanges, saveGameState, getLatestGameStates, clearAllLogs, clearAllData, initializeDatabase, getDatabase } from './db.js';
import { logRequest, logResponse, logError } from './utils/logger.js';
import net from 'net';
import { exec } from 'child_process';
import { promisify } from 'util';

// Convert exec to promise-based
const execAsync = promisify(exec);

// Port for the server
const PORT = 3001;

// Check if port is in use and kill the process if needed
async function ensurePortAvailable(port) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer()
      .once('error', async (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${port} is already in use. Attempting to kill the process...`);
          try {
            // Find and kill the process using the port (works on macOS/Linux)
            const { stdout } = await execAsync(`lsof -i :${port} -t`);
            if (stdout.trim()) {
              const pid = stdout.trim();
              console.log(`Killing process ${pid} that's using port ${port}`);
              await execAsync(`kill -9 ${pid}`);
              console.log(`Process ${pid} killed. Waiting for port to be released...`);
              // Wait a bit for the port to be released
              setTimeout(() => resolve(), 1000);
            }
          } catch (error) {
            console.warn(`Could not kill process using port ${port}: ${error.message}`);
            reject(new Error(`Port ${port} is in use and could not be released`));
          }
        } else {
          reject(err);
        }
      })
      .once('listening', () => {
        tester.close();
        resolve();
      })
      .listen(port);
  });
}

// Initialize database before setting up the server
initializeDatabase();

const app = express();
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    // Log the request
    logRequest(req);

    // Log the response when it's sent
    const originalSend = res.send;
    res.send = function(data) {
        logResponse(req, res);
        return originalSend.apply(res, arguments);
    };

    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    logError(err);
    res.status(500).json({ success: false, error: err.message });
});

// Test endpoint to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Save logs to database
app.post('/api/save-logs', (req, res) => {
  try {
    const result = saveLogs(req.body);
    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error saving logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get logs with optional filtering
app.get('/api/logs', (req, res) => {
  try {
    const options = {
      startTime: req.query.startTime ? parseInt(req.query.startTime) : undefined,
      endTime: req.query.endTime ? parseInt(req.query.endTime) : undefined,
      stepName: req.query.step,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined
    };
    const logs = getLogs(options);
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get statistics for each step
app.get('/api/stats', (req, res) => {
  try {
    const stats = getStepStats();
    const controlRanges = getControlRanges();
    res.json({ 
      success: true, 
      stats,
      controlRanges
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save real-time game state
app.post('/api/game-state', (req, res) => {
  try {
    const result = saveGameState(req.body);
    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error saving game state:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get latest game states
app.get('/api/game-states', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) || 100 : 100;
    const states = getLatestGameStates(limit);
    res.json({ success: true, states });
  } catch (error) {
    console.error('Error getting game states:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear all logs
app.post('/api/clear-logs', (req, res) => {
  try {
    const result = clearAllData();
    res.json(result);
  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server after ensuring the port is available
async function startServer() {
  try {
    await ensurePortAvailable(PORT);
    
    // Store server reference for graceful shutdown
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      // Clear all logs after server starts
      clearAllData();
      console.log('Cleared all previous logs and data');
    });
    
    // Graceful shutdown handling
    function gracefulShutdown() {
      console.log('Shutting down server gracefully...');
      server.close(() => {
        console.log('Server closed');
        // Close the database connection if needed
        try {
          const db = getDatabase();
          if (db && typeof db.close === 'function') {
            db.close();
            console.log('Database connection closed');
          }
        } catch (err) {
          console.error('Error closing database:', err);
        }
        process.exit(0);
      });
      
      // Force close if it takes too long
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    }
    
    // Listen for termination signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Start the server
startServer(); 