import express from 'express';
import cors from 'cors';
import { saveLogs, getLogs, getStepStats, getControlRanges } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 