import { BasicSteps, OrientationSteps, createStep } from './routine_steps.js';

export class BasicRoutine {
  constructor() {
    this.name = "Basic Flight Test";
    this.description = "Tests basic flight controls and movements";

    // Create custom steps for basic movements
    const moveForward = createStep("Forward", 2000, {
      throttle: 0.5,
      pitch: -0.5,
      roll: 0
    });

    const moveBackward = createStep("Backward", 2000, {
      throttle: 0.5,
      pitch: 0.5,
      roll: 0
    });

    const moveLeft = createStep("Left", 2000, {
      throttle: 0.5,
      pitch: 0,
      roll: -0.5
    });

    const moveRight = createStep("Right", 2000, {
      throttle: 0.5,
      pitch: 0,
      roll: 0.5
    });

    const yawLeft = createStep("Yaw Left", 2000, {
      throttle: 0.5,
      pitch: 0,
      roll: 0,
      yaw: 0.5
    });

    const yawRight = createStep("Yaw Right", 2000, {
      throttle: 0.5,
      pitch: 0,
      roll: 0,
      yaw: -0.5
    });

    this.steps = [
      BasicSteps.takeOff,
      BasicSteps.hover,
      moveForward,
      BasicSteps.hover,
      moveBackward,
      BasicSteps.hover,
      moveLeft,
      BasicSteps.hover,
      moveRight,
      BasicSteps.hover,
      yawLeft,
      BasicSteps.hover,
      yawRight,
      BasicSteps.hover,
      BasicSteps.land
    ];
  }
} 