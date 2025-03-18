import * as THREE from 'three';

export class Map {
  constructor(scene) {
    this.scene = scene;
    
    // Set scene background
    this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Add fog for edge fade-out effect
    this.scene.fog = new THREE.Fog(0x87CEEB, 1000, 4000);
    
    // Setup lighting
    this.setupLighting();
    
    // Create ground and grid
    this.setupGround();
    
    // Create landing pad
    this.setupLandingPad();
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);
  }
  
  setupGround() {
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      side: THREE.DoubleSide
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Add grid lines to create checkered floor
    const gridHelper = new THREE.GridHelper(1000, 100, 0x000000, 0x000000);
    this.scene.add(gridHelper);
  }
  
  setupLandingPad() {
    // Create landing pad to mark start/end position
    const landingPadGeometry = new THREE.CylinderGeometry(2, 2, 0.1, 32);
    const landingPadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.7
    });
    this.landingPad = new THREE.Mesh(landingPadGeometry, landingPadMaterial);
    this.landingPad.position.y = 0.05; // Position slightly above ground to prevent z-fighting
    this.landingPad.receiveShadow = true;
    this.scene.add(this.landingPad);
  }
  
  // Method to reset or update map state if needed
  reset() {
    // Currently no state to reset, but we can add functionality here if needed
  }
} 