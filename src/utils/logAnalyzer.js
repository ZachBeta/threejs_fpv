import { queryEvents } from './db/database.js';

class LogAnalyzer {
  static getPerformanceMetrics(timeRange = {}) {
    const events = queryEvents({
      ...timeRange,
      eventType: 'performance',
      limit: 1000
    });

    return {
      averageFps: this.calculateAverageFps(events),
      peakMemoryUsage: this.findPeakMemoryUsage(events),
      drawCallsOverTime: this.analyzeDrawCalls(events)
    };
  }

  static getErrorSummary(timeRange = {}) {
    const events = queryEvents({
      ...timeRange,
      eventType: 'error',
      limit: 1000
    });

    return this.categorizeErrors(events);
  }

  static calculateAverageFps(events) {
    const fpsEvents = events.filter(e => {
      try {
        const details = JSON.parse(e.details);
        return details && details.fps && details.fps > 0;
      } catch (error) {
        return false;
      }
    });

    if (fpsEvents.length === 0) return 0;

    const totalFps = fpsEvents.reduce((sum, event) => {
      const details = JSON.parse(event.details);
      return sum + details.fps;
    }, 0);

    return totalFps / fpsEvents.length;
  }

  static findPeakMemoryUsage(events) {
    return events.reduce((peak, event) => {
      try {
        const details = JSON.parse(event.details);
        return Math.max(peak, details.memoryUsage || 0);
      } catch (error) {
        return peak;
      }
    }, 0);
  }

  static analyzeDrawCalls(events) {
    return events.map(event => {
      try {
        const details = JSON.parse(event.details);
        return {
          timestamp: event.timestamp,
          drawCalls: details.drawCalls || 0
        };
      } catch (error) {
        return {
          timestamp: event.timestamp,
          drawCalls: 0
        };
      }
    });
  }

  static categorizeErrors(events) {
    const categories = {};
    
    events.forEach(event => {
      try {
        const details = JSON.parse(event.details);
        const message = details.message || event.details;
        const errorType = this.getErrorType(message);
        
        if (!categories[errorType]) {
          categories[errorType] = {
            count: 0,
            examples: []
          };
        }

        categories[errorType].count++;
        if (categories[errorType].examples.length < 3) {
          categories[errorType].examples.push(message);
        }
      } catch (error) {
        // Skip malformed entries
        console.warn('Skipping malformed error entry:', error);
      }
    });

    return categories;
  }

  static getErrorType(message) {
    if (typeof message !== 'string') return 'Other';
    
    if (message.includes('WebGL')) return 'WebGL';
    if (message.includes('texture')) return 'Texture';
    if (message.includes('geometry')) return 'Geometry';
    if (message.includes('memory')) return 'Memory';
    return 'Other';
  }
}

export default LogAnalyzer; 