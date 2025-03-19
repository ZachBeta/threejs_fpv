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
    
    // Create XYZ axes helper at origin with arrows
    this.setupCustomAxes();
    
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
  
  setupCustomAxes() {
    // Create custom axes with arrows
    const axisLength = 15;
    const axisThickness = 0.2;
    const arrowSize = 1;
    
    // Create X axis (red)
    const xAxisGeo = new THREE.CylinderGeometry(axisThickness, axisThickness, axisLength, 12);
    const xAxisMat = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8
    });
    const xAxis = new THREE.Mesh(xAxisGeo, xAxisMat);
    xAxis.rotation.z = -Math.PI / 2; // Rotate to X axis orientation
    xAxis.position.x = axisLength / 2;
    
    // Create X axis arrow
    const xArrowGeo = new THREE.ConeGeometry(arrowSize * 0.8, arrowSize * 2, 12);
    const xArrow = new THREE.Mesh(xArrowGeo, xAxisMat);
    xArrow.rotation.z = -Math.PI / 2; // Orient along X axis
    xArrow.position.x = axisLength + arrowSize;
    
    // Create Y axis (green)
    const yAxisGeo = new THREE.CylinderGeometry(axisThickness, axisThickness, axisLength, 12);
    const yAxisMat = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8
    });
    const yAxis = new THREE.Mesh(yAxisGeo, yAxisMat);
    yAxis.position.y = axisLength / 2;
    
    // Create Y axis arrow
    const yArrowGeo = new THREE.ConeGeometry(arrowSize * 0.8, arrowSize * 2, 12);
    const yArrow = new THREE.Mesh(yArrowGeo, yAxisMat);
    yArrow.position.y = axisLength + arrowSize;
    
    // Create Z axis (blue)
    const zAxisGeo = new THREE.CylinderGeometry(axisThickness, axisThickness, axisLength, 12);
    const zAxisMat = new THREE.MeshStandardMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: 0.8
    });
    const zAxis = new THREE.Mesh(zAxisGeo, zAxisMat);
    zAxis.rotation.x = Math.PI / 2; // Rotate to Z axis orientation
    zAxis.position.z = axisLength / 2;
    
    // Create Z axis arrow
    const zArrowGeo = new THREE.ConeGeometry(arrowSize * 0.8, arrowSize * 2, 12);
    const zArrow = new THREE.Mesh(zArrowGeo, zAxisMat);
    zArrow.rotation.x = Math.PI / 2; // Orient along Z axis
    zArrow.position.z = axisLength + arrowSize;
    
    // Create a group to hold all axes
    this.axesGroup = new THREE.Group();
    this.axesGroup.add(xAxis, xArrow, yAxis, yArrow, zAxis, zArrow);
    this.axesGroup.position.y = 0.1; // Slightly above ground to prevent z-fighting
    
    this.scene.add(this.axesGroup);
  }
  
  setupLandingPad() {
    // Create a column to support the landing pad
    const columnGeometry = new THREE.CylinderGeometry(0.5, 0.5, 50, 16);
    const columnMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x888888,
      roughness: 0.7
    });
    const column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.y = 25.0; // Half height to place bottom at ground level
    column.castShadow = true;
    column.receiveShadow = true;
    this.scene.add(column);
    
    // Create landing pad to mark start/end position
    const landingPadGeometry = new THREE.CylinderGeometry(2, 2, 0.1, 32);
    const landingPadMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.5
    });
    this.landingPad = new THREE.Mesh(landingPadGeometry, landingPadMaterial);
    this.landingPad.position.y = 50.0; // 10x higher than before (was 5.0)
    this.landingPad.receiveShadow = true;
    
    // Add landing pad to physics objects
    // Flag this object as a collision object that drones can land on
    this.landingPad.userData = {
      isCollider: true,
      type: 'landingPad'
    };
    
    this.scene.add(this.landingPad);
  }
  
  // Get the landing pad position (start position)
  getLandingPadPosition() {
    return {
      x: this.landingPad.position.x,
      y: this.landingPad.position.y + 1.0, // Add slight offset above the pad
      z: this.landingPad.position.z
    };
  }
  
  // Method to reset or update map state if needed
  reset() {
    // Currently no state to reset, but we can add functionality here if needed
  }
} 