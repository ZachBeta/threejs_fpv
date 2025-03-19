import * as THREE from 'three';

export class DronePhysics {
  constructor() {
    // Position and movement
    this.position = { x: 0, y: 10, z: 0 };
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
    
    // Hover mode
    this.hoverMode = false;
    this.hoverHeight = 5;
    this.hoverStrength = 4.0;  // Further reduced for smoother response
    this.hoverDamping = 0.9;   // Increased damping for better stability
    this.lastThrottle = 0;
    this.hoverAdjustRate = 3.0; // Slower height adjustments
    this.hoverIntegralError = 0;
    this.hoverMaxIntegral = 0.5; // Reduced to prevent overshoot
    this.hoverDeadzone = 0.05;
    this.targetHoverHeight = 5; // New: separate target for smooth transitions
    this.hoverTransitionSpeed = 2.0; // New: control transition speed
    
    // Momentum tracking
    this.previousThrottle = 0;
    this.throttleChangeRate = 8.0;
  }

  updatePhysics(deltaTime) {
    // Apply gravity
    this.velocity.y -= this.gravity * deltaTime;
    
    // Update rotations first
    this.updateRotations(deltaTime);
    
    // Then update position based on new orientation
    this.updatePosition(deltaTime);
    
    // Apply ground collision
    this.handleGroundCollision();
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
    
    // Hover mode control (like cruise control)
    if (this.hoverMode) {
      // Update target height based on throttle input (like adjusting cruise speed)
      if (Math.abs(this.throttle) > this.hoverDeadzone) {
        // Scale height change by throttle amount for finer control
        const heightChange = this.throttle * this.hoverAdjustRate * deltaTime;
        this.targetHoverHeight += heightChange;
      }
      
      // Smoothly transition current hover height to target
      const heightDiff = this.targetHoverHeight - this.hoverHeight;
      if (Math.abs(heightDiff) > 0.001) {
        this.hoverHeight += heightDiff * this.hoverTransitionSpeed * deltaTime;
      }

      // PID control for hover
      const heightError = this.hoverHeight - this.position.y;
      const heightErrorVelocity = -this.velocity.y;
      
      // Update integral error with anti-windup
      if (Math.abs(heightError) < 1.0) { // Only accumulate when close
        this.hoverIntegralError += heightError * deltaTime;
        this.hoverIntegralError = Math.max(-this.hoverMaxIntegral, 
                                         Math.min(this.hoverMaxIntegral, this.hoverIntegralError));
      } else {
        this.hoverIntegralError = 0; // Reset when far from target
      }
      
      // PID force calculation with smoother response
      const proportionalForce = heightError * this.hoverStrength;
      const derivativeForce = heightErrorVelocity * this.hoverDamping;
      const integralForce = this.hoverIntegralError * (this.hoverStrength * 0.02); // Further reduced integral gain
      
      // Combine forces with gravity compensation
      const baseForce = proportionalForce + derivativeForce + integralForce;
      const gravityCompensation = this.gravity * (1.0 + Math.abs(heightError) * 0.1); // Adaptive gravity compensation
      const hoverForce = (baseForce + gravityCompensation) * deltaTime;
      
      // Apply hover force with smooth ramping
      const forceScale = Math.min(1.0, Math.abs(heightError) * 2.0); // Ramp up force based on error
      this.velocity.y += hoverForce * forceScale;
    }
    
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

  handleGroundCollision() {
    if (this.position.y < this.groundLevel) {
      this.position.y = this.groundLevel;
      this.velocity.y = 0;
      
      // Apply ground friction
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
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

  toggleHoverMode() {
    this.hoverMode = !this.hoverMode;
    if (this.hoverMode) {
      // When engaging hover (like engaging cruise control), use current height
      this.hoverHeight = this.position.y;
      this.targetHoverHeight = this.position.y;
      this.hoverIntegralError = 0;
    }
  }

  reset() {
    this.position = { x: 0, y: 10, z: 0 };
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
    this.hoverMode = false;
  }
} 