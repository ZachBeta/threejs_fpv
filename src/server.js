import express from 'express';
import cors from 'cors';
import { saveLogs, getLogs, getStepStats, getControlRanges, saveGameState, getLatestGameStates, clearAllLogs, clearAllData, initializeDatabase } from './db.js';
import { logRequest, logResponse, logError } from './utils/logger.js';

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

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Clear all logs after server starts
  clearAllData();
  console.log('Cleared all previous logs and data');
}); 