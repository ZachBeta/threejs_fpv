import { BasicSteps, createStep } from './routine_steps.js';

export class YawRotationRoutine {
  constructor() {
    this.name = "Yaw Rotation Tests";
    this.description = "Tests 180° and 360° yaw rotations in both directions";

    // Create yaw rotation steps
    const yaw180Right = createStep("Yaw 180° right", 2000, {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: -1.0 // Negative yaw for clockwise/right rotation
    });

    const yaw180Left = createStep("Yaw 180° left", 2000, {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: 1.0 // Positive yaw for counterclockwise/left rotation
    });
    
    const yaw360Right = createStep("Yaw 360° right", 4000, {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: -1.0 // Negative yaw for clockwise/right rotation
    });

    const yaw360Left = createStep("Yaw 360° left", 4000, {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: 1.0 // Positive yaw for counterclockwise/left rotation
    });

    // Assemble the routine
    this.steps = [
      BasicSteps.takeOff,
      BasicSteps.hoverMaintainHeading,
      // 180 degree tests
      yaw180Right,
      BasicSteps.hoverMaintainHeading,
      yaw180Left, // Return to original heading
      BasicSteps.hoverMaintainHeading,
      // 360 degree tests
      yaw360Right,
      BasicSteps.hoverMaintainHeading,
      yaw360Left,
      BasicSteps.hoverMaintainHeading,
      BasicSteps.land
    ];
  }
} 