import * as THREE from 'three';
import { DroneModel } from '../models/drone_model.js';
import { Map } from '../models/map.js';
import { Controls } from '../controls.js';

class PhysicsDemo {
  constructor() {
    // Initialize controls
    this.controls = new Controls();

    // Create controller display
    this.setupControllerDisplay();

    // Create diagnostic overlay
    this.setupDiagnosticOverlay();

    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Smoother shadow edges
    document.body.appendChild(this.renderer.domElement);

    // Initialize map
    this.map = new Map(this.scene);

    // Create drone using DroneModel
    this.drone = new DroneModel(this.scene, this.map);
    
    // Set up camera position
    this.camera.position.set(0, 15, 15);
    this.camera.lookAt(0, 0, 0);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(), false);

    // Start animation loop
    this.animate();
  }

  setupControllerDisplay() {
    // Create controller display
    const controllerDisplay = document.createElement('div');
    controllerDisplay.style.position = 'fixed';
    controllerDisplay.style.bottom = '20px';
    controllerDisplay.style.left = '50%';
    controllerDisplay.style.transform = 'translateX(-50%)';
    controllerDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    controllerDisplay.style.color = '#00ff00';
    controllerDisplay.style.fontFamily = 'monospace';
    controllerDisplay.style.padding = '10px';
    controllerDisplay.style.borderRadius = '5px';
    controllerDisplay.style.zIndex = '1000';
    controllerDisplay.style.display = 'flex';
    controllerDisplay.style.gap = '20px';

    // Create stick displays
    const leftStickDisplay = document.createElement('div');
    leftStickDisplay.style.width = '100px';
    leftStickDisplay.style.height = '100px';
    leftStickDisplay.style.border = '1px solid #00ff00';
    leftStickDisplay.style.position = 'relative';
    leftStickDisplay.innerHTML = '<div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%);">Left Stick</div>';

    const rightStickDisplay = document.createElement('div');
    rightStickDisplay.style.width = '100px';
    rightStickDisplay.style.height = '100px';
    rightStickDisplay.style.border = '1px solid #00ff00';
    rightStickDisplay.style.position = 'relative';
    rightStickDisplay.innerHTML = '<div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%);">Right Stick</div>';

    // Create stick indicators
    const leftStickIndicator = document.createElement('div');
    leftStickIndicator.style.width = '10px';
    leftStickIndicator.style.height = '10px';
    leftStickIndicator.style.backgroundColor = '#00ff00';
    leftStickIndicator.style.borderRadius = '50%';
    leftStickIndicator.style.position = 'absolute';
    leftStickIndicator.style.left = '50%';
    leftStickIndicator.style.top = '50%';
    leftStickIndicator.style.transform = 'translate(-50%, -50%)';
    leftStickDisplay.appendChild(leftStickIndicator);

    const rightStickIndicator = document.createElement('div');
    rightStickIndicator.style.width = '10px';
    rightStickIndicator.style.height = '10px';
    rightStickIndicator.style.backgroundColor = '#00ff00';
    rightStickIndicator.style.borderRadius = '50%';
    rightStickIndicator.style.position = 'absolute';
    rightStickIndicator.style.left = '50%';
    rightStickIndicator.style.top = '50%';
    rightStickIndicator.style.transform = 'translate(-50%, -50%)';
    rightStickDisplay.appendChild(rightStickIndicator);

    controllerDisplay.appendChild(leftStickDisplay);
    controllerDisplay.appendChild(rightStickDisplay);
    document.body.appendChild(controllerDisplay);

    this.controllerDisplay = controllerDisplay;
    this.leftStickIndicator = leftStickIndicator;
    this.rightStickIndicator = rightStickIndicator;
  }

  setupDiagnosticOverlay() {
    // Create diagnostic overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.bottom = '20px';
    overlay.style.right = '20px';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.color = '#00ff00';
    overlay.style.fontFamily = 'monospace';
    overlay.style.padding = '10px';
    overlay.style.borderRadius = '5px';
    overlay.style.zIndex = '1000';
    document.body.appendChild(overlay);

    this.diagnosticOverlay = overlay;
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  updatePhysicsFromState() {
    const controls = this.controls.getControls();
    
    // Apply game state to drone
    this.drone.setThrottle(controls.throttle);
    this.drone.setYaw(controls.yaw);
    this.drone.setPitch(controls.pitch);
    this.drone.setRoll(controls.roll);
    
    // Sync altitude hold state
    if (controls.altitudeHold !== this.drone.altitudeHold) {
      console.log("Syncing altitude hold state from controls:", controls.altitudeHold);
      if (controls.altitudeHold) {
        this.drone.physics.enableAltitudeHold();
      } else {
        this.drone.physics.disableAltitudeHold();
      }
    }

    // Update controls diagnostics with drone orientation
    this.controls.updateDroneOrientation(this.drone.droneMesh.rotation);
  }

  updateDiagnostics() {
    const diagnostics = this.controls.getDiagnostics();
    const controls = this.controls.getControls();
    
    // Calculate speed from physics velocity
    const velocity = this.drone.velocity;
    diagnostics.speed = Math.sqrt(
      velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z
    );
    diagnostics.altitude = this.drone.position.y;
    
    // Update hover indicator
    const hoverIndicator = document.getElementById('hover-indicator');
    if (hoverIndicator) {
      if (this.drone.altitudeHold) {
        hoverIndicator.classList.add('active');
      } else {
        hoverIndicator.classList.remove('active');
      }
    }
    
    // Format values to have consistent width with leading + or - signs
    
    // For drone orientation
    const droneOrientation = diagnostics.debugState.droneOrientation || {};
    const roundedOrientation = {};
    
    for (const key in droneOrientation) {
      const value = Number(droneOrientation[key]);
      roundedOrientation[key] = (value >= 0 ? '+' : '') + value.toFixed(6);
    }
    
    // For raw inputs
    const rawInputs = diagnostics.debugState.rawInputs || {};
    const formattedRawInputs = {};
    
    // Format the left and right sticks
    for (const stick of ['leftStick', 'rightStick']) {
      if (rawInputs[stick]) {
        formattedRawInputs[stick] = {};
        for (const axis of ['x', 'y']) {
          const value = Number(rawInputs[stick][axis] || 0);
          formattedRawInputs[stick][axis] = (value >= 0 ? '+' : '') + value.toFixed(6);
        }
      }
    }
    
    // For processed controls
    const processedControls = diagnostics.debugState.processedControls || {};
    const formattedControls = {};
    
    for (const control in processedControls) {
      const value = Number(processedControls[control]);
      formattedControls[control] = (value >= 0 ? '+' : '') + value.toFixed(6);
    }
    
    // Update overlay text with enhanced debug info
    this.diagnosticOverlay.innerHTML = `
      <div>Controller: ${diagnostics.controllerConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Controller Name: ${diagnostics.controllerName || 'None'}</div>
      <div>Last Input: ${diagnostics.lastInput}</div>
      <div>Speed: ${diagnostics.speed.toFixed(2)} m/s</div>
      <div>Altitude: ${diagnostics.altitude.toFixed(2)} m</div>
      <div>Position: X:${this.drone.position.x.toFixed(2)} Y:${this.drone.position.y.toFixed(2)} Z:${this.drone.position.z.toFixed(2)}</div>
      <div>Map Position: X:${Math.floor(this.drone.position.x)} Y:${Math.floor(this.drone.position.y)} Z:${Math.floor(this.drone.position.z)}</div>
      <div>Throttle: ${this.drone.throttle.toFixed(2)}</div>
      <div>Altitude Hold: ${this.drone.altitudeHold ? 'ON' : 'OFF'}</div>
      <div>Controls.altitudeHold: ${controls.altitudeHold ? 'ON' : 'OFF'}</div>
      <div>Debug State:</div>
      <div style="margin-left: 10px">
        Raw Inputs: ${JSON.stringify(formattedRawInputs, null, 2)}</div>
      <div style="margin-left: 10px">
        Processed Controls: ${JSON.stringify(formattedControls, null, 2)}</div>
      <div style="margin-left: 10px">
        Drone Orientation: ${JSON.stringify(roundedOrientation, null, 2)}</div>
    `;

    // Update stick indicators
    if (diagnostics.debugState.rawInputs.leftStick) {
      const leftStick = diagnostics.debugState.rawInputs.leftStick;
      this.leftStickIndicator.style.left = `${(leftStick.x * 50) + 50}%`;
      this.leftStickIndicator.style.top = `${(leftStick.y * 50) + 50}%`;
    }
    if (diagnostics.debugState.rawInputs.rightStick) {
      const rightStick = diagnostics.debugState.rawInputs.rightStick;
      this.rightStickIndicator.style.left = `${(rightStick.x * 50) + 50}%`;
      this.rightStickIndicator.style.top = `${(rightStick.y * 50) + 50}%`;
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = 0.016; // Assuming 60fps

    // Update gamepad state
    this.controls.updateGamepadState();
    this.controls.handleGamepadInput();

    // Update physics from game state
    this.updatePhysicsFromState();

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

    // Update diagnostics
    this.updateDiagnostics();

    this.renderer.render(this.scene, this.camera);
  }

  reset() {
    this.controls.reset();
    this.drone.reset();
  }

  // Control methods now delegate to controls instance
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
    this.toggleAltitudeHold();
  }

  toggleAltitudeHold() {
    console.log("Demo: toggleAltitudeHold called");
    this.controls.toggleAltitudeHold();
    this.drone.toggleAltitudeHold();
  }
}

// Create demo instance
const demo = new PhysicsDemo();

// Add keyboard controls
document.addEventListener('keydown', (event) => {
  switch(event.key) {
    // Left stick (WASD)
    case 'w': // Throttle up
      demo.setThrottle(1.0);
      break;
    case 's': // Throttle down
      demo.setThrottle(-1.0);
      break;
    case 'a': // Yaw left
      demo.setYaw(1.0);
      break;
    case 'd': // Yaw right
      demo.setYaw(-1.0);
      break;
    
    // Right stick (IJKL)
    case 'i': // Pitch forward
      demo.setPitch(-1.0); // Negative value to pitch forward
      break;
    case 'k': // Pitch backward
      demo.setPitch(1.0); // Positive value to pitch backward
      break;
    case 'j': // Roll left
      demo.setRoll(1.0); // Changed from -1.0 to 1.0 for left roll
      break;
    case 'l': // Roll right
      demo.setRoll(-1.0); // Changed from 1.0 to -1.0 for right roll
      break;
    
    // Other controls
    case 'h':
      demo.toggleAltitudeHold();
      break;
    case 'r':
      demo.reset();
      break;
  }
});

document.addEventListener('keyup', (event) => {
  switch(event.key) {
    // Left stick (WASD)
    case 'w':
    case 's':
      demo.setThrottle(0);
      break;
    case 'a':
    case 'd':
      demo.setYaw(0);
      break;
    
    // Right stick (IJKL)
    case 'i':
    case 'k':
      demo.setPitch(0);
      break;
    case 'j':
    case 'l':
      demo.setRoll(0);
      break;
  }
});