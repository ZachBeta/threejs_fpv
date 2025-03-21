import * as THREE from 'three';
import { DronePhysics } from '../drone_physics.js';

export class DroneModel {
  constructor(scene, map = null) {
    // Store scene reference
    this.scene = scene;
    
    // Get start position from the map if provided
    let startPosition = null;
    if (map) {
      startPosition = map.getLandingPadPosition();
    }

    // Initialize physics with a reference to the scene for collision detection and start position
    this.physics = new DronePhysics(scene, startPosition);
    
    // Store the initial position for reset
    this.initialPosition = { ...this.physics.position };
    
    // Create a fixed quaternion for the 180° Y rotation
    this.yRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
    
    // Create drone mesh
    this.createDroneMesh();
    
    // Add to scene
    this.scene.add(this._droneMesh);
  }

  createDroneMesh() {
    // Create main drone body - two parts for top and bottom
    const topGeometry = new THREE.BoxGeometry(1, 0.1, 1);
    const bottomGeometry = new THREE.BoxGeometry(1, 0.1, 1);
    
    // Black top, white bottom as requested
    const topMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const bottomMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    
    this._droneMesh = new THREE.Group();
    
    // Top part of the frame
    const topFrame = new THREE.Mesh(topGeometry, topMaterial);
    topFrame.position.y = 0.05;
    topFrame.castShadow = true;
    this._droneMesh.add(topFrame);
    
    // Bottom part of the frame
    const bottomFrame = new THREE.Mesh(bottomGeometry, bottomMaterial);
    bottomFrame.position.y = -0.05;
    bottomFrame.castShadow = true;
    this._droneMesh.add(bottomFrame);
    
    // Set initial position
    this._droneMesh.position.x = this.physics.position.x;
    this._droneMesh.position.y = this.physics.position.y;
    this._droneMesh.position.z = this.physics.position.z;
    this._droneMesh.rotation.y = Math.PI; // Rotate 180 degrees to face away from camera

    // Add orientation indicators
    this.addOrientationIndicators();

    // Add FPV camera model
    this.addCameraModel();

    // Add propellers
    this.addPropellers();
  }

  addCameraModel() {
    // Create camera box
    const cameraGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const cameraMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2
    });
    this.cameraModel = new THREE.Mesh(cameraGeometry, cameraMaterial);
    
    // Position at the front of the drone, slightly below center
    this.cameraModel.position.z = 0.6; // Same position as red arrow
    this.cameraModel.position.y = -0.05; // Slightly below center
    
    // Create lens
    const lensGeometry = new THREE.CylinderGeometry(0.07, 0.07, 0.05, 16);
    const lensMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.3,
      metalness: 0.8
    });
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.rotation.x = Math.PI / 2; // Rotate to point forward
    lens.position.z = 0.1; // Position at front of camera
    lens.position.y = 0.01; // Slight uptilt
    this.cameraModel.add(lens);
    
    // Create lens glass
    const glassGeometry = new THREE.CircleGeometry(0.06, 16);
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x99ccff,
      roughness: 0.2,
      metalness: 0.9,
      transparent: true,
      opacity: 0.8
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.z = 0.13; // Slightly in front of lens
    glass.rotation.x = Math.PI / 2; // Face forward
    this.cameraModel.add(glass);
    
    // Add small red recording indicator
    const indicatorGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.02);
    const indicatorMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      roughness: 0.3,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    indicator.position.set(0.08, 0.08, 0);
    this.cameraModel.add(indicator);
    
    // Add camera to drone
    this._droneMesh.add(this.cameraModel);
  }

  addOrientationIndicators() {
    // Front indicator (red)
    const frontIndicator = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.4, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.5  // More opaque than before (was 0.15)
      })
    );
    frontIndicator.rotation.x = Math.PI / 2; // Point forward
    frontIndicator.position.z = 0.6;
    frontIndicator.castShadow = true;
    this._droneMesh.add(frontIndicator);

    // Up indicator (blue)
    const upIndicator = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.4, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0x0000ff,
        transparent: true,
        opacity: 0.5  // More opaque than before (was 0.15)
      })
    );
    upIndicator.position.y = 0.3;
    upIndicator.castShadow = true;
    this._droneMesh.add(upIndicator);

    // Right indicator (green)
    const rightIndicator = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.4, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5  // More opaque than before (was 0.15)
      })
    );
    rightIndicator.rotation.z = -Math.PI / 2; // Point right
    rightIndicator.position.x = 0.6;
    rightIndicator.castShadow = true;
    this._droneMesh.add(rightIndicator);
  }

  addPropellers() {
    const propellerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.05, 16);
    // Red propellers as requested
    const propellerMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.7
    });
    
    this.propellers = [];
    const propellerPositions = [
      { x: -0.65, z: -0.65 },
      { x: 0.65, z: -0.65 },
      { x: -0.65, z: 0.65 },
      { x: 0.65, z: 0.65 }
    ];

    propellerPositions.forEach(pos => {
      const propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
      propeller.position.set(pos.x, 0.1, pos.z);
      propeller.castShadow = true;
      this._droneMesh.add(propeller);
      this.propellers.push(propeller);
      
      // Add arm connecting to center
      const armGeometry = new THREE.BoxGeometry(pos.x === -0.65 ? 0.7 : 0.7, 0.05, 0.05);
      const armMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
      const arm = new THREE.Mesh(armGeometry, armMaterial);
      
      // Position arm to connect propeller to center
      if (pos.x < 0 && pos.z < 0) {
        arm.position.set(pos.x/2, 0, pos.z/2);
        arm.rotation.y = Math.PI/4;
      } else if (pos.x > 0 && pos.z < 0) {
        arm.position.set(pos.x/2, 0, pos.z/2);
        arm.rotation.y = -Math.PI/4;
      } else if (pos.x < 0 && pos.z > 0) {
        arm.position.set(pos.x/2, 0, pos.z/2);
        arm.rotation.y = -Math.PI/4;
      } else {
        arm.position.set(pos.x/2, 0, pos.z/2);
        arm.rotation.y = Math.PI/4;
      }
      
      this._droneMesh.add(arm);
    });
  }

  update(deltaTime) {
    // Update physics
    this.physics.updatePhysics(deltaTime);

    // Update drone mesh position
    this._droneMesh.position.x = this.physics.position.x;
    this._droneMesh.position.y = this.physics.position.y;
    this._droneMesh.position.z = this.physics.position.z;
    
    // Create a temporary quaternion for the combined rotation
    const combinedRotation = new THREE.Quaternion();
    // Start with the Y rotation (180° flip)
    combinedRotation.copy(this.yRotation);
    // Then apply the physics rotation
    combinedRotation.multiply(this.physics.quaternion);
    // Apply the combined rotation to the drone mesh
    this._droneMesh.quaternion.copy(combinedRotation);

    // Animate propellers based on throttle
    const propellerSpeed = this.physics.throttle * 0.5;
    const propellerOpacity = Math.min(0.7, 0.3 + this.physics.throttle * 0.4); // Become more transparent at higher speeds
    
    this.propellers.forEach(propeller => {
      propeller.rotation.y += propellerSpeed;
      
      // Update material to simulate motion blur at higher throttle levels
      propeller.material.opacity = propellerOpacity;
      
      // Scale the propeller radius slightly based on throttle to simulate blur
      const blurScale = 1.0 + (this.physics.throttle * 0.2);
      propeller.scale.set(blurScale, 1, blurScale);
    });
  }

  // Control methods
  setThrottle(value) {
    this.physics.setThrottle(value);
  }

  setPitch(value) {
    this.physics.setPitch(value);
  }

  setRoll(value) {
    this.physics.setRoll(value);
  }

  setYaw(value) {
    this.physics.setYaw(value);
  }

  toggleAltitudeHold() {
    return this.physics.toggleAltitudeHold();
  }

  // For backwards compatibility
  toggleHoverMode() {
    return this.toggleAltitudeHold();
  }

  reset() {
    this.physics.reset();
    // Reset drone mesh position and rotation
    this._droneMesh.position.x = this.physics.position.x;
    this._droneMesh.position.y = this.physics.position.y; 
    this._droneMesh.position.z = this.physics.position.z;
    this._droneMesh.rotation.set(0, Math.PI, 0);
  }

  // Getters for physics state
  get position() {
    return this.physics.position;
  }

  get velocity() {
    return this.physics.velocity;
  }

  get rotation() {
    return this.physics.rotation;
  }

  get throttle() {
    return this.physics.throttle;
  }

  get altitudeHoldActive() {
    return this.physics.altitudeHoldActive;
  }
  
  // For backwards compatibility
  get hoverMode() {
    return this.physics.altitudeHoldActive;
  }

  // Add an alias property for use in the physics demo
  get altitudeHold() {
    return this.physics.altitudeHoldActive;
  }
  
  // Expose the droneMesh for debugging and recording
  get droneMesh() {
    return this._droneMesh;
  }
} 