export class DronePhysics {
  constructor() {
    // Position and movement
    this.position = { x: 0, y: 10, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 }; // pitch, yaw, roll
    this.angularVelocity = { x: 0, y: 0, z: 0 };
    
    // Controls
    this.throttle = 0;
    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;
    
    // Physics parameters
    this.gravity = 9.81;
    this.maxThrottle = 1.0;
    this.throttleAcceleration = 40.0;
    this.tiltSpeed = 2.0;
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
    this.hoverStrength = 0.5;
    
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
    // Update angular velocities based on control inputs
    // Note: Control inputs directly influence angular velocity
    this.angularVelocity.x += (this.pitch - this.rotation.x) * this.tiltSpeed * deltaTime;
    this.angularVelocity.y += this.yaw * this.tiltSpeed * deltaTime;
    this.angularVelocity.z += (this.roll - this.rotation.z) * this.tiltSpeed * deltaTime;

    // Apply angular damping
    this.angularVelocity.x *= this.angularDamping;
    this.angularVelocity.y *= this.angularDamping;
    this.angularVelocity.z *= this.angularDamping;

    // Update rotations
    this.rotation.x += this.angularVelocity.x * deltaTime;
    this.rotation.y += this.angularVelocity.y * deltaTime;
    this.rotation.z += this.angularVelocity.z * deltaTime;
  }

  updatePosition(deltaTime) {
    // Gradually change throttle for momentum
    this.previousThrottle += (this.throttle - this.previousThrottle) * 
                           this.throttleChangeRate * deltaTime;
    
    if (this.previousThrottle > 0) {
      // Calculate the drone's up vector based on its rotation
      // This determines the direction of thrust
      const { upX, upY, upZ } = this.calculateUpVector();
      
      // Apply thrust force
      const throttleResponse = Math.pow(this.previousThrottle, 1.5);
      const thrustForce = throttleResponse * this.throttleAcceleration;
      
      this.velocity.x += upX * thrustForce * deltaTime;
      this.velocity.y += upY * thrustForce * deltaTime;
      this.velocity.z += upZ * thrustForce * deltaTime;
      
      // Apply translational forces from tilt
      this.applyTiltForces(deltaTime);
    }
    
    // Apply air resistance
    this.applyAirResistance(deltaTime);
    
    // Apply hover mode if enabled
    if (this.hoverMode) {
      const heightError = this.hoverHeight - this.position.y;
      this.velocity.y += heightError * this.hoverStrength * deltaTime;
    }
    
    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
  }

  calculateUpVector() {
    // Calculate rotation matrices components
    const cosPitch = Math.cos(this.rotation.x);
    const sinPitch = Math.sin(this.rotation.x);
    const cosYaw = Math.cos(this.rotation.y);
    const sinYaw = Math.sin(this.rotation.y);
    const cosRoll = Math.cos(this.rotation.z);
    const sinRoll = Math.sin(this.rotation.z);
    
    // Calculate the drone's up vector (initially [0, 1, 0])
    // after applying all rotations in order: yaw, pitch, roll
    return {
      upX: sinRoll * cosPitch,
      upY: cosRoll * cosPitch,
      upZ: sinPitch
    };
  }

  applyTiltForces(deltaTime) {
    const cosYaw = Math.cos(this.rotation.y);
    const sinYaw = Math.sin(this.rotation.y);
    
    // Forward vector (where the drone is facing)
    const forwardX = -sinYaw;
    const forwardZ = -cosYaw;
    
    // Right vector
    const rightX = cosYaw;
    const rightZ = -sinYaw;
    
    // Apply forward force based on pitch
    const pitchForce = -this.rotation.x * this.tiltForce * this.previousThrottle;
    this.velocity.x += forwardX * pitchForce * deltaTime;
    this.velocity.z += forwardZ * pitchForce * deltaTime;
    
    // Apply sideways force based on roll
    const rollForce = this.rotation.z * this.tiltForce * this.previousThrottle;
    this.velocity.x += rightX * rollForce * deltaTime;
    this.velocity.z += rightZ * rollForce * deltaTime;
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
    
    // Vertical drag
    const verticalDragCoef = this.throttle < 0.1 && this.velocity.y < 0 
                          ? this.verticalDrag * 0.5 
                          : this.verticalDrag;
    const verticalDragForce = Math.abs(this.velocity.y) * verticalDragCoef;
    this.velocity.y *= (1 - verticalDragForce * deltaTime);
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
    this.yaw = Math.min(Math.max(-1, value), 1);
  }

  toggleHoverMode() {
    this.hoverMode = !this.hoverMode;
    if (this.hoverMode) {
      this.hoverHeight = this.position.y;
    }
  }

  reset() {
    this.position = { x: 0, y: 10, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.angularVelocity = { x: 0, y: 0, z: 0 };
    this.throttle = 0;
    this.previousThrottle = 0;
    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;
    this.hoverMode = false;
  }
} 