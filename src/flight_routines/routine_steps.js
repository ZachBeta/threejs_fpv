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
    name: "Yaw right for 1 second",
    duration: 1000,
    controls: {
      throttle: 0.6,
      pitch: 0,
      roll: 0,
      yaw: -0.5
    }
  },

  yawLeft: {
    name: "Yaw left for 1 second",
    duration: 1000,
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

// Helper function to create an acrobatic step with safety requirements
export function createAcrobaticStep(name, duration, controls, requirements = {}) {
  return {
    name,
    duration,
    controls: {
      throttle: controls.throttle ?? 0,
      pitch: controls.pitch ?? 0,
      roll: controls.roll ?? 0,
      yaw: controls.yaw ?? null  // Default to maintaining heading
    },
    requirements: {
      minAltitude: requirements.minAltitude ?? 30, // Minimum safe altitude (default 30 units)
      requireSafetyOff: requirements.requireSafetyOff ?? true, // Acrobatic maneuvers require safety mode off
      maxGroundSpeed: requirements.maxGroundSpeed // Optional maximum ground speed
    },
    // Function to check if requirements are met
    checkRequirements: function(drone) {
      const checks = [];
      
      // Check altitude requirement
      if (this.requirements.minAltitude && 
          drone.physics.position.y < this.requirements.minAltitude) {
        checks.push(`Altitude too low for ${this.name}. Need at least ${this.requirements.minAltitude} units.`);
        
        // Attempt recovery by applying more throttle if altitude is too low
        if (drone.physics.position.y < this.requirements.minAltitude * 0.9) {
          // Override controls to gain altitude
          this.controls.throttle = 1.0;  // Full throttle
          this.controls.pitch = 0;       // Level pitch
          this.controls.roll = 0;        // Level roll
          // Keep current yaw
        }
      }
      
      // Check safety mode requirement
      if (this.requirements.requireSafetyOff && 
          drone.physics.safetyMode) {
        checks.push(`Safety mode must be off for ${this.name}.`);
      }
      
      // Check ground speed requirement if specified
      if (this.requirements.maxGroundSpeed !== undefined) {
        const groundSpeed = Math.sqrt(
          drone.physics.velocity.x * drone.physics.velocity.x + 
          drone.physics.velocity.z * drone.physics.velocity.z
        );
        if (groundSpeed > this.requirements.maxGroundSpeed) {
          checks.push(`Ground speed too high for ${this.name}. Maximum: ${this.requirements.maxGroundSpeed}.`);
        }
      }
      
      return {
        canRun: checks.length === 0,
        messages: checks
      };
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