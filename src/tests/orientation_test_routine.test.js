import { OrientationTestRoutine } from '../flight_routines/orientation_test_routine.js';
import { DroneModel } from '../models/drone_model.js';
import * as THREE from 'three';

describe('OrientationTestRoutine', () => {
  let routine;
  let drone;
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
    drone = new DroneModel(scene);
    routine = new OrientationTestRoutine();
  });

  describe('yaw behavior', () => {
    test('yaw right step should rotate drone clockwise', () => {
      // Get the yaw right step
      const yawStep = routine.steps.find(step => 
        step.name.includes("Yaw right for 2 seconds")
      );
      expect(yawStep).toBeDefined();
      
      // Initial heading should be 0
      expect(drone.physics.localRotation.y).toBe(0);

      // Apply yaw control for 2 seconds
      const stepDuration = 2.0; // seconds
      const updateInterval = 1/60; // 60fps

      // Simulate the step duration
      for (let time = 0; time < stepDuration; time += updateInterval) {
        drone.physics.setYaw(yawStep.controls.yaw);
        drone.physics.updatePhysics(updateInterval);
      }

      // Should have rotated clockwise (negative y rotation)
      expect(drone.physics.localRotation.y).toBeLessThan(0);
    });

    test('hover step should maintain current heading', () => {
      // First rotate drone 45 degrees
      drone.physics.localRotation.y = -Math.PI/4; // -45 degrees
      
      // Get the hover step
      const hoverStep = routine.steps.find(step => 
        step.name.includes("Hover (maintain heading)")
      );
      expect(hoverStep).toBeDefined();
      expect(hoverStep.controls.yaw).toBeNull(); // Should be null to maintain heading
      
      // Apply hover for 1 second
      const stepDuration = 1;
      const updateInterval = 1/60;
      const initialHeading = drone.physics.localRotation.y;

      // Simulate the step duration
      for (let time = 0; time < stepDuration; time += updateInterval) {
        drone.physics.setYaw(hoverStep.controls.yaw);
        drone.physics.updatePhysics(updateInterval);
      }

      // Heading should remain unchanged
      expect(drone.physics.localRotation.y).toBeCloseTo(initialHeading, 5);
    });

    test('complete yaw sequence maintains final orientation', () => {
      const yawSequence = routine.steps.filter(step => 
        step.name.includes("Yaw") || step.name.includes("Hover")
      );

      // Execute the sequence
      let currentTime = 0;
      yawSequence.forEach(step => {
        const updateInterval = 1/60;
        const stepDuration = step.duration / 1000; // Convert ms to seconds
        
        for (let time = 0; time < stepDuration; time += updateInterval) {
          drone.physics.setYaw(step.controls.yaw);
          drone.physics.updatePhysics(updateInterval);
          currentTime += updateInterval;
        }
      });

      // After sequence, should be back at original heading
      expect(drone.physics.localRotation.y).toBeCloseTo(0, 2);
    });
  });
}); 