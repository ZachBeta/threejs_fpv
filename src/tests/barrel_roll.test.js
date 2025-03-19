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
    drone.physics.position.y = 50; // Increased altitude to ensure complete roll
    
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
    let fullRotationAchieved = false;
    
    // Store complete roll progression for analysis
    const rollHistory = [];
    const upVectorHistory = [];
    let lastRoll = drone.physics.localRotation.z;
    let cumulativeRoll = 0;
    
    for (let time = 0; time < duration; time += deltaTime) {
      drone.physics.updatePhysics(deltaTime);
      
      // Store roll angle history
      rollHistory.push(drone.physics.localRotation.z);
      upVectorHistory.push({ ...drone.physics.up });
      
      // Check if we've passed through an upside-down position
      if (drone.physics.up.y < -0.5) {
        passedUpsideDown = true;
      }
      
      // Track min/max roll for analysis
      maxRoll = Math.max(maxRoll, drone.physics.localRotation.z);
      minRoll = Math.min(minRoll, drone.physics.localRotation.z);
      
      // Track cumulative roll with wrap-around handling
      let rollDiff = drone.physics.localRotation.z - lastRoll;
      
      // Handle angle wraparound
      if (rollDiff > Math.PI) rollDiff -= 2 * Math.PI;
      if (rollDiff < -Math.PI) rollDiff += 2 * Math.PI;
      
      cumulativeRoll += rollDiff;
      lastRoll = drone.physics.localRotation.z;
      
      // Check if we've completed a full rotation
      if (Math.abs(cumulativeRoll) >= 2 * Math.PI) {
        fullRotationAchieved = true;
        // We can break early if we've achieved a full rotation
        break;
      }
    }
    
    // Log results for debugging
    console.log('Max roll:', maxRoll);
    console.log('Min roll:', minRoll);
    console.log('Passed upside down:', passedUpsideDown);
    console.log('Final up vector:', drone.physics.up);
    console.log('Full rotation achieved:', fullRotationAchieved);
    console.log('Cumulative roll (radians):', cumulativeRoll);
    console.log('Cumulative roll (degrees):', cumulativeRoll * 180 / Math.PI);
    
    // Calculate the roll range properly with modulo math
    const normalizedRolls = rollHistory.map(r => ((r % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
    const rollRange = Math.max(...normalizedRolls) - Math.min(...normalizedRolls);
    console.log('Normalized roll range (degrees):', rollRange * 180 / Math.PI);
    
    // Calculate up vector progression 
    const upVectorYRange = Math.max(...upVectorHistory.map(v => v.y)) - 
                           Math.min(...upVectorHistory.map(v => v.y));
    console.log('Up vector Y range:', upVectorYRange);
    
    // A proper barrel roll must pass through an upside-down position
    expect(passedUpsideDown).toBe(true);
    
    // Verify the roll covers a significant range of angles
    expect(Math.abs(cumulativeRoll)).toBeGreaterThanOrEqual(Math.PI * 1.5); // At least 270 degrees
    
    // Verify our up vector goes through proper range (-1 to 1 in Y axis)
    expect(upVectorYRange).toBeGreaterThan(1.5); // Should cover most of the full range (-1 to 1)
    
    // Check if either we achieved a full rotation or got very close
    expect(fullRotationAchieved || Math.abs(cumulativeRoll) > Math.PI * 1.8).toBe(true);
    
    // Verify the drone ended in a relatively stable orientation
    // We don't need to be precisely level but shouldn't be extremely tilted
    const finalRoll = Math.abs(((drone.physics.localRotation.z % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
    const isNearLevel = finalRoll < Math.PI / 4 || finalRoll > Math.PI * 7 / 4;
    const isNearInverted = finalRoll > Math.PI * 3 / 4 && finalRoll < Math.PI * 5 / 4;
    
    // Either near level or near inverted is acceptable (we could end either way depending on timing)
    expect(isNearLevel || isNearInverted).toBe(true);
  });
  
  test('barrel roll should not lose significant altitude', () => {
    // Start at a safe height
    drone.physics.position.y = 70; // Increased to match routine minimum altitude
    
    // Set up for a strong barrel roll
    drone.setThrottle(1.0); // Use full throttle (updated to match routine)
    drone.setPitch(0.25);    // Increased forward pitch (updated to match routine)
    drone.setRoll(1.0);      // Full right roll
    drone.setYaw(0.3);       // Coordinated yaw
    
    // Store initial position
    const initialY = drone.physics.position.y;
    
    // Simulate physics at 60fps for the duration of a typical barrel roll step (3 seconds)
    const deltaTime = 1/60;
    const duration = 3; // 3 seconds for a typical barrel roll
    
    // Track positions during the maneuver
    const altitudeHistory = [];
    
    for (let time = 0; time < duration; time += deltaTime) {
      drone.physics.updatePhysics(deltaTime);
      altitudeHistory.push(drone.physics.position.y);
    }
    
    // Calculate altitude metrics
    const finalY = drone.physics.position.y;
    const altitudeLoss = initialY - finalY;
    const minAltitude = Math.min(...altitudeHistory);
    const maxAltitudeLoss = initialY - minAltitude;
    
    // Log results
    console.log('Initial altitude:', initialY);
    console.log('Final altitude:', finalY);
    console.log('Altitude loss:', altitudeLoss);
    console.log('Maximum altitude loss:', maxAltitudeLoss);
    
    // A well-executed barrel roll should not lose excessive altitude
    // Real aircraft do lose some altitude during barrel rolls, so allow for that
    expect(altitudeLoss).toBeLessThan(35); // Allow for reasonable altitude loss during acrobatics
    expect(maxAltitudeLoss).toBeLessThan(40); // Maximum dip during maneuver should be limited
  });
}); 