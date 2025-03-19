import { BasicSteps, createStep } from './routine_steps.js';

export class ColumnCircleRoutine {
  constructor() {
    this.name = "Column Circle";
    this.description = "Takes off and circles around a column while keeping it in view";

    // Initial takeoff with forward momentum
    const quickTakeoff = createStep("Quick takeoff with forward momentum", 2000, {
      throttle: 1.0,
      pitch: -0.3, // Slight forward pitch during takeoff
      roll: 0,
      yaw: 0
    });

    const moveForward = createStep("Move forward", 2000, {
      throttle: 0.8,
      pitch: -0.6, // Reduced pitch to maintain better control
      roll: 0,
      yaw: 0
    });

    // Hover at position before starting circle
    const hoverAtPosition = createStep("Hover at position", 1500, {
      throttle: 0.65,
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    // Circle left while pointing at column
    // We need to coordinate roll, yaw, and pitch to maintain orientation
    const circleLeft = createStep("Circle left while pointing at column", 4000, {
      throttle: 0.7,
      pitch: 0,     // Neutral pitch to maintain height
      roll: -0.3,   // Gentle left roll for circling
      yaw: -0.4     // Stronger yaw to keep pointing at column
    });

    // Circle right while pointing at column
    const circleRight = createStep("Circle right while pointing at column", 4000, {
      throttle: 0.7,
      pitch: 0,     // Neutral pitch to maintain height
      roll: 0.3,    // Gentle right roll for circling
      yaw: 0.4      // Stronger yaw to keep pointing at column
    });

    // Transition step between circles
    const transitionHover = createStep("Transition hover", 1000, {
      throttle: 0.65,
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    this.steps = [
      quickTakeoff,
      moveForward,
      hoverAtPosition,
      // Complete two full circles to the left
      circleLeft,
      transitionHover,
      circleLeft,
      transitionHover,
      circleLeft,
      transitionHover,
      circleLeft,
      hoverAtPosition,
      // Complete two full circles to the right
      circleRight,
      transitionHover,
      circleRight,
      transitionHover,
      circleRight,
      transitionHover,
      circleRight,
      hoverAtPosition,
      BasicSteps.land
    ];
  }
} 