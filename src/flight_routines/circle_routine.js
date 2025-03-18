import { BasicSteps, createStep } from './routine_steps.js';

export class CircleRoutine {
  constructor() {
    this.name = "Circle Flight";
    this.description = "Performs circular flight patterns";

    // Create circle movement steps
    const circleLeft = createStep("Circle Left", 3000, {
      throttle: 0.5,
      pitch: 0.3,
      roll: -0.3,
      yaw: -0.2
    });

    const circleRight = createStep("Circle Right", 3000, {
      throttle: 0.5,
      pitch: 0.3,
      roll: 0.3,
      yaw: 0.2
    });

    // Create hover at height step
    const hoverHigh = createStep("Hover at circle height", 1000, {
      throttle: 0.7,
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    this.steps = [
      BasicSteps.takeOff,
      hoverHigh,
      circleLeft,
      BasicSteps.hover,
      circleRight,
      BasicSteps.hover,
      // Complete the pattern with another set
      circleLeft,
      BasicSteps.hover,
      circleRight,
      BasicSteps.hover,
      BasicSteps.land
    ];
  }
} 