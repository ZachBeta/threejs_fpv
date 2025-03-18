import { BasicSteps, OrientationSteps, createStep } from './routine_steps.js';

export class PhysicsTestRoutine {
  constructor() {
    this.name = "Physics Test";
    this.description = "Tests basic physics behaviors including momentum and orientation-relative forces";
    
    // Custom steps for physics testing
    const hoverHigher = createStep("Hover at testing height", 1000, {
      throttle: 0.8,
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    const gentlePitchForward = {
      ...OrientationSteps.pitchForward,
      name: "Gentle pitch forward",
      controls: {
        ...OrientationSteps.pitchForward.controls,
        pitch: -0.5  // Half strength for better testing
      }
    };

    const gentlePitchBackward = {
      ...OrientationSteps.pitchBackward,
      name: "Gentle pitch backward",
      controls: {
        ...OrientationSteps.pitchBackward.controls,
        pitch: 0.5  // Half strength for better testing
      }
    };

    this.steps = [
      BasicSteps.takeOff,
      hoverHigher,
      
      // Test 1: Basic momentum
      {
        ...gentlePitchForward,
        name: "Test momentum - pitch forward"
      },
      BasicSteps.hover,
      {
        ...gentlePitchBackward,
        name: "Test momentum - counter pitch"
      },
      BasicSteps.hover,

      // Test 2: Orientation-relative movement
      OrientationSteps.yawRight90,
      BasicSteps.hover,
      {
        ...gentlePitchForward,
        name: "Test orientation - should move right"
      },
      BasicSteps.hover,
      {
        ...gentlePitchBackward,
        name: "Test orientation - should move left"
      },
      BasicSteps.hover,
      OrientationSteps.yawLeft90,
      
      // Test 3: Quick direction changes
      {
        ...OrientationSteps.pitchForward,
        duration: 500,
        name: "Quick forward pitch"
      },
      {
        ...OrientationSteps.pitchBackward,
        duration: 500,
        name: "Quick backward pitch"
      },
      BasicSteps.hover,
      
      BasicSteps.land
    ];
  }
} 