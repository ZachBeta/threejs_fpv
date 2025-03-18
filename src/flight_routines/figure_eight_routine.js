import { BasicSteps, createStep } from './routine_steps.js';

export class FigureEightRoutine {
  constructor() {
    this.name = "Figure Eight";
    this.description = "Performs a figure eight pattern";

    // Create figure eight steps
    const startForward = createStep("Start forward motion", 1500, {
      throttle: 0.6,
      pitch: 0.3,
      roll: 0,
      yaw: 0
    });

    const turnLeft = createStep("Turn left", 2000, {
      throttle: 0.6,
      pitch: 0.3,
      roll: -0.4,
      yaw: -0.2
    });

    const turnRight = createStep("Turn right", 2000, {
      throttle: 0.6,
      pitch: 0.3,
      roll: 0.4,
      yaw: 0.2
    });

    // Create hover at height step
    const hoverHigh = createStep("Hover at pattern height", 1000, {
      throttle: 0.7,
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    this.steps = [
      BasicSteps.takeOff,
      hoverHigh,
      // First loop (left)
      startForward,
      turnLeft,
      turnLeft,
      // Transition to second loop
      startForward,
      // Second loop (right)
      turnRight,
      turnRight,
      // Return to center
      startForward,
      BasicSteps.hover,
      BasicSteps.land
    ];
  }
} 