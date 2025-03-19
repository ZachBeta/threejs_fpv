import { BasicSteps, createStep } from './routine_steps.js';

export class YawTestRoutine {
  constructor() {
    this.name = "720° Yaw Test";
    this.description = "Tests full 720-degree yaw rotations in both directions";

    // Create yaw test steps
    const yawLeft720 = createStep("Yaw left 720°", 5000, {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: 0.5  // Positive yaw for counterclockwise/left rotation
    });

    const yawRight720 = createStep("Yaw right 720°", 5000, {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: -0.5  // Negative yaw for clockwise/right rotation
    });

    this.steps = [
      BasicSteps.takeOff,
      BasicSteps.hoverMaintainHeading,
      yawLeft720,
      BasicSteps.hoverMaintainHeading,
      yawRight720,
      BasicSteps.hoverMaintainHeading,
      BasicSteps.land
    ];
  }
} 