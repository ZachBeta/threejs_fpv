// Common flight routine steps that can be reused across different routines

export const BasicSteps = {
  takeOff: {
    name: "Take off",
    duration: 2000,
    controls: {
      throttle: 1.0,
      pitch: 0,
      roll: 0,
      yaw: null  // maintain heading during takeoff
    }
  },

  hover: {
    name: "Hover",
    duration: 1000,
    controls: {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: null  // maintain heading during hover
    }
  },

  // New hover step that maintains orientation
  hoverMaintainHeading: {
    name: "Hover (maintain heading)",
    duration: 1000,
    controls: {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: null // null means maintain current yaw
    }
  },

  land: {
    name: "0 throttle",
    duration: 2000,
    controls: {
      throttle: 0,
      pitch: 0,
      roll: 0,
      yaw: 0  // reset yaw when landing
    }
  }
};

export const OrientationSteps = {
  yawRight: {
    name: "Yaw right for 2 seconds",
    duration: 2000,
    controls: {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: -0.5
    }
  },

  yawLeft: {
    name: "Yaw left for 2 seconds",
    duration: 2000,
    controls: {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: 0.5
    }
  },

  pitchForward: {
    name: "Pitch forward",
    duration: 1000,
    controls: {
      throttle: 0.6,
      pitch: -1.0,
      roll: 0,
      yaw: null // maintain current yaw
    }
  },

  pitchBackward: {
    name: "Pitch backward",
    duration: 1000,
    controls: {
      throttle: 0.6,
      pitch: 1.0,
      roll: 0,
      yaw: null // maintain current yaw
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
      yaw: controls.yaw ?? null  // Default to maintaining heading
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