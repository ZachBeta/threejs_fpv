export class DronePhysics {
  constructor() {
    // Position and movement
    this.position = { x: 0, y: 10, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
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
    
    // Calculate rotation matrices components once for efficiency
    const cosPitch = Math.cos(this.rotation.x);
    const sinPitch = Math.sin(this.rotation.x);
    const cosRoll = Math.cos(this.rotation.z);
    const sinRoll = Math.sin(this.rotation.z);
    const cosYaw = Math.cos(this.rotation.y);
    const sinYaw = Math.sin(this.rotation.y);
    
    // Apply throttle with non-linear acceleration curve and momentum
    // Gradually change throttle response for more realistic inertia
    this.previousThrottle += (this.throttle - this.previousThrottle) * 
                             this.throttleChangeRate * deltaTime;
    
    if (this.previousThrottle > 0) {
      // Non-linear throttle response for more realistic feel
      const throttleResponse = Math.pow(this.previousThrottle, 1.5);
      
      // Calculate drone's up vector based on its rotation
      // For a typical FPV drone, positive throttle should push the drone in its own upward direction
      // We need to calculate the direction vector based on the drone's current rotation
      
      // Calculate the up vector (initially [0, 1, 0]) after all rotations
      // This gives us the direction the drone's thrust should push it
      
      // Apply rotations in order: yaw, pitch, roll
      // These calculations combine the rotation matrices for each axis
      let upX = sinRoll * cosPitch;
      let upY = cosRoll * cosPitch;
      let upZ = sinPitch;
      
      // Apply the thrust in the direction of the drone's up vector
      this.velocity.x += upX * throttleResponse * this.throttleAcceleration * deltaTime;
      this.velocity.y += upY * throttleResponse * this.throttleAcceleration * deltaTime;
      this.velocity.z += upZ * throttleResponse * this.throttleAcceleration * deltaTime;
    }
    
    // Apply forward/sideways movement based on tilt
    // This simulates how tilting a drone causes it to move in that direction
    if (this.previousThrottle > 0) {
      // In our coordinate system:
      // - Forward is -Z (drone flies forward when pitched down, which is -X rotation)
      // - Right is +X (drone flies right when rolled right, which is +Z rotation)
      // - Up is +Y
      
      // When yawed, the forward and right directions rotate around the Y axis
      
      // Forward vector calculation (where the drone is facing)
      // When yaw = 0, forward is -Z
      // When yaw = 90 (π/2), forward is -X
      const forwardX = -sinYaw;  // Negative because forward is opposite of the way we're facing
      const forwardZ = -cosYaw;  // Negative because forward is -Z in our coordinate system
      
      // Right vector calculation (perpendicular to forward and up)
      // When yaw = 0, right is +X
      // When yaw = 90 (π/2), right is -Z
      const rightX = cosYaw;
      const rightZ = -sinYaw;
      
      // Apply forward force based on pitch angle (scaled by tilt force and throttle)
      // When pitched forward (negative pitch), we move forward
      const pitchForce = -this.rotation.x * this.tiltForce * this.previousThrottle * 1.5;
      this.velocity.x += forwardX * pitchForce * deltaTime;
      this.velocity.z += forwardZ * pitchForce * deltaTime;
      
      // Apply sideways force based on roll angle (scaled by tilt force and throttle)
      // When rolled right (positive roll), we move right
      const rollForce = this.rotation.z * this.tiltForce * this.previousThrottle;
      this.velocity.x += rightX * rollForce * deltaTime;
      this.velocity.z += rightZ * rollForce * deltaTime;
    }

    // Apply air resistance with different coefficients for horizontal and vertical movement
    // Horizontal drag - affects x and z components
    const horizontalSpeed = Math.sqrt(
      this.velocity.x * this.velocity.x + 
      this.velocity.z * this.velocity.z
    );
    
    if (horizontalSpeed > 0) {
      // Air resistance proportional to velocity squared for more realism at high speeds
      const horizontalDragForce = horizontalSpeed * this.horizontalDrag * 
                                (1 + horizontalSpeed * 0.1); // Adding some quadratic component
      
      // Apply drag in opposite direction of movement
      this.velocity.x *= (1 - horizontalDragForce * deltaTime);
      this.velocity.z *= (1 - horizontalDragForce * deltaTime);
    }
    
    // Vertical drag - depends on whether drone is moving up or down
    // When throttle is low/zero and falling, simulate free fall with less drag
    const verticalDragCoef = this.throttle < 0.1 && this.velocity.y < 0 
                           ? this.verticalDrag * 0.5 // Less drag when falling
                           : this.verticalDrag;
    
    const verticalDragForce = Math.abs(this.velocity.y) * verticalDragCoef;
    this.velocity.y *= (1 - verticalDragForce * deltaTime);

    // Apply hover mode
    if (this.hoverMode) {
      const heightError = this.hoverHeight - this.position.y;
      this.velocity.y += heightError * this.hoverStrength * deltaTime;
    }

    // Update angular velocities based on control inputs
    this.angularVelocity.x += (this.pitch - this.rotation.x) * this.tiltSpeed * deltaTime;
    this.angularVelocity.z += (this.roll - this.rotation.z) * this.tiltSpeed * deltaTime;
    this.angularVelocity.y += this.yaw * this.tiltSpeed * deltaTime;

    // Apply angular damping
    this.angularVelocity.x *= this.angularDamping;
    this.angularVelocity.y *= this.angularDamping;
    this.angularVelocity.z *= this.angularDamping;

    // Update rotations
    this.rotation.x += this.angularVelocity.x * deltaTime;
    this.rotation.y += this.angularVelocity.y * deltaTime;
    this.rotation.z += this.angularVelocity.z * deltaTime;

    // Update positions
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;

    // Ground collision
    if (this.position.y < this.groundLevel) {
      this.position.y = this.groundLevel;
      this.velocity.y = 0;
      
      // Apply friction when on ground to stop horizontal movement
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
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
    this.previousThrottle = 0;
    this.pitch = 0;
    this.roll = 0;
    this.yaw = 0;
    this.hoverMode = false;
  }
} 