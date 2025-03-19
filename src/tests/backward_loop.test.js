import { DronePhysics } from '../drone_physics.js';
import * as THREE from 'three';

describe('Backward Loop Physics', () => {
  let physics;

  beforeEach(() => {
    // Create a fresh physics instance for each test
    physics = new DronePhysics();
    
    // Disable safety mode
    physics.safetyMode = false;
    
    // Start at a safe height
    physics.position.y = 150; // Extra height for full backward loop
  });

  test('backward loop physics simulation should complete a full 360 rotation', () => {
    // Setup for backward loop
    physics.setThrottle(1.0); // Full throttle
    physics.setPitch(1.0);    // Full backward pitch
    
    // Simulate physics for a duration that should allow a complete loop
    const deltaTime = 1/60; // 60fps
    const duration = 6;     // 6 seconds should be enough for a complete backward loop
    
    // Track the pitch rotation throughout the maneuver
    const pitchHistory = [];
    const upVectorHistory = [];
    let passedUpsideDown = false;
    let cumulativePitch = 0;
    let lastPitch = physics.localRotation.x;
    
    // Perform physics simulation
    for (let time = 0; time < duration; time += deltaTime) {
      // Update physics
      physics.updatePhysics(deltaTime);
      
      // Track current pitch angle
      const currentPitch = physics.localRotation.x;
      pitchHistory.push(currentPitch);
      
      // Track up vector
      upVectorHistory.push({...physics.up});
      
      // Check if we've passed through upside-down position
      if (physics.up.y < -0.5) {
        passedUpsideDown = true;
      }
      
      // Calculate the change in pitch accounting for wraparound
      let pitchDelta = currentPitch - lastPitch;
      if (pitchDelta < -Math.PI) pitchDelta += 2 * Math.PI;
      if (pitchDelta > Math.PI) pitchDelta -= 2 * Math.PI;
      
      // Accumulate the total rotation
      cumulativePitch += pitchDelta;
      lastPitch = currentPitch;
    }
    
    // Log results for analysis
    console.log('Total accumulated pitch:', cumulativePitch);
    console.log('Final pitch angle:', physics.localRotation.x);
    console.log('Final up vector:', physics.up);
    console.log('Passed upside down:', passedUpsideDown);
    
    // Verify requirements for a proper backward loop
    
    // 1. We should have passed through an upside-down position
    expect(passedUpsideDown).toBe(true);
    
    // 2. Accumulated pitch should be approximately 2π (360 degrees) or more
    // Allow some tolerance (at least 270 degrees)
    expect(Math.abs(cumulativePitch)).toBeGreaterThan(Math.PI * 3/2);
    
    // Ideally, we want a full 360-degree loop
    expect(Math.abs(cumulativePitch)).toBeGreaterThanOrEqual(Math.PI * 1.8); // At least 90% of a full loop
  });

  test('inspect orientation changes during backward loop', () => {
    // Setup for backward loop
    physics.setThrottle(1.0); // Full throttle
    physics.setPitch(1.0);    // Full backward pitch
    
    // Simulate physics for a full loop
    const deltaTime = 1/60; // 60fps
    const duration = 6;     // 6 seconds should be enough for a complete backward loop
    
    // Track quaternion values and up vectors
    const upVectors = [];
    const rotations = [];
    const times = [];
    
    // Perform simulation
    for (let time = 0; time < duration; time += deltaTime) {
      // Update physics
      physics.updatePhysics(deltaTime);
      
      // Store time
      times.push(time);
      
      // Store direction vectors to verify orientation is updating correctly
      upVectors.push(physics.up.clone());
      
      // Store local rotation
      rotations.push({...physics.localRotation});
    }
    
    // Define key points to check
    const keyPoints = [
      { label: "Start", frame: 0 },
      { label: "1 second", frame: Math.floor(1 / deltaTime) },
      { label: "2 seconds", frame: Math.floor(2 / deltaTime) },
      { label: "3 seconds", frame: Math.floor(3 / deltaTime) },
      { label: "4 seconds", frame: Math.floor(4 / deltaTime) },
      { label: "5 seconds", frame: Math.floor(5 / deltaTime) },
      { label: "End", frame: upVectors.length - 1 }
    ];
    
    // Log orientation data at key points
    console.log("\nOrientation data at key points:");
    for (const point of keyPoints) {
      const frame = point.frame;
      if (frame < upVectors.length) {
        const up = upVectors[frame];
        const rot = rotations[frame];
        console.log(`${point.label} (frame ${frame}, time ${times[frame].toFixed(2)}s):`);
        console.log(`  Up vector: (${up.x.toFixed(3)}, ${up.y.toFixed(3)}, ${up.z.toFixed(3)})`);
        console.log(`  Rotation: (pitch: ${rot.x.toFixed(3)}, yaw: ${rot.y.toFixed(3)}, roll: ${rot.z.toFixed(3)})`);
      }
    }
    
    // Now that we have the actual data, we can create meaningful tests
    
    // Verify the physics engine is consistent
    expect(upVectors[0].y).toBeGreaterThan(0.9); // Start pointing up
    
    // Verify we made a full loop (accumulated sufficient rotation)
    const finalUpY = upVectors[upVectors.length - 1].y;
    expect(finalUpY).toBeGreaterThan(0.7); // After loop, should be pointing up again
    
    // Verify proper motion by checking if we pass through an upside down phase
    let minUpY = 1.0;
    for (const up of upVectors) {
      minUpY = Math.min(minUpY, up.y);
    }
    expect(minUpY).toBeLessThan(0); // At some point, we should be at least partially inverted
  });

  test('backward loop quaternion rotation should be smooth', () => {
    // Setup for backward loop
    physics.setThrottle(1.0); // Full throttle
    physics.setPitch(1.0);    // Full backward pitch
    
    // Simulate physics and track orientation
    const deltaTime = 1/60; // 60fps
    const duration = 6;     // 6 seconds
    const frameCount = Math.ceil(duration / deltaTime);
    
    // State snapshots for analysis
    const orientationSnapshots = [];
    
    // Perform simulation
    for (let frame = 0; frame < frameCount; frame++) {
      // Update physics
      physics.updatePhysics(deltaTime);
      
      // Take snapshot of orientation state
      orientationSnapshots.push({
        frame,
        time: frame * deltaTime,
        euler: { ...physics.localRotation },
        quaternion: physics.quaternion.clone(),
        up: physics.up.clone(),
        forward: physics.forward.clone()
      });
    }
    
    // Analyze the quaternion transitions between frames
    let maxQuaternionJump = 0;
    
    for (let i = 1; i < orientationSnapshots.length; i++) {
      const prev = orientationSnapshots[i-1];
      const curr = orientationSnapshots[i];
      
      // Check for quaternion jumps using dot product
      // The dot product of two quaternions gives the cosine of half the angle between them
      const quatDot = Math.abs(
        prev.quaternion.x * curr.quaternion.x +
        prev.quaternion.y * curr.quaternion.y +
        prev.quaternion.z * curr.quaternion.z +
        prev.quaternion.w * curr.quaternion.w
      );
      const quatAngleDiff = Math.acos(Math.min(1, quatDot)) * 2 * (180 / Math.PI);
      maxQuaternionJump = Math.max(maxQuaternionJump, quatAngleDiff);
      
      // Log any extreme jumps for debugging
      if (quatAngleDiff > 10) {
        console.log(`Large quaternion jump of ${quatAngleDiff.toFixed(2)} degrees at frame ${i}, time ${curr.time.toFixed(2)}s`);
      }
    }
    
    // Log results
    console.log('Max quaternion jump between frames (degrees):', maxQuaternionJump);
    
    // We expect smooth transitions with no large jumps in quaternion space
    // This is the key test since quaternions avoid the gimbal lock issues of Euler angles
    expect(maxQuaternionJump).toBeLessThan(15.0); // No sudden flips (15 degrees max change per frame)
  });
});

// Helper function to normalize an angle to [-π, π] range
function normalizeAngle(angle) {
  return ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;
} 