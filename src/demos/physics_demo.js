import * as THREE from 'three';
import { DronePhysics } from '../physics.js';

class PhysicsDemo {
  constructor() {
    // Initialize drone state
    this.droneState = {
      gamepad: null,
      deadzone: 0.1,
      diagnostics: {
        speed: 0,
        altitude: 0,
        controllerConnected: false,
        controllerName: '',
        lastInput: 'None'
      }
    };

    // Create controller display
    this.setupControllerDisplay();

    // Create diagnostic overlay
    this.setupDiagnosticOverlay();

    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

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

    // Setup gamepad event listeners
    window.addEventListener("gamepadconnected", (e) => {
      console.log("Gamepad connected:", e.gamepad);
      this.droneState.gamepad = e.gamepad;
      this.droneState.diagnostics.controllerConnected = true;
      this.droneState.diagnostics.controllerName = e.gamepad.id;
    });

    window.addEventListener("gamepaddisconnected", (e) => {
      console.log("Gamepad disconnected");
      this.droneState.gamepad = null;
      this.droneState.diagnostics.controllerConnected = false;
      this.droneState.diagnostics.controllerName = '';
    });

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

  updateGamepadState() {
    const gamepads = navigator.getGamepads();
    
    if (!this.droneState.gamepad) {
      for (const gamepad of gamepads) {
        if (gamepad) {
          this.droneState.gamepad = gamepad;
          this.droneState.diagnostics.controllerConnected = true;
          this.droneState.diagnostics.controllerName = gamepad.id;
          break;
        }
      }
      return;
    }

    // Get fresh gamepad state
    const freshGamepad = navigator.getGamepads()[this.droneState.gamepad.index];
    
    if (!freshGamepad) {
      this.droneState.gamepad = null;
      this.droneState.diagnostics.controllerConnected = false;
      this.droneState.diagnostics.controllerName = '';
    } else {
      this.droneState.gamepad = freshGamepad;
    }
  }

  handleGamepadInput() {
    if (!this.droneState.gamepad) {
      this.droneState.diagnostics.controllerConnected = false;
      this.droneState.diagnostics.controllerName = '';
      return;
    }

    const gamepad = this.droneState.gamepad;
    this.droneState.diagnostics.controllerConnected = true;
    this.droneState.diagnostics.controllerName = gamepad.id;
    const deadzone = this.droneState.deadzone;

    // Check for L button press (button 4) to reset the drone
    if (gamepad.buttons[4] && gamepad.buttons[4].pressed) {
      this.reset();
      return;
    }

    // Left stick - Throttle and Yaw
    const leftX = Math.abs(gamepad.axes[0]) > deadzone ? gamepad.axes[0] : 0;
    const leftY = Math.abs(gamepad.axes[1]) > deadzone ? gamepad.axes[1] : 0;
    
    // Right stick - Pitch and Roll
    const rightX = Math.abs(gamepad.axes[2]) > deadzone ? gamepad.axes[2] : 0;
    const rightY = Math.abs(gamepad.axes[3]) > deadzone ? gamepad.axes[3] : 0;

    // Update last input for diagnostics
    if (leftX !== 0 || leftY !== 0 || rightX !== 0 || rightY !== 0) {
      this.droneState.diagnostics.lastInput = `L:(${leftX.toFixed(2)},${leftY.toFixed(2)}) R:(${rightX.toFixed(2)},${rightY.toFixed(2)})`;
    }

    // Update controller display
    this.leftStickIndicator.style.left = `${(leftX * 50) + 50}%`;
    this.leftStickIndicator.style.top = `${(leftY * 50) + 50}%`;
    this.rightStickIndicator.style.left = `${(rightX * 50) + 50}%`;
    this.rightStickIndicator.style.top = `${(rightY * 50) + 50}%`;

    // Apply to drone physics
    if (leftY !== 0) {
      // Vertical movement (throttle)
      this.physics.setThrottle(-leftY); // Invert Y axis
    } else {
      this.physics.setThrottle(0);
    }

    if (leftX !== 0) {
      // Yaw (rotate left/right)
      this.physics.setYaw(-leftX);
    } else {
      this.physics.setYaw(0);
    }

    if (rightY !== 0) {
      // Pitch (tilt forward/backward)
      this.physics.setPitch(-rightY);
    } else {
      this.physics.setPitch(0);
    }

    if (rightX !== 0) {
      // Roll (tilt left/right)
      this.physics.setRoll(rightX);
    } else {
      this.physics.setRoll(0);
    }
  }

  updateDiagnostics() {
    // Calculate speed from physics velocity
    const velocity = this.physics.velocity;
    this.droneState.diagnostics.speed = Math.sqrt(
      velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z
    );
    this.droneState.diagnostics.altitude = this.physics.position.y;
    
    // Update overlay text
    this.diagnosticOverlay.innerHTML = `
      <div>Controller: ${this.droneState.diagnostics.controllerConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Controller Name: ${this.droneState.diagnostics.controllerName || 'None'}</div>
      <div>Last Input: ${this.droneState.diagnostics.lastInput}</div>
      <div>Speed: ${this.droneState.diagnostics.speed.toFixed(2)} m/s</div>
      <div>Altitude: ${this.droneState.diagnostics.altitude.toFixed(2)} m</div>
      <div>Throttle: ${this.physics.throttle.toFixed(2)}</div>
      <div>Hover Mode: ${this.physics.hoverMode ? 'ON' : 'OFF'}</div>
    `;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update gamepad state
    this.updateGamepadState();
    this.handleGamepadInput();

    // Update physics
    this.physics.updatePhysics(0.016); // Assuming 60fps

    // Update drone mesh position and rotation
    this.droneMesh.position.copy(this.physics.position);
    
    // Convert plain object rotation to THREE.Euler rotation
    this.droneMesh.rotation.x = this.physics.rotation.x;
    this.droneMesh.rotation.y = this.physics.rotation.y;
    this.droneMesh.rotation.z = this.physics.rotation.z;

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
    const propellerSpeed = this.physics.throttle * 10;
    this.propellers.forEach(propeller => {
      propeller.rotation.y += propellerSpeed;
    });

    // Update diagnostics
    this.updateDiagnostics();

    this.renderer.render(this.scene, this.camera);
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
    
    // Reset drone mesh position
    this.droneMesh.position.copy(this.physics.position);
    
    // Reset camera position relative to drone
    const offsetY = 15;
    const offsetZ = 15;
    this.camera.position.x = this.physics.position.x;
    this.camera.position.y = this.physics.position.y + offsetY;
    this.camera.position.z = this.physics.position.z + offsetZ;
    this.camera.lookAt(
      this.physics.position.x,
      this.physics.position.y,
      this.physics.position.z
    );
  }
}

// Create demo instance
const demo = new PhysicsDemo();

// Add keyboard controls
document.addEventListener('keydown', (event) => {
  switch(event.key) {
    case ' ': // Spacebar for throttle
      demo.setThrottle(1.0);
      break;
    case 'w':
      demo.setPitch(1.0);
      break;
    case 's':
      demo.setPitch(-1.0);
      break;
    case 'a':
      demo.setRoll(-1.0);
      break;
    case 'd':
      demo.setRoll(1.0);
      break;
    case 'q':
      demo.setYaw(-1.0);
      break;
    case 'e':
      demo.setYaw(1.0);
      break;
    case 'h':
      demo.toggleHoverMode();
      break;
    case 'r':
      demo.reset();
      break;
  }
});

document.addEventListener('keyup', (event) => {
  switch(event.key) {
    case ' ':
      demo.setThrottle(0);
      break;
    case 'w':
    case 's':
      demo.setPitch(0);
      break;
    case 'a':
    case 'd':
      demo.setRoll(0);
      break;
    case 'q':
    case 'e':
      demo.setYaw(0);
      break;
  }
});