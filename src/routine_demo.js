import * as THREE from 'three';
import { DronePhysics } from './physics.js';
import { GameStateLogger } from './game_state_logger.js';

class RoutineDemo {
  constructor() {
    console.log('Creating new RoutineDemo instance');
    this.isRoutineRunning = false;
    this.currentStep = 0;
    this.stepStartTime = 0;
    this.routine = [
      { name: 'Takeoff', duration: 2000 },
      { name: 'Hover', duration: 2000 },
      { name: 'Forward', duration: 2000 },
      { name: 'Backward', duration: 2000 },
      { name: 'Left', duration: 2000 },
      { name: 'Right', duration: 2000 },
      { name: 'Rotate Left', duration: 2000 },
      { name: 'Rotate Right', duration: 2000 },
      { name: 'Land', duration: 2000 },
      { name: 'Reset', duration: 1000 }
    ];

    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Initialize logging
    this.logger = new GameStateLogger();
    this.logs = [];
    this.lastLogTime = 0;
    this.logInterval = 100; // Log every 100ms

    // Initialize control stick displays
    this.leftStickIndicator = document.querySelector('.stick-display[data-label="Left Stick"] .stick-indicator');
    this.rightStickIndicator = document.querySelector('.stick-display[data-label="Right Stick"] .stick-indicator');

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

    // Get UI elements
    this.overlay = document.getElementById('overlay');
    this.routineSteps = document.querySelectorAll('.routine-step');

    // Start animation loop
    this.animate();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updateUI() {
    // Update overlay text
    if (this.isRoutineRunning) {
      const currentStep = this.routine[this.currentStep];
      const timeLeft = Math.ceil((currentStep.duration - (performance.now() - this.stepStartTime)) / 1000);
      this.overlay.textContent = `Current: ${currentStep.name} (${timeLeft}s)`;
    } else {
      this.overlay.textContent = 'Press SPACE to start routine';
    }

    // Update step highlighting
    this.routineSteps.forEach((step, index) => {
      if (this.isRoutineRunning && index === this.currentStep) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const currentTime = performance.now();

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

    // Update UI
    this.updateUI();

    // Update physics
    this.physics.updatePhysics(0.016); // Assuming 60fps

    // Update drone mesh position and rotation
    this.droneMesh.position.copy(this.physics.position);
    this.droneMesh.rotation.copy(this.physics.rotation);

    // Animate propellers based on throttle
    const propellerSpeed = this.physics.throttle * 10;
    this.propellers.forEach(propeller => {
      propeller.rotation.y += propellerSpeed;
    });

    // Update control stick visualization
    this.updateControlSticks();

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
    this.physics.reset();
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
    fetch('http://localhost:3000/api/save-logs', {
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
}

// Create demo instance
const demo = new RoutineDemo();

// Add keyboard controls
document.addEventListener('keydown', (event) => {
  switch(event.key) {
    case ' ': // Spacebar to start/stop routine
      if (demo.isRoutineRunning) {
        demo.stopRoutine();
      } else {
        demo.startRoutine();
      }
      break;
    case 'r':
      demo.reset();
      break;
  }
});

export { RoutineDemo }; 