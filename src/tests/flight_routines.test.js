import { BasicRoutine } from '../flight_routines/basic_routine.js';
import { CircleRoutine } from '../flight_routines/circle_routine.js';
import { FigureEightRoutine } from '../flight_routines/figure_eight_routine.js';
import { OrientationTestRoutine } from '../flight_routines/orientation_test_routine.js';
import { PhysicsTestRoutine } from '../flight_routines/physics_test_routine.js';
import { ThrottleTestRoutine } from '../flight_routines/throttle_test_routine.js';
import { AdvancedManeuversRoutine } from '../flight_routines/advanced_maneuvers_routine.js';
import { YawTestRoutine } from '../flight_routines/yaw_test_routine.js';
import { BasicSteps } from '../flight_routines/routine_steps.js';
import { YawRotationRoutine } from '../flight_routines/yaw_rotation_routine.js';
import { AcrobaticsRoutine } from '../flight_routines/acrobatics_routine.js';

describe('Flight Routines', () => {
  // Helper function to validate basic step structure
  const validateStep = (step) => {
    expect(step).toHaveProperty('name');
    expect(step).toHaveProperty('duration');
    expect(step).toHaveProperty('controls');
    expect(step.controls).toHaveProperty('throttle');
    expect(step.controls).toHaveProperty('pitch');
    expect(step.controls).toHaveProperty('roll');
    expect(step.controls).toHaveProperty('yaw');
  };

  // Helper function to validate routine structure
  const validateRoutine = (routine) => {
    expect(routine).toHaveProperty('name');
    expect(routine).toHaveProperty('description');
    expect(routine).toHaveProperty('steps');
    expect(Array.isArray(routine.steps)).toBe(true);
    expect(routine.steps.length).toBeGreaterThan(0);
    
    // Every routine should start with takeoff and end with land
    expect(routine.steps[0]).toEqual(BasicSteps.takeOff);
    expect(routine.steps[routine.steps.length - 1]).toEqual(BasicSteps.land);
    
    // Validate each step
    routine.steps.forEach(validateStep);
  };

  describe('BasicRoutine', () => {
    let routine;

    beforeEach(() => {
      routine = new BasicRoutine();
    });

    test('should have valid structure', () => {
      validateRoutine(routine);
    });

    test('should include all basic movements', () => {
      const stepNames = routine.steps.map(step => step.name);
      expect(stepNames).toContain('Forward');
      expect(stepNames).toContain('Backward');
      expect(stepNames).toContain('Left');
      expect(stepNames).toContain('Right');
      expect(stepNames).toContain('Yaw Left');
      expect(stepNames).toContain('Yaw Right');
    });

    test('should have hover steps between movements', () => {
      const movements = ['Forward', 'Backward', 'Left', 'Right', 'Yaw Left', 'Yaw Right'];
      movements.forEach(movement => {
        const movementIndex = routine.steps.findIndex(step => step.name === movement);
        expect(movementIndex).toBeGreaterThan(0);
        expect(routine.steps[movementIndex + 1].name).toBe('Hover');
      });
    });
  });

  describe('CircleRoutine', () => {
    let routine;

    beforeEach(() => {
      routine = new CircleRoutine();
    });

    test('should have valid structure', () => {
      validateRoutine(routine);
    });

    test('should include circle maneuvers', () => {
      const stepNames = routine.steps.map(step => step.name);
      expect(stepNames).toContain('Circle Left');
      expect(stepNames).toContain('Circle Right');
    });

    test('should have correct circle control values', () => {
      const circleLeft = routine.steps.find(step => step.name === 'Circle Left');
      const circleRight = routine.steps.find(step => step.name === 'Circle Right');

      // Circle left should have negative roll and yaw
      expect(circleLeft.controls.roll).toBeLessThan(0);
      expect(circleLeft.controls.yaw).toBeLessThan(0);

      // Circle right should have positive roll and yaw
      expect(circleRight.controls.roll).toBeGreaterThan(0);
      expect(circleRight.controls.yaw).toBeGreaterThan(0);
    });
  });

  describe('FigureEightRoutine', () => {
    let routine;

    beforeEach(() => {
      routine = new FigureEightRoutine();
    });

    test('should have valid structure', () => {
      validateRoutine(routine);
    });

    test('should include figure eight components', () => {
      const stepNames = routine.steps.map(step => step.name);
      expect(stepNames).toContain('Start forward motion');
      expect(stepNames).toContain('Turn left');
      expect(stepNames).toContain('Turn right');
    });

    test('should have correct turn control values', () => {
      const turnLeft = routine.steps.find(step => step.name === 'Turn left');
      const turnRight = routine.steps.find(step => step.name === 'Turn right');

      // Turn left should have negative roll and yaw
      expect(turnLeft.controls.roll).toBeLessThan(0);
      expect(turnLeft.controls.yaw).toBeLessThan(0);

      // Turn right should have positive roll and yaw
      expect(turnRight.controls.roll).toBeGreaterThan(0);
      expect(turnRight.controls.yaw).toBeGreaterThan(0);
    });
  });

  describe('AdvancedManeuversRoutine', () => {
    let routine;

    beforeEach(() => {
      routine = new AdvancedManeuversRoutine();
    });

    test('should have valid structure', () => {
      validateRoutine(routine);
    });

    test('should include all advanced maneuvers', () => {
      const stepNames = routine.steps.map(step => step.name);
      expect(stepNames).toContain('Circle Left');
      expect(stepNames).toContain('Circle Right');
      expect(stepNames).toContain('Ascend');
      expect(stepNames).toContain('Descend');
      expect(stepNames).toContain('Figure Eight Left');
      expect(stepNames).toContain('Figure Eight Right');
    });

    test('should have correct vertical control values', () => {
      const ascend = routine.steps.find(step => step.name === 'Ascend');
      const descend = routine.steps.find(step => step.name === 'Descend');

      expect(ascend.controls.throttle).toBe(1.0);
      expect(descend.controls.throttle).toBeLessThan(0.5);
    });

    test('should have hover steps between maneuvers', () => {
      const maneuvers = ['Circle Left', 'Circle Right', 'Ascend', 'Descend', 'Figure Eight Left', 'Figure Eight Right'];
      maneuvers.forEach(maneuver => {
        const maneuverIndex = routine.steps.findIndex(step => step.name === maneuver);
        expect(maneuverIndex).toBeGreaterThan(0);
        expect(routine.steps[maneuverIndex + 1].name).toBe('Hover');
      });
    });
  });

  describe('OrientationTestRoutine', () => {
    let routine;

    beforeEach(() => {
      routine = new OrientationTestRoutine();
    });

    test('should have valid structure', () => {
      validateRoutine(routine);
    });

    test('should include orientation test steps', () => {
      const stepNames = routine.steps.map(step => step.name);
      expect(stepNames).toContain('Yaw right for 1 second (drone should face right)');
      expect(stepNames).toContain('Pitch forward (should move right relative to starting position)');
      expect(stepNames).toContain('Pitch backward (should move left relative to starting position)');
      expect(stepNames).toContain('Yaw left for 1 second (return to start)');
    });

    test('should have correct yaw control values', () => {
      const yawRight = routine.steps.find(step => step.name === 'Yaw right for 1 second (drone should face right)');
      const yawLeft = routine.steps.find(step => step.name === 'Yaw left for 1 second (return to start)');

      expect(yawRight.controls.yaw).toBeLessThan(0);
      expect(yawLeft.controls.yaw).toBeGreaterThan(0);
    });
  });

  describe('YawTestRoutine', () => {
    let routine;

    beforeEach(() => {
      routine = new YawTestRoutine();
    });

    test('should have valid structure', () => {
      validateRoutine(routine);
    });

    test('should include yaw test steps', () => {
      const stepNames = routine.steps.map(step => step.name);
      expect(stepNames).toContain('Yaw left for 5 seconds');
      expect(stepNames).toContain('Yaw right for 5 seconds');
    });

    test('should have correct yaw durations and values', () => {
      const yawLeft = routine.steps.find(step => step.name === 'Yaw left for 5 seconds');
      const yawRight = routine.steps.find(step => step.name === 'Yaw right for 5 seconds');

      expect(yawLeft.duration).toBe(5000);
      expect(yawRight.duration).toBe(5000);
      expect(yawLeft.controls.yaw).toBeGreaterThan(0);
      expect(yawRight.controls.yaw).toBeLessThan(0);
    });

    test('should maintain hover between yaw movements', () => {
      const yawSteps = ['Yaw left for 5 seconds', 'Yaw right for 5 seconds'];
      yawSteps.forEach(movement => {
        const movementIndex = routine.steps.findIndex(step => step.name === movement);
        expect(movementIndex).toBeGreaterThan(0);
        expect(routine.steps[movementIndex + 1].name).toBe('Hover (maintain heading)');
      });
    });
  });

  describe('PhysicsTestRoutine', () => {
    let routine;

    beforeEach(() => {
      routine = new PhysicsTestRoutine();
    });

    test('should have valid structure', () => {
      validateRoutine(routine);
    });

    test('should include physics test components', () => {
      const stepNames = routine.steps.map(step => step.name);
      expect(stepNames).toContain('Test momentum - pitch forward');
      expect(stepNames).toContain('Test momentum - counter pitch');
      expect(stepNames).toContain('Test orientation - should move right');
      expect(stepNames).toContain('Test orientation - should move left');
      expect(stepNames).toContain('Quick forward pitch');
      expect(stepNames).toContain('Quick backward pitch');
    });

    test('should have correct test durations', () => {
      const quickPitch = routine.steps.find(step => step.name === 'Quick forward pitch');
      expect(quickPitch.duration).toBe(500); // Quick movements should be 500ms
    });
  });

  describe('ThrottleTestRoutine', () => {
    let routine;

    beforeEach(() => {
      routine = new ThrottleTestRoutine();
    });

    test('should have valid structure', () => {
      validateRoutine(routine);
    });

    test('should include all throttle test steps', () => {
      const stepNames = routine.steps.map(step => step.name);
      expect(stepNames).toContain('Full Throttle');
      expect(stepNames).toContain('Half Throttle');
      expect(stepNames).toContain('Quarter Throttle');
      expect(stepNames).toContain('Zero Throttle');
      expect(stepNames).toContain('Quick Throttle Change');
      expect(stepNames).toContain('Fall Test');
    });

    test('should have correct throttle values', () => {
      const fullThrottle = routine.steps.find(step => step.name === 'Full Throttle');
      const halfThrottle = routine.steps.find(step => step.name === 'Half Throttle');
      const quarterThrottle = routine.steps.find(step => step.name === 'Quarter Throttle');
      const zeroThrottle = routine.steps.find(step => step.name === 'Zero Throttle');

      expect(fullThrottle.controls.throttle).toBe(1.0);
      expect(halfThrottle.controls.throttle).toBe(0.5);
      expect(quarterThrottle.controls.throttle).toBe(0.25);
      expect(zeroThrottle.controls.throttle).toBe(0);
    });

    test('should have correct test durations', () => {
      const quickChange = routine.steps.find(step => step.name === 'Quick Throttle Change');
      const fallTest = routine.steps.find(step => step.name === 'Fall Test');

      expect(quickChange.duration).toBe(500); // Quick changes should be 500ms
      expect(fallTest.duration).toBe(1000); // Fall test should be 1000ms
    });
  });

  describe('YawRotationRoutine', () => {
    let routine;

    beforeEach(() => {
      routine = new YawRotationRoutine();
    });

    test('should have valid structure', () => {
      validateRoutine(routine);
    });

    test('should include 180 and 360 degree yaw steps', () => {
      const stepNames = routine.steps.map(step => step.name);
      expect(stepNames).toContain('Yaw 180° right');
      expect(stepNames).toContain('Yaw 180° left');
      expect(stepNames).toContain('Yaw 360° right');
      expect(stepNames).toContain('Yaw 360° left');
    });

    test('should have appropriate durations for different rotations', () => {
      const yaw180Right = routine.steps.find(step => step.name === 'Yaw 180° right');
      const yaw360Right = routine.steps.find(step => step.name === 'Yaw 360° right');

      // 360 should take longer than 180
      expect(yaw360Right.duration).toBeGreaterThan(yaw180Right.duration);
    });

    test('should have correct yaw control values', () => {
      const yaw180Right = routine.steps.find(step => step.name === 'Yaw 180° right');
      const yaw180Left = routine.steps.find(step => step.name === 'Yaw 180° left');

      // Right rotation should have negative yaw
      expect(yaw180Right.controls.yaw).toBeLessThan(0);
      // Left rotation should have positive yaw
      expect(yaw180Left.controls.yaw).toBeGreaterThan(0);
    });
  });

  describe('AcrobaticsRoutine', () => {
    let routine;

    beforeEach(() => {
      routine = new AcrobaticsRoutine();
    });

    test('should have valid structure', () => {
      validateRoutine(routine);
    });

    test('should require safety off mode', () => {
      expect(routine.requiresSafetyOff).toBe(true);
    });

    test('should include barrel roll and loop maneuvers', () => {
      const stepNames = routine.steps.map(step => step.name);
      expect(stepNames).toContain('Barrel roll right');
      expect(stepNames).toContain('Barrel roll left');
      expect(stepNames).toContain('Forward loop');
      expect(stepNames).toContain('Backward loop');
    });

    test('barrel rolls should coordinate roll and yaw', () => {
      const barrelRollRight = routine.steps.find(step => step.name === 'Barrel roll right');
      const barrelRollLeft = routine.steps.find(step => step.name === 'Barrel roll left');

      // Barrel roll right should have positive roll and some yaw in the same direction
      expect(barrelRollRight.controls.roll).toBeGreaterThan(0);
      expect(barrelRollRight.controls.yaw).toBeGreaterThan(0);

      // Barrel roll left should have negative roll and some yaw in the same direction
      expect(barrelRollLeft.controls.roll).toBeLessThan(0);
      expect(barrelRollLeft.controls.yaw).toBeLessThan(0);
    });

    test('loops should use maximum pitch and throttle', () => {
      const forwardLoop = routine.steps.find(step => step.name === 'Forward loop');
      const backwardLoop = routine.steps.find(step => step.name === 'Backward loop');

      // Loops should use max throttle
      expect(forwardLoop.controls.throttle).toBe(1.0);
      expect(backwardLoop.controls.throttle).toBe(1.0);

      // Forward loop uses full negative pitch
      expect(forwardLoop.controls.pitch).toBe(-1.0);
      // Backward loop uses full positive pitch
      expect(backwardLoop.controls.pitch).toBe(1.0);
    });

    test('validateRequirements should check safety mode', () => {
      const mockDroneWithSafety = {
        physics: { safetyMode: true }
      };
      const mockDroneWithoutSafety = {
        physics: { safetyMode: false }
      };

      // Should not allow routine with safety on
      const resultWithSafety = routine.validateRequirements(mockDroneWithSafety);
      expect(resultWithSafety.canRun).toBe(false);
      expect(resultWithSafety.message).toContain("safety mode");

      // Should allow routine with safety off
      const resultWithoutSafety = routine.validateRequirements(mockDroneWithoutSafety);
      expect(resultWithoutSafety.canRun).toBe(true);
    });
  });
}); 