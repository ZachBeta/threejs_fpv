import { BasicSteps, OrientationSteps, createStep } from './routine_steps.js';

export class AdvancedManeuversRoutine {
  constructor() {
    this.name = "Advanced Maneuvers Test";
    this.description = "Tests complex flight maneuvers including circles and figure-eights";

    // Custom steps for advanced maneuvers
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

    const ascend = createStep("Ascend", 2000, {
      throttle: 1.0,
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    const descend = createStep("Descend", 2000, {
      throttle: 0.3,
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    const figureEightLeft = createStep("Figure Eight Left", 2000, {
      throttle: 0.8,
      pitch: -0.3,
      roll: -0.4,
      yaw: -0.2
    });

    const figureEightRight = createStep("Figure Eight Right", 2000, {
      throttle: 0.8,
      pitch: -0.3,
      roll: 0.4,
      yaw: 0.2
    });

    this.steps = [
      BasicSteps.takeOff,
      BasicSteps.hover,
      // Test circle maneuvers
      circleLeft,
      BasicSteps.hover,
      circleRight,
      BasicSteps.hover,
      // Test vertical control
      ascend,
      BasicSteps.hover,
      descend,
      BasicSteps.hover,
      // Test figure-eight maneuver
      figureEightLeft,
      BasicSteps.hover,
      figureEightRight,
      BasicSteps.hover,
      figureEightLeft,
      BasicSteps.hover,
      figureEightRight,
      BasicSteps.hover,
      BasicSteps.land
    ];
  }
} 