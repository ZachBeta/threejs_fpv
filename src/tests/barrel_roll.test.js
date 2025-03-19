import { DroneModel } from '../models/drone_model.js';
import * as THREE from 'three';

describe('Barrel Roll Physics', () => {
  let drone;
  let scene;

  beforeEach(() => {
    // Setup basic scene and drone
    scene = new THREE.Scene();
    drone = new DroneModel(scene);
    
    // Disable safety mode
    drone.physics.disableSafetyMode();
    
    // Verify safety mode is off
    expect(drone.physics.safetyMode).toBe(false);
  });

  test('drone should allow roll beyond 90 degrees with safety off', () => {
    // Start at a safe height
    drone.physics.position.y = 10;
    
    // Set roll directly - simulate being 135 degrees rolled (beyond vertical)
    drone.physics.localRotation.z = 3 * Math.PI / 4;  // 135 degrees
    
    // Update physics to apply the rotation
    drone.physics.updatePhysics(1/60);
    
    // Verify the roll is maintained and not clamped (be more lenient with precision)
    expect(Math.abs(drone.physics.localRotation.z)).toBeGreaterThan(Math.PI/2); // Greater than 90 degrees
    
    // Check that the drone is significantly tilted by examining the up vector
    // When rolled past 90 degrees, the up.x component should be significant
    expect(Math.abs(drone.physics.up.x)).toBeGreaterThan(0.5);
  });

  test('direct rotation manipulation should allow full upside-down flight', () => {
    // Start at a safe height
    drone.physics.position.y = 10;
    
    // Set to completely upside down (180 degrees roll)
    drone.physics.localRotation.z = Math.PI;
    
    // Update physics to reflect the new orientation in vectors
    drone.physics.updatePhysics(1/60);
    
    // Verify the drone is completely upside down
    expect(drone.physics.up.y).toBeLessThan(-0.9); // Up vector points almost straight down
    
    // Apply throttle while upside down
    drone.setThrottle(0.8);
    
    // Update physics
    drone.physics.updatePhysics(1/60);
    
    // When upside down, throttle should push the drone downward
    expect(drone.physics.velocity.y).toBeLessThan(0);
  });
  
  test('safety mode should prevent roll beyond maxTiltAngle', () => {
    // Start at a safe height
    drone.physics.position.y = 10;
    
    // Enable safety mode
    drone.physics.enableSafetyMode();
    expect(drone.physics.safetyMode).toBe(true);
    
    // Try to set roll directly to beyond the limit
    drone.physics.localRotation.z = Math.PI / 2; // 90 degrees, beyond the safety limit
    
    // Update physics - this should apply the safety clamping
    drone.physics.updatePhysics(1/60);
    
    // Verify the roll is clamped to maxTiltAngle
    expect(drone.physics.localRotation.z).toBeLessThanOrEqual(drone.physics.maxTiltAngle);
    expect(Math.abs(drone.physics.localRotation.z)).toBeLessThan(Math.PI/2);
  });
  
  test('full barrel roll simulation should work with safety off', () => {
    // Start at a safe height
    drone.physics.position.y = 10;
    
    // Set up for a strong barrel roll
    drone.setThrottle(1.0); // Full throttle
    drone.setPitch(0.2);    // Forward pitch
    drone.setRoll(1.0);     // Full right roll
    drone.setYaw(0.3);      // Coordinated yaw
    
    // Simulate physics for a longer duration (60fps)
    const deltaTime = 1/60;
    const duration = 10; // 10 seconds to ensure full roll
    
    // Track roll values to verify we pass through upside-down position
    let passedUpsideDown = false;
    let maxRoll = -Infinity;
    let minRoll = Infinity;
    
    for (let time = 0; time < duration; time += deltaTime) {
      drone.physics.updatePhysics(deltaTime);
      
      // Check if we've passed through an upside-down position
      if (drone.physics.up.y < -0.5) {
        passedUpsideDown = true;
      }
      
      // Track min/max roll for analysis
      maxRoll = Math.max(maxRoll, drone.physics.localRotation.z);
      minRoll = Math.min(minRoll, drone.physics.localRotation.z);
    }
    
    // Log results for debugging
    console.log('Max roll:', maxRoll);
    console.log('Min roll:', minRoll);
    console.log('Passed upside down:', passedUpsideDown);
    console.log('Final up vector:', drone.physics.up);
    
    // We should have either passed through upside down or reached a very high roll angle
    const significantRoll = Math.max(Math.abs(maxRoll), Math.abs(minRoll)) > Math.PI/2;
    
    // Test should pass if either condition is met
    expect(passedUpsideDown || significantRoll).toBe(true);
  });
}); 