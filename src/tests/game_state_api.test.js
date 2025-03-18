import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

describe('Game State API Integration Tests', () => {
  beforeEach(async () => {
    // Clear existing game states before each test
    await fetch(`${API_BASE}/clear-logs`, {
      method: 'POST'
    });
  });

  test('should handle empty game states initially', async () => {
    const response = await fetch(`${API_BASE}/game-states?limit=10`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.states)).toBe(true);
    expect(data.states.length).toBe(0);
  });

  test('should save and retrieve game states', async () => {
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

    // Save state
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

    // Retrieve state
    const getResponse = await fetch(`${API_BASE}/game-states?limit=1`);
    const getData = await getResponse.json();
    
    expect(getData.success).toBe(true);
    expect(getData.states.length).toBe(1);
    
    const savedState = getData.states[0];
    expect(savedState.position.x).toBe(testState.position.x);
    expect(savedState.position.y).toBe(testState.position.y);
    expect(savedState.position.z).toBe(testState.position.z);
    expect(savedState.rotation.x).toBe(testState.rotation.x);
    expect(savedState.rotation.y).toBe(testState.rotation.y);
    expect(savedState.rotation.z).toBe(testState.rotation.z);
    expect(savedState.controls.throttle).toBe(testState.controls.throttle);
    expect(savedState.currentStep).toBe(testState.currentStep);
  });

  test('should respect the limit parameter', async () => {
    // Save multiple states
    const states = Array(5).fill(null).map((_, i) => ({
      timestamp: Date.now() + i,
      position: { x: i.toString(), y: '0.00', z: '0.00' },
      rotation: { x: '0.00', y: '0.00', z: '0.00' },
      controls: { throttle: '0.50', pitch: '0.00', roll: '0.00', yaw: '0.00' },
      currentStep: `Step ${i}`
    }));

    // Save all states
    for (const state of states) {
      await fetch(`${API_BASE}/game-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
    }

    const limit = 3;
    const response = await fetch(`${API_BASE}/game-states?limit=${limit}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.states.length).toBeLessThanOrEqual(limit);
  });

  test('should handle invalid limit parameter gracefully', async () => {
    const response = await fetch(`${API_BASE}/game-states?limit=invalid`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.states)).toBe(true);
  });
}); 