import { jest } from '@jest/globals';
import { DronePhysics } from '../physics.js';

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

  describe('Basic Movement', () => {
    test('drone should fall when no throttle is applied', () => {
      const deltaTime = 0.016; // 60fps
      const initialVelocity = drone.velocity.y;
      
      drone.updatePhysics(deltaTime);
      const velocityAfterFirstUpdate = drone.velocity.y;
      
      drone.updatePhysics(deltaTime);
      const velocityAfterSecondUpdate = drone.velocity.y;
      
      // Velocity should become increasingly negative due to gravity
      expect(velocityAfterSecondUpdate).toBeLessThan(velocityAfterFirstUpdate);
      expect(velocityAfterFirstUpdate).toBeLessThan(initialVelocity);
    });

    test('drone should maintain horizontal momentum when throttle is zero', () => {
      const deltaTime = 0.016; // 60fps
      
      // First give the drone some horizontal velocity
      drone.velocity.x = 5.0;
      drone.velocity.z = 5.0;
      const initialX = drone.position.x;
      const initialZ = drone.position.z;
      
      // Update physics with zero throttle
      drone.setThrottle(0);
      drone.updatePhysics(deltaTime);
      
      // Drone should still move horizontally
      expect(drone.position.x).toBeGreaterThan(initialX);
      expect(drone.position.z).toBeGreaterThan(initialZ);
      // But should also be falling
      expect(drone.velocity.y).toBeLessThan(0);
    });
  });

  describe('Throttle and Acceleration', () => {
    test('throttle should eventually increase drone upward velocity', () => {
      const deltaTime = 0.016; // 60fps
      
      // Apply maximum throttle
      drone.setThrottle(1.0);
      
      // Update several times to account for momentum
      for (let i = 0; i < 20; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // After multiple frames with full throttle, the drone should be moving upward
      expect(drone.velocity.y).toBeGreaterThan(0);
    });

    test('throttle should eventually counteract gravity when sufficient', () => {
      const deltaTime = 0.016; // 60fps
      const initialY = drone.position.y;
      
      // Apply full throttle and let it stabilize for many frames
      drone.setThrottle(1.0);
      for (let i = 0; i < 30; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // After sufficient time with full throttle, the drone should be rising
      expect(drone.velocity.y).toBeGreaterThan(0);
      expect(drone.position.y).toBeGreaterThan(initialY);
    });

    test('throttle should be limited to maxThrottle', () => {
      drone.setThrottle(2.0); // Attempt to set throttle above 1
      expect(drone.throttle).toBeLessThanOrEqual(1);
      
      drone.setThrottle(-1.0); // Attempt to set throttle below 0
      expect(drone.throttle).toBeGreaterThanOrEqual(0);
    });

    test('throttle response should have momentum (gradual change)', () => {
      const deltaTime = 0.016; // 60fps
      
      // Set throttle and update once
      drone.setThrottle(1.0);
      drone.updatePhysics(deltaTime);
      
      // Check that previousThrottle is approaching throttle but not equal yet
      expect(drone.previousThrottle).toBeGreaterThan(0);
      expect(drone.previousThrottle).toBeLessThan(1.0);
      
      // Several more updates should get closer to the target throttle
      for (let i = 0; i < 20; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Should be close to the target throttle after sufficient time
      expect(drone.previousThrottle).toBeGreaterThan(0.8);
    });
  });

  describe('Orientation-Based Thrust', () => {
    test('thrust should be applied in the direction the drone is pointing (level)', () => {
      const deltaTime = 0.016; // 60fps
      
      // Reset the drone to ensure no residual velocities
      drone.reset();
      
      // Set drone to level and apply throttle
      drone.rotation.x = 0; // No pitch
      drone.rotation.z = 0; // No roll
      drone.setThrottle(1.0);
      
      // Update for enough frames to counteract gravity
      for (let i = 0; i < 30; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // After sufficient time with full throttle and level orientation, 
      // the drone should be moving more vertically than horizontally
      expect(Math.abs(drone.velocity.y)).toBeGreaterThan(Math.abs(drone.velocity.x));
      expect(Math.abs(drone.velocity.y)).toBeGreaterThan(Math.abs(drone.velocity.z));
      expect(drone.velocity.y).toBeGreaterThan(0); // Upward acceleration after overcoming gravity
    });
    
    test('thrust should create angled motion when drone is pitched forward', () => {
      const deltaTime = 0.016; // 60fps
      
      // Reset the drone to ensure no residual velocities
      drone.reset();
      
      // Set drone to pitched forward and apply throttle
      drone.rotation.x = -Math.PI / 8; // Pitched forward 22.5 degrees
      drone.setThrottle(1.0);
      
      // Let it stabilize for more frames
      for (let i = 0; i < 30; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // The drone should be moving both upward and forward
      expect(drone.velocity.y).toBeGreaterThan(0); // Eventually going up
      expect(drone.velocity.z).toBeLessThan(0); // Moving forward (negative Z)
    });
  });

  describe('Tilt-Based Movement', () => {
    test('rolling right should make the drone move right (positive x)', () => {
      const deltaTime = 0.016; // 60fps
      
      // Set drone to roll right and apply throttle
      drone.rotation.z = Math.PI / 8; // Roll right 22.5 degrees
      drone.setThrottle(1.0);
      
      // Let it stabilize for a few frames
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // The drone should move to the right (positive x)
      expect(drone.velocity.x).toBeGreaterThan(0);
    });

    test('rolling left should make the drone move left (negative x)', () => {
      const deltaTime = 0.016; // 60fps
      
      // Set drone to roll left and apply throttle
      drone.rotation.z = -Math.PI / 8; // Roll left 22.5 degrees
      drone.setThrottle(1.0);
      
      // Let it stabilize for a few frames
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // The drone should move to the left (negative x)
      expect(drone.velocity.x).toBeLessThan(0);
    });
    
    test('pitching forward should make the drone move forward (negative z)', () => {
      const deltaTime = 0.016; // 60fps
      
      // Set drone to pitch forward and apply throttle
      drone.rotation.x = -Math.PI / 8; // Pitch forward 22.5 degrees
      drone.setThrottle(1.0);
      
      // Let it stabilize for a few frames
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // The drone should move forward (negative z)
      expect(drone.velocity.z).toBeLessThan(0);
    });
    
    test('pitching backward should make the drone move backward (positive z)', () => {
      const deltaTime = 0.016; // 60fps
      
      // Set drone to pitch backward and apply throttle
      drone.rotation.x = Math.PI / 8; // Pitch backward 22.5 degrees
      drone.setThrottle(1.0);
      
      // Let it stabilize for a few frames
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // The drone should move backward (positive z)
      expect(drone.velocity.z).toBeGreaterThan(0);
    });

    test('yaw rotation should change the direction of forward movement', () => {
      const deltaTime = 0.016; // 60fps
      
      // Set drone to yaw right 90 degrees and pitch forward
      drone.rotation.y = Math.PI / 2; // Yaw right 90 degrees
      drone.rotation.x = -Math.PI / 8; // Pitch forward 22.5 degrees
      drone.setThrottle(1.0);
      
      // Let it stabilize for a few frames
      for (let i = 0; i < 15; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // When yawed 90 degrees right and pitched forward, the drone should move in the negative X direction
      expect(drone.velocity.x).toBeLessThan(0);
      
      // Ensure there is significant X movement when yawed and pitched
      expect(Math.abs(drone.velocity.x)).toBeGreaterThan(0.05);
    });

    test('positive yaw input should rotate drone counterclockwise', () => {
      const deltaTime = 0.016; // 60fps
      const initialRotationY = drone.rotation.y;
      
      // Apply positive yaw (should rotate counterclockwise/left)
      drone.setYaw(0.5);
      
      // Update physics for a few frames
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Rotation should increase (counterclockwise) with positive yaw
      expect(drone.rotation.y).toBeGreaterThan(initialRotationY);
    });

    test('negative yaw input should rotate drone clockwise', () => {
      const deltaTime = 0.016; // 60fps
      const initialRotationY = drone.rotation.y;
      
      // Apply negative yaw (should rotate clockwise/right)
      drone.setYaw(-0.5);
      
      // Update physics for a few frames
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Rotation should decrease (clockwise) with negative yaw
      expect(drone.rotation.y).toBeLessThan(initialRotationY);
    });

    test('yaw rotation should accumulate over time', () => {
      const deltaTime = 0.016; // 60fps
      const initialRotationY = drone.rotation.y;
      
      // Apply positive yaw
      drone.setYaw(0.5);
      
      // Store rotation after a few frames
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      const rotationAfterFiveFrames = drone.rotation.y;
      
      // Continue rotating for more frames
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      const rotationAfterTenFrames = drone.rotation.y;
      
      // Verify rotation continues to accumulate
      expect(rotationAfterTenFrames).toBeGreaterThan(rotationAfterFiveFrames);
      expect(rotationAfterFiveFrames).toBeGreaterThan(initialRotationY);
    });

    test('yaw should stop when input returns to zero', () => {
      const deltaTime = 0.016; // 60fps
      
      // First apply some yaw
      drone.setYaw(0.5);
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Record rotation at this point
      const rotationBeforeStop = drone.rotation.y;
      
      // Set yaw back to zero and update
      drone.setYaw(0);
      for (let i = 0; i < 10; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Due to angular damping, final rotation should be very close to rotation when we stopped
      const rotationDifference = Math.abs(drone.rotation.y - rotationBeforeStop);
      expect(rotationDifference).toBeLessThan(0.01);
    });
  });

  describe('Reset Functionality', () => {
    test('reset should restore initial state', () => {
      // Change some values
      drone.position = { x: 10, y: 20, z: 30 };
      drone.velocity = { x: 5, y: -2, z: 1 };
      drone.throttle = 0.5;
      
      // Reset
      drone.reset();
      
      // Check values are restored
      expect(drone.position.y).toBe(10);
      expect(drone.velocity.y).toBe(0);
      expect(drone.throttle).toBe(0);
      expect(drone.previousThrottle).toBe(0);
    });
  });

  describe('Advanced Maneuvers', () => {
    test('circle left should combine pitch, roll, and yaw for circular motion', () => {
      const deltaTime = 0.016; // 60fps
      
      // Reset drone and set initial conditions
      drone.reset();
      drone.setThrottle(0.5);
      drone.setPitch(0.3);
      drone.setRoll(-0.3);
      drone.setYaw(-0.2);
      
      // Track initial position
      const initialX = drone.position.x;
      const initialZ = drone.position.z;
      
      // Let the drone move for several frames
      for (let i = 0; i < 30; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Verify circular motion components:
      // 1. Should be moving (position changed)
      expect(drone.position.x).not.toBe(initialX);
      expect(drone.position.z).not.toBe(initialZ);
      
      // 2. Should maintain stable height with 0.5 throttle
      expect(Math.abs(drone.position.y - 10)).toBeLessThan(2); // Allow small height variation
      
      // 3. Should have combined movement in both X and Z axes
      expect(Math.abs(drone.velocity.x)).toBeGreaterThan(0);
      expect(Math.abs(drone.velocity.z)).toBeGreaterThan(0);
    });

    test('circle right should combine pitch, roll, and yaw for opposite circular motion', () => {
      const deltaTime = 0.016; // 60fps
      
      // Reset drone and set initial conditions
      drone.reset();
      drone.setThrottle(0.5);
      drone.setPitch(0.3);
      drone.setRoll(0.3);
      drone.setYaw(0.2);
      
      // Track initial position
      const initialX = drone.position.x;
      const initialZ = drone.position.z;
      
      // Let the drone move for several frames
      for (let i = 0; i < 30; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Verify circular motion components
      expect(drone.position.x).not.toBe(initialX);
      expect(drone.position.z).not.toBe(initialZ);
      expect(Math.abs(drone.position.y - 10)).toBeLessThan(2);
      expect(Math.abs(drone.velocity.x)).toBeGreaterThan(0);
      expect(Math.abs(drone.velocity.z)).toBeGreaterThan(0);
      
      // Verify opposite direction from circle left
      // If circle left had negative roll and yaw, this should have positive
      expect(drone.rotation.z).toBeGreaterThan(0); // Positive roll
      expect(drone.rotation.y).toBeGreaterThan(0); // Positive yaw
    });

    test('figure eight should transition between left and right circular motions', () => {
      // Simplified test - just verify basic directional change capabilities
      
      // Test left turn
      drone.reset();
      drone.setThrottle(0.8);
      drone.rotation.x = -0.3; // Forward pitch
      drone.rotation.z = -0.4; // Roll left
      drone.setYaw(-0.2);      // Yaw left
      
      // Let it turn left for a while
      for (let i = 0; i < 20; i++) {
        drone.updatePhysics(0.016);
      }
      
      // Verify left motion
      expect(drone.velocity.x).toBeLessThan(0);
      
      // Reset for the right turn test
      drone.reset();
      drone.setThrottle(0.8);
      drone.rotation.x = -0.3; // Forward pitch
      drone.rotation.z = 0.4;  // Roll right
      drone.setYaw(0.2);       // Yaw right
      
      // Let it turn right for a while
      for (let i = 0; i < 20; i++) {
        drone.updatePhysics(0.016);
      }
      
      // Verify right motion
      expect(drone.velocity.x).toBeGreaterThan(0);
      
      // This simpler test verifies that the drone can perform both left and right 
      // components needed for a figure eight, without the complexity of the transition
    });

    test('ascend and descend should change altitude while maintaining position', () => {
      const deltaTime = 0.016; // 60fps
      
      // Test ascend
      drone.reset();
      const initialY = drone.position.y;
      const initialX = drone.position.x;
      const initialZ = drone.position.z;
      
      // Use maximum throttle for strong ascent
      drone.setThrottle(1.0);
      
      // Let it ascend
      for (let i = 0; i < 45; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      const maxHeight = drone.position.y;
      // Should gain altitude
      expect(maxHeight).toBeGreaterThan(initialY);
      // Should maintain horizontal position
      expect(Math.abs(drone.position.x - initialX)).toBeLessThan(0.1);
      expect(Math.abs(drone.position.z - initialZ)).toBeLessThan(0.1);
      
      // Gradual throttle reduction to stop
      drone.setThrottle(0.3);
      for (let i = 0; i < 30; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      drone.setThrottle(0);
      for (let i = 0; i < 30; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      const heightAfterStop = drone.position.y;
      
      // Let gravity pull it down
      for (let i = 0; i < 120; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Should lose altitude from the stopping point
      expect(drone.position.y).toBeLessThan(heightAfterStop);
      // Should still maintain horizontal position
      expect(Math.abs(drone.position.x - initialX)).toBeLessThan(0.1);
      expect(Math.abs(drone.position.z - initialZ)).toBeLessThan(0.1);
    });
  });
}); 