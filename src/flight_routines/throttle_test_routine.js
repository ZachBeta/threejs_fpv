import { BasicSteps, createStep } from './routine_steps.js';

export class ThrottleTestRoutine {
  constructor() {
    this.name = "Throttle Test";
    this.description = "Tests throttle response, acceleration, and momentum";

    // Custom steps for throttle testing
    const fullThrottle = createStep("Full Throttle", 2000, {
      throttle: 1.0,
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    const halfThrottle = createStep("Half Throttle", 2000, {
      throttle: 0.5,
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    const quarterThrottle = createStep("Quarter Throttle", 2000, {
      throttle: 0.25,
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    const zeroThrottle = createStep("Zero Throttle", 2000, {
      throttle: 0,
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    const quickThrottleChange = createStep("Quick Throttle Change", 500, {
      throttle: 1.0,
      pitch: 0,
      roll: 0,
      yaw: 0
    });

    this.steps = [
      BasicSteps.takeOff,
      BasicSteps.hover,
      // Test gradual throttle changes
      quarterThrottle,
      halfThrottle,
      fullThrottle,
      halfThrottle,
      quarterThrottle,
      BasicSteps.hover,
      // Test momentum and quick changes
      quickThrottleChange,
      zeroThrottle,
      quickThrottleChange,
      zeroThrottle,
      // Test gravity and falling
      {
        ...zeroThrottle,
        name: "Fall Test",
        duration: 1000
      },
      // Recovery
      fullThrottle,
      BasicSteps.hover,
      BasicSteps.land
    ];
  }
} 