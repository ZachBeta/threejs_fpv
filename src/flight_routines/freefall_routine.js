import { BasicSteps, createStep } from './routine_steps.js';

export class FreefallRoutine {
  constructor() {
    this.name = "Freefall Test";
    this.description = "Tests freefall physics and ground collision";

    // Custom steps for freefall test
    const riseHigh = createStep("Rise to height", 3000, {
      throttle: 1.0,  // Full throttle to gain altitude
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    const hoverHigh = createStep("Hover at height", 1000, {
      throttle: 0.5,  // Maintain altitude
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    const cutPower = createStep("Cut power", 3000, {
      throttle: 0,    // Zero throttle for freefall
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    const recoverHover = createStep("Recover hover", 2000, {
      throttle: 0.7,  // Higher throttle to stop falling
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    this.steps = [
      BasicSteps.takeOff,
      riseHigh,      // Rise high in the air
      hoverHigh,     // Brief hover to stabilize
      cutPower,      // Cut power and freefall
      recoverHover,  // Recover from freefall
      BasicSteps.hover,
      BasicSteps.land
    ];
  }
} 