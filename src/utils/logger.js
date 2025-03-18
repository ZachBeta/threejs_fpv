import { logEvent } from './db/database.js';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

const logFile = path.join(logsDir, 'server.log');

function formatTimestamp() {
    return new Date().toISOString();
}

function formatRequest(req) {
    return {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params
    };
}

function formatResponse(res) {
    return {
        statusCode: res.statusCode,
        headers: res.getHeaders()
    };
}

export function logRequest(req) {
    const timestamp = formatTimestamp();
    const request = formatRequest(req);
    
    const logEntry = `\n[${timestamp}] REQUEST:\n${JSON.stringify(request, null, 2)}\n`;
    fs.appendFileSync(logFile, logEntry);
}

export function logResponse(req, res) {
    const timestamp = formatTimestamp();
    const response = formatResponse(res);
    
    const logEntry = `\n[${timestamp}] RESPONSE:\n${JSON.stringify(response, null, 2)}\n`;
    fs.appendFileSync(logFile, logEntry);
}

export function logError(error) {
    const timestamp = formatTimestamp();
    const errorLog = {
        message: error.message,
        stack: error.stack
    };
    
    const logEntry = `\n[${timestamp}] ERROR:\n${JSON.stringify(errorLog, null, 2)}\n`;
    fs.appendFileSync(logFile, logEntry);
}

class Logger {
  static logRender(component, details = {}) {
    const performanceData = {
      timestamp: performance.now(),
      fps: details.fps || 0,
      drawCalls: details.renderer?.info.render.calls || 0,
      triangles: details.renderer?.info.render.triangles || 0
    };

    logEvent('render', component, details, performanceData);
  }

  static logInteraction(component, details = {}) {
    logEvent('interaction', component, {
      ...details,
      timestamp: performance.now()
    });
  }

  static logPerformance(component, metrics = {}) {
    logEvent('performance', component, {
      ...metrics,
      timestamp: performance.now()
    });
  }

  static logSceneChange(component, details = {}) {
    logEvent('scene_change', component, {
      ...details,
      timestamp: performance.now()
    });
  }

  static logCameraUpdate(component, details = {}) {
    logEvent('camera_update', component, {
      ...details,
      timestamp: performance.now()
    });
  }

  static logCollision(component, details = {}) {
    logEvent('collision', component, {
      ...details,
      timestamp: performance.now()
    });
  }
}

export default Logger; 