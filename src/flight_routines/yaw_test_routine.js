import { BasicSteps, createStep } from './routine_steps.js';

export class YawTestRoutine {
  constructor() {
    this.name = "Yaw Test";
    this.description = "Tests sustained yaw rotations in both directions";

    // Create yaw test steps
    const yawLeft = createStep("Yaw left for 5 seconds", 5000, {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: 0.5  // Positive yaw for counterclockwise/left rotation
    });

    const yawRight = createStep("Yaw right for 5 seconds", 5000, {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: -0.5  // Negative yaw for clockwise/right rotation
    });

    this.steps = [
      BasicSteps.takeOff,
      BasicSteps.hoverMaintainHeading,
      yawLeft,
      BasicSteps.hoverMaintainHeading,
      yawRight,
      BasicSteps.hoverMaintainHeading,
      BasicSteps.land
    ];
  }
} 