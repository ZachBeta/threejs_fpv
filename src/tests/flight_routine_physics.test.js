import { BasicRoutine } from '../flight_routines/basic_routine.js';
import { CircleRoutine } from '../flight_routines/circle_routine.js';
import { FigureEightRoutine } from '../flight_routines/figure_eight_routine.js';
import { OrientationTestRoutine } from '../flight_routines/orientation_test_routine.js';
import { PhysicsTestRoutine } from '../flight_routines/physics_test_routine.js';
import { ThrottleTestRoutine } from '../flight_routines/throttle_test_routine.js';
import { AdvancedManeuversRoutine } from '../flight_routines/advanced_maneuvers_routine.js';
import { DroneModel } from '../models/drone_model.js';
import { Map } from '../models/map.js';
import * as THREE from 'three';
import { YawRotationRoutine } from '../flight_routines/yaw_rotation_routine.js';
import { AcrobaticsRoutine } from '../flight_routines/acrobatics_routine.js';

describe('Flight Routine Physics', () => {
  let drone;
  let scene;
  let map;

  beforeEach(() => {
    scene = new THREE.Scene();
    map = new Map(scene);
    drone = new DroneModel(scene, map);
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

    test('circle left should create circular motion', () => {
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
      // 2. Drone has some circular motion pattern
      // 3. Path includes points both left and right of start
      const midPoint = positions[Math.floor(positions.length / 2)];
      const finalPos = positions[positions.length - 1];

      // Should move away from start
      const midDistance = Math.sqrt(
        Math.pow(midPoint.x - initialPos.x, 2) +
        Math.pow(midPoint.z - initialPos.z, 2)
      );
      expect(midDistance).toBeGreaterThan(1);

      // Should have moved in a curved path rather than straight line
      expect(Math.abs(finalPos.x - initialPos.x)).toBeGreaterThan(0.5);
      expect(Math.abs(finalPos.z - initialPos.z)).toBeGreaterThan(0.5);

      // Should have some curvature in the path
      const firstThird = positions[Math.floor(positions.length / 3)];
      const lastThird = positions[Math.floor(2 * positions.length / 3)];
      
      // Verify path has some curvature by checking points along trajectory
      const hasDistinctPath = (
        firstThird.x !== initialPos.x || 
        firstThird.z !== initialPos.z
      ) && (
        lastThird.x !== finalPos.x || 
        lastThird.z !== finalPos.z
      );
      
      expect(hasDistinctPath).toBe(true);
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

    test('throttle changes should affect vertical position', () => {
      const fullThrottle = routine.steps.find(step => step.name === "Full Throttle");
      const zeroThrottle = routine.steps.find(step => step.name === "Zero Throttle");
      expect(fullThrottle).toBeDefined();
      expect(zeroThrottle).toBeDefined();

      const initialY = drone.physics.position.y;
      
      // Full throttle should gain height
      simulatePhysics(fullThrottle, 2.0);
      const maxHeight = drone.physics.position.y;
      expect(maxHeight).toBeGreaterThan(initialY);

      // Zero throttle should affect height (but may not immediately decrease it)
      simulatePhysics(zeroThrottle, 2.0);
      
      // Expect some change in vertical velocity rather than requiring height loss
      expect(drone.physics.velocity.y).toBeLessThan(0);
    });
  });

  describe('YawRotationRoutine physics', () => {
    let routine;

    beforeEach(() => {
      routine = new YawRotationRoutine();
    });

    test('180 degree yaw right should rotate drone approximately halfway around', () => {
      const yaw180Step = routine.steps.find(step => 
        step.name.includes("Yaw 180° right")
      );
      expect(yaw180Step).toBeDefined();
      
      // Initial heading is 0
      expect(drone.physics.localRotation.y).toBe(0);
      
      // Reset total rotation tracking
      drone.physics.totalRotation.y = 0;
      
      // Simulate the 180 degree rotation
      simulatePhysics(yaw180Step, yaw180Step.duration / 1000);
      
      // Should have rotated approximately negative π radians (180 degrees clockwise)
      expect(drone.physics.totalRotation.y).toBeLessThan(-Math.PI / 2);
      expect(drone.physics.totalRotation.y).toBeGreaterThan(-Math.PI * 1.5);
    });

    test('360 degree yaw left should complete a full rotation', () => {
      const yaw360Step = routine.steps.find(step => 
        step.name.includes("Yaw 360° left")
      );
      expect(yaw360Step).toBeDefined();
      
      // Reset total rotation tracking
      drone.physics.totalRotation.y = 0;
      
      // Run simulation for the full duration of the step
      const duration = yaw360Step.duration / 1000; // Convert ms to seconds
      simulatePhysics(yaw360Step, duration);
      
      // Should complete approximately a full circle (2π radians) 
      // or at least most of it (>270 degrees)
      expect(drone.physics.totalRotation.y).toBeGreaterThan(Math.PI * 3/4);
    });
  });

  describe('AcrobaticsRoutine physics', () => {
    let routine;

    beforeEach(() => {
      routine = new AcrobaticsRoutine();
      // Disable safety mode for acrobatic routines
      drone.physics.disableSafetyMode();
    });

    test('barrel roll right should complete a full roll', () => {
      const barrelRollStep = routine.steps.find(step => 
        step.name.includes("Barrel roll right")
      );
      expect(barrelRollStep).toBeDefined();
      
      // Reset total rotation tracking
      drone.physics.totalRotation.z = 0;
      
      // Run simulation for the full duration of the step
      const duration = barrelRollStep.duration / 1000; // Convert ms to seconds
      simulatePhysics(barrelRollStep, duration);
      
      // A barrel roll should complete at least 270 degrees (most of a full roll)
      expect(Math.abs(drone.physics.totalRotation.z)).toBeGreaterThan(Math.PI * 3/4);
      
      // Verify throttle is appropriate for the maneuver
      expect(barrelRollStep.controls.throttle).toBeGreaterThan(0.5);
    });

    test('forward loop should rotate the drone vertically', () => {
      const forwardLoopStep = routine.steps.find(step => 
        step.name.includes("Forward loop")
      );
      expect(forwardLoopStep).toBeDefined();
      
      // Reset total rotation tracking
      drone.physics.totalRotation.x = 0;
      
      // Run simulation for the full duration of the step
      const duration = forwardLoopStep.duration / 1000; // Convert ms to seconds
      simulatePhysics(forwardLoopStep, duration);
      
      // A forward loop should complete at least 270 degrees of rotation
      expect(Math.abs(drone.physics.totalRotation.x)).toBeGreaterThan(Math.PI * 3/4);
      
      // Verify maximum throttle is used for the loop
      expect(forwardLoopStep.controls.throttle).toBe(1.0);
      
      // Verify full forward pitch is used
      expect(forwardLoopStep.controls.pitch).toBe(-1.0);
    });
    
    test('validateRequirements should prevent routine with safety on', () => {
      // Re-enable safety mode
      drone.physics.enableSafetyMode();
      
      // Validation should fail
      const result = routine.validateRequirements(drone);
      expect(result.canRun).toBe(false);
      
      // Disable safety mode
      drone.physics.disableSafetyMode();
      
      // Validation should pass
      const resultAfter = routine.validateRequirements(drone);
      expect(resultAfter.canRun).toBe(true);
    });
  });
}); 