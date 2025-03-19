/**
 * Gamepad Configuration Utility
 * 
 * This module helps identify the correct button and axis mappings for different controllers.
 * Use the results from gamepad tester to update this configuration.
 */

const StandardGamepadConfig = {
  // Standard Mapping (Xbox-like controllers)
  deadzone: 0.1,
  axisMapping: {
    leftStickX: 0,  // Left Stick X axis
    leftStickY: 1,  // Left Stick Y axis
    rightStickX: 2, // Right Stick X axis
    rightStickY: 3  // Right Stick Y axis
  },
  buttonMapping: {
    reset: 4,  // Left Bumper (LB)
    hover: 5   // Right Bumper (RB)
  }
};

const PS4GamepadConfig = {
  // PS4 DualShock Controller
  deadzone: 0.1,
  axisMapping: {
    leftStickX: 0,  // Left Stick X axis
    leftStickY: 1,  // Left Stick Y axis 
    rightStickX: 2, // Right Stick X axis
    rightStickY: 3  // Right Stick Y axis
  },
  buttonMapping: {
    reset: 4,  // L1 button
    hover: 5   // R1 button
  }
};

// Add more controller configurations here as needed

/**
 * Gets the appropriate gamepad configuration based on controller ID
 * @param {string} gamepadId - The ID of the connected gamepad
 * @returns {Object} The gamepad configuration
 */
function getGamepadConfig(gamepadId) {
  // Default to standard config
  let config = { ...StandardGamepadConfig };
  
  // Check for known controller types
  if (gamepadId && gamepadId.toLowerCase().includes('dualshock') || 
      gamepadId && gamepadId.toLowerCase().includes('playstation')) {
    config = { ...PS4GamepadConfig };
  }
  
  // Add more controller detection as needed
  
  return config;
}

// Export the configs and helper functions
export {
  StandardGamepadConfig,
  PS4GamepadConfig,
  getGamepadConfig
}; 