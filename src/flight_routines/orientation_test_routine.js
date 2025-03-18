import { BasicSteps, OrientationSteps } from './routine_steps.js';

export class OrientationTestRoutine {
  constructor() {
    this.name = "Orientation Test";
    this.description = "Tests pitch controls relative to drone orientation";
    this.steps = [
      BasicSteps.takeOff,
      BasicSteps.hoverMaintainHeading,
      {
        ...OrientationSteps.yawRight,
        name: "Yaw right for 2 seconds (drone should face right)"
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
        ...OrientationSteps.yawLeft,
        name: "Yaw left for 2 seconds (return to start)"
      },
      BasicSteps.hoverMaintainHeading,
      BasicSteps.land
    ];
  }
} 