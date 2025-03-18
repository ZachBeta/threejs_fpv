import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize database connection
const db = new Database(join(__dirname, '../../../logs.db'));

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    event_type TEXT NOT NULL,
    component TEXT NOT NULL,
    details TEXT,
    performance_data TEXT
  )
`);

// Prepare statements for better performance
const insertEvent = db.prepare(`
  INSERT INTO events (event_type, component, details, performance_data)
  VALUES (?, ?, ?, ?)
`);

/**
 * Log an event to the database
 * @param {string} eventType - Type of event (e.g., 'render', 'collision', 'input')
 * @param {string} component - Component where the event occurred
 * @param {object|string} details - Additional event details
 * @param {object} [performanceData] - Optional performance metrics
 */
function logEvent(eventType, component, details, performanceData = null) {
  try {
    insertEvent.run(
      eventType,
      component,
      typeof details === 'object' ? JSON.stringify(details) : details,
      performanceData ? JSON.stringify(performanceData) : null
    );
  } catch (error) {
    console.error('Failed to log event:', error);
  }
}

/**
 * Query events from the database
 * @param {object} filters - Query filters
 * @returns {Array} Matching events
 */
function queryEvents({ startTime, endTime, eventType, component, limit = 100 }) {
  let query = 'SELECT * FROM events WHERE 1=1';
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
  if (component) {
    query += ' AND component = ?';
    params.push(component);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  return db.prepare(query).all(...params);
}

// Clean up database connection on process exit
process.on('exit', () => {
  db.close();
});

export { logEvent, queryEvents, db }; 