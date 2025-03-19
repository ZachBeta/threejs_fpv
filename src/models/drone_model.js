import * as THREE from 'three';
import { DronePhysics } from '../drone_physics.js';

export class DroneModel {
  constructor(scene) {
    // Store scene reference
    this.scene = scene;

    // Initialize physics with a reference to the scene for collision detection
    this.physics = new DronePhysics(scene);
    
    // Create drone mesh
    this.createDroneMesh();
    
    // Add to scene
    this.scene.add(this.droneMesh);
  }

  createDroneMesh() {
    // Create main drone body
    const droneGeometry = new THREE.BoxGeometry(1, 0.2, 1);
    const droneMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.droneMesh = new THREE.Mesh(droneGeometry, droneMaterial);
    this.droneMesh.position.y = 51.0; // Match the new higher initial height 
    this.droneMesh.castShadow = true;
    this.droneMesh.rotation.y = Math.PI; // Rotate 180 degrees to face away from camera

    // Add orientation indicators
    this.addOrientationIndicators();

    // Add propellers
    this.addPropellers();
  }

  addOrientationIndicators() {
    // Front indicator (red)
    const frontIndicator = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    frontIndicator.rotation.x = Math.PI / 2; // Point forward
    frontIndicator.position.z = 0.6;
    frontIndicator.castShadow = true;
    this.droneMesh.add(frontIndicator);

    // Up indicator (blue)
    const upIndicator = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x0000ff })
    );
    upIndicator.position.y = 0.3;
    upIndicator.castShadow = true;
    this.droneMesh.add(upIndicator);

    // Right indicator (green)
    const rightIndicator = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 })
    );
    rightIndicator.rotation.z = -Math.PI / 2; // Point right
    rightIndicator.position.x = 0.6;
    rightIndicator.castShadow = true;
    this.droneMesh.add(rightIndicator);
  }

  addPropellers() {
    const propellerGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
    const propellerMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    this.propellers = [];
    const propellerPositions = [
      { x: -0.5, z: -0.5 },
      { x: 0.5, z: -0.5 },
      { x: -0.5, z: 0.5 },
      { x: 0.5, z: 0.5 }
    ];

    propellerPositions.forEach(pos => {
      const propeller = new THREE.Mesh(propellerGeometry, propellerMaterial);
      propeller.position.set(pos.x, 0.1, pos.z);
      propeller.castShadow = true;
      this.droneMesh.add(propeller);
      this.propellers.push(propeller);
    });
  }

  update(deltaTime) {
    // Update physics
    this.physics.updatePhysics(deltaTime);

    // Update drone mesh position
    this.droneMesh.position.x = this.physics.position.x;
    this.droneMesh.position.y = this.physics.position.y;
    this.droneMesh.position.z = this.physics.position.z;
    
    // Update drone rotation using quaternion
    this.droneMesh.quaternion.copy(this.physics.quaternion);
    // Add 180 degrees rotation around Y to keep facing away from camera
    this.droneMesh.rotateY(Math.PI);

    // Animate propellers based on throttle
    const propellerSpeed = this.physics.throttle * 0.5;
    this.propellers.forEach(propeller => {
      propeller.rotation.y += propellerSpeed;
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
    this.droneMesh.position.set(0, 51.0, 0); // Match the new higher initial height
    this.droneMesh.rotation.set(0, Math.PI, 0);
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
    return this.physics.hoverMode;
  }
} 