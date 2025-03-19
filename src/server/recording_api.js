/**
 * Recording API Server
 * 
 * Handles recording storage, retrieval, and analysis
 * Uses SQLite database to store recordings
 */

import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { analyzeBackflip } from '../utils/backflip_analyzer.js';

// Get dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
const dbPromise = open({
  filename: path.join(__dirname, '../../data/recordings.db'),
  driver: sqlite3.Database
});

// Setup database tables
async function initDatabase() {
  const db = await dbPromise;
  
  // Create recordings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY,
      maneuver_type TEXT NOT NULL,
      drone_type TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      frame_count INTEGER DEFAULT 0,
      success BOOLEAN,
      completion_percentage INTEGER,
      analysis_data TEXT
    )
  `);
  
  // Create frames table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS frames (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recording_id TEXT NOT NULL,
      frame_index INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      frame_data TEXT NOT NULL,
      FOREIGN KEY (recording_id) REFERENCES recordings (id)
    )
  `);
  
  console.log('Database initialized');
}

// Setup API routes
export function setupRecordingApi(app) {
  // Initialize database
  initDatabase().catch(err => {
    console.error('Database initialization failed:', err);
  });
  
  // Get all recordings
  app.get('/api/recordings', async (req, res) => {
    try {
      const db = await dbPromise;
      const recordings = await db.all(`
        SELECT id, maneuver_type, drone_type, start_time, end_time, 
               frame_count, success, completion_percentage
        FROM recordings
        ORDER BY start_time DESC
      `);
      
      res.json(recordings);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      res.status(500).json({ error: 'Failed to fetch recordings' });
    }
  });
  
  // Get a specific recording
  app.get('/api/recordings/:id', async (req, res) => {
    try {
      const db = await dbPromise;
      const recording = await db.get(`
        SELECT * FROM recordings WHERE id = ?
      `, [req.params.id]);
      
      if (!recording) {
        return res.status(404).json({ error: 'Recording not found' });
      }
      
      // Get all frames for this recording
      const frames = await db.all(`
        SELECT frame_index, timestamp, frame_data
        FROM frames
        WHERE recording_id = ?
        ORDER BY frame_index
      `, [req.params.id]);
      
      // Parse frame data from JSON strings
      const parsedFrames = frames.map(frame => ({
        ...frame,
        frame_data: JSON.parse(frame.frame_data)
      }));
      
      res.json({
        ...recording,
        frames: parsedFrames,
        analysis_data: recording.analysis_data ? JSON.parse(recording.analysis_data) : null
      });
    } catch (error) {
      console.error(`Error fetching recording ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch recording' });
    }
  });
  
  // Start a new recording
  app.post('/api/recordings/start', async (req, res) => {
    try {
      const db = await dbPromise;
      const { maneuverType, droneType } = req.body;
      
      const recordingId = uuidv4();
      const startTime = Date.now();
      
      await db.run(`
        INSERT INTO recordings (
          id, maneuver_type, drone_type, start_time
        ) VALUES (?, ?, ?, ?)
      `, [recordingId, maneuverType || 'backflip', droneType || 'standard', startTime]);
      
      res.json({
        recordingId,
        startTime,
        maneuverType,
        droneType
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      res.status(500).json({ error: 'Failed to start recording' });
    }
  });
  
  // Add frame to recording
  app.post('/api/recordings/:id/frames', async (req, res) => {
    try {
      const db = await dbPromise;
      const recordingId = req.params.id;
      
      // Check if recording exists
      const recording = await db.get('SELECT * FROM recordings WHERE id = ?', [recordingId]);
      if (!recording) {
        return res.status(404).json({ error: 'Recording not found' });
      }
      
      // Get current frame count
      const { frame_count } = await db.get('SELECT frame_count FROM recordings WHERE id = ?', [recordingId]);
      const frameIndex = frame_count;
      
      // Store frame data
      await db.run(`
        INSERT INTO frames (
          recording_id, frame_index, timestamp, frame_data
        ) VALUES (?, ?, ?, ?)
      `, [
        recordingId,
        frameIndex,
        req.body.timestamp || Date.now(),
        JSON.stringify(req.body)
      ]);
      
      // Update frame count
      await db.run(`
        UPDATE recordings SET frame_count = frame_count + 1 WHERE id = ?
      `, [recordingId]);
      
      res.json({ success: true, frameIndex });
    } catch (error) {
      console.error(`Error adding frame to recording ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to add frame' });
    }
  });
  
  // Stop recording and analyze results
  app.post('/api/recordings/:id/stop', async (req, res) => {
    try {
      const db = await dbPromise;
      const recordingId = req.params.id;
      
      // Get all frames for this recording
      const frames = await db.all(`
        SELECT frame_index, timestamp, frame_data
        FROM frames
        WHERE recording_id = ?
        ORDER BY frame_index
      `, [recordingId]);
      
      if (frames.length === 0) {
        return res.status(400).json({ error: 'Recording has no frames' });
      }
      
      // Parse frame data
      const parsedFrames = frames.map(frame => ({
        frameIndex: frame.frame_index,
        timestamp: frame.timestamp,
        ...JSON.parse(frame.frame_data)
      }));
      
      // Analyze the backflip
      const analysis = analyzeBackflip(parsedFrames);
      
      // Update recording with analysis results
      await db.run(`
        UPDATE recordings SET 
          end_time = ?,
          success = ?,
          completion_percentage = ?,
          analysis_data = ?
        WHERE id = ?
      `, [
        Date.now(),
        analysis.success ? 1 : 0,
        analysis.completionPercentage,
        JSON.stringify(analysis),
        recordingId
      ]);
      
      res.json({
        recordingId,
        frameCount: frames.length,
        analysis
      });
    } catch (error) {
      console.error(`Error stopping recording ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to stop recording' });
    }
  });
  
  // Delete a recording
  app.delete('/api/recordings/:id', async (req, res) => {
    try {
      const db = await dbPromise;
      const recordingId = req.params.id;
      
      // Delete frames first (due to foreign key constraint)
      await db.run('DELETE FROM frames WHERE recording_id = ?', [recordingId]);
      
      // Delete the recording
      const result = await db.run('DELETE FROM recordings WHERE id = ?', [recordingId]);
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Recording not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error(`Error deleting recording ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete recording' });
    }
  });
  
  // Re-analyze a recording
  app.post('/api/recordings/:id/analyze', async (req, res) => {
    try {
      const db = await dbPromise;
      const recordingId = req.params.id;
      
      // Get all frames for this recording
      const frames = await db.all(`
        SELECT frame_index, timestamp, frame_data
        FROM frames
        WHERE recording_id = ?
        ORDER BY frame_index
      `, [recordingId]);
      
      if (frames.length === 0) {
        return res.status(400).json({ error: 'Recording has no frames' });
      }
      
      // Parse frame data
      const parsedFrames = frames.map(frame => ({
        frameIndex: frame.frame_index,
        timestamp: frame.timestamp,
        ...JSON.parse(frame.frame_data)
      }));
      
      // Analyze the backflip
      const analysis = analyzeBackflip(parsedFrames);
      
      // Update recording with analysis results
      await db.run(`
        UPDATE recordings SET 
          success = ?,
          completion_percentage = ?,
          analysis_data = ?
        WHERE id = ?
      `, [
        analysis.success ? 1 : 0,
        analysis.completionPercentage,
        JSON.stringify(analysis),
        recordingId
      ]);
      
      res.json({
        recordingId,
        frameCount: frames.length,
        analysis
      });
    } catch (error) {
      console.error(`Error analyzing recording ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to analyze recording' });
    }
  });
  
  // Get a list of problematic recordings
  app.get('/api/recordings/problematic', async (req, res) => {
    try {
      const db = await dbPromise;
      const recordings = await db.all(`
        SELECT id, maneuver_type, drone_type, start_time, end_time, 
               frame_count, success, completion_percentage
        FROM recordings
        WHERE success = 0
        ORDER BY start_time DESC
      `);
      
      res.json(recordings);
    } catch (error) {
      console.error('Error fetching problematic recordings:', error);
      res.status(500).json({ error: 'Failed to fetch recordings' });
    }
  });
  
  console.log('Recording API routes registered');
} 