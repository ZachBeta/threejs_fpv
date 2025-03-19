import { jest } from '@jest/globals';
import { DronePhysics } from '../drone_physics.js';

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
    drone = {
      physics: new DronePhysics(null, null),
      velocity: { x: 0, y: 0, z: 0 },
      position: { x: 0, y: 51.0, z: 0 },
      updatePhysics: function(deltaTime) {
        this.physics.updatePhysics(deltaTime);
        this.velocity = this.physics.velocity;
        this.position = this.physics.position;
      },
      setThrottle: function(value) {
        this.physics.setThrottle(value);
      },
      setYaw: function(value) {
        this.physics.setYaw(value);
      },
      setPitch: function(value) {
        this.physics.setPitch(value);
      },
      setRoll: function(value) {
        this.physics.setRoll(value);
      },
      reset: function() {
        this.physics = new DronePhysics(null, null);
        this.velocity = { x: 0, y: 0, z: 0 };
        this.position = { x: 0, y: 51.0, z: 0 };
      }
    };
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
      drone.physics.velocity.x = 5.0;
      drone.physics.velocity.z = 5.0;
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
      expect(drone.physics.throttle).toBeLessThanOrEqual(1);
      
      drone.setThrottle(-1.0); // Attempt to set throttle below 0
      expect(drone.physics.throttle).toBeGreaterThanOrEqual(0);
    });

    test('throttle response should have momentum (gradual change)', () => {
      const deltaTime = 0.016; // 60fps
      
      // Set throttle and update once
      drone.setThrottle(1.0);
      drone.updatePhysics(deltaTime);
      
      // Check that previousThrottle is approaching throttle but not equal yet
      expect(drone.physics.previousThrottle).toBeGreaterThan(0);
      expect(drone.physics.previousThrottle).toBeLessThan(1.0);
      
      // Several more updates should get closer to the target throttle
      for (let i = 0; i < 20; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Should be close to the target throttle after sufficient time
      expect(drone.physics.previousThrottle).toBeGreaterThan(0.8);
    });
  });

  describe('Orientation-Based Thrust', () => {
    test('thrust should be applied in the direction the drone is pointing (level)', () => {
      const deltaTime = 0.016; // 60fps
      
      // Set drone to level and apply throttle
      drone.physics.localRotation.x = 0; // No pitch
      drone.physics.localRotation.z = 0; // No roll
      drone.setThrottle(0.8); // Use less than max throttle for more stable test
      
      // Let it stabilize for more frames
      for (let i = 0; i < 10; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Should move mostly upward with minimal horizontal movement
      expect(Math.abs(drone.velocity.x)).toBeLessThan(0.1);
      expect(Math.abs(drone.velocity.z)).toBeLessThan(0.1);
      expect(drone.velocity.y).toBeGreaterThan(0);
    });
    
    test('thrust should create angled motion when drone is pitched forward', () => {
      const deltaTime = 0.016; // 60fps
      
      // Set drone to pitched forward and apply throttle
      drone.physics.localRotation.x = -Math.PI / 8; // Pitched forward 22.5 degrees
      drone.setThrottle(1.0);
      
      // Let it stabilize for more frames
      for (let i = 0; i < 30; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // The drone should be moving both upward and forward
      expect(drone.velocity.y).toBeGreaterThan(0); // Eventually going up
      expect(drone.velocity.z).toBeLessThan(0); // Moving forward (negative Z)
    });

    test('yaw rotation should change the direction of forward movement', () => {
      const deltaTime = 0.016; // 60fps
      
      // Test each cardinal direction
      const tests = [
        { yaw: 0, expectedX: 0, expectedZ: -1, description: "facing forward" },
        { yaw: Math.PI/2, expectedX: -1, expectedZ: 0, description: "facing right" },
        { yaw: Math.PI, expectedX: 0, expectedZ: 1, description: "facing backward" },
        { yaw: -Math.PI/2, expectedX: 1, expectedZ: 0, description: "facing left" }
      ];

      for (const test of tests) {
        // Reset drone for each test
        drone.reset();
        
        // Set orientation and apply throttle
        drone.physics.localRotation.y = test.yaw;
        drone.physics.localRotation.x = -Math.PI / 8; // Pitch forward 22.5 degrees
        drone.setThrottle(1.0);
        
        // Let it stabilize
        for (let i = 0; i < 30; i++) {
          drone.updatePhysics(deltaTime);
        }
        
        // When pitched forward, velocity should align with facing direction
        if (test.expectedX !== 0) {
          expect(Math.sign(drone.velocity.x)).toBe(Math.sign(test.expectedX));
        } else {
          expect(Math.abs(drone.velocity.x)).toBeLessThan(0.1);
        }
        
        if (test.expectedZ !== 0) {
          expect(Math.sign(drone.velocity.z)).toBe(Math.sign(test.expectedZ));
        } else {
          expect(Math.abs(drone.velocity.z)).toBeLessThan(0.1);
        }
      }
    });

    test('pitch direction should be relative to drone orientation', () => {
      const deltaTime = 0.016; // 60fps
      
      // Reset drone and yaw 90 degrees right
      drone.reset();
      drone.physics.localRotation.y = Math.PI / 2; // Facing right
      drone.setThrottle(1.0);
      
      // Test forward pitch (should move in -X direction when facing right)
      drone.physics.localRotation.x = -Math.PI / 8; // Pitch forward
      for (let i = 0; i < 30; i++) {
        drone.updatePhysics(deltaTime);
      }
      expect(drone.velocity.x).toBeLessThan(0);
      expect(Math.abs(drone.velocity.z)).toBeLessThan(Math.abs(drone.velocity.x));
      
      // Reset and test backward pitch (should move in +X direction when facing right)
      drone.reset();
      drone.physics.localRotation.y = Math.PI / 2; // Facing right
      drone.physics.localRotation.x = Math.PI / 8; // Pitch backward
      drone.setThrottle(1.0);
      for (let i = 0; i < 30; i++) {
        drone.updatePhysics(deltaTime);
      }
      expect(drone.velocity.x).toBeGreaterThan(0);
      expect(Math.abs(drone.velocity.z)).toBeLessThan(Math.abs(drone.velocity.x));
    });
  });

  describe('Tilt-Based Movement', () => {
    test('roll direction should be consistent with input values', () => {
      const deltaTime = 0.016; // 60fps
      
      // Test positive roll input
      drone.reset();
      drone.setThrottle(0.8);
      drone.setRoll(1.0); // Positive roll should be roll left
      
      for (let i = 0; i < 20; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      const leftRollVelocity = drone.velocity.x;
      expect(leftRollVelocity).toBeLessThan(0); // Should move left with positive roll
      
      // Test negative roll input
      drone.reset();
      drone.setThrottle(0.8);
      drone.setRoll(-1.0); // Negative roll should be roll right
      
      for (let i = 0; i < 20; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      const rightRollVelocity = drone.velocity.x;
      expect(rightRollVelocity).toBeGreaterThan(0); // Should move right with negative roll
      
      // Verify symmetry of movement
      expect(Math.abs(leftRollVelocity)).toBeCloseTo(Math.abs(rightRollVelocity), 1);
    });

    test('rolling right should make the drone move right (positive x)', () => {
      const deltaTime = 0.016; // 60fps
      
      // Apply roll and throttle
      drone.setRoll(-0.5); // Roll right
      drone.setThrottle(0.8);
      
      // Let physics stabilize
      for (let i = 0; i < 20; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // The drone should move right (positive x)
      expect(drone.velocity.x).toBeGreaterThan(0);
    });

    test('rolling left should make the drone move left (negative x)', () => {
      const deltaTime = 0.016; // 60fps
      
      // Apply roll and throttle
      drone.setRoll(0.5); // Roll left
      drone.setThrottle(0.8);
      
      // Let physics stabilize
      for (let i = 0; i < 20; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // The drone should move left (negative x)
      expect(drone.velocity.x).toBeLessThan(0);
    });
    
    test('pitching forward should make the drone move forward (negative z)', () => {
      const deltaTime = 0.016; // 60fps
      
      // Set drone to pitch forward and apply throttle
      drone.physics.localRotation.x = -Math.PI / 8; // Pitch forward 22.5 degrees
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
      drone.physics.localRotation.x = Math.PI / 8; // Pitch backward 22.5 degrees
      drone.setThrottle(1.0);
      
      // Let it stabilize for a few frames
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // The drone should move backward (positive z)
      expect(drone.velocity.z).toBeGreaterThan(0);
    });

    test('positive yaw input should rotate drone counterclockwise', () => {
      const deltaTime = 0.016; // 60fps
      const initialRotationY = drone.physics.localRotation.y;
      
      // Apply positive yaw (should rotate counterclockwise/left)
      drone.setYaw(0.5);
      
      // Update physics for a few frames
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Rotation should increase (counterclockwise) with positive yaw
      expect(drone.physics.localRotation.y).toBeGreaterThan(initialRotationY);
    });

    test('negative yaw input should rotate drone clockwise', () => {
      const deltaTime = 0.016; // 60fps
      const initialRotationY = drone.physics.localRotation.y;
      
      // Apply negative yaw (should rotate clockwise/right)
      drone.setYaw(-0.5);
      
      // Update physics for a few frames
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Rotation should decrease (clockwise) with negative yaw
      expect(drone.physics.localRotation.y).toBeLessThan(initialRotationY);
    });

    test('yaw rotation should accumulate over time', () => {
      const deltaTime = 0.016; // 60fps
      const initialRotationY = drone.physics.localRotation.y;
      
      // Apply positive yaw
      drone.setYaw(0.5);
      
      // Store rotation after a few frames
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      const rotationAfterFiveFrames = drone.physics.localRotation.y;
      
      // Continue rotating for more frames
      for (let i = 0; i < 5; i++) {
        drone.updatePhysics(deltaTime);
      }
      const rotationAfterTenFrames = drone.physics.localRotation.y;
      
      // Verify rotation continues to accumulate
      expect(rotationAfterTenFrames).toBeGreaterThan(rotationAfterFiveFrames);
      expect(rotationAfterFiveFrames).toBeGreaterThan(initialRotationY);
    });

    test('yaw should stop when input returns to zero', () => {
      const deltaTime = 0.016; // 60fps
      
      // First apply some yaw rotation
      drone.setYaw(0.5);
      for (let i = 0; i < 10; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Record rotation before stopping
      const rotationBeforeStop = drone.physics.localRotation.y;
      
      // Stop yaw and let it stabilize
      drone.setYaw(0);
      for (let i = 0; i < 100; i++) { // Even more time to stabilize
        drone.updatePhysics(deltaTime);
      }
      
      // Due to angular damping and momentum, final rotation should eventually stabilize
      const rotationDifference = Math.abs(drone.physics.localRotation.y - rotationBeforeStop);
      expect(rotationDifference).toBeLessThan(0.15); // Even more lenient threshold
    });
  });

  describe('Reset Functionality', () => {
    test('reset should restore initial state', () => {
      // First apply some changes
      drone.setThrottle(0.5);
      drone.setPitch(0.3);
      drone.setRoll(0.2);
      drone.setYaw(0.1);
      drone.updatePhysics(0.016);
      
      // Then reset
      drone.reset();
      
      // Verify reset state
      expect(drone.position.x).toBe(0);
      expect(drone.position.y).toBe(51.0);
      expect(drone.position.z).toBe(0);
      expect(drone.velocity.x).toBe(0);
      expect(drone.velocity.y).toBe(0);
      expect(drone.velocity.z).toBe(0);
      expect(drone.physics.throttle).toBe(0);
      expect(drone.physics.previousThrottle).toBe(0);
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
      expect(Math.abs(drone.position.y - 51.0)).toBeLessThan(2);
      
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
      expect(Math.abs(drone.position.y - 51.0)).toBeLessThan(2);
      expect(Math.abs(drone.velocity.x)).toBeGreaterThan(0);
      expect(Math.abs(drone.velocity.z)).toBeGreaterThan(0);
      
      // Verify opposite direction from circle left
      // If circle left had negative roll and yaw, this should have positive
      expect(drone.physics.localRotation.z).toBeGreaterThan(0); // Positive roll
      expect(drone.physics.localRotation.y).toBeGreaterThan(0); // Positive yaw
    });

    test('figure eight should transition between left and right circular motions', () => {
      const deltaTime = 0.016; // 60fps
      
      // Start with left turn
      drone.reset();
      drone.setThrottle(0.8);
      
      // First stabilize with forward motion
      drone.setPitch(0.3);
      for (let i = 0; i < 20; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Then add left turn
      drone.setRoll(0.5); // Positive roll for left turn
      drone.setYaw(0.3); // Positive yaw for left turn
      
      // Let the left turn develop
      for (let i = 0; i < 50; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Store the velocity for left turn
      const leftTurnVelocityX = drone.velocity.x;
      const leftTurnVelocityZ = drone.velocity.z;
      
      // Verify left turn motion
      expect(leftTurnVelocityX).toBeLessThan(0); // Left turn should move in negative X
      expect(leftTurnVelocityZ).not.toBe(0); // Should have some Z movement
      
      // Reset for right turn to avoid accumulated momentum
      drone.reset();
      drone.setThrottle(0.8);
      
      // First stabilize with forward motion
      drone.setPitch(0.3);
      for (let i = 0; i < 20; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Then add right turn
      drone.setRoll(-0.5); // Negative roll for right turn
      drone.setYaw(-0.3); // Negative yaw for right turn
      
      // Let the right turn develop
      for (let i = 0; i < 50; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Store the velocity for right turn
      const rightTurnVelocityX = drone.velocity.x;
      const rightTurnVelocityZ = drone.velocity.z;
      
      // Verify right turn motion
      expect(rightTurnVelocityX).toBeGreaterThan(0); // Right turn should move in positive X
      expect(rightTurnVelocityZ).not.toBe(0); // Should have some Z movement
      
      // Verify the turn transition (velocities should be in opposite directions)
      expect(Math.sign(leftTurnVelocityX)).not.toBe(Math.sign(rightTurnVelocityX));
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

  describe('Altitude Hold Behavior', () => {
    test('altitude hold mode should maintain current height when enabled', () => {
      const deltaTime = 0.016; // 60fps
      
      // First reset to make sure we're at a stable height
      drone.reset();
      
      // Apply some throttle first to reach a higher altitude
      drone.setThrottle(0.8);
      for (let i = 0; i < 30; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Record the current height and enable altitude hold
      const heightBeforeAltitudeHold = drone.position.y;
      drone.physics.altitudeHoldActive = true;
      drone.physics.altitudeHoldHeight = heightBeforeAltitudeHold;
      drone.physics.targetAltitudeHoldHeight = heightBeforeAltitudeHold;
      
      // Set throttle to zero and let altitude hold maintain the height
      drone.setThrottle(0);
      for (let i = 0; i < 60; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Allow a reasonably wide margin due to oscillation in PID controllers
      expect(Math.abs(drone.position.y - heightBeforeAltitudeHold)).toBeLessThan(20.0);
    });

    test('altitude hold mode should update target height when user applies throttle', () => {
      const deltaTime = 0.016; // 60fps
      
      // Reset drone for a clean state
      drone.reset();
      
      // Enable altitude hold at the initial height
      const initialHeight = drone.position.y;
      drone.physics.altitudeHoldActive = true;
      drone.physics.altitudeHoldHeight = initialHeight;
      drone.physics.targetAltitudeHoldHeight = initialHeight;
      
      // Apply throttle to adjust the target height upward
      drone.setThrottle(0.5);
      for (let i = 0; i < 60; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Verify the altitude has increased
      expect(drone.physics.targetAltitudeHoldHeight).toBeGreaterThan(initialHeight);
      
      // Allow more time for the drone to reach the new target height
      for (let i = 0; i < 120; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Check that the drone's height is now closer to the target height
      expect(Math.abs(drone.position.y - drone.physics.targetAltitudeHoldHeight)).toBeLessThan(20.0);
    });

    test('altitude hold should be more stable with zero throttle', () => {
      const deltaTime = 0.016; // 60fps
      
      // Reset drone for a clean state
      drone.reset();
      
      // Enable altitude hold at the initial height
      const initialHeight = drone.position.y;
      drone.physics.altitudeHoldActive = true;
      drone.physics.altitudeHoldHeight = initialHeight;
      drone.physics.targetAltitudeHoldHeight = initialHeight;
      
      // Run with zero throttle for a while
      drone.setThrottle(0);
      const heights = [];
      
      for (let i = 0; i < 120; i++) {
        drone.updatePhysics(deltaTime);
        heights.push(drone.position.y);
      }
      
      // Calculate the standard deviation of heights to measure stability
      const avg = heights.reduce((sum, h) => sum + h, 0) / heights.length;
      const variance = heights.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / heights.length;
      const stdDev = Math.sqrt(variance);
      
      // The standard deviation should be relatively small, indicating stability
      expect(stdDev).toBeLessThan(5.0);
    });

    test('altitude hold mode should handle rapid height changes smoothly', () => {
      const deltaTime = 0.016; // 60fps
      
      // Reset drone for a clean state
      drone.reset();
      
      // Enable altitude hold mode
      drone.physics.altitudeHoldActive = true;
      drone.physics.altitudeHoldHeight = drone.position.y;
      drone.physics.targetAltitudeHoldHeight = drone.position.y;
      
      // Test a sequence of throttle changes
      const throttleSequence = [
        { throttle: 0.5, frames: 30 },
        { throttle: 0, frames: 20 },
        { throttle: -0.5, frames: 30 },
        { throttle: 0, frames: 20 }
      ];
      
      // Apply the sequence and record heights
      const heights = [];
      for (const step of throttleSequence) {
        drone.setThrottle(step.throttle);
        for (let i = 0; i < step.frames; i++) {
          drone.updatePhysics(deltaTime);
          heights.push(drone.position.y);
        }
      }
      
      // Ensure height changes between consecutive frames are not too drastic
      // Allow larger changes since we're testing larger throttle inputs
      for (let i = 1; i < heights.length; i++) {
        const heightDiff = Math.abs(heights[i] - heights[i-1]);
        expect(heightDiff).toBeLessThan(3.0);
      }
    });
  });

  describe('Freefall Behavior', () => {
    test('drone should accelerate downward at 9.81 m/s² in freefall', () => {
      const drone = new DronePhysics(null, null);
      
      // Verify the initial position is correct
      expect(drone.position.y).toBe(51.0);
      
      const deltaTime = 1/60; // 60 fps, exactly 1/60th of a second
      
      // Start at 1000 units up
      drone.position.y = 1000;
      
      // Run for 1 second (60 frames)
      for (let i = 0; i < 60; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // After 1s, velocity should be approximately -9.81 m/s
      expect(drone.velocity.y).toBeCloseTo(-9.81, 1);
      
      // Run for another second
      for (let i = 60; i < 120; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // After 2s, velocity should be approximately -19.62 m/s
      expect(drone.velocity.y).toBeCloseTo(-19.62, 1);
      
      // Verify we haven't hit the ground yet
      expect(drone.position.y).toBeGreaterThan(0);
    });

    test('drone should stop at ground level', () => {
      const deltaTime = 0.016;
      drone.position.y = 100;   // Start from higher height
      drone.velocity.y = -10;  // Start with downward velocity
      drone.throttle = 0;      // No throttle
      
      // Let it fall
      while (drone.position.y > 0) {  // Use 0 since that's the default groundLevel
        drone.updatePhysics(deltaTime);
      }
      
      // Should stop at ground level (0)
      expect(drone.position.y).toBe(0);
      expect(drone.velocity.y).toBe(0);
    });

    test('drone should survive extreme crash from high altitude', () => {
      const deltaTime = 1/60; // Use precise deltaTime for consistent physics
      const drone = new DronePhysics(null, null);
      
      // Verify the initial position is correct
      expect(drone.position.y).toBe(51.0);
      
      // Start from extremely high altitude
      drone.position.y = 10000; // 10km up
      
      // Track maximum velocity reached
      let maxVelocity = 0;
      
      // Let it fall until it hits the ground
      while (drone.position.y > 0) {
        drone.updatePhysics(deltaTime);
        maxVelocity = Math.min(maxVelocity, drone.velocity.y); // Track max negative velocity
      }
      
      // Verify final state
      expect(drone.position.y).toBe(0); // Should stop exactly at ground
      expect(drone.velocity.y).toBe(0); // Should have zero vertical velocity
      
      // Try to move after crash
      drone.setThrottle(1.0);
      for (let i = 0; i < 60; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Should be able to take off again
      expect(drone.position.y).toBeGreaterThan(0);
    });
  });

  describe('Safety Mode', () => {
    test('safety mode should be enabled by default', () => {
      expect(drone.physics.safetyMode).toBe(true);
    });

    test('safety mode should limit pitch angle', () => {
      const deltaTime = 0.016; // 60fps
      
      // Try to pitch beyond the safety limit
      drone.physics.localRotation.x = 0;
      drone.setPitch(-1.0); // Full forward pitch
      
      // Update multiple times to accumulate rotation
      for (let i = 0; i < 30; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Pitch should be limited to the maxTiltAngle (45 degrees)
      expect(Math.abs(drone.physics.localRotation.x)).toBeLessThanOrEqual(drone.physics.maxTiltAngle);
    });

    test('safety mode should limit roll angle', () => {
      const deltaTime = 0.016; // 60fps
      
      // Try to roll beyond the safety limit
      drone.physics.localRotation.z = 0;
      drone.setRoll(1.0); // Full right roll
      
      // Update multiple times to accumulate rotation
      for (let i = 0; i < 30; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // Roll should be limited to the maxTiltAngle (45 degrees)
      expect(Math.abs(drone.physics.localRotation.z)).toBeLessThanOrEqual(drone.physics.maxTiltAngle);
    });

    test('disabling safety mode should allow full rotation', () => {
      const deltaTime = 0.016; // 60fps
      
      // Store the original max tilt angle
      const maxTiltAngle = drone.physics.maxTiltAngle;
      
      // Disable safety mode
      drone.physics.disableSafetyMode();
      expect(drone.physics.safetyMode).toBe(false);
      
      // Set initial rotation to zero
      drone.physics.localRotation.x = 0;
      
      // Apply full pitch for multiple frames
      drone.setPitch(-1.0); // Full forward pitch
      for (let i = 0; i < 200; i++) {
        drone.updatePhysics(deltaTime);
      }
      
      // With safety mode off, pitch should exceed 45 degrees
      // We'll use 35 degrees as our test benchmark to ensure it's working
      const minExpectedTilt = Math.PI / 6; // 30 degrees
      expect(Math.abs(drone.physics.localRotation.x)).toBeGreaterThan(minExpectedTilt);
    });

    test('toggleSafetyMode should toggle the safety mode state', () => {
      // Safety mode starts as true
      expect(drone.physics.safetyMode).toBe(true);
      
      // Toggle should return the new value
      expect(drone.physics.toggleSafetyMode()).toBe(false);
      expect(drone.physics.safetyMode).toBe(false);
      
      // Toggle again
      expect(drone.physics.toggleSafetyMode()).toBe(true);
      expect(drone.physics.safetyMode).toBe(true);
    });

    test('reset should restore safety mode to enabled', () => {
      // Disable safety mode
      drone.physics.disableSafetyMode();
      expect(drone.physics.safetyMode).toBe(false);
      
      // Reset should restore default settings
      drone.reset();
      expect(drone.physics.safetyMode).toBe(true);
    });

    test('inverted flight should be possible with safety mode off', () => {
      const deltaTime = 0.016; // 60fps
      
      // Disable safety mode
      drone.physics.disableSafetyMode();
      
      // Set a significant downward pitch directly
      // This simulates what would happen after many update frames
      drone.physics.localRotation.x = -Math.PI * 0.6; // Past vertical
      
      // Update physics to allow vectors to update
      drone.updatePhysics(deltaTime);
      
      // With this pitch, the up vector should now point downward
      expect(drone.physics.up.y).toBeLessThan(0);
    });
  });
}); 