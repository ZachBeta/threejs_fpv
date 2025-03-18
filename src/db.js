import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '..', 'logs.db'));

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS routine_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    step_name TEXT NOT NULL,
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_routine_logs_timestamp ON routine_logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_routine_logs_step ON routine_logs(step_name);
`);

export function saveLogs(logs) {
  const stmt = db.prepare(`
    INSERT INTO routine_logs (
      timestamp, step_name, position_x, position_y, position_z,
      rotation_x, rotation_y, rotation_z, throttle, pitch, roll, yaw
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((logs) => {
    for (const log of logs) {
      stmt.run(
        log.timestamp,
        log.currentStep,
        parseFloat(log.position.x),
        parseFloat(log.position.y),
        parseFloat(log.position.z),
        parseFloat(log.rotation.x),
        parseFloat(log.rotation.y),
        parseFloat(log.rotation.z),
        parseFloat(log.controls.throttle),
        parseFloat(log.controls.pitch),
        parseFloat(log.controls.roll),
        parseFloat(log.controls.yaw)
      );
    }
  });

  transaction(logs);
  return { success: true, count: logs.length };
}

export function getLogs(options = {}) {
  const {
    startTime,
    endTime,
    stepName,
    limit = 1000,
    offset = 0
  } = options;

  let query = 'SELECT * FROM routine_logs WHERE 1=1';
  const params = [];

  if (startTime) {
    query += ' AND timestamp >= ?';
    params.push(startTime);
  }
  if (endTime) {
    query += ' AND timestamp <= ?';
    params.push(endTime);
  }
  if (stepName) {
    query += ' AND step_name = ?';
    params.push(stepName);
  }

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

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