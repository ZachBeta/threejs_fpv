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
    
    // Create shadow test objects at different distances
    this.createShadowTestObjects();
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(200, 300, 200);
    directionalLight.castShadow = true;
    
    // Improve shadow quality and range
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    
    // Configure shadow camera to cover a larger area
    const shadowSize = 500;
    directionalLight.shadow.camera.left = -shadowSize;
    directionalLight.shadow.camera.right = shadowSize;
    directionalLight.shadow.camera.top = shadowSize;
    directionalLight.shadow.camera.bottom = -shadowSize;
    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 1000;
    
    // Adjust bias to reduce shadow acne
    directionalLight.shadow.bias = -0.0001;
    
    // Add helper to visualize the light's shadow camera (comment out in production)
    // const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // this.scene.add(helper);
    
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
      roughness: 0.7,
      transparent: true,
      opacity: 0.3
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
  
  // Get the targeting column position
  getTargetPosition() {
    return {
      x: 0,
      y: 50,
      z: 0
    };
  }
  
  // Update method to animate map elements
  update(deltaTime) {
    // Remove spinner animation since it no longer exists
  }
  
  // Method to reset or update map state if needed
  reset() {
    // Remove spinner reset since it no longer exists
  }
  
  createShadowTestObjects() {
    // Create a set of test cubes at various distances from the origin
    const distances = [50, 100, 200, 300, 400];
    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00];
    
    // Create diagonal test objects (northeast direction)
    distances.forEach((distance, index) => {
      this.createTestObject(distance, distance, colors[index]);
    });
    
    // Create cardinal direction test objects
    const farDistance = 300;
    this.createTestObject(farDistance, 0, 0xff5500); // East
    this.createTestObject(-farDistance, 0, 0x5500ff); // West
    this.createTestObject(0, farDistance, 0x00ff55); // North
    this.createTestObject(0, -farDistance, 0xff0055); // South
  }
  
  createTestObject(x, z, color) {
    // Create a floating cube
    const cubeSize = 10;
    const cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMaterial = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.7
    });
    
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(x, cubeSize * 1.5, z);
    cube.castShadow = true;
    cube.receiveShadow = true;
    this.scene.add(cube);
    
    // Create a column under the cube
    const columnHeight = 30;
    const columnGeometry = new THREE.CylinderGeometry(2, 2, columnHeight, 16);
    const columnMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x888888,
      roughness: 0.5
    });
    
    const column = new THREE.Mesh(columnGeometry, columnMaterial);
    column.position.set(x, columnHeight / 2, z);
    column.castShadow = true;
    column.receiveShadow = true;
    this.scene.add(column);
  }
} 