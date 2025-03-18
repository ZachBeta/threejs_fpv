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
    test('yawRight90 step should rotate drone 90 degrees clockwise', () => {
      // Get the yaw right step
      const yawStep = routine.steps.find(step => 
        step.name.includes("Yaw 90 degrees right")
      );
      expect(yawStep).toBeDefined();
      
      // Initial heading should be 0
      expect(drone.physics.localRotation.y).toBe(0);

      // Apply yaw control for 1.5 seconds (duration of step)
      const stepDuration = 1.5; // seconds
      const updateInterval = 1/60; // 60fps

      // Simulate the step duration
      for (let time = 0; time < stepDuration; time += updateInterval) {
        drone.physics.setYaw(yawStep.controls.yaw);
        drone.physics.updatePhysics(updateInterval);
      }

      // Final heading should be -90 degrees (-π/2 radians clockwise)
      expect(drone.physics.localRotation.y).toBeCloseTo(-Math.PI/2, 2);
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