import { jest } from '@jest/globals';
import { DronePhysics } from '../physics';

// Mock THREE.js
jest.mock('three', () => ({
  Vector3: jest.fn().mockImplementation((x, y, z) => ({ x, y, z })),
  Quaternion: jest.fn().mockImplementation((x, y, z, w) => ({ x, y, z, w })),
  Euler: jest.fn().mockImplementation((x, y, z) => ({ x, y, z })),
}));

describe('Drone Physics', () => {
  let drone;
  let mockScene;
  let mockCamera;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Create mock scene and camera
    mockScene = {
      add: jest.fn(),
      remove: jest.fn(),
    };
    mockCamera = {
      position: { x: 0, y: 0, z: 0 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
    };

    // Create new drone instance
    drone = new DronePhysics();
  });

  describe('Gravity and Falling', () => {
    test('drone should fall when no throttle is applied', () => {
      const deltaTime = 0.016; // 60fps
      const initialY = drone.position.y;
      
      drone.updatePhysics(deltaTime);
      
      expect(drone.position.y).toBeLessThan(initialY);
      expect(drone.velocity.y).toBeLessThan(0);
    });

    test('drone should fall faster over time due to gravity', () => {
      const deltaTime = 0.016; // 60fps
      const initialVelocity = drone.velocity.y;
      
      drone.updatePhysics(deltaTime);
      const velocityAfterFirstUpdate = drone.velocity.y;
      
      drone.updatePhysics(deltaTime);
      const velocityAfterSecondUpdate = drone.velocity.y;
      
      expect(velocityAfterSecondUpdate).toBeLessThan(velocityAfterFirstUpdate);
      expect(velocityAfterFirstUpdate).toBeLessThan(initialVelocity);
    });
  });

  describe('Throttle and Acceleration', () => {
    test('throttle should increase drone upward velocity with non-linear response', () => {
      const deltaTime = 0.016; // 60fps
      
      // First update to get initial falling velocity
      drone.updatePhysics(deltaTime);
      const initialVelocity = drone.velocity.y;
      
      // Apply throttle and update
      drone.setThrottle(0.5);
      drone.updatePhysics(deltaTime);
      const velocityAfterHalfThrottle = drone.velocity.y;
      
      // The velocity might still be negative due to gravity,
      // but it should be less negative than the initial velocity
      expect(velocityAfterHalfThrottle).toBeGreaterThan(initialVelocity);
      
      drone.setThrottle(1.0);
      drone.updatePhysics(deltaTime);
      const velocityAfterFullThrottle = drone.velocity.y;
      
      // The increase in velocity should be non-linear
      const halfThrottleIncrease = velocityAfterHalfThrottle - initialVelocity;
      const fullThrottleIncrease = velocityAfterFullThrottle - velocityAfterHalfThrottle;
      
      expect(fullThrottleIncrease).toBeGreaterThan(halfThrottleIncrease);
    });

    test('throttle should counteract gravity when sufficient', () => {
      const deltaTime = 0.016; // 60fps
      const initialY = drone.position.y;
      
      // Apply full throttle and let it stabilize for a few frames
      drone.setThrottle(1.0);
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      const finalY = drone.position.y;
      expect(finalY).toBeGreaterThan(initialY);
      expect(drone.velocity.y).toBeGreaterThan(0);
    });

    test('throttle should be limited to maxThrottle', () => {
      drone.setThrottle(2.0); // Attempt to set throttle above max
      expect(drone.throttle).toBeLessThanOrEqual(drone.maxThrottle);
    });

    test('throttle should not go below 0', () => {
      drone.setThrottle(-1.0); // Attempt to set throttle below 0
      expect(drone.throttle).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reset Functionality', () => {
    test('reset should restore initial state', () => {
      // Modify drone state
      drone.position.y = 20;
      drone.velocity.y = 5;
      drone.setThrottle(0.5);
      
      // Reset drone
      drone.reset();
      
      expect(drone.position.y).toBe(10);
      expect(drone.velocity.y).toBe(0);
      expect(drone.throttle).toBe(0);
    });
  });
}); 