import Logger from '../utils/logger.js';
import LogAnalyzer from '../utils/logAnalyzer.js';
import { db } from '../utils/db/database.js';

describe('Logging System Tests', () => {
  // Clear the database before each test
  beforeEach(() => {
    db.exec('DELETE FROM events');
  });

  // Clean up after all tests
  afterAll(() => {
    db.close();
  });

  test('should log render events with performance data', () => {
    const mockRenderer = {
      info: {
        render: {
          calls: 100,
          triangles: 5000
        }
      }
    };

    Logger.logRender('TestScene', {
      fps: 60,
      renderer: mockRenderer
    });

    const events = db.prepare('SELECT * FROM events WHERE event_type = ?').all('render');
    expect(events.length).toBe(1);
    
    const details = JSON.parse(events[0].performance_data);
    expect(details.fps).toBe(60);
    expect(details.drawCalls).toBe(100);
    expect(details.triangles).toBe(5000);
  });

  test('should log and analyze errors', () => {
    const testError = new Error('WebGL buffer allocation failed');
    Logger.logError('TestComponent', testError);

    const errorSummary = LogAnalyzer.getErrorSummary();
    expect(Object.keys(errorSummary)).toContain('WebGL');
    expect(errorSummary.WebGL.count).toBe(1);
    expect(errorSummary.WebGL.examples[0]).toContain('WebGL buffer allocation failed');
  });

  test('should calculate average FPS correctly', () => {
    // Log multiple render events with different FPS
    Logger.logPerformance('TestScene', { fps: 60 });
    Logger.logPerformance('TestScene', { fps: 30 });
    Logger.logPerformance('TestScene', { fps: 45 });

    const metrics = LogAnalyzer.getPerformanceMetrics();
    expect(metrics.averageFps).toBe(45); // (60 + 30 + 45) / 3
  });

  test('should handle invalid data gracefully', () => {
    // Test with undefined renderer
    expect(() => {
      Logger.logRender('TestScene', {});
    }).not.toThrow();

    // Test with invalid performance data
    expect(() => {
      Logger.logPerformance('TestScene', null);
    }).not.toThrow();
  });

  test('should track camera updates', () => {
    const cameraDetails = {
      position: { x: 0, y: 1, z: 2 },
      rotation: { x: 0, y: 0, z: 0 }
    };

    Logger.logCameraUpdate('MainCamera', cameraDetails);

    const events = db.prepare('SELECT * FROM events WHERE event_type = ?').all('camera_update');
    expect(events.length).toBe(1);
    
    const details = JSON.parse(events[0].details);
    expect(details.position).toEqual(cameraDetails.position);
    expect(details.rotation).toEqual(cameraDetails.rotation);
  });

  test('should track collision events', () => {
    const collisionDetails = {
      object1: 'player',
      object2: 'wall',
      point: { x: 1, y: 0, z: 1 }
    };

    Logger.logCollision('Physics', collisionDetails);

    const events = db.prepare('SELECT * FROM events WHERE event_type = ?').all('collision');
    expect(events.length).toBe(1);
    
    const details = JSON.parse(events[0].details);
    expect(details.object1).toBe('player');
    expect(details.object2).toBe('wall');
  });
}); 