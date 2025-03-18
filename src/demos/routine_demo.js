import * as THREE from 'three';
import { DronePhysics } from '../physics.js';
import { GameStateApi } from '../game_state_api.js';

class RoutineDemo {
  constructor() {
    console.log('Creating new RoutineDemo instance');
    this.isRoutineRunning = false;
    this.currentStep = 0;
    this.stepStartTime = 0;
    
    // Performance metrics
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.isPaused = false;
    
    // Basic and advanced routines
    this.routines = {
      basic: [
        { name: 'Takeoff', duration: 2000, action: () => this.takeoff() },
        { name: 'Hover', duration: 2000, action: () => this.hover() },
        { name: 'Forward', duration: 2000, action: () => this.moveForward() },
        { name: 'Backward', duration: 2000, action: () => this.moveBackward() },
        { name: 'Left', duration: 2000, action: () => this.moveLeft() },
        { name: 'Right', duration: 2000, action: () => this.moveRight() },
        { name: 'Rotate Left', duration: 2000, action: () => this.rotateLeft() },
        { name: 'Rotate Right', duration: 2000, action: () => this.rotateRight() },
        { name: 'Land', duration: 2000, action: () => this.land() },
        { name: 'Reset', duration: 1000, action: () => this.resetDrone() }
      ],
      advanced: [
        { name: 'Takeoff', duration: 2000, action: () => this.takeoff() },
        { name: 'Circle Left', duration: 4000, action: () => this.circleLeft() },
        { name: 'Hover', duration: 1000, action: () => this.hover() },
        { name: 'Circle Right', duration: 4000, action: () => this.circleRight() },
        { name: 'Hover', duration: 1000, action: () => this.hover() },
        { name: 'Figure Eight', duration: 6000, action: () => this.figureEight() },
        { name: 'Hover', duration: 1000, action: () => this.hover() },
        { name: 'Ascend', duration: 2000, action: () => this.ascend() },
        { name: 'Descend', duration: 2000, action: () => this.descend() },
        { name: 'Hover', duration: 1000, action: () => this.hover() },
        { name: 'Land', duration: 2000, action: () => this.land() },
        { name: 'Reset', duration: 1000, action: () => this.resetDrone() }
      ],
      // Special figure eight pattern
      figureEight: [
        { name: 'Start Figure Eight', duration: 1000, action: () => this.startFigureEight() },
        { name: 'Circle Left Part', duration: 3000, action: () => this.figureEightLeft() },
        { name: 'Circle Right Part', duration: 3000, action: () => this.figureEightRight() },
        { name: 'End Figure Eight', duration: 1000, action: () => this.hover() }
      ]
    };
    
    // Set active routine to basic
    this.activeRoutineType = 'basic';
    this.routine = this.routines.basic;

    // Check server status
    this.checkServerStatus();

    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB); // Add sky blue background
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    // Initialize logging
    this.logger = new GameStateApi();
    this.logger.enable(); // Enable logging by default
    this.logs = [];
    this.lastLogTime = 0;
    this.logInterval = 100; // Log every 100ms

    // Initialize control stick displays
    this.leftStickIndicator = document.querySelector('.stick-display[data-label="Left Stick"] .stick-indicator');
    this.rightStickIndicator = document.querySelector('.stick-display[data-label="Right Stick"] .stick-indicator');

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    this.scene.add(directionalLight);

    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      side: THREE.DoubleSide
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Add grid lines to create checkered floor
    const gridHelper = new THREE.GridHelper(100, 100, 0x000000, 0x000000);
    this.scene.add(gridHelper);

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

    // Create drone mesh
    const droneGeometry = new THREE.BoxGeometry(1, 0.2, 1);
    const droneMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.droneMesh = new THREE.Mesh(droneGeometry, droneMaterial);
    this.droneMesh.position.y = 10; // Match initial physics position
    this.droneMesh.castShadow = true;
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
    this.physics.groundLevel = 0; // Set the ground level to match our scene
    
    // Set up camera position
    this.camera.position.set(0, 20, 20);
    this.camera.lookAt(this.physics.position);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(), false);

    // Get UI elements
    this.overlay = document.getElementById('overlay');
    this.routineSteps = document.querySelectorAll('.routine-step');
    this.routineSelector = document.getElementById('routine-selector');
    
    // Setup routine selector
    if (this.routineSelector) {
      this.routineSelector.addEventListener('change', (e) => {
        this.activeRoutineType = e.target.value;
        this.routine = this.routines[this.activeRoutineType];
        this.updateRoutineStepsDisplay();
      });
    }
    
    // Start animation loop
    this.animate();
  }
  
  updateRoutineStepsDisplay() {
    const stepsContainer = document.getElementById('routine-steps');
    if (!stepsContainer) return;
    
    // Clear existing steps
    stepsContainer.innerHTML = '';
    
    // Add current routine steps
    this.routine.forEach((step, index) => {
      const stepElement = document.createElement('div');
      stepElement.className = 'routine-step';
      stepElement.textContent = `${index + 1}. ${step.name}`;
      stepsContainer.appendChild(stepElement);
    });
    
    // Update routineSteps reference
    this.routineSteps = document.querySelectorAll('.routine-step');
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateUI() {
    // Calculate speed
    const speed = Math.sqrt(
      Math.pow(this.physics.velocity.x, 2) +
      Math.pow(this.physics.velocity.y, 2) +
      Math.pow(this.physics.velocity.z, 2)
    );
    
    // Format position for display
    const pos = this.physics.position;
    const vel = this.physics.velocity;
    
    let statusText = `FPS: ${this.fps}
Routine: ${this.activeRoutineType}
Running: ${this.isRoutineRunning ? 'Yes' : 'No'}
Step: ${this.isRoutineRunning ? `${this.currentStep + 1}. ${this.routine[this.currentStep].name}` : 'None'}

Position: X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(2)}, Z: ${pos.z.toFixed(2)}
Velocity: X: ${vel.x.toFixed(2)}, Y: ${vel.y.toFixed(2)}, Z: ${vel.z.toFixed(2)}
Speed: ${speed.toFixed(2)} m/s

Controls:
  Throttle: ${this.physics.throttle.toFixed(2)}
  Pitch: ${this.physics.pitch.toFixed(2)}
  Roll: ${this.physics.roll.toFixed(2)}
  Yaw: ${this.physics.yaw.toFixed(2)}`;

    if (this.overlay) {
      this.overlay.textContent = statusText;
    }

    // Update active step in UI
    if (this.routineSteps && this.isRoutineRunning) {
      this.routineSteps.forEach((el, index) => {
        if (index === this.currentStep) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });
    }
  }

  animate() {
    if (this.isPaused) return;
    
    requestAnimationFrame(() => this.animate());
    
    const currentTime = performance.now();

    // Update FPS counter
    this.frameCount++;
    if (currentTime > this.lastFpsUpdate + 1000) { // Update every second
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }

    // Update physics
    this.physics.updatePhysics(0.016); // Assuming 60fps

    // Update drone mesh position 
    this.droneMesh.position.x = this.physics.position.x;
    this.droneMesh.position.y = this.physics.position.y;
    this.droneMesh.position.z = this.physics.position.z;
    
    // Update drone rotation - use rotation from physics
    const droneRotation = new THREE.Euler(
      this.physics.rotation.x,
      this.physics.rotation.y,
      this.physics.rotation.z,
      'XYZ'
    );
    this.droneMesh.rotation.copy(droneRotation);
    
    // Update camera to follow drone
    const offsetY = 15; // Height above drone
    const offsetZ = 15; // Distance behind drone
    this.camera.position.x = this.physics.position.x;
    this.camera.position.y = this.physics.position.y + offsetY;
    this.camera.position.z = this.physics.position.z + offsetZ;
    this.camera.lookAt(
      this.physics.position.x,
      this.physics.position.y,
      this.physics.position.z
    );

    // Animate propellers based on throttle
    const propellerSpeed = this.physics.throttle * 0.5;
    this.propellers.forEach(propeller => {
      propeller.rotation.y += propellerSpeed;
    });

    // Update control stick displays
    this.updateControlSticks();
    
    // Update UI information
    this.updateUI();

    // Log state if enough time has passed
    if (currentTime - this.lastLogTime >= this.logInterval) {
      this.logState();
      this.lastLogTime = currentTime;
    }

    // Update routine
    if (this.isRoutineRunning) {
      if (currentTime - this.stepStartTime >= this.routine[this.currentStep].duration) {
        // Reset controls before next step
        this.setThrottle(0);
        this.setPitch(0);
        this.setRoll(0);
        this.setYaw(0);

        // Move to next step
        this.currentStep++;
        if (this.currentStep >= this.routine.length) {
          this.currentStep = 0;
          this.isRoutineRunning = false;
        } else {
          this.stepStartTime = currentTime;
          this.routine[this.currentStep].action();
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateControlSticks() {
    // Left stick - Throttle and Yaw
    const leftX = this.physics.yaw;
    const leftY = this.physics.throttle;
    
    // Right stick - Pitch and Roll
    const rightX = this.physics.roll;
    const rightY = this.physics.pitch;

    // Update stick positions (scale from -1,1 to 0,100)
    this.leftStickIndicator.style.left = `${50 + leftX * 50}%`;
    this.leftStickIndicator.style.top = `${50 + leftY * 50}%`;

    this.rightStickIndicator.style.left = `${50 + rightX * 50}%`;
    this.rightStickIndicator.style.top = `${50 + rightY * 50}%`;
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
    // Delegate to resetDrone method for consistency
    this.resetDrone();
  }

  logState() {
    if (!this.isRoutineRunning) return;

    const state = {
      timestamp: performance.now(),
      position: {
        x: this.physics.position.x.toFixed(2),
        y: this.physics.position.y.toFixed(2),
        z: this.physics.position.z.toFixed(2)
      },
      rotation: {
        x: this.physics.rotation.x.toFixed(2),
        y: this.physics.rotation.y.toFixed(2),
        z: this.physics.rotation.z.toFixed(2)
      },
      controls: {
        throttle: this.physics.throttle.toFixed(2),
        pitch: this.physics.pitch.toFixed(2),
        roll: this.physics.roll.toFixed(2),
        yaw: this.physics.yaw.toFixed(2)
      },
      currentStep: this.isRoutineRunning ? this.routine[this.currentStep].name : 'Idle'
    };

    this.logs.push(state);
    this.logger.logGameState(state);
  }

  startRoutine() {
    this.isRoutineRunning = true;
    this.currentStep = 0;
    this.stepStartTime = performance.now();
    this.logs = []; // Clear previous logs
    this.logger.enable(); // Enable logging
    this.routine[this.currentStep].action();
    this.updateUI();
  }

  stopRoutine() {
    this.isRoutineRunning = false;
    // Reset controls
    this.setThrottle(0);
    this.setPitch(0);
    this.setRoll(0);
    this.setYaw(0);
    this.logger.disable(); // Disable logging

    // Save logs to file
    this.saveLogs();
  }

  saveLogs() {
    const logData = JSON.stringify(this.logs, null, 2);
    
    // Send logs to server
    const API_BASE = '/api';
    fetch(`${API_BASE}/save-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: logData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Logs saved successfully:', data.filename);
      } else {
        console.error('Failed to save logs:', data.error);
      }
    })
    .catch(error => {
      console.error('Error sending logs to server:', error);
    });
  }

  updateRoutine() {
    if (!this.isRoutineRunning) return;

    const currentTime = performance.now();
    const currentStep = this.routine[this.currentStep];
    
    console.log(`Current step: ${currentStep.name} (${Math.ceil((currentStep.duration - (currentTime - this.stepStartTime)) / 1000)}s remaining)`);

    if (currentTime - this.stepStartTime >= currentStep.duration) {
      this.currentStep++;
      if (this.currentStep >= this.routine.length) {
        console.log('Routine completed');
        this.isRoutineRunning = false;
      } else {
        this.stepStartTime = currentTime;
        setTimeout(() => this.updateRoutine(), 100);
      }
    } else {
      setTimeout(() => this.updateRoutine(), 100);
    }
  }

  // Routine step implementations
  takeoff() {
    console.log('Executing takeoff');
    this.setThrottle(0.8);
    this.setPitch(0);
    this.setRoll(0);
    this.setYaw(0);
  }

  hover() {
    console.log('Executing hover');
    this.setThrottle(0.5);
    this.setPitch(0);
    this.setRoll(0);
    this.setYaw(0);
  }

  moveForward() {
    console.log('Executing forward movement');
    this.setThrottle(0.5);
    this.setPitch(-0.5);
    this.setRoll(0);
    this.setYaw(0);
  }

  moveBackward() {
    console.log('Executing backward movement');
    this.setThrottle(0.5);
    this.setPitch(0.5);
    this.setRoll(0);
    this.setYaw(0);
  }

  moveLeft() {
    console.log('Executing left movement');
    this.setThrottle(0.5);
    this.setPitch(0);
    this.setRoll(-0.5);
    this.setYaw(0);
  }

  moveRight() {
    console.log('Executing right movement');
    this.setThrottle(0.5);
    this.setPitch(0);
    this.setRoll(0.5);
    this.setYaw(0);
  }

  rotateLeft() {
    console.log('Executing left rotation');
    this.setThrottle(0.5);
    this.setPitch(0);
    this.setRoll(0);
    this.setYaw(-0.5);
  }

  rotateRight() {
    console.log('Executing right rotation');
    this.setThrottle(0.5);
    this.setPitch(0);
    this.setRoll(0);
    this.setYaw(0.5);
  }

  land() {
    console.log('Executing landing');
    this.setThrottle(0.2);
    this.setPitch(0);
    this.setRoll(0);
    this.setYaw(0);
  }

  resetDrone() {
    this.physics.reset(); // Use the reset method from physics
    
    // Reset drone mesh position
    this.droneMesh.position.x = 0;
    this.droneMesh.position.y = 10;
    this.droneMesh.position.z = 0;
    
    // Reset camera
    this.camera.position.set(0, 20, 20);
    this.camera.lookAt(0, 10, 0);
    
    this.setThrottle(0);
    this.setPitch(0);
    this.setRoll(0);
    this.setYaw(0);
  }

  checkServerStatus() {
    const API_BASE = '/api';
    const statusElement = document.getElementById('server-status');
    
    if (!statusElement) {
      console.error('Server status element not found');
      return;
    }
    
    statusElement.textContent = 'Checking server connection...';
    
    fetch(`${API_BASE}/test`)
      .then(response => response.json())
      .then(data => {
        console.log('Server status response:', data);
        statusElement.textContent = `Server connected: ${data.message}`;
        statusElement.style.color = '#00FF00';
        this.logger.enable();
      })
      .catch(error => {
        console.error('Server connection failed:', error);
        statusElement.textContent = `Server not connected: ${error.message}`;
        statusElement.style.color = '#FF0000';
        this.logger.disable();
      });
  }

  pauseSimulation() {
    this.isPaused = true;
    if (this.isRoutineRunning) {
      this.isRoutineRunning = false;
    }
  }
  
  resumeSimulation() {
    this.isPaused = false;
    this.lastFpsUpdate = performance.now();
    this.frameCount = 0;
    this.animate();
  }

  // Advanced flight routines
  circleLeft() {
    console.log('Executing circle left');
    this.setThrottle(0.5);
    this.setPitch(0.3);
    this.setRoll(-0.3);
    this.setYaw(-0.2);
  }
  
  circleRight() {
    console.log('Executing circle right');
    this.setThrottle(0.5);
    this.setPitch(0.3);
    this.setRoll(0.3);
    this.setYaw(0.2);
  }
  
  figureEight() {
    console.log('Executing figure eight');
    this.startFigureEight();
  }
  
  startFigureEight() {
    console.log('Starting figure eight');
    this.setThrottle(0.6);
    this.setPitch(0.3);
    this.setRoll(0);
    this.setYaw(0);
  }
  
  figureEightLeft() {
    console.log('Figure eight - left turn');
    this.setThrottle(0.6);
    this.setPitch(0.3);
    this.setRoll(-0.4);
    this.setYaw(-0.2);
  }
  
  figureEightRight() {
    console.log('Figure eight - right turn');
    this.setThrottle(0.6);
    this.setPitch(0.3);
    this.setRoll(0.4);
    this.setYaw(0.2);
  }
  
  ascend() {
    console.log('Executing ascend');
    this.setThrottle(0.8);
    this.setPitch(0);
    this.setRoll(0);
    this.setYaw(0);
  }
  
  descend() {
    console.log('Executing descend');
    this.setThrottle(0.3);
    this.setPitch(0);
    this.setRoll(0);
    this.setYaw(0);
  }
}

// Create demo instance
const demo = new RoutineDemo();

// Make demo available globally for the menu
window.demo = demo;

// Add keyboard controls
document.addEventListener('keydown', (event) => {
  console.log('Key pressed:', event.key);
  switch(event.key) {
    case ' ': // Spacebar to start/stop routine
      if (demo.isRoutineRunning) {
        console.log('Stopping routine');
        demo.stopRoutine();
      } else {
        console.log('Starting routine');
        demo.startRoutine();
      }
      break;
    case 'r':
      console.log('Resetting drone');
      demo.resetDrone();
      break;
    case 'Escape':
      // Menu handled in HTML
      if (demo.isRoutineRunning || !demo.isPaused) {
        console.log('Pausing simulation');
        demo.pauseSimulation();
      }
      break;
  }
});

// Listen for menu resume event
document.getElementById('close-menu-button')?.addEventListener('click', () => {
  if (demo.isPaused) {
    console.log('Resuming simulation');
    demo.resumeSimulation();
  }
});

export { RoutineDemo }; 