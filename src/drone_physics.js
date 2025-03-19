import * as THREE from 'three';

export class DronePhysics {
  constructor(scene = null, startPosition = null) {
    // Store reference to scene for collision detection
    this.scene = scene;
    
    // Default start position if not provided
    const defaultPosition = { x: 0, y: 51.0, z: 0 };
    
    // Position and movement - use provided start position or default
    this.position = startPosition ? { ...startPosition } : { ...defaultPosition };
    this.initialPosition = { ...this.position }; // Store initial position for reset
    this.velocity = { x: 0, y: 0, z: 0 };
    
    // Use THREE.js for quaternion math
    this.quaternion = new THREE.Quaternion();
    this.targetQuaternion = new THREE.Quaternion();
    this.rotationEuler = new THREE.Euler(0, 0, 0, 'YXZ'); // YXZ order: yaw, pitch, roll
    this.localRotation = { x: 0, y: 0, z: 0 }; // For input tracking
    this.angularVelocity = { x: 0, y: 0, z: 0 };
    
    // Vectors for transformation
    this.forward = new THREE.Vector3(0, 0, -1);
    this.up = new THREE.Vector3(0, 1, 0);
    this.right = new THREE.Vector3(1, 0, 0);
    
    // Controls
    this.throttle = 0;
    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;
    this.lastYaw = 0; // Track last yaw input for null handling
    
    // Physics parameters
    this.gravity = 9.81;
    this.maxThrottle = 1.0;
    this.throttleAcceleration = 40.0;
    this.tiltSpeed = 2.0;
    this.yawSpeed = 2.0; // Reduced from 4.5 for smoother control
    this.yawAcceleration = 4.0; // New parameter for smooth yaw changes
    this.yawDamping = 0.92; // New parameter for yaw momentum
    this.airResistance = 0.05;
    this.angularDamping = 0.95;
    this.tiltForce = 5.0;
    this.horizontalDrag = 0.02;
    this.verticalDrag = 0.05;
    this.mass = 0.5;
    
    // Environment
    this.groundLevel = 0;
    
    // Altitude hold mode (renamed from hover mode)
    this.altitudeHoldActive = false;
    this.altitudeHoldHeight = 5;
    this.altitudeHoldStrength = 4.0;  // Further reduced for smoother response
    this.altitudeHoldDamping = 0.9;   // Increased damping for better stability
    this.lastThrottle = 0;
    this.altitudeHoldAdjustRate = 3.0; // Slower height adjustments
    this.altitudeHoldIntegralError = 0;
    this.altitudeHoldMaxIntegral = 0.5; // Reduced to prevent overshoot
    this.altitudeHoldDeadzone = 0.05;
    this.targetAltitudeHoldHeight = 5; // New: separate target for smooth transitions
    this.altitudeHoldTransitionSpeed = 2.0; // New: control transition speed
    
    // Momentum tracking
    this.previousThrottle = 0;
    this.throttleChangeRate = 8.0;
    
    // Safety mode - when false, allows full acrobatic flight
    this.safetyMode = true;
    this.maxTiltAngle = Math.PI / 4; // 45 degrees maximum tilt when safety is enabled
  }

  updatePhysics(deltaTime) {
    // Prior position for teleportation detection
    const priorY = this.position.y;
    
    // Apply gravity
    this.velocity.y -= this.gravity * deltaTime;
    
    // Update rotations first
    this.updateRotations(deltaTime);
    
    // Then update position based on new orientation
    this.updatePosition(deltaTime);
    
    // Apply ground and landing pad collision
    this.handleGroundCollision(priorY, deltaTime);
  }

  updateRotations(deltaTime) {
    // Handle yaw input with smooth acceleration
    if (this.yaw === null) {
      // When yaw is null, gradually reduce rotation
      this.angularVelocity.y *= this.yawDamping;
    } else {
      // Smoothly accelerate yaw based on input
      const targetYawVelocity = this.yaw * this.yawSpeed;
      const yawDiff = targetYawVelocity - this.angularVelocity.y;
      this.angularVelocity.y += yawDiff * this.yawAcceleration * deltaTime;
    }
    
    // Apply yaw rotation with momentum
    this.localRotation.y += this.angularVelocity.y * deltaTime;
    
    // Update pitch and roll
    this.localRotation.x += this.pitch * this.tiltSpeed * deltaTime; // Pitch
    this.localRotation.z += this.roll * this.tiltSpeed * deltaTime; // Roll
    
    // Apply safety limits if enabled
    if (this.safetyMode) {
      // Limit pitch and roll angles
      this.localRotation.x = Math.max(Math.min(this.localRotation.x, this.maxTiltAngle), -this.maxTiltAngle);
      this.localRotation.z = Math.max(Math.min(this.localRotation.z, this.maxTiltAngle), -this.maxTiltAngle);
    }
    
    // Apply angular damping
    this.localRotation.x *= this.angularDamping;
    this.localRotation.z *= this.angularDamping;
    
    // Update rotation euler with current local rotation
    this.rotationEuler.set(
      this.localRotation.x,
      this.localRotation.y,
      this.localRotation.z
    );
    
    // Convert to quaternion
    this.quaternion.setFromEuler(this.rotationEuler);
    
    // Update direction vectors
    this.forward.set(0, 0, -1).applyQuaternion(this.quaternion);
    this.up.set(0, 1, 0).applyQuaternion(this.quaternion);
    this.right.set(1, 0, 0).applyQuaternion(this.quaternion);
  }

  updatePosition(deltaTime) {
    // Gradually change throttle for momentum
    this.previousThrottle += (this.throttle - this.previousThrottle) * 
                           this.throttleChangeRate * deltaTime;
    
    if (this.previousThrottle > 0) {
      // Apply thrust in the up direction
      const throttleResponse = Math.pow(this.previousThrottle, 1.5);
      const thrustForce = throttleResponse * this.throttleAcceleration;
      
      // Add velocity in the up direction
      this.velocity.x += this.up.x * thrustForce * deltaTime;
      this.velocity.y += this.up.y * thrustForce * deltaTime;
      this.velocity.z += this.up.z * thrustForce * deltaTime;
      
      // Apply translational forces from tilt
      this.applyTiltForces(deltaTime);
    }
    
    // Apply air resistance
    this.applyAirResistance(deltaTime);
    
    // Apply altitude hold
    this.applyAltitudeHold(deltaTime);
    
    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
  }

  applyTiltForces(deltaTime) {
    // Apply forward/backward force based on pitch
    const pitchForce = -this.localRotation.x * this.tiltForce * this.previousThrottle;
    this.velocity.x += this.forward.x * pitchForce * deltaTime;
    this.velocity.y += this.forward.y * pitchForce * deltaTime;
    this.velocity.z += this.forward.z * pitchForce * deltaTime;
    
    // Apply sideways force based on roll
    const rollForce = this.localRotation.z * this.tiltForce * this.previousThrottle;
    this.velocity.x += this.right.x * rollForce * deltaTime;
    this.velocity.y += this.right.y * rollForce * deltaTime;
    this.velocity.z += this.right.z * rollForce * deltaTime;
  }

  applyAirResistance(deltaTime) {
    // Horizontal drag
    const horizontalSpeed = Math.sqrt(
      this.velocity.x * this.velocity.x + 
      this.velocity.z * this.velocity.z
    );
    
    if (horizontalSpeed > 0) {
      const horizontalDragForce = horizontalSpeed * this.horizontalDrag * 
                                (1 + horizontalSpeed * 0.1);
      this.velocity.x *= (1 - horizontalDragForce * deltaTime);
      this.velocity.z *= (1 - horizontalDragForce * deltaTime);
    }
    
    // Only apply vertical drag when not in freefall
    if (!(this.throttle < 0.1 && this.velocity.y < 0)) {
      const verticalDragForce = Math.abs(this.velocity.y) * this.verticalDrag;
      this.velocity.y *= (1 - verticalDragForce * deltaTime);
    }
  }

  handleGroundCollision(priorY, deltaTime) {
    // Ground collision
    if (this.position.y < this.groundLevel) {
      this.position.y = this.groundLevel;
      this.velocity.y = 0;
      
      // Apply ground friction
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
    }
    
    // Check for landing pad collision
    if (this.scene) {
      this.scene.children.forEach(object => {
        if (object.userData && object.userData.isCollider) {
          if (object.userData.type === 'landingPad') {
            // Enhanced collision detection for high velocities
            const landingPadY = object.position.y;
            const landingPadRadius = 2; // Same as the cylinder radius
            
            // Check if drone is above landing pad horizontally
            const dx = this.position.x - object.position.x;
            const dz = this.position.z - object.position.z;
            const distanceSquared = dx * dx + dz * dz;
            
            if (distanceSquared < landingPadRadius * landingPadRadius) {
              // Drone is within the horizontal bounds of the landing pad
              
              // For extreme velocities (teleportation-like), we need to check if the drone
              // started above the landing pad and ended below it in a single step
              if (priorY > landingPadY && this.position.y < landingPadY) {
                // We've teleported through the landing pad in one step
                this.position.y = landingPadY + 0.1; // Place on the landing pad
                this.velocity.y = 0;
                
                // Apply higher friction
                this.velocity.x *= 0.6;
                this.velocity.z *= 0.6;
                return; // Skip further collision detection
              }
              
              // For high velocities, use continuous collision detection
              if (this.velocity.y < -10) { // Only for significant downward velocities
                // The step size we need to check to prevent tunneling (based on velocity)
                const frameTime = deltaTime || 0.016; // Use provided deltaTime or default
                const velocityMagnitude = Math.abs(this.velocity.y);
                const safeStepSize = 0.1; // Maximum allowed movement per sub-step
                const numSubSteps = Math.max(1, Math.ceil(velocityMagnitude * frameTime / safeStepSize));
                const subStepTime = frameTime / numSubSteps;
                
                // Simulate movement in smaller sub-steps for continuous collision detection
                let collided = false;
                const originalY = this.position.y; // Store original position
                
                for (let i = 0; i < numSubSteps; i++) {
                  // Calculate next position
                  const nextY = this.position.y + this.velocity.y * subStepTime;
                  
                  // Check if this sub-step crosses the landing pad
                  if (this.position.y > landingPadY && nextY <= landingPadY) {
                    // Collision detected - stop at landing pad
                    this.position.y = landingPadY + 0.1; // Rest slightly above the pad
                    this.velocity.y = 0;
                    
                    // Apply higher friction when landing on the pad
                    this.velocity.x *= 0.6;
                    this.velocity.z *= 0.6;
                    
                    collided = true;
                    break;
                  }
                  
                  // If no collision, update position for next sub-step
                  if (!collided) {
                    this.position.y = nextY;
                  }
                }
                
                // If no collision occurred during sub-steps, restore the original position
                // to let normal physics continue
                if (!collided) {
                  this.position.y = originalY;
                } else {
                  return; // Skip further processing if a collision was detected
                }
              }
              
              // Standard collision check (already on or near the pad)
              if (this.position.y <= (landingPadY + 0.1) && 
                  this.position.y >= (landingPadY - 0.1)) {
                
                // Keep the drone on the landing pad
                this.position.y = landingPadY + 0.1; // Rest slightly above the pad
                this.velocity.y = 0;
                
                // Apply higher friction when on the pad
                this.velocity.x *= 0.6;
                this.velocity.z *= 0.6;
              }
            }
          }
        }
      });
    }
  }

  // Control setters
  setThrottle(value) {
    this.throttle = Math.min(Math.max(0, value), this.maxThrottle);
  }

  setPitch(value) {
    this.pitch = Math.min(Math.max(-1, value), 1);
  }

  setRoll(value) {
    this.roll = Math.min(Math.max(-1, value), 1);
  }

  setYaw(value) {
    // Handle null value for maintaining current heading
    if (value === null) {
      this.yaw = null;
      return;
    }
    this.yaw = Math.min(Math.max(-1, value), 1);
  }

  toggleAltitudeHold() {
    if (this.altitudeHoldActive) {
      this.disableAltitudeHold();
    } else {
      this.enableAltitudeHold();
    }
    return this.altitudeHoldActive;
  }

  enableAltitudeHold() {
    this.altitudeHoldActive = true;
    this.altitudeHoldHeight = this.position.y;
    this.targetAltitudeHoldHeight = this.position.y;
    this.altitudeHoldIntegralError = 0;
    console.log("Altitude hold enabled at height:", this.position.y);
  }

  disableAltitudeHold() {
    this.altitudeHoldActive = false;
    // Reset integral error when disabling to prevent unexpected behavior when re-enabling
    this.altitudeHoldIntegralError = 0;
    console.log("Altitude hold disabled");
  }

  toggleSafetyMode() {
    this.safetyMode = !this.safetyMode;
    return this.safetyMode;
  }
  
  enableSafetyMode() {
    this.safetyMode = true;
  }
  
  disableSafetyMode() {
    this.safetyMode = false;
  }

  reset() {
    // Maintain scene reference
    const scene = this.scene;
    
    this.position = { ...this.initialPosition }; // Reset to initial position
    this.velocity = { x: 0, y: 0, z: 0 };
    this.quaternion.set(0, 0, 0, 1);
    this.localRotation = { x: 0, y: 0, z: 0 };
    this.angularVelocity = { x: 0, y: 0, z: 0 };
    this.forward.set(0, 0, -1);
    this.up.set(0, 1, 0);
    this.right.set(1, 0, 0);
    this.throttle = 0;
    this.previousThrottle = 0;
    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;
    this.altitudeHoldActive = false;
    this.safetyMode = true; // Reset to safe mode by default
    
    // Restore scene reference
    this.scene = scene;
  }

  // Update altitude hold height target based on throttle input
  updateAltitudeHoldTarget(deltaTime) {
    if (Math.abs(this.throttle) > this.altitudeHoldDeadzone) {
      // Adjust target height based on throttle direction and value
      this.targetAltitudeHoldHeight += this.throttle * this.altitudeHoldAdjustRate * deltaTime;
    }
    
    // Smoothly transition to target height
    this.altitudeHoldHeight += (this.targetAltitudeHoldHeight - this.altitudeHoldHeight) 
                            * this.altitudeHoldTransitionSpeed * deltaTime;
  }

  // Apply altitude hold forces
  applyAltitudeHold(deltaTime) {
    if (!this.altitudeHoldActive) return;
    
    // Update target height based on throttle input
    this.updateAltitudeHoldTarget(deltaTime);
    
    // Calculate error and derivative (vertical velocity)
    const heightError = this.altitudeHoldHeight - this.position.y;
    const velocityError = -this.velocity.y; // Negative because upward is positive
    
    // Update integral term with anti-windup
    this.altitudeHoldIntegralError += heightError * deltaTime;
    this.altitudeHoldIntegralError = Math.max(
      -this.altitudeHoldMaxIntegral,
      Math.min(this.altitudeHoldMaxIntegral, this.altitudeHoldIntegralError)
    );
    
    // PID controller for altitude hold with stronger gains
    const pTerm = heightError * 5.0;
    const dTerm = velocityError * 3.0;
    const iTerm = this.altitudeHoldIntegralError * 1.0;
    
    // Combined force with stronger gravity compensation
    const gravityCompensation = this.gravity * 1.2; // Over-compensate gravity slightly
    let hoverForce = (pTerm + dTerm + iTerm) + gravityCompensation;
    
    // Scale force based on error magnitude for smoother response
    const forceScale = Math.min(1.0, Math.abs(heightError) * 0.5);
    
    // Apply the force to the vertical velocity
    this.velocity.y += hoverForce * forceScale * deltaTime;
  }

  // Add backward compatibility getter/setter for hoverMode
  get hoverMode() {
    return this.altitudeHoldActive;
  }
  
  set hoverMode(value) {
    this.altitudeHoldActive = value;
    if (value) {
      this.altitudeHoldHeight = this.position.y;
      this.targetAltitudeHoldHeight = this.position.y;
      this.altitudeHoldIntegralError = 0;
    }
  }
} 