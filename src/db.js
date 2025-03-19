import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '..', 'logs.db'));

// Initialize database tables with improved schema
function initializeDatabase() {
  // Create tables one by one to ensure proper initialization
  db.exec('DROP TABLE IF EXISTS routine_logs');
  db.exec('DROP TABLE IF EXISTS game_states');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS event_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      event_name TEXT NOT NULL,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS state_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      state_type TEXT NOT NULL,
      position_x REAL,
      position_y REAL,
      position_z REAL,
      rotation_x REAL,
      rotation_y REAL,
      rotation_z REAL,
      throttle REAL,
      pitch REAL,
      roll REAL,
      yaw REAL,
      additional_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indices
  db.exec('CREATE INDEX IF NOT EXISTS idx_event_logs_timestamp ON event_logs(timestamp)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_event_logs_type ON event_logs(event_type)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_state_snapshots_timestamp ON state_snapshots(timestamp)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_state_snapshots_type ON state_snapshots(state_type)');
}

// Initialize database on module load
initializeDatabase();

// Save an event log
export function saveEvent(event) {
  const stmt = db.prepare(`
    INSERT INTO event_logs (
      timestamp, event_type, event_name, metadata
    ) VALUES (?, ?, ?, ?)
  `);

  stmt.run(
    event.timestamp,
    event.type,
    event.name,
    JSON.stringify(event.metadata || {})
  );

  return { success: true };
}

// Save a state snapshot
export function saveStateSnapshot(state) {
  const stmt = db.prepare(`
    INSERT INTO state_snapshots (
      timestamp, state_type, position_x, position_y, position_z,
      rotation_x, rotation_y, rotation_z, throttle, pitch, roll, yaw,
      additional_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const additionalData = {
    ...(state.additionalData || {}),
    currentStep: state.currentStep || 'Unknown'
  };

  stmt.run(
    state.timestamp,
    state.type,
    parseFloat(state.position.x),
    parseFloat(state.position.y),
    parseFloat(state.position.z),
    parseFloat(state.rotation.x),
    parseFloat(state.rotation.y),
    parseFloat(state.rotation.z),
    parseFloat(state.controls.throttle),
    parseFloat(state.controls.pitch),
    parseFloat(state.controls.roll),
    parseFloat(state.controls.yaw),
    JSON.stringify(additionalData)
  );

  return { success: true };
}

// Get events with filtering
export function getEvents(options = {}) {
  const {
    startTime,
    endTime,
    eventType,
    limit = 1000,
    offset = 0
  } = options;

  let query = 'SELECT * FROM event_logs WHERE 1=1';
  const params = [];

  if (startTime) {
    query += ' AND timestamp >= ?';
    params.push(startTime);
  }
  if (endTime) {
    query += ' AND timestamp <= ?';
    params.push(endTime);
  }
  if (eventType) {
    query += ' AND event_type = ?';
    params.push(eventType);
  }

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

// Get state snapshots with filtering
export function getStateSnapshots(options = {}) {
  const {
    startTime,
    endTime,
    stateType,
    limit = 100,
    offset = 0
  } = options;

  let query = 'SELECT * FROM state_snapshots WHERE 1=1';
  const params = [];

  if (startTime) {
    query += ' AND timestamp >= ?';
    params.push(startTime);
  }
  if (endTime) {
    query += ' AND timestamp <= ?';
    params.push(endTime);
  }
  if (stateType) {
    query += ' AND state_type = ?';
    params.push(stateType);
  }

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(query).all(...params);

  // Transform the flat database rows into nested state objects
  return rows.map(row => ({
    timestamp: row.timestamp,
    position: {
      x: row.position_x.toFixed(2),
      y: row.position_y.toFixed(2),
      z: row.position_z.toFixed(2)
    },
    rotation: {
      x: row.rotation_x.toFixed(2),
      y: row.rotation_y.toFixed(2),
      z: row.rotation_z.toFixed(2)
    },
    controls: {
      throttle: row.throttle.toFixed(2),
      pitch: row.pitch.toFixed(2),
      roll: row.roll.toFixed(2),
      yaw: row.yaw.toFixed(2)
    },
    currentStep: JSON.parse(row.additional_data || '{}').currentStep || 'Unknown'
  }));
}

// Get statistics for events
export function getEventStats() {
  return db.prepare(`
    SELECT 
      event_type,
      event_name,
      COUNT(*) as count,
      MIN(timestamp) as first_occurrence,
      MAX(timestamp) as last_occurrence
    FROM event_logs
    GROUP BY event_type, event_name
    ORDER BY event_type, first_occurrence
  `).all();
}

// Clear all data with error handling
export function clearAllData() {
  try {
    // Simple direct queries with individual try-catches to handle errors for each table
    try {
      db.exec('DELETE FROM event_logs');
      console.log('Cleared event_logs table');
    } catch (err) {
      console.warn('Error clearing event_logs:', err.message);
    }
    
    try {
      db.exec('DELETE FROM state_snapshots');
      console.log('Cleared state_snapshots table');
    } catch (err) {
      console.warn('Error clearing state_snapshots:', err.message);
    }
    
    return { success: true, message: 'Data cleared successfully' };
  } catch (error) {
    console.error('Error in clearAllData:', error);
    return { success: false, message: error.message };
  }
}

// Export the database instance for proper cleanup
export function getDatabase() {
  return db;
}

// Export the initialize function for explicit initialization
export { initializeDatabase };

// For backward compatibility
export const saveLogs = (logs) => {
  const transaction = db.transaction((logs) => {
    for (const log of logs) {
      saveEvent({
        timestamp: log.timestamp,
        type: 'routine_step',
        name: log.currentStep,
        metadata: {
          position: log.position,
          rotation: log.rotation,
          controls: log.controls
        }
      });
    }
  });

  transaction(logs);
  return { success: true, count: logs.length };
};

export const saveGameState = (state) => {
  return saveStateSnapshot({
    ...state,
    type: 'game_state'
  });
};

export const getLatestGameStates = (limit = 100) => {
  return getStateSnapshots({
    stateType: 'game_state',
    limit
  });
};

export const getLogs = (options = {}) => {
  return getEvents({
    ...options,
    eventType: 'routine_step'
  });
};

export function getStepStats() {
  return db.prepare(`
    SELECT 
      step_name,
      COUNT(*) as count,
      MIN(timestamp) as start_time,
      MAX(timestamp) as end_time,
      AVG(position_y) as avg_height,
      MAX(position_y) as max_height,
      AVG(ABS(rotation_x)) as avg_tilt_x,
      AVG(ABS(rotation_z)) as avg_tilt_z
    FROM routine_logs
    GROUP BY step_name
    ORDER BY MIN(timestamp)
  `).all();
}

export function getControlRanges() {
  return db.prepare(`
    SELECT 
      MIN(throttle) as min_throttle,
      MAX(throttle) as max_throttle,
      MIN(pitch) as min_pitch,
      MAX(pitch) as max_pitch,
      MIN(roll) as min_roll,
      MAX(roll) as max_roll,
      MIN(yaw) as min_yaw,
      MAX(yaw) as max_yaw
    FROM routine_logs
  `).get();
}

export function clearAllLogs() {
  try {
    // Clear both logs and game states
    const logsPath = path.join(DATA_DIR, 'logs');
    const statesPath = path.join(DATA_DIR, 'states');
    
    // Clear logs directory
    if (fs.existsSync(logsPath)) {
      fs.readdirSync(logsPath).forEach(file => {
        fs.unlinkSync(path.join(logsPath, file));
      });
    }
    
    // Clear states directory
    if (fs.existsSync(statesPath)) {
      fs.readdirSync(statesPath).forEach(file => {
        fs.unlinkSync(path.join(statesPath, file));
      });
    }
    
    console.log('All logs cleared successfully');
  } catch (error) {
    console.error('Error clearing logs:', error);
    throw error;
  }
} 