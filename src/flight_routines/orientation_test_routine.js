import { BasicSteps, OrientationSteps } from './routine_steps.js';

export class OrientationTestRoutine {
  constructor() {
    this.name = "Orientation Test";
    this.description = "Tests pitch controls relative to drone orientation";
    this.steps = [
      BasicSteps.takeOff,
      BasicSteps.hoverMaintainHeading,
      {
        ...OrientationSteps.yawRight90,
        duration: 1500,
        name: "Yaw 90 degrees right (drone should face right)"
      },
      BasicSteps.hoverMaintainHeading,
      {
        ...OrientationSteps.pitchForward,
        name: "Pitch forward (should move right relative to starting position)"
      },
      BasicSteps.hoverMaintainHeading,
      {
        ...OrientationSteps.pitchBackward,
        name: "Pitch backward (should move left relative to starting position)"
      },
      BasicSteps.hoverMaintainHeading,
      {
        ...OrientationSteps.yawLeft90,
        duration: 1500,
        name: "Yaw back to start (-90 degrees)"
      },
      BasicSteps.hoverMaintainHeading,
      BasicSteps.land
    ];
  }
} 