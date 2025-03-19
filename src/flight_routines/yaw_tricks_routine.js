import { BasicSteps, createStep } from './routine_steps.js';

export class YawTricksRoutine {
  constructor() {
    this.name = "Yaw Trick Maneuvers";
    this.description = "Dynamic 180° and 360° yaw rotations combined with other movements";
    this.requiresSafetyOff = false; // Most tricks don't need safety off
    
    // Create specialized steps for yaw tricks
    
    // Fast 180° yaw rotation while moving forward
    const yaw180Forward = createStep("180° Yaw while moving forward", 2000, {
      throttle: 0.7,
      pitch: -0.3, // Forward movement
      roll: 0,
      yaw: 1.0 // Full left yaw
    });
    
    // Fast 180° return while moving forward on opposite direction
    const yaw180Return = createStep("180° Yaw return while moving forward", 2000, {
      throttle: 0.7,
      pitch: -0.3, // Still forward movement (relative to new orientation)
      roll: 0,
      yaw: -1.0 // Full right yaw
    });
    
    // 360° rotation while ascending
    const yaw360Ascending = createStep("360° Yaw while ascending", 3500, {
      throttle: 0.9, // Higher throttle for ascent
      pitch: 0,
      roll: 0,
      yaw: 1.0 // Full left yaw
    });
    
    // 360° rotation while descending
    const yaw360Descending = createStep("360° Yaw while descending", 3500, {
      throttle: 0.3, // Lower throttle for descent
      pitch: 0,
      roll: 0,
      yaw: -1.0 // Full right yaw
    });
    
    // Yaw 180° while moving sideways (crab movement)
    const yaw180Sideways = createStep("180° Yaw while moving sideways", 2500, {
      throttle: 0.7,
      pitch: 0,
      roll: 0.3, // Slight roll for sideways motion
      yaw: 1.0 // Full yaw
    });
    
    // Quick hover to stabilize
    const quickHover = createStep("Quick hover", 1000, {
      throttle: 0.7,
      pitch: 0,
      roll: 0,
      yaw: null // Maintain heading
    });
    
    // Orbit point with constant yaw - drone will rotate to keep facing center
    const orbitRight = createStep("Orbit while facing center (right)", 4000, {
      throttle: 0.7,
      pitch: 0,
      roll: 0.4, // Roll right to orbit
      yaw: -0.4 // Yaw left to maintain facing center
    });
    
    // Orbit point with constant yaw - in the opposite direction
    const orbitLeft = createStep("Orbit while facing center (left)", 4000, {
      throttle: 0.7,
      pitch: 0,
      roll: -0.4, // Roll left to orbit
      yaw: 0.4 // Yaw right to maintain facing center
    });
    
    // Assemble the routine
    this.steps = [
      BasicSteps.takeOff,
      quickHover,
      
      // Forward with 180° rotations
      yaw180Forward,
      quickHover,
      yaw180Return,
      quickHover,
      
      // Vertical 360° rotations
      yaw360Ascending,
      quickHover,
      yaw360Descending,
      quickHover,
      
      // Sideways with yaw
      yaw180Sideways,
      quickHover,
      
      // Orbiting with yaw
      orbitRight,
      quickHover,
      orbitLeft,
      quickHover,
      
      BasicSteps.land
    ];
  }
  
  // Method to check safety mode
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