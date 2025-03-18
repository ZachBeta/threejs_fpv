// Common flight routine steps that can be reused across different routines

export const BasicSteps = {
  takeOff: {
    name: "Take off",
    duration: 2000,
    controls: {
      throttle: 1.0,
      pitch: 0,
      roll: 0,
      yaw: 0
    }
  },

  hover: {
    name: "Hover",
    duration: 1000,
    controls: {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: 0
    }
  },

  land: {
    name: "0 throttle",
    duration: 2000,
    controls: {
      throttle: 0,
      pitch: 0,
      roll: 0,
      yaw: 0
    }
  }
};

export const OrientationSteps = {
  yawRight90: {
    name: "Yaw 90 degrees right",
    duration: 1000,
    controls: {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: 1.0
    }
  },

  yawLeft90: {
    name: "Yaw 90 degrees left",
    duration: 1000,
    controls: {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: -1.0
    }
  },

  pitchForward: {
    name: "Pitch forward",
    duration: 1000,
    controls: {
      throttle: 0.6,
      pitch: -1.0,
      roll: 0,
      yaw: 0
    }
  },

  pitchBackward: {
    name: "Pitch backward",
    duration: 1000,
    controls: {
      throttle: 0.6,
      pitch: 1.0,
      roll: 0,
      yaw: 0
    }
  }
};

// Helper function to create a custom step
export function createStep(name, duration, controls) {
  return {
    name,
    duration,
    controls: {
      throttle: controls.throttle ?? 0,
      pitch: controls.pitch ?? 0,
      roll: controls.roll ?? 0,
      yaw: controls.yaw ?? 0
    }
  };
}

// Helper function to modify an existing step
export function modifyStep(step, modifications) {
  return {
    ...step,
    name: modifications.name ?? step.name,
    duration: modifications.duration ?? step.duration,
    controls: {
      ...step.controls,
      ...modifications.controls
    }
  };
} 