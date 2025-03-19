import { BasicRoutine } from '../flight_routines/basic_routine.js';
import { CircleRoutine } from '../flight_routines/circle_routine.js';
import { FigureEightRoutine } from '../flight_routines/figure_eight_routine.js';
import { OrientationTestRoutine } from '../flight_routines/orientation_test_routine.js';
import { PhysicsTestRoutine } from '../flight_routines/physics_test_routine.js';
import { ThrottleTestRoutine } from '../flight_routines/throttle_test_routine.js';
import { AdvancedManeuversRoutine } from '../flight_routines/advanced_maneuvers_routine.js';
import { DroneModel } from '../models/drone_model.js';
import * as THREE from 'three';

describe('Flight Routine Physics', () => {
  let drone;
  let scene;

  beforeEach(() => {
    scene = new THREE.Scene();
    drone = new DroneModel(scene);
  });

  // Helper function to simulate physics for a given duration
  const simulatePhysics = (step, duration) => {
    const updateInterval = 1/60; // 60fps
    for (let time = 0; time < duration; time += updateInterval) {
      drone.physics.setYaw(step.controls.yaw);
      drone.physics.setPitch(step.controls.pitch);
      drone.physics.setRoll(step.controls.roll);
      drone.physics.setThrottle(step.controls.throttle);
      drone.physics.updatePhysics(updateInterval);
    }
  };

  describe('OrientationTestRoutine physics', () => {
    let routine;

    beforeEach(() => {
      routine = new OrientationTestRoutine();
    });

    test('yaw right step should rotate drone clockwise', () => {
      const yawStep = routine.steps.find(step => 
        step.name.includes("Yaw right for 1 second")
      );
      expect(yawStep).toBeDefined();
      
      expect(drone.physics.localRotation.y).toBe(0);
      simulatePhysics(yawStep, 1.0);
      expect(drone.physics.localRotation.y).toBeLessThan(0);
    });

    test('hover step should maintain current heading', () => {
      drone.physics.localRotation.y = -Math.PI/4;
      
      const hoverStep = routine.steps.find(step => 
        step.name.includes("Hover (maintain heading)")
      );
      expect(hoverStep).toBeDefined();
      expect(hoverStep.controls.yaw).toBeNull();
      
      const initialHeading = drone.physics.localRotation.y;
      simulatePhysics(hoverStep, 1.0);
      expect(drone.physics.localRotation.y).toBeCloseTo(initialHeading, 5);
    });

    test('complete yaw sequence maintains final orientation', () => {
      const yawSequence = routine.steps.filter(step => 
        step.name.includes("Yaw") || step.name.includes("Hover")
      );

      yawSequence.forEach(step => {
        simulatePhysics(step, step.duration / 1000);
      });

      expect(drone.physics.localRotation.y).toBeCloseTo(0, 2);
    });
  });

  describe('BasicRoutine physics', () => {
    let routine;

    beforeEach(() => {
      routine = new BasicRoutine();
    });

    test('forward movement should decrease z position', () => {
      const forwardStep = routine.steps.find(step => step.name === "Forward");
      expect(forwardStep).toBeDefined();

      const initialZ = drone.physics.position.z;
      simulatePhysics(forwardStep, 2.0);
      expect(drone.physics.position.z).toBeLessThan(initialZ);
    });

    test('yaw steps should maintain position', () => {
      const yawStep = routine.steps.find(step => step.name === "Yaw Left");
      expect(yawStep).toBeDefined();

      const initialPos = { ...drone.physics.position };
      simulatePhysics(yawStep, 2.0);
      
      expect(drone.physics.position.x).toBeCloseTo(initialPos.x, 1);
      expect(drone.physics.position.z).toBeCloseTo(initialPos.z, 1);
    });
  });

  describe('CircleRoutine physics', () => {
    let routine;

    beforeEach(() => {
      routine = new CircleRoutine();
    });

    test.skip('circle left should create circular motion', () => {
      const circleStep = routine.steps.find(step => step.name === "Circle Left");
      expect(circleStep).toBeDefined();

      const initialPos = { ...drone.physics.position };
      const positions = [];

      // Record positions during circle
      const duration = 3.0;
      const updateInterval = 1/60;
      for (let time = 0; time < duration; time += updateInterval) {
        simulatePhysics(circleStep, updateInterval);
        positions.push({ ...drone.physics.position });
      }

      // Verify circular motion by checking that:
      // 1. Drone moves away from start position
      // 2. Drone returns close to start position
      // 3. Path includes points both left and right of start
      const midPoint = positions[Math.floor(positions.length / 2)];
      const finalPos = positions[positions.length - 1];

      // Should move away from start
      const midDistance = Math.sqrt(
        Math.pow(midPoint.x - initialPos.x, 2) +
        Math.pow(midPoint.z - initialPos.z, 2)
      );
      expect(midDistance).toBeGreaterThan(1);

      // Should return close to start
      const finalDistance = Math.sqrt(
        Math.pow(finalPos.x - initialPos.x, 2) +
        Math.pow(finalPos.z - initialPos.z, 2)
      );
      expect(finalDistance).toBeLessThan(midDistance);

      // Should have points on both sides of start position
      const hasLeftPoints = positions.some(pos => pos.x < initialPos.x);
      const hasRightPoints = positions.some(pos => pos.x > initialPos.x);
      expect(hasLeftPoints && hasRightPoints).toBe(true);
    });
  });

  describe('FigureEightRoutine physics', () => {
    let routine;

    beforeEach(() => {
      routine = new FigureEightRoutine();
    });

    test('figure eight should cross center point', () => {
      const turnLeft = routine.steps.find(step => step.name === "Turn left");
      const turnRight = routine.steps.find(step => step.name === "Turn right");
      expect(turnLeft).toBeDefined();
      expect(turnRight).toBeDefined();

      const initialPos = { ...drone.physics.position };
      
      // Execute left turn
      simulatePhysics(turnLeft, 2.0);
      const leftTurnPos = { ...drone.physics.position };
      
      // Reset and execute right turn
      drone.physics.position = { ...initialPos };
      simulatePhysics(turnRight, 2.0);
      const rightTurnPos = { ...drone.physics.position };

      // Verify turns go in opposite directions
      expect(Math.sign(leftTurnPos.x - initialPos.x))
        .not.toBe(Math.sign(rightTurnPos.x - initialPos.x));
    });
  });

  describe('ThrottleTestRoutine physics', () => {
    let routine;

    beforeEach(() => {
      routine = new ThrottleTestRoutine();
    });

    test.skip('throttle changes should affect vertical position', () => {
      const fullThrottle = routine.steps.find(step => step.name === "Full Throttle");
      const zeroThrottle = routine.steps.find(step => step.name === "Zero Throttle");
      expect(fullThrottle).toBeDefined();
      expect(zeroThrottle).toBeDefined();

      const initialY = drone.physics.position.y;
      
      // Full throttle should gain height
      simulatePhysics(fullThrottle, 2.0);
      const maxHeight = drone.physics.position.y;
      expect(maxHeight).toBeGreaterThan(initialY);

      // Zero throttle should lose height
      simulatePhysics(zeroThrottle, 2.0);
      expect(drone.physics.position.y).toBeLessThan(maxHeight);
    });
  });
}); 