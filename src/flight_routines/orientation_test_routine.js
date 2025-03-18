import { BasicSteps, OrientationSteps } from './routine_steps.js';

export class OrientationTestRoutine {
  constructor() {
    this.name = "Orientation Test";
    this.description = "Tests pitch controls relative to drone orientation";
    this.steps = [
      BasicSteps.takeOff,
      BasicSteps.hover,
      {
        ...OrientationSteps.yawRight90,
        name: "Yaw 90 degrees right (drone should face right)"
      },
      BasicSteps.hover,
      {
        ...OrientationSteps.pitchForward,
        name: "Pitch forward (should move right relative to starting position)"
      },
      BasicSteps.hover,
      {
        ...OrientationSteps.pitchBackward,
        name: "Pitch backward (should move left relative to starting position)"
      },
      BasicSteps.hover,
      {
        ...OrientationSteps.yawLeft90,
        name: "Yaw back to start (-90 degrees)"
      },
      BasicSteps.land
    ];
  }
} 