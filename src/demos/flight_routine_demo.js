import * as THREE from 'three';
import { DroneModel } from '../models/drone_model.js';
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
        { name: 'Hover', duration: 1000, action: () => this.hover() },
        { name: 'Backward', duration: 2000, action: () => this.moveBackward() },
        { name: 'Hover', duration: 1000, action: () => this.hover() },
        { name: 'Left', duration: 2000, action: () => this.moveLeft() },
        { name: 'Hover', duration: 1000, action: () => this.hover() },
        { name: 'Right', duration: 2000, action: () => this.moveRight() },
        { name: 'Hover', duration: 1000, action: () => this.hover() },
        { name: 'Rotate Left', duration: 2000, action: () => this.rotateLeft() },
        { name: 'Hover', duration: 1000, action: () => this.hover() },
        { name: 'Rotate Right', duration: 2000, action: () => this.rotateRight() },
        { name: 'Hover', duration: 1000, action: () => this.hover() },
        { name: 'Land', duration: 2000, action: () => this.land() },
        { name: 'Reset', duration: 1000, action: () => this.resetDrone() }
      ],
      advanced: [
        { name: 'Takeoff', duration: 2000, action: () => this.takeoff() },
        { name: 'Hover', duration: 1000, action: () => this.hover() },
        { name: 'Circle Left', duration: 4000, action: () => this.circleLeft() },
        { name: 'Hover', duration: 1000, action: () => this.hover() },
        { name: 'Circle Right', duration: 4000, action: () => this.circleRight() },
        { name: 'Hover', duration: 1000, action: () => this.hover() },
        { name: 'Figure Eight', duration: 6000, action: () => this.figureEight() },
        { name: 'Hover', duration: 1000, action: () => this.hover() },
        { name: 'Ascend', duration: 2000, action: () => this.ascend() },
        { name: 'Hover', duration: 1000, action: () => this.hover() },
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

    // Create drone using DroneModel
    this.drone = new DroneModel(this.scene);
    
    // Set up camera position
    this.camera.position.set(0, 20, 20);
    this.camera.lookAt(this.drone.position);

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
    
    // Initialize routine steps display with the current routine
    this.updateRoutineStepsDisplay();
  }
  
  updateRoutineStepsDisplay() {
    const stepsContainer = document.getElementById('routine-steps');
    if (!stepsContainer) {
      console.error('Routine steps container not found');
      return;
    }
    
    console.log(`Updating routine steps display for ${this.activeRoutineType} routine with ${this.routine.length} steps`);
    
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
    console.log(`Created ${this.routineSteps.length} routine step elements`);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateUI() {
    // Calculate speed
    const speed = Math.sqrt(
      Math.pow(this.drone.physics.velocity.x, 2) +
      Math.pow(this.drone.physics.velocity.y, 2) +
      Math.pow(this.drone.physics.velocity.z, 2)
    );
    
    // Format position for display
    const pos = this.drone.position;
    const vel = this.drone.physics.velocity;
    
    let statusText = `FPS: ${this.fps}
Routine: ${this.activeRoutineType}
Running: ${this.isRoutineRunning ? 'Yes' : 'No'}
Step: ${this.isRoutineRunning ? `${this.currentStep + 1}. ${this.routine[this.currentStep].name}` : 'None'}

Position: X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(2)}, Z: ${pos.z.toFixed(2)}
Velocity: X: ${vel.x.toFixed(2)}, Y: ${vel.y.toFixed(2)}, Z: ${vel.z.toFixed(2)}
Speed: ${speed.toFixed(2)} m/s

Controls:
  Throttle: ${this.drone.physics.throttle.toFixed(2)}
  Pitch: ${this.drone.physics.pitch.toFixed(2)}
  Roll: ${this.drone.physics.roll.toFixed(2)}
  Yaw: ${this.drone.physics.yaw.toFixed(2)}`;

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

    // Update drone
    this.drone.update(0.016); // Assuming 60fps

    // Update camera to follow drone
    const offsetY = 15; // Height above drone
    const offsetZ = 15; // Distance behind drone
    this.camera.position.x = this.drone.position.x;
    this.camera.position.y = this.drone.position.y + offsetY;
    this.camera.position.z = this.drone.position.z + offsetZ;
    this.camera.lookAt(
      this.drone.position.x,
      this.drone.position.y,
      this.drone.position.z
    );

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
        this.resetControls();

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
    const leftX = this.drone.physics.yaw;
    const leftY = this.drone.physics.throttle;
    
    // Right stick - Pitch and Roll
    const rightX = this.drone.physics.roll;
    const rightY = this.drone.physics.pitch;

    // Update stick positions (scale from -1,1 to 0,100)
    if (this.leftStickIndicator) {
      this.leftStickIndicator.style.left = `${50 + leftX * 50}%`;
      this.leftStickIndicator.style.top = `${50 + leftY * 50}%`;
    }

    if (this.rightStickIndicator) {
      this.rightStickIndicator.style.left = `${50 + rightX * 50}%`;
      this.rightStickIndicator.style.top = `${50 + rightY * 50}%`;
    }
  }

  // Control methods now delegate to drone
  setThrottle(value) {
    this.drone.setThrottle(value);
  }

  setPitch(value) {
    this.drone.setPitch(value);
  }

  setRoll(value) {
    this.drone.setRoll(value);
  }

  setYaw(value) {
    this.drone.setYaw(value);
  }

  toggleHoverMode() {
    this.drone.toggleHoverMode();
  }

  resetDrone() {
    this.drone.reset();
  }

  logState() {
    if (!this.isRoutineRunning) return;

    const state = {
      timestamp: performance.now(),
      position: {
        x: this.drone.position.x.toFixed(2),
        y: this.drone.position.y.toFixed(2),
        z: this.drone.position.z.toFixed(2)
      },
      rotation: {
        x: this.drone.physics.rotation.x.toFixed(2),
        y: this.drone.physics.rotation.y.toFixed(2),
        z: this.drone.physics.rotation.z.toFixed(2)
      },
      controls: {
        throttle: this.drone.physics.throttle.toFixed(2),
        pitch: this.drone.physics.pitch.toFixed(2),
        roll: this.drone.physics.roll.toFixed(2),
        yaw: this.drone.physics.yaw.toFixed(2)
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
    this.resetControls();
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
    console.log('Executing hover - leveling drone');
    this.setThrottle(0.5); // Maintain altitude
    this.setPitch(0);      // Level pitch
    this.setRoll(0);       // Level roll
    this.setYaw(0);        // Stop any rotation
    
    // Reset the physics rotation to ensure the drone is flat
    // This will be helpful in case there's any accumulated rotation
    this.drone.physics.rotation.x = 0;
    this.drone.physics.rotation.z = 0;
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
    this.setYaw(0.5);
  }

  rotateRight() {
    console.log('Executing right rotation');
    this.setThrottle(0.5);
    this.setPitch(0);
    this.setRoll(0);
    this.setYaw(-0.5);
  }

  land() {
    console.log('Executing landing');
    this.setThrottle(0.2);
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

  // Helper method to reset all controls to neutral position
  resetControls() {
    this.setThrottle(0);
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

// Ensure routine steps are displayed when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, updating routine steps display');
  // Use setTimeout to ensure the demo instance is fully initialized
  setTimeout(() => {
    if (demo) {
      demo.updateRoutineStepsDisplay();
    }
  }, 100);
});

export { RoutineDemo }; 