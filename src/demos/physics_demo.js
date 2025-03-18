import * as THREE from 'three';
import { DronePhysics } from '../physics.js';

class PhysicsDemo {
  constructor() {
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x808080,
      side: THREE.DoubleSide
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.scene.add(this.ground);

    // Create drone mesh
    const droneGeometry = new THREE.BoxGeometry(1, 0.2, 1);
    const droneMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.droneMesh = new THREE.Mesh(droneGeometry, droneMaterial);
    this.droneMesh.position.y = 10;
    this.scene.add(this.droneMesh);

    // Add propellers
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
      this.droneMesh.add(propeller);
      this.propellers.push(propeller);
    });

    // Initialize physics
    this.physics = new DronePhysics();
    
    // Set up camera position
    this.camera.position.set(0, 15, 15);
    this.camera.lookAt(0, 0, 0);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(), false);

    // Start animation loop
    this.animate();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update physics
    this.physics.updatePhysics(0.016); // Assuming 60fps

    // Update drone mesh position and rotation
    this.droneMesh.position.copy(this.physics.position);
    
    // Convert plain object rotation to THREE.Euler rotation
    this.droneMesh.rotation.x = this.physics.rotation.x;
    this.droneMesh.rotation.y = this.physics.rotation.y;
    this.droneMesh.rotation.z = this.physics.rotation.z;

    // Animate propellers based on throttle
    const propellerSpeed = this.physics.throttle * 10;
    this.propellers.forEach(propeller => {
      propeller.rotation.y += propellerSpeed;
    });

    this.renderer.render(this.scene, this.camera);
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

  toggleHoverMode() {
    this.physics.toggleHoverMode();
  }

  reset() {
    this.physics.reset();
  }
}

// Create demo instance
const demo = new PhysicsDemo();

// Add keyboard controls
document.addEventListener('keydown', (event) => {
  switch(event.key) {
    case ' ': // Spacebar for throttle
      demo.setThrottle(1.0);
      break;
    case 'w':
      demo.setPitch(1.0);
      break;
    case 's':
      demo.setPitch(-1.0);
      break;
    case 'a':
      demo.setRoll(-1.0);
      break;
    case 'd':
      demo.setRoll(1.0);
      break;
    case 'q':
      demo.setYaw(-1.0);
      break;
    case 'e':
      demo.setYaw(1.0);
      break;
    case 'h':
      demo.toggleHoverMode();
      break;
    case 'r':
      demo.reset();
      break;
  }
});

document.addEventListener('keyup', (event) => {
  switch(event.key) {
    case ' ':
      demo.setThrottle(0);
      break;
    case 'w':
    case 's':
      demo.setPitch(0);
      break;
    case 'a':
    case 'd':
      demo.setRoll(0);
      break;
    case 'q':
    case 'e':
      demo.setYaw(0);
      break;
  }
}); 