import { BasicSteps, createStep, createAcrobaticStep } from './routine_steps.js';

export class BackflipRoutine {
  constructor() {
    this.name = "Backflip";
    this.description = "Performs a single backflip maneuver";
    this.requiresSafetyOff = true; // Flag to indicate this routine requires safety off
    
    // Quick takeoff to backflip height
    const quickAscent = createStep("Quick ascent", 1500, {
      throttle: 1.0,
      pitch: 0,
      roll: 0,
      yaw: 0
    });
    
    // Immediate aggressive pitch up for backflip
    const pitchUp = createAcrobaticStep("Pitch up", 500, {
      throttle: 1.0,
      pitch: 1.0,
      roll: 0,
      yaw: 0
    });
    
    // Execute backflip with increased throttle
    const backflip = createAcrobaticStep("Backflip", 2000, {
      throttle: 1.0,
      pitch: 1.0,
      roll: 0,
      yaw: 0
    }, {
      minAltitude: 50
    });
    
    // Recovery with higher throttle
    const recover = createStep("Recover", 1000, {
      throttle: 0.85,
      pitch: 0,
      roll: 0,
      yaw: 0
    });
    
    // Assemble the routine - now more direct
    this.steps = [
      quickAscent,  // Quick ascent to minimum height
      pitchUp,      // Aggressive initial pitch up
      backflip,     // Execute the backflip
      recover,      // Recover and stabilize
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
    if (drone.physics.position && drone.physics.position.y < 40) {
      return {
        canRun: false,
        message: "Insufficient altitude for backflip routine. Need at least 40 units of altitude."
      };
    }
    
    return { canRun: true };
  }
} 