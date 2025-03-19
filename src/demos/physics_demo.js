import * as THREE from 'three';
import { DroneModel } from '../models/drone_model.js';
import { Map } from '../models/map.js';
import { Controls } from '../controls.js';
import { stateRecorder } from '../utils/state_recorder.js';
import RecordingManager from '../utils/RecordingManager.js';

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
    
    // Disable safety mode by default
    this.drone.physics.disableSafetyMode();
    
    // Set up camera position
    this.camera.position.set(0, 15, 15);
    this.camera.lookAt(0, 0, 0);

    // Set up FPV camera
    this.setupFPVCamera();

    // Initialize recording manager
    this.recordingManager = new RecordingManager();
    this.recordingManager.mount(document.body);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(), false);

    // Start animation loop
    this.animate();
    
    // For debugging - make demo accessible globally
    window.demo = this;
  }

  setupFPVCamera() {
    // Create FPV camera with wider FOV for fisheye effect
    this.fpvCamera = new THREE.PerspectiveCamera(120, 1, 0.1, 1000);
    
    // Create FPV renderer
    this.fpvRenderer = new THREE.WebGLRenderer({ antialias: false });
    this.fpvRenderer.setSize(200, 200); // Small size for PIP
    
    // Style the PIP container
    const pipContainer = document.createElement('div');
    pipContainer.style.position = 'fixed';
    pipContainer.style.bottom = '20px';
    pipContainer.style.left = '20px';
    pipContainer.style.width = '200px';
    pipContainer.style.height = '200px';
    pipContainer.style.border = '2px solid #00ff00';
    pipContainer.style.borderRadius = '5px';
    pipContainer.style.overflow = 'hidden';
    pipContainer.style.zIndex = '1000';
    
    // Add label to PIP view
    const pipLabel = document.createElement('div');
    pipLabel.textContent = 'DRONE CAM';
    pipLabel.style.position = 'absolute';
    pipLabel.style.top = '5px';
    pipLabel.style.left = '50%';
    pipLabel.style.transform = 'translateX(-50%)';
    pipLabel.style.color = '#00ff00';
    pipLabel.style.fontFamily = 'monospace';
    pipLabel.style.fontSize = '12px';
    pipLabel.style.fontWeight = 'bold';
    pipLabel.style.textShadow = '1px 1px 1px black';
    pipLabel.style.zIndex = '1001';
    
    // Add crosshair to FPV view
    const crosshair = document.createElement('div');
    crosshair.style.position = 'absolute';
    crosshair.style.top = '50%';
    crosshair.style.left = '50%';
    crosshair.style.transform = 'translate(-50%, -50%)';
    crosshair.style.zIndex = '1001';
    
    // Create horizontal line
    const horizontalLine = document.createElement('div');
    horizontalLine.style.width = '20px';
    horizontalLine.style.height = '2px';
    horizontalLine.style.backgroundColor = '#00ff00';
    horizontalLine.style.position = 'absolute';
    horizontalLine.style.top = '50%';
    horizontalLine.style.left = '50%';
    horizontalLine.style.transform = 'translate(-50%, -50%)';
    horizontalLine.style.opacity = '0.7';
    
    // Create vertical line
    const verticalLine = document.createElement('div');
    verticalLine.style.width = '2px';
    verticalLine.style.height = '20px';
    verticalLine.style.backgroundColor = '#00ff00';
    verticalLine.style.position = 'absolute';
    verticalLine.style.top = '50%';
    verticalLine.style.left = '50%';
    verticalLine.style.transform = 'translate(-50%, -50%)';
    verticalLine.style.opacity = '0.7';
    
    // Create center dot
    const centerDot = document.createElement('div');
    centerDot.style.width = '4px';
    centerDot.style.height = '4px';
    centerDot.style.borderRadius = '50%';
    centerDot.style.backgroundColor = '#00ff00';
    centerDot.style.position = 'absolute';
    centerDot.style.top = '50%';
    centerDot.style.left = '50%';
    centerDot.style.transform = 'translate(-50%, -50%)';
    centerDot.style.opacity = '0.7';
    
    // Assemble crosshair
    crosshair.appendChild(horizontalLine);
    crosshair.appendChild(verticalLine);
    crosshair.appendChild(centerDot);
    
    // Add the renderer to the container
    pipContainer.appendChild(this.fpvRenderer.domElement);
    pipContainer.appendChild(pipLabel);
    pipContainer.appendChild(crosshair);
    document.body.appendChild(pipContainer);
    
    // Store the container reference
    this.pipContainer = pipContainer;
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
    
    // Update FPV camera aspect ratio if needed
    // (We keep it 1:1 for the PIP view)
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
    
    // Helper function to format objects as key:value pairs per line
    const formatAsKeyValuePairs = (obj, indent = 2) => {
      const indentSpace = ' '.repeat(indent);
      let result = '';
      
      if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && value !== null) {
            result += `${indentSpace}${key}:\n${formatAsKeyValuePairs(value, indent + 2)}`;
          } else {
            result += `${indentSpace}${key}: ${value}\n`;
          }
        }
      }
      
      return result;
    };
    
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
      <div style="margin-left: 10px; white-space: pre; font-family: monospace;">
        Raw Inputs:
${formatAsKeyValuePairs(formattedRawInputs)}</div>
      <div style="margin-left: 10px; white-space: pre; font-family: monospace;">
        Processed Controls:
${formatAsKeyValuePairs(formattedControls)}</div>
      <div style="margin-left: 10px; white-space: pre; font-family: monospace;">
        Drone Orientation:
${formatAsKeyValuePairs(roundedOrientation)}</div>
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
    const currentTime = performance.now() / 1000; // Convert to seconds

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
    
    // Get world position of the camera model
    const cameraWorldPosition = new THREE.Vector3();
    this.drone.cameraModel.getWorldPosition(cameraWorldPosition);
    
    // Get world quaternion of the camera model
    const cameraWorldQuaternion = new THREE.Quaternion();
    this.drone.cameraModel.getWorldQuaternion(cameraWorldQuaternion);
    
    // Set FPV camera position to match physical camera model
    this.fpvCamera.position.copy(cameraWorldPosition);
    
    // Set FPV camera orientation to match physical camera model
    // The camera model is facing forward on the drone, but we need to rotate 180°
    // around Y axis to make it face in the correct direction for the camera view
    this.fpvCamera.quaternion.copy(cameraWorldQuaternion);
    this.fpvCamera.rotateY(Math.PI);
    
    // Add slight uptilt to the FPV camera (about 15 degrees)
    this.fpvCamera.rotateX(-0.26); // ~15 degrees in radians

    // Update diagnostics
    this.updateDiagnostics();
    
    // Record frame if recording is active
    if (this.recordingManager.isRecording) {
      this.recordingManager.recordFrame({
        physics: {
          position: { ...this.drone.position },
          quaternion: { ...this.drone.quaternion },
          up: { ...this.drone.up },
          forward: { ...this.drone.getWorldDirection(new THREE.Vector3()) },
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

    // Render main view
    this.renderer.render(this.scene, this.camera);
    
    // Render FPV view
    this.fpvRenderer.render(this.scene, this.fpvCamera);
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
    
    // Recording controls
    case 'b': // Backward loop recording shortcut
      // First, check if we're already recording
      if (!demo.recordingManager.isRecording) {
        // Start recording
        demo.recordingManager.startRecording();
        // Configure for backward loop - full throttle and backward pitch
        demo.setThrottle(1.0);
        demo.setPitch(1.0);
      } else {
        // Stop recording and reset controls
        demo.recordingManager.stopRecording();
        demo.setThrottle(0);
        demo.setPitch(0);
      }
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
    case 'w': // Release throttle up
    case 's': // Release throttle down
      demo.setThrottle(0);
      break;
    case 'a': // Release yaw left
    case 'd': // Release yaw right
      demo.setYaw(0);
      break;
    
    // Right stick (IJKL)
    case 'i': // Release pitch forward
    case 'k': // Release pitch backward
      demo.setPitch(0);
      break;
    case 'j': // Release roll left
    case 'l': // Release roll right
      demo.setRoll(0);
      break;
  }
});