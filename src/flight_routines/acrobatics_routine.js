import { BasicSteps, createStep, createAcrobaticStep } from './routine_steps.js';

export class AcrobaticsRoutine {
  constructor() {
    this.name = "Acrobatic Maneuvers";
    this.description = "Advanced acrobatic maneuvers that require safety mode to be disabled";
    this.requiresSafetyOff = true; // Flag to indicate this routine requires safety off
    
    // Create acrobatic steps
    
    // Barrel roll to the right - enhanced for full 360° roll
    const barrelRollRight = createAcrobaticStep("Barrel roll right", 3000, {
      throttle: 1.0, // Full throttle for altitude maintenance during roll (increased from 0.85)
      pitch: 0.25, // Increased forward pitch to counteract altitude loss (increased from 0.15)
      roll: 1.0, // Full right roll
      yaw: 0.3 // Slight yaw to coordinate the roll
    }, {
      minAltitude: 70, // Increased minimum altitude for barrel rolls (from 50)
    });
    
    // Barrel roll to the left - enhanced for full 360° roll
    const barrelRollLeft = createAcrobaticStep("Barrel roll left", 3000, {
      throttle: 1.0, // Full throttle for altitude maintenance (increased from 0.85)
      pitch: 0.25, // Increased forward pitch to counteract altitude loss (increased from 0.15)
      roll: -1.0, // Full left roll
      yaw: -0.3 // Slight yaw to coordinate the roll
    }, {
      minAltitude: 70, // Increased minimum altitude (from 50)
    });
    
    // Forward loop (loop de loop) - enhanced for full 360° vertical loop
    const loopForward = createAcrobaticStep("Forward loop", 4000, {
      throttle: 1.0, // Full throttle for vertical maneuvers
      pitch: -1.0, // Full forward pitch to initiate loop
      roll: 0,
      yaw: 0
    }, {
      minAltitude: 100, // Increased minimum altitude for loops
    });
    
    // Backward loop - enhanced for full 360° vertical loop
    const loopBackward = createAcrobaticStep("Backward loop", 4000, {
      throttle: 1.0, 
      pitch: 1.0, // Full backward pitch to initiate loop
      roll: 0,
      yaw: 0
    }, {
      minAltitude: 100, // Increased minimum altitude for loops
    });
    
    // Split-S maneuver (half roll followed by half loop)
    const splitS = createAcrobaticStep("Split-S", 3500, {
      throttle: 0.9,
      pitch: 0, // Start with roll
      roll: 1.0, // Roll to inverted
      yaw: 0
    }, {
      minAltitude: 80, // Increased minimum altitude
    });
    
    // After initial roll, apply forward pitch to complete the split-S
    const splitSPull = createAcrobaticStep("Split-S pull", 3000, {
      throttle: 1.0,
      pitch: -1.0, // Pull through the half loop
      roll: 0, // No additional roll
      yaw: 0
    }, {
      minAltitude: 80, // Increased minimum altitude
    });
    
    // Immelmann turn (half loop followed by half roll)
    const immelmannLoop = createAcrobaticStep("Immelmann loop", 3000, {
      throttle: 1.0,
      pitch: -1.0, // Pull up into half loop
      roll: 0,
      yaw: 0
    }, {
      minAltitude: 80, // Increased minimum altitude
    });
    
    // After loop, roll to normal orientation
    const immelmannRoll = createAcrobaticStep("Immelmann roll", 2500, {
      throttle: 0.8,
      pitch: 0,
      roll: 1.0, // Roll to upright
      yaw: 0
    }, {
      minAltitude: 80, // Increased minimum altitude
    });
    
    // 180° Yaw flip - a quick yaw rotation for filming
    const yawFlip180 = createAcrobaticStep("180° Yaw Flip", 2000, {
      throttle: 0.7,
      pitch: 0,
      roll: 0,
      yaw: 1.0 // Full yaw to left
    }, {
      minAltitude: 30, // Increased minimum altitude slightly
    });
    
    // Extended hover at height for recovery with higher throttle
    const hoverHigh = createStep("Hover (recovery)", 1500, {
      throttle: 0.85, // Increased throttle for higher altitude recovery
      pitch: 0,
      roll: 0,
      yaw: null // Maintain heading
    });
    
    // Gain altitude step - for climbing higher before acrobatics
    const gainAltitude = createStep("Gain altitude", 2500, {
      throttle: 1.0, // Full throttle for climb
      pitch: 0,
      roll: 0,
      yaw: null
    });
    
    // Assemble the routine
    this.steps = [
      BasicSteps.takeOff,
      gainAltitude, // Start with gaining significant altitude
      hoverHigh, // Hover at altitude first
      
      // Barrel rolls
      gainAltitude, // Gain altitude before acrobatic maneuver
      barrelRollRight,
      hoverHigh, // Recovery hover
      gainAltitude, // Gain altitude before acrobatic maneuver
      barrelRollLeft,
      hoverHigh, // Recovery hover
      
      // Loops
      gainAltitude, // Extra altitude for loops
      gainAltitude, // Double altitude gain for loops
      loopForward,
      hoverHigh, // Recovery hover
      gainAltitude, // Extra altitude for loops
      gainAltitude, // Double altitude gain for loops
      loopBackward,
      hoverHigh, // Recovery hover
      
      // Split-S maneuver
      gainAltitude, // Gain altitude before acrobatic maneuver
      gainAltitude, // Extra altitude for split-S
      splitS, // Roll inverted
      splitSPull, // Pull through
      hoverHigh, // Recovery hover
      
      // Immelmann turn
      gainAltitude, // Gain altitude before acrobatic maneuver
      gainAltitude, // Extra altitude for Immelmann
      immelmannLoop, // Half loop up
      immelmannRoll, // Half roll
      hoverHigh, // Recovery hover
      
      // Yaw flip
      gainAltitude, // Gain altitude before acrobatic maneuver
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
    
    // Check altitude for the whole routine if position is available
    if (drone.physics.position && drone.physics.position.y < 40) { // Increased minimum altitude requirement
      return {
        canRun: false,
        message: "Insufficient altitude for acrobatic routine. Need at least 40 units of altitude."
      };
    }
    
    return { canRun: true };
  }
} 