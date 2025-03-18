import { logEvent } from './db/database.js';
import { performance } from 'perf_hooks';

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

  static logError(component, error) {
    logEvent('error', component, {
      message: error.message,
      stack: error.stack,
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