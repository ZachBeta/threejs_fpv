import fetch from 'node-fetch';
import { startDemo, stopDemo, initializeDemo } from '../demos/game_state_demo.js';

const API_BASE = 'http://localhost:3000/api';

describe('Game State API Integration Tests', () => {
  let demo;

  beforeAll(() => {
    // Initialize the demo instance
    demo = initializeDemo();
  });

  beforeEach(() => {
    // Reset demo state before each test
    if (demo) {
      stopDemo();
    }
  });

  afterAll(() => {
    // Clean up after all tests
    stopDemo();
  });

  test('should handle empty game states when demo is not running', async () => {
    const response = await fetch(`${API_BASE}/game-states?limit=10`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.states)).toBe(true);
    // Since demo is not running, we expect no states or invalid states
    data.states.forEach(state => {
      expect(state).toBeFalsy();
    });
  });

  test('should record and retrieve valid game states when demo is running', async () => {
    // Start the demo
    startDemo();

    // Wait for some states to be recorded (at least 500ms)
    await new Promise(resolve => setTimeout(resolve, 500));

    const response = await fetch(`${API_BASE}/game-states?limit=5`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.states)).toBe(true);
    expect(data.states.length).toBeGreaterThan(0);

    // Verify the structure of each state
    data.states.forEach(state => {
      expect(state).toHaveProperty('timestamp');
      expect(state).toHaveProperty('position');
      expect(state.position).toHaveProperty('x');
      expect(state.position).toHaveProperty('y');
      expect(state.position).toHaveProperty('z');
      expect(state).toHaveProperty('rotation');
      expect(state.rotation).toHaveProperty('x');
      expect(state.rotation).toHaveProperty('y');
      expect(state.rotation).toHaveProperty('z');
      expect(state).toHaveProperty('controls');
      expect(state.controls).toHaveProperty('throttle');
      expect(state.controls).toHaveProperty('pitch');
      expect(state.controls).toHaveProperty('roll');
      expect(state.controls).toHaveProperty('yaw');
      expect(state).toHaveProperty('currentStep');
    });

    // Stop the demo
    stopDemo();
  });

  test('should respect the limit parameter', async () => {
    // Start the demo
    startDemo();

    // Wait for some states to be recorded
    await new Promise(resolve => setTimeout(resolve, 500));

    const limit = 3;
    const response = await fetch(`${API_BASE}/game-states?limit=${limit}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.states.length).toBeLessThanOrEqual(limit);

    // Stop the demo
    stopDemo();
  });

  test('should handle invalid limit parameter gracefully', async () => {
    const response = await fetch(`${API_BASE}/game-states?limit=invalid`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.states)).toBe(true);
    // Should use default limit when invalid
    expect(data.states.length).toBeLessThanOrEqual(100);
  });

  test('should save game state through POST endpoint', async () => {
    const testState = {
      timestamp: Date.now(),
      position: { x: '1.00', y: '2.00', z: '3.00' },
      rotation: { x: '0.00', y: '0.00', z: '0.00' },
      controls: {
        throttle: '0.50',
        pitch: '0.00',
        roll: '0.00',
        yaw: '0.00'
      },
      currentStep: 'Test'
    };

    const postResponse = await fetch(`${API_BASE}/game-state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testState)
    });

    const postData = await postResponse.json();
    expect(postResponse.status).toBe(200);
    expect(postData.success).toBe(true);

    // Verify the state was saved by retrieving it
    const getResponse = await fetch(`${API_BASE}/game-states?limit=1`);
    const getData = await getResponse.json();
    
    expect(getData.success).toBe(true);
    expect(getData.states.length).toBe(1);
    expect(getData.states[0].position.x).toBe(testState.position.x);
    expect(getData.states[0].position.y).toBe(testState.position.y);
    expect(getData.states[0].position.z).toBe(testState.position.z);
  });
}); 