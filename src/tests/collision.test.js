import * as THREE from 'three';
import { DronePhysics } from '../drone_physics.js';
import { Map } from '../models/map.js';

describe('Collision Physics Tests', () => {
  let scene, drone, map;
  
  beforeEach(() => {
    // Create a scene for collision objects
    scene = new THREE.Scene();
    
    // Initialize the map with the landing pad
    map = new Map(scene);
    
    // Get start position from map
    const startPosition = map.getLandingPadPosition();
    
    // Create drone physics with scene for collision detection and start position
    drone = new DronePhysics(scene, startPosition);
  });
  
  test('high velocity drone should not fall through landing pad', () => {
    // Set drone to a position above the landing pad
    drone.position.x = 0;
    drone.position.y = 100; // High above landing pad at y=50
    drone.position.z = 0;
    
    // Give it a very high downward velocity
    drone.velocity.y = -50; // Extreme downward velocity
    
    // Run physics updates until drone reaches landing pad
    const deltaTime = 1/60; // Simulate at 60fps
    let stepCount = 0;
    const maxSteps = 300; // Reasonable limit to avoid infinite loop
    
    // Track the minimum y position to ensure it never goes below the landing pad
    let minY = drone.position.y;
    let landingPadY = 50.0; // Known landing pad height
    
    // Simulate falling
    while (drone.position.y > landingPadY && stepCount < maxSteps) {
      drone.updatePhysics(deltaTime);
      stepCount++;
      
      // Track minimum height
      minY = Math.min(minY, drone.position.y);
    }
    
    // Verify the drone did not pass through the landing pad
    expect(drone.position.y).toBeGreaterThanOrEqual(landingPadY);
    expect(minY).toBeGreaterThanOrEqual(landingPadY);
    
    // Verify the vertical velocity was zeroed out upon landing
    expect(drone.velocity.y).toBe(0);
  });
  
  test('drone should not pass through landing pad when falling at terminal velocity', () => {
    // Set drone to a position extremely high above the landing pad
    drone.position.x = 0;
    drone.position.y = 1000; // Very high above landing pad
    drone.position.z = 0;
    
    // Start with zero velocity, it will accelerate due to gravity
    drone.velocity.y = 0;
    
    // Run physics updates until drone reaches landing pad
    const deltaTime = 1/60; // Simulate at 60fps
    let stepCount = 0;
    const maxSteps = 1000; // Increased limit for longer fall
    
    // Track the minimum y position to ensure it never goes below the landing pad
    let minY = drone.position.y;
    let landingPadY = 50.0; // Known landing pad height
    let maxVelocity = 0; // Track the maximum downward velocity
    
    // Simulate falling
    while (drone.position.y > landingPadY && stepCount < maxSteps) {
      drone.updatePhysics(deltaTime);
      stepCount++;
      
      // Track minimum height and maximum velocity
      minY = Math.min(minY, drone.position.y);
      maxVelocity = Math.min(maxVelocity, drone.velocity.y); // More negative = higher downward speed
    }
    
    // Verify the drone did not pass through the landing pad
    expect(drone.position.y).toBeGreaterThanOrEqual(landingPadY);
    expect(minY).toBeGreaterThanOrEqual(landingPadY);
    
    // Ensure we reached a significant velocity (terminal velocity)
    expect(Math.abs(maxVelocity)).toBeGreaterThan(20);
    
    // Verify the vertical velocity was zeroed out upon landing
    expect(drone.velocity.y).toBe(0);
  });
  
  test('drone teleported with extreme velocity should not pass through landing pad', () => {
    // Set drone to a position far above the landing pad
    drone.position.x = 0;
    drone.position.y = 55; // Just above landing pad at y=50
    drone.position.z = 0;
    
    // Give it an unrealistically high downward velocity (teleportation-like)
    drone.velocity.y = -1000; // Extreme velocity that would normally cause tunneling
    
    // Single physics step which would normally tunnel through the landing pad
    const deltaTime = 1/60; // Simulate at 60fps
    drone.updatePhysics(deltaTime);
    
    // Landing pad height
    const landingPadY = 50.0;
    
    // Verify the drone did not pass through the landing pad
    expect(drone.position.y).toBeGreaterThanOrEqual(landingPadY);
    
    // Verify the vertical velocity was zeroed out upon landing
    expect(drone.velocity.y).toBe(0);
  });
}); 