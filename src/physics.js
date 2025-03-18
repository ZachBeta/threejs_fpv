export class DronePhysics {
  constructor() {
    // Position and velocity
    this.position = { x: 0, y: 10, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    
    // Rotation and angular velocity (in radians)
    this.rotation = { x: 0, y: 0, z: 0 };
    this.angularVelocity = { x: 0, y: 0, z: 0 };
    
    // Control inputs
    this.throttle = 0;
    this.pitch = 0;  // Forward/backward tilt
    this.roll = 0;   // Left/right tilt
    this.yaw = 0;    // Left/right rotation
    
    // Physics constants
    this.gravity = 9.81;
    this.maxThrottle = 1.0;
    this.throttleAcceleration = 30.0;
    this.maxTiltAngle = Math.PI / 4; // 45 degrees
    this.tiltSpeed = 2.0; // How fast the drone can tilt
    this.airResistance = 0.05;
    this.angularDamping = 0.95; // How quickly rotation slows down
    
    // Environment
    this.groundLevel = 0;
    
    // Hover mode
    this.hoverMode = false;
    this.hoverHeight = 5;
    this.hoverStrength = 0.5;
  }

  updatePhysics(deltaTime) {
    // Apply gravity
    this.velocity.y -= this.gravity * deltaTime;
    
    // Apply throttle with non-linear acceleration curve
    if (this.throttle > 0) {
      // Non-linear throttle response for more realistic feel
      const throttleResponse = Math.pow(this.throttle, 1.5);
      this.velocity.y += throttleResponse * this.throttleAcceleration * deltaTime;
    }

    // Apply air resistance
    const speed = Math.sqrt(
      this.velocity.x * this.velocity.x + 
      this.velocity.y * this.velocity.y + 
      this.velocity.z * this.velocity.z
    );
    const airResistanceForce = speed * this.airResistance;
    
    this.velocity.x *= (1 - airResistanceForce * deltaTime);
    this.velocity.y *= (1 - airResistanceForce * deltaTime);
    this.velocity.z *= (1 - airResistanceForce * deltaTime);

    // Apply hover mode
    if (this.hoverMode) {
      const heightDiff = this.hoverHeight - this.position.y;
      if (heightDiff > 0) {
        this.velocity.y += heightDiff * this.hoverStrength * deltaTime;
      }
    }

    // Update rotation based on tilt inputs
    this.rotation.x += this.pitch * this.tiltSpeed * deltaTime;
    this.rotation.z += this.roll * this.tiltSpeed * deltaTime;
    this.rotation.y += this.yaw * this.tiltSpeed * deltaTime;

    // Clamp rotation angles
    this.rotation.x = Math.max(-this.maxTiltAngle, Math.min(this.maxTiltAngle, this.rotation.x));
    this.rotation.z = Math.max(-this.maxTiltAngle, Math.min(this.maxTiltAngle, this.rotation.z));

    // Apply angular damping
    this.angularVelocity.x *= this.angularDamping;
    this.angularVelocity.y *= this.angularDamping;
    this.angularVelocity.z *= this.angularDamping;

    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Ground collision
    if (this.position.y < this.groundLevel) {
      this.position.y = this.groundLevel;
      this.velocity.y = 0;
    }
  }

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
  }

  setHoverHeight(height) {
    this.hoverHeight = Math.max(this.groundLevel, height);
  }

  reset() {
    this.position = { x: 0, y: 10, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.angularVelocity = { x: 0, y: 0, z: 0 };
    this.throttle = 0;
    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;
    this.hoverMode = false;
  }
} 