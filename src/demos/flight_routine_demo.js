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
import { FreefallRoutine } from '../flight_routines/freefall_routine.js';
import { Controls } from '../controls.js';
import { YawRotationRoutine } from '../flight_routines/yaw_rotation_routine.js';
import { AcrobaticsRoutine } from '../flight_routines/acrobatics_routine.js';
import { YawTricksRoutine } from '../flight_routines/yaw_tricks_routine.js';
import { BackflipRoutine } from '../flight_routines/backflip_routine.js';
import { ColumnCircleRoutine } from '../flight_routines/column_circle_routine.js';
import { StateRecorder } from '../utils/state_recorder.js';
import RecordingManager from '../utils/RecordingManager.js';

class FlightRoutineDemo {
  constructor(droneConfig) {
    console.log('Creating new FlightRoutineDemo instance');
    this.initializeBasics();
    
    // Wait for DOM before initializing UI
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeUI());
    } else {
      this.initializeUI();
    }
  }

  initializeBasics() {
    // Initialize non-DOM dependent properties
    this.isRoutineRunning = false;
    this.currentStep = 0;
    this.stepStartTime = 0;
    this.isPaused = false;
    
    // Recording state
    this.isRecording = false;
    this.recordingStartTime = 0;
    
    // Performance metrics
    this.fps = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    
    // Initialize controls
    this.controls = new Controls();
    
    // Initialize routine objects - store complete routine objects
    this.routineObjects = {
      basic: new BasicRoutine(),
      circle: new CircleRoutine(),
      figureEight: new FigureEightRoutine(),
      orientationTest: new OrientationTestRoutine(),
      physicsTest: new PhysicsTestRoutine(),
      throttleTest: new ThrottleTestRoutine(),
      advancedManeuvers: new AdvancedManeuversRoutine(),
      freefall: new FreefallRoutine(),
      yawRotation: new YawRotationRoutine(),
      acrobatics: new AcrobaticsRoutine(),
      yawTricks: new YawTricksRoutine(),
      backflip: new BackflipRoutine(),
      columnCircle: new ColumnCircleRoutine()
    };
    
    // Initialize available routines steps
    this.routines = {
      basic: this.routineObjects.basic.steps,
      circle: this.routineObjects.circle.steps,
      figureEight: this.routineObjects.figureEight.steps,
      orientationTest: this.routineObjects.orientationTest.steps,
      physicsTest: this.routineObjects.physicsTest.steps,
      throttleTest: this.routineObjects.throttleTest.steps,
      advancedManeuvers: this.routineObjects.advancedManeuvers.steps,
      freefall: this.routineObjects.freefall.steps,
      yawRotation: this.routineObjects.yawRotation.steps,
      acrobatics: this.routineObjects.acrobatics.steps,
      yawTricks: this.routineObjects.yawTricks.steps,
      backflip: this.routineObjects.backflip.steps,
      columnCircle: this.routineObjects.columnCircle.steps
    };

    // Set default routine to column circle
    this.activeRoutineType = 'columnCircle';
    this.routine = this.routines[this.activeRoutineType];

    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Smoother shadow edges

    // Initialize map
    this.map = new Map(this.scene);

    // Initialize logging
    this.logger = new GameStateApi();
    this.logger.enable(); // Enable logging by default
    this.logs = [];
    this.lastLogTime = 0;
    this.logInterval = 100; // Log every 100ms

    // Create drone using DroneModel
    this.drone = new DroneModel(this.scene, this.map);
    
    // Disable safety mode by default
    this.drone.physics.disableSafetyMode();
    
    // Set up camera position
    this.camera.position.set(0, 20, 20);
    this.camera.lookAt(this.drone.position);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(), false);

    // Initialize state recorder
    this.stateRecorder = new StateRecorder();

    // Initialize recording manager
    this.recordingManager = new RecordingManager();
    this.recordingManager.mount(document.getElementById('instructions'));
  }

  initializeUI() {
    console.log('Initializing UI elements');
    
    // Append renderer to document
    document.body.appendChild(this.renderer.domElement);
    
    // Bind UI elements
    this.bindUIElements();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initialize safety mode toggle with safety off by default
    if (this.safeModeToggle && this.drone && this.drone.physics) {
      this.safeModeToggle.checked = false;
      this.drone.physics.disableSafetyMode();
      console.log('Safety mode initialized to:', this.drone.physics.safetyMode);
      
      // Update the safety status text color to match the current state
      const safetyStatus = document.getElementById('safety-status');
      if (safetyStatus) {
        safetyStatus.textContent = 'OFF';
        safetyStatus.style.color = '#ff0000';
      }
    }
    
    // Initialize routine steps display
    this.updateRoutineStepsDisplay();
    
    // Check routine availability
    this.updateRoutineAvailability();
    
    // Start animation loop
    this.animate();
    
    // Make demo available globally for UI updates
    window.demo = this;
    
    // Check server status
    this.checkServerStatus();
  }

  bindUIElements() {
    console.log('Binding UI elements');
    
    // Get UI elements
    this.overlay = document.getElementById('overlay');
    this.routineSteps = document.querySelectorAll('.routine-step');
    this.routineSelect = document.getElementById('routine-select');
    this.safeModeToggle = document.getElementById('safe-mode-toggle');
    this.recordingToggle = document.getElementById('recording-toggle');
    this.recordingEnabled = document.getElementById('recording-enabled');
    this.recordingStatus = document.getElementById('recording-status');
    this.recordingTime = document.getElementById('recording-time');
    this.leftStickIndicator = document.querySelector('.stick-display[data-label="Left Stick"] .stick-indicator');
    this.rightStickIndicator = document.querySelector('.stick-display[data-label="Right Stick"] .stick-indicator');
    
    // Initialize recording time tracking
    this.recordingStartTime = 0;
    this.recordingTimeInterval = null;
    
    // Log any missing elements for debugging
    if (!this.overlay) console.warn('Overlay element not found');
    if (!this.routineSelect) console.warn('Routine selector not found');
    if (!this.recordingToggle) console.warn('Recording toggle not found');
    if (!this.recordingEnabled) console.warn('Recording enabled element not found');
    if (!this.recordingStatus) console.warn('Recording status element not found');
    if (!this.recordingTime) console.warn('Recording time element not found');
    if (!this.leftStickIndicator) console.warn('Left stick indicator not found');
    if (!this.rightStickIndicator) console.warn('Right stick indicator not found');
  }

  setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Setup routine selector
    if (this.routineSelect) {
      this.routineSelect.addEventListener('change', (e) => {
        this.activeRoutineType = e.target.value;
        this.routine = this.routines[this.activeRoutineType];
        
        // Update UI without starting the routine
        this.updateRoutineStepsDisplay();
        this.updateRoutineAvailability();
        this.updateSafetyRequirements();
        this.debugSafetyModeStatus();
      });
    }

    // Add keyboard controls
    document.addEventListener('keydown', (event) => {
      console.log('Key pressed:', event.key);
      if (event.key === ' ') { // Spacebar to toggle routine
        if (this.isRoutineRunning) {
          this.stopRoutine();
        } else if (this.routineSelect.value) {
          // If a routine is selected but not running, start it
          this.activeRoutineType = this.routineSelect.value;
          this.routine = this.routines[this.activeRoutineType];
          this.startRoutine();
        }
      } else if (event.key === 'r') {
        this.drone.reset();
        this.controls.reset();
      }
    });

    // Toggle safety mode
    if (this.safeModeToggle) {
      this.safeModeToggle.addEventListener('change', () => {
        if (this.safeModeToggle.checked) {
          console.log('Enabling safety mode');
          this.drone.physics.enableSafetyMode();
        } else {
          console.log('Disabling safety mode');
          this.drone.physics.disableSafetyMode();
        }
        
        // Update UI and check routine availability
        this.updateRoutineAvailability();
        this.updateSafetyRequirements();
        this.debugSafetyModeStatus();
      });
    }

    // Toggle recording
    if (this.recordingToggle) {
      this.recordingToggle.addEventListener('change', () => {
        const isEnabled = this.recordingToggle.checked;
        console.log('Recording toggle:', isEnabled ? 'enabled' : 'disabled');
        
        // Update UI
        if (this.recordingEnabled) {
          this.recordingEnabled.textContent = isEnabled ? 'ON' : 'OFF';
          this.recordingEnabled.style.color = isEnabled ? '#00ff00' : '#ff0000';
        }
        
        // If currently running a routine, handle recording state
        if (this.isRoutineRunning) {
          if (isEnabled && !this.recordingManager.isRecording) {
            console.log('Starting recording due to toggle');
            this.recordingManager.startRecording(this.activeRoutineType);
            this.recordingStatus.style.display = 'flex';
            this.recordingStatus.style.opacity = '1';
            
            // Start recording time tracking
            this.recordingStartTime = performance.now();
            this.updateRecordingTime();
            this.recordingTimeInterval = setInterval(() => this.updateRecordingTime(), 100);
          } else if (!isEnabled && this.recordingManager.isRecording) {
            console.log('Stopping recording due to toggle');
            this.recordingManager.stopRecording();
            this.recordingStatus.style.display = 'none';
            this.recordingStatus.style.opacity = '0';
            
            // Stop recording time tracking
            if (this.recordingTimeInterval) {
              clearInterval(this.recordingTimeInterval);
              this.recordingTimeInterval = null;
            }
          }
        }
      });
    }
  }

  startRoutine() {
    if (this.isRoutineRunning) return;
    
    // Check if routine has requirements
    const currentRoutine = this.routineObjects[this.activeRoutineType];
    if (currentRoutine && currentRoutine.validateRequirements) {
      const status = currentRoutine.validateRequirements(this.drone);
      if (!status.canRun) {
        console.warn('Cannot run routine:', status.message);
        this.overlay.textContent = `Cannot run routine: ${status.message}`;
        return;
      }
    }
    
    this.isRoutineRunning = true;
    this.currentStep = 0;
    this.stepStartTime = performance.now();
    
    // Start recording if enabled
    if (this.recordingToggle && this.recordingToggle.checked) {
      console.log('Starting recording for routine:', this.activeRoutineType);
      this.recordingManager.startRecording(this.activeRoutineType);
      this.recordingStatus.style.display = 'flex';
      this.recordingStatus.style.opacity = '1';
      
      // Start recording time tracking
      this.recordingStartTime = performance.now();
      this.updateRecordingTime();
      this.recordingTimeInterval = setInterval(() => this.updateRecordingTime(), 100);
    }
    
    // Update UI
    this.updateRoutineStepsDisplay();
    this.updateControlSticks();
    this.overlay.textContent = `Running ${this.activeRoutineType} routine`;
    
    // Apply first step's controls
    this.applyStepControls(this.routine[this.currentStep]);
  }

  stopRoutine() {
    if (!this.isRoutineRunning) return;
    
    // Store current routine selection
    const currentRoutine = this.routineSelect.value;
    
    this.isRoutineRunning = false;
    this.currentStep = 0;
    
    // Stop recording if it's active
    if (this.recordingManager.isRecording) {
      console.log('Stopping recording');
      this.recordingManager.stopRecording();
      this.recordingStatus.style.display = 'none';
      this.recordingStatus.style.opacity = '0';
      
      // Stop recording time tracking
      if (this.recordingTimeInterval) {
        clearInterval(this.recordingTimeInterval);
        this.recordingTimeInterval = null;
      }
    }
    
    // Reset controls
    this.controls.reset();
    this.updateControlSticks();
    
    // Reset drone position and ensure safety mode is off
    this.drone.reset();
    this.ensureSafetyModeOff();
    
    // Restore routine selector to previous value
    if (this.routineSelect) {
      this.routineSelect.value = currentRoutine;
      this.activeRoutineType = currentRoutine;
      this.routine = this.routines[this.activeRoutineType];
    }
    
    // Update overlay
    this.overlay.textContent = 'Press SPACE to start routine';
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
      
      // Highlight the active step if we're running a routine
      if (this.isRoutineRunning && index === this.currentStep) {
        stepElement.classList.add('active');
      }
      
      stepsContainer.appendChild(stepElement);
    });
    
    // Update routineSteps reference
    this.routineSteps = document.querySelectorAll('.routine-step');
    console.log(`Created ${this.routineSteps.length} routine step elements`);
    
    // If we're running a routine, scroll to the active step
    if (this.isRoutineRunning && this.currentStep >= 0 && this.currentStep < this.routineSteps.length) {
      this.scrollToActiveStep(this.routineSteps[this.currentStep]);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateUI() {
    // Calculate speed
    const velocity = this.drone.physics.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z);
    
    // Format position and velocity for display
    const pos = this.drone.physics.position;
    const rot = this.drone.physics.localRotation;
    const quat = this.drone.physics.quaternion;
    
    // Get current controls from the active routine step or default to zero values
    let controls = { throttle: 0, pitch: 0, roll: 0, yaw: 0 };
    if (this.isRoutineRunning && this.routine && this.currentStep < this.routine.length) {
      controls = this.routine[this.currentStep].controls;
    }
    
    // Format control values, handling null values
    const formatControl = (value) => value === null ? 'maintain' : value.toFixed(2);
    
    const statusText = `
      Position: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})
      Speed: ${speed.toFixed(2)} m/s
      Local Rotation:
        Pitch: ${rot.x.toFixed(2)}°
        Yaw: ${rot.y.toFixed(2)}°
        Roll: ${rot.z.toFixed(2)}°
      Quaternion:
        X: ${quat.x.toFixed(2)}
        Y: ${quat.y.toFixed(2)}
        Z: ${quat.z.toFixed(2)}
        W: ${quat.w.toFixed(2)}
      Controls:
        Throttle: ${formatControl(controls.throttle)}
        Pitch: ${formatControl(controls.pitch)}
        Roll: ${formatControl(controls.roll)}
        Yaw: ${formatControl(controls.yaw)}
    `;
    
    // Update the overlay text
    const overlay = document.getElementById('overlay');
    if (overlay) {
      overlay.textContent = statusText;
    }
    
    // Update active step in UI
    if (this.routine) {
      const stepIndex = this.currentStep;
      const steps = document.querySelectorAll('.routine-step');
      
      // Deactivate all steps first
      steps.forEach(step => step.classList.remove('active'));
      
      // Activate current step if it exists
      if (stepIndex >= 0 && stepIndex < steps.length) {
        const activeStep = steps[stepIndex];
        activeStep.classList.add('active');
        
        // Scroll to active step
        this.scrollToActiveStep(activeStep);
      }
    }

    // Update safety mode toggle
    if (this.safeModeToggle) {
      this.safeModeToggle.checked = this.drone.physics.safetyMode;
      
      // Update safety status text
      const safetyStatus = document.getElementById('safety-status');
      if (safetyStatus) {
        const currentRoutine = this.routineObjects[this.activeRoutineType];
        const requiresSafetyOff = currentRoutine && currentRoutine.requiresSafetyOff;
        
        if (this.drone.physics.safetyMode) {
          safetyStatus.textContent = 'ON';
          safetyStatus.style.color = '#00ff00';
          
          if (requiresSafetyOff) {
            // When safety is on but routine requires it off
            safetyStatus.textContent += ' (OFF needed)';
            safetyStatus.style.color = '#ff9900';
          }
        } else {
          safetyStatus.textContent = 'OFF';
          safetyStatus.style.color = '#ff0000';
          
          if (requiresSafetyOff) {
            // When safety is off and routine requires it off - show checkmark
            safetyStatus.textContent += ' ✓';
          }
        }
      }
    }
  }

  // Helper method to scroll to the active step
  scrollToActiveStep(activeStepElement) {
    const stepsContainer = document.getElementById('routine-steps');
    if (!stepsContainer || !activeStepElement) return;
    
    // Calculate position to scroll to
    const containerRect = stepsContainer.getBoundingClientRect();
    const activeRect = activeStepElement.getBoundingClientRect();
    
    // Check if the active element is outside the visible area
    const isAbove = activeRect.top < containerRect.top;
    const isBelow = activeRect.bottom > containerRect.bottom;
    
    if (isAbove || isBelow) {
      // Scroll with smooth animation
      activeStepElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }

  animate() {
    if (this.isPaused) return;
    
    requestAnimationFrame(() => this.animate());
    
    const currentTime = performance.now();
    const deltaTime = 0.016; // Assuming 60fps

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
    this.drone.update(deltaTime);
    
    // Update map elements
    this.map.update(deltaTime);

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
          // Store current routine selection
          const currentRoutine = this.routineSelect.value;
          
          // Routine is complete
          this.currentStep = 0;
          this.isRoutineRunning = false;
          
          // Stop recording if active
          if (this.recordingManager.isRecording) {
            console.log('Stopping recording - routine complete');
            this.recordingManager.stopRecording();
            this.recordingStatus.style.display = 'none';
            this.recordingStatus.style.opacity = '0';
            
            // Stop recording time tracking
            if (this.recordingTimeInterval) {
              clearInterval(this.recordingTimeInterval);
              this.recordingTimeInterval = null;
            }
          }
          
          // Reset controls and drone
          this.controls.reset();
          this.updateControlSticks();
          this.drone.reset();
          this.ensureSafetyModeOff();
          
          // Restore routine selector to previous value
          if (this.routineSelect) {
            this.routineSelect.value = currentRoutine;
            this.activeRoutineType = currentRoutine;
            this.routine = this.routines[this.activeRoutineType];
          }
          
          // Update overlay
          this.overlay.textContent = 'Press SPACE to start routine';
        } else {
          this.stepStartTime = currentTime;
          this.applyStepControls(this.routine[this.currentStep]);
        }
      }
    }
    
    // Record frame if recording is active
    if (this.recordingManager.isRecording) {
      const forward = new THREE.Vector3();
      if (this.drone && this.drone.mesh) {
        this.drone.mesh.getWorldDirection(forward);
      }
      
      this.recordingManager.recordFrame({
        physics: {
          position: { ...this.drone.position },
          quaternion: { ...this.drone.quaternion },
          up: { ...this.drone.up },
          forward: { x: forward.x, y: forward.y, z: forward.z },
          pitch: this.controls.pitch,
          roll: this.controls.roll,
          yaw: this.controls.yaw,
          throttle: this.controls.throttle
        },
        render: {
          position: { ...this.drone.position },
          quaternion: { ...this.drone.quaternion }
        }
      });
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
        x: this.drone.physics.localRotation.x.toFixed(2),
        y: this.drone.physics.localRotation.y.toFixed(2),
        z: this.drone.physics.localRotation.z.toFixed(2)
      },
      controls: this.controls.getControls(),
      currentStep: this.isRoutineRunning ? this.routine[this.currentStep].name : 'Idle'
    };

    this.logs.push(state);
    this.logger.logGameState(state);
  }

  // Add new method to apply controls from a step
  applyStepControls(step) {
    console.log('Applying controls for step:', step.name);
    const controls = step.controls;
    this.setThrottle(controls.throttle);
    this.setPitch(controls.pitch);
    this.setRoll(controls.roll);
    this.setYaw(controls.yaw);
    
    // Update UI to highlight the current step
    const steps = document.querySelectorAll('.routine-step');
    
    // Deactivate all steps first
    steps.forEach(step => step.classList.remove('active'));
    
    // Activate current step
    if (this.currentStep >= 0 && this.currentStep < steps.length) {
      const activeStep = steps[this.currentStep];
      activeStep.classList.add('active');
      
      // Scroll to the active step immediately
      this.scrollToActiveStep(activeStep);
    }
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

  updateRoutineAvailability() {
    // Check if current routine has requirements
    const currentRoutine = this.routineObjects[this.activeRoutineType];
    
    if (currentRoutine && currentRoutine.validateRequirements) {
      const status = currentRoutine.validateRequirements(this.drone);
      
      // Only disable the start button if requirements aren't met
      if (this.runButton) {
        this.runButton.disabled = !status.canRun;
        
        // Add clear visual indication to start button
        if (!status.canRun) {
          this.runButton.style.opacity = "0.5";
          this.runButton.title = "Toggle safety mode to OFF to enable this routine";
        } else {
          this.runButton.style.opacity = "1";
          this.runButton.title = "";
        }
      }
      
      // Remove warning if exists - we don't need it anymore
      const warningMsg = document.getElementById('routine-warning');
      if (warningMsg) {
        warningMsg.remove();
      }
    } else {
      // No requirements, make sure start button is enabled if it exists
      if (this.runButton) {
        this.runButton.disabled = false;
        this.runButton.style.opacity = "1";
        this.runButton.title = "";
      }
      
      // Remove warning if exists
      const warningMsg = document.getElementById('routine-warning');
      if (warningMsg) {
        warningMsg.remove();
      }
    }
  }

  // Add debug function for safety mode status
  debugSafetyModeStatus() {
    console.log('========= SAFETY MODE DEBUG =========');
    console.log('UI toggle checked:', this.safeModeToggle ? this.safeModeToggle.checked : 'N/A');
    console.log('Drone physics safety mode:', this.drone.physics.safetyMode);
    console.log('Active routine:', this.activeRoutineType);
    
    const routine = this.routineObjects[this.activeRoutineType];
    if (routine && routine.requiresSafetyOff) {
      console.log('This routine requires safety off:', routine.requiresSafetyOff);
      console.log('Validation result:', routine.validateRequirements(this.drone));
    } else {
      console.log('No safety mode requirements for this routine');
    }
    console.log('====================================');
  }

  // Function to update safety requirements notice
  updateSafetyRequirements() {
    const routineSelector = document.querySelector('.routine-selector');
    if (!routineSelector) return;
    
    // Remove any existing notices
    const existingNotice = document.getElementById('safety-notice');
    if (existingNotice) {
      existingNotice.remove();
    }
    
    // Instead of adding a large warning, we'll just color the option in the dropdown
    const routineOption = this.routineSelect?.querySelector(`option[value="${this.activeRoutineType}"]`);
    if (routineOption) {
      // Reset all options to default color first
      Array.from(this.routineSelect.options).forEach(opt => {
        opt.style.color = '';
      });
      
      // Check if selected routine requires safety off
      const routine = this.routineObjects[this.activeRoutineType];
      if (routine && routine.requiresSafetyOff) {
        if (this.drone.physics.safetyMode) {
          // If safety is on but routine needs it off, colorize the option
          routineOption.style.color = '#ff9900';
        } else {
          // If safety is already off, colorize green
          routineOption.style.color = '#00ff00';
        }
      }
    }
  }

  // Add method to update recording status
  updateRecordingStatus() {
    if (this.recordingManager.isRecording) {
      this.recordingStatus.style.display = 'flex';
      this.recordingStatus.style.opacity = '1';
    } else {
      this.recordingStatus.style.display = 'none';
      this.recordingStatus.style.opacity = '0';
    }
  }

  // Add method to update recording time
  updateRecordingTime() {
    if (!this.recordingTime || !this.recordingStartTime) return;
    
    const currentTime = performance.now();
    const elapsedSeconds = (currentTime - this.recordingStartTime) / 1000;
    this.recordingTime.textContent = `Recording ${this.activeRoutineType}: ${elapsedSeconds.toFixed(1)}s`;
  }

  // Add method to ensure safety mode is off
  ensureSafetyModeOff() {
    if (this.drone && this.drone.physics) {
      this.drone.physics.disableSafetyMode();
      
      // Update UI
      if (this.safeModeToggle) {
        this.safeModeToggle.checked = false;
        const safetyStatus = document.getElementById('safety-status');
        if (safetyStatus) {
          safetyStatus.textContent = 'OFF';
          safetyStatus.style.color = '#ff0000';
        }
      }
    }
  }
}

// Create demo instance
const demo = new FlightRoutineDemo();

// Make demo available globally for the menu
window.demo = demo;

// Ensure routine steps are displayed when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, updating routine steps display');
  // Use setTimeout to ensure the demo instance is fully initialized
  setTimeout(() => {
    if (demo) {
      demo.updateRoutineStepsDisplay();
      demo.updateRoutineAvailability();
      demo.updateSafetyRequirements();
    }
  }, 100);
});

export { FlightRoutineDemo }; 