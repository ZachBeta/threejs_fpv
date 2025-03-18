import { BasicRoutine } from '../flight_routines/basic_routine.js';
import { CircleRoutine } from '../flight_routines/circle_routine.js';
import { FigureEightRoutine } from '../flight_routines/figure_eight_routine.js';
import { OrientationTestRoutine } from '../flight_routines/orientation_test_routine.js';
import { PhysicsTestRoutine } from '../flight_routines/physics_test_routine.js';
import { ThrottleTestRoutine } from '../flight_routines/throttle_test_routine.js';
import { AdvancedManeuversRoutine } from '../flight_routines/advanced_maneuvers_routine.js';
import { BasicSteps } from '../flight_routines/routine_steps.js';

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
      expect(stepNames).toContain('Rotate Left');
      expect(stepNames).toContain('Rotate Right');
    });

    test('should have hover steps between movements', () => {
      const movements = ['Forward', 'Backward', 'Left', 'Right', 'Rotate Left', 'Rotate Right'];
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
      expect(stepNames).toContain('Yaw 90 degrees right (drone should face right)');
      expect(stepNames).toContain('Pitch forward (should move right relative to starting position)');
      expect(stepNames).toContain('Pitch backward (should move left relative to starting position)');
      expect(stepNames).toContain('Yaw back to start (-90 degrees)');
    });

    test('should have correct yaw control values', () => {
      const yawRight = routine.steps.find(step => step.name === 'Yaw 90 degrees right (drone should face right)');
      const yawLeft = routine.steps.find(step => step.name === 'Yaw back to start (-90 degrees)');

      expect(yawRight.controls.yaw).toBeGreaterThan(0);
      expect(yawLeft.controls.yaw).toBeLessThan(0);
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
}); 