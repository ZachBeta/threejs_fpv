import { BasicSteps, createStep } from './routine_steps.js';

export class AcrobaticsRoutine {
  constructor() {
    this.name = "Acrobatic Maneuvers";
    this.description = "Advanced acrobatic maneuvers that require safety mode to be disabled";
    this.requiresSafetyOff = true; // Flag to indicate this routine requires safety off
    
    // Create acrobatic steps
    
    // Barrel roll to the right - enhanced for full 360° roll
    const barrelRollRight = createStep("Barrel roll right", 3000, {
      throttle: 0.85, // Higher throttle for stable acrobatics
      pitch: 0.15, // Slight forward pitch to maintain altitude during roll
      roll: 1.0, // Full right roll
      yaw: 0.3 // Slight yaw to coordinate the roll
    });
    
    // Barrel roll to the left - enhanced for full 360° roll
    const barrelRollLeft = createStep("Barrel roll left", 3000, {
      throttle: 0.85,
      pitch: 0.15,
      roll: -1.0, // Full left roll
      yaw: -0.3 // Slight yaw to coordinate the roll
    });
    
    // Forward loop (loop de loop) - enhanced for full 360° vertical loop
    const loopForward = createStep("Forward loop", 4000, {
      throttle: 1.0, // Full throttle for vertical maneuvers
      pitch: -1.0, // Full forward pitch to initiate loop
      roll: 0,
      yaw: 0
    });
    
    // Backward loop - enhanced for full 360° vertical loop
    const loopBackward = createStep("Backward loop", 4000, {
      throttle: 1.0, 
      pitch: 1.0, // Full backward pitch to initiate loop
      roll: 0,
      yaw: 0
    });
    
    // Split-S maneuver (half roll followed by half loop)
    const splitS = createStep("Split-S", 3500, {
      throttle: 0.9,
      pitch: 0, // Start with roll
      roll: 1.0, // Roll to inverted
      yaw: 0
    });
    
    // After initial roll, apply forward pitch to complete the split-S
    const splitSPull = createStep("Split-S pull", 3000, {
      throttle: 1.0,
      pitch: -1.0, // Pull through the half loop
      roll: 0, // No additional roll
      yaw: 0
    });
    
    // Immelmann turn (half loop followed by half roll)
    const immelmannLoop = createStep("Immelmann loop", 3000, {
      throttle: 1.0,
      pitch: -1.0, // Pull up into half loop
      roll: 0,
      yaw: 0
    });
    
    // After loop, roll to normal orientation
    const immelmannRoll = createStep("Immelmann roll", 2500, {
      throttle: 0.8,
      pitch: 0,
      roll: 1.0, // Roll to upright
      yaw: 0
    });
    
    // 180° Yaw flip - a quick yaw rotation for filming
    const yawFlip180 = createStep("180° Yaw Flip", 2000, {
      throttle: 0.7,
      pitch: 0,
      roll: 0,
      yaw: 1.0 // Full yaw to left
    });
    
    // Extended hover at height for recovery
    const hoverHigh = createStep("Hover (recovery)", 1500, {
      throttle: 0.7,
      pitch: 0,
      roll: 0,
      yaw: null // Maintain heading
    });
    
    // Assemble the routine
    this.steps = [
      BasicSteps.takeOff,
      hoverHigh, // Hover at altitude first
      
      // Barrel rolls
      barrelRollRight,
      hoverHigh, // Recovery hover
      barrelRollLeft,
      hoverHigh, // Recovery hover
      
      // Loops
      loopForward,
      hoverHigh, // Recovery hover
      loopBackward,
      hoverHigh, // Recovery hover
      
      // Split-S maneuver
      splitS, // Roll inverted
      splitSPull, // Pull through
      hoverHigh, // Recovery hover
      
      // Immelmann turn
      immelmannLoop, // Half loop up
      immelmannRoll, // Half roll
      hoverHigh, // Recovery hover
      
      // Yaw flip
      yawFlip180,
      hoverHigh, // Recovery hover
      
      BasicSteps.land
    ];
  }
  
  // Method to check if safety mode is off
  validateRequirements(drone) {
    if (this.requiresSafetyOff && drone.physics.safetyMode) {
      return {
        canRun: false,
        message: "This routine requires safety mode to be disabled."
      };
    }
    return { canRun: true };
  }
} 