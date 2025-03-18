import * as THREE from 'three';
import { DroneModel } from '../models/drone_model.js';
import { GameStateApi } from '../game_state_api.js';
import { Map } from '../models/map.js';
import { BasicRoutine } from '../flight_routines/basic_routine.js';
import { CircleRoutine } from '../flight_routines/circle_routine.js';
import { FigureEightRoutine } from '../flight_routines/figure_eight_routine.js';
import { OrientationTestRoutine } from '../flight_routines/orientation_test_routine.js';
import { PhysicsTestRoutine } from '../flight_routines/physics_test_routine.js';
import { ThrottleTestRoutine } from '../flight_routines/throttle_test_routine.js';
import { AdvancedManeuversRoutine } from '../flight_routines/advanced_maneuvers_routine.js';
import { Controls } from '../controls.js';

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
    
    // Initialize controls
    this.controls = new Controls();
    
    // Initialize available routines
    this.routines = {
      basic: new BasicRoutine().steps,
      circle: new CircleRoutine().steps,
      figureEight: new FigureEightRoutine().steps,
      orientationTest: new OrientationTestRoutine().steps,
      physicsTest: new PhysicsTestRoutine().steps,
      throttleTest: new ThrottleTestRoutine().steps,
      advancedManeuvers: new AdvancedManeuversRoutine().steps
    };

    // Set default routine
    this.activeRoutineType = 'basic';
    this.routine = this.routines[this.activeRoutineType];

    // Check server status
    this.checkServerStatus();

    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    // Initialize map
    this.map = new Map(this.scene);

    // Initialize logging
    this.logger = new GameStateApi();
    this.logger.enable(); // Enable logging by default
    this.logs = [];
    this.lastLogTime = 0;
    this.logInterval = 100; // Log every 100ms

    // Initialize control stick displays
    this.leftStickIndicator = document.querySelector('.stick-display[data-label="Left Stick"] .stick-indicator');
    this.rightStickIndicator = document.querySelector('.stick-display[data-label="Right Stick"] .stick-indicator');

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
    const controls = this.controls.getControls();
    
    let statusText = `FPS: ${this.fps}
Routine: ${this.activeRoutineType}
Running: ${this.isRoutineRunning ? 'Yes' : 'No'}
Step: ${this.isRoutineRunning ? `${this.currentStep + 1}. ${this.routine[this.currentStep].name}` : 'None'}

Position: X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(2)}, Z: ${pos.z.toFixed(2)}
Velocity: X: ${vel.x.toFixed(2)}, Y: ${vel.y.toFixed(2)}, Z: ${vel.z.toFixed(2)}
Speed: ${speed.toFixed(2)} m/s

Controls:
  Throttle: ${controls.throttle.toFixed(2)}
  Pitch: ${controls.pitch.toFixed(2)}
  Roll: ${controls.roll.toFixed(2)}
  Yaw: ${controls.yaw.toFixed(2)}`;

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

    // Update controls state
    this.controls.updateGamepadState();
    this.controls.handleGamepadInput();

    // Apply controls to drone
    const controls = this.controls.getControls();
    this.drone.setThrottle(controls.throttle);
    this.drone.setPitch(controls.pitch);
    this.drone.setRoll(controls.roll);
    this.drone.setYaw(controls.yaw);

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
          this.applyStepControls(this.routine[this.currentStep]);
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateControlSticks() {
    const controls = this.controls.getControls();
    
    // Left stick - Throttle and Yaw
    const leftX = controls.yaw;
    const leftY = controls.throttle;
    
    // Right stick - Pitch and Roll
    const rightX = controls.roll;
    const rightY = controls.pitch;

    // Update stick positions (scale from -1,1 to 0,100)
    if (this.leftStickIndicator) {
      this.leftStickIndicator.style.left = `${50 + leftX * 50}%`;
      this.leftStickIndicator.style.top = `${50 - leftY * 50}%`;
    }

    if (this.rightStickIndicator) {
      this.rightStickIndicator.style.left = `${50 + rightX * 50}%`;
      this.rightStickIndicator.style.top = `${50 - rightY * 50}%`;
    }
  }

  // Control methods
  setThrottle(value) {
    this.controls.setThrottle(value);
  }

  setPitch(value) {
    this.controls.setPitch(value);
  }

  setRoll(value) {
    this.controls.setRoll(value);
  }

  setYaw(value) {
    this.controls.setYaw(value);
  }

  toggleHoverMode() {
    this.controls.toggleHoverMode();
  }

  resetControls() {
    this.controls.reset();
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
      controls: this.controls.getControls(),
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
    this.applyStepControls(this.routine[this.currentStep]);
    this.updateUI();
  }

  // Add new method to apply controls from a step
  applyStepControls(step) {
    console.log('Applying controls for step:', step.name);
    const controls = step.controls;
    this.setThrottle(controls.throttle);
    this.setPitch(controls.pitch);
    this.setRoll(controls.roll);
    this.setYaw(controls.yaw);
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
      console.log('Resetting drone and controls');
      demo.drone.reset();
      demo.controls.reset();
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