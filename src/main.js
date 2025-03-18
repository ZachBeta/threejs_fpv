import * as THREE from 'three';

// Create diagnostic overlay
const overlay = document.createElement('div');
overlay.style.position = 'fixed';
overlay.style.top = '10px';
overlay.style.left = '10px';
overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
overlay.style.color = '#00ff00';
overlay.style.fontFamily = 'monospace';
overlay.style.padding = '10px';
overlay.style.borderRadius = '5px';
overlay.style.zIndex = '1000';
document.body.appendChild(overlay);

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

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15); // Start position
camera.lookAt(0, 5, 0);

// Create renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a large ground plane
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3a9d23,
    roughness: 0.8,
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

// Create a tall pedestal
const pedestalGeometry = new THREE.BoxGeometry(2, 10, 2);
const pedestalMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x808080,
    roughness: 0.6
});
const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
pedestal.position.y = 5; // Half of its height
scene.add(pedestal);

// Create checkerboard texture
const size = 32;
const canvas = document.createElement('canvas');
canvas.width = size;
canvas.height = size;
const context = canvas.getContext('2d');
context.fillStyle = '#ffffff';
context.fillRect(0, 0, size, size);
context.fillStyle = '#000000';
for (let i = 0; i < size; i += 8) {
    for (let j = 0; j < size; j += 8) {
        if ((i + j) % 16 === 0) {
            context.fillRect(i, j, 8, 8);
        }
    }
}
const checkerTexture = new THREE.CanvasTexture(canvas);
checkerTexture.wrapS = THREE.RepeatWrapping;
checkerTexture.wrapT = THREE.RepeatWrapping;
checkerTexture.repeat.set(2, 2);

// Function to create a building
function createBuilding(x, z) {
    const height = 10 + Math.random() * 15;
    const width = 8 + Math.random() * 6;
    const depth = 8 + Math.random() * 6;
    
    const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
    
    // Create materials for each face
    const materials = [
        new THREE.MeshStandardMaterial({ // right
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.3,
            flatShading: true,
            map: checkerTexture.clone()
        }),
        new THREE.MeshStandardMaterial({ // left
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.3,
            flatShading: true,
            map: checkerTexture.clone()
        }),
        new THREE.MeshStandardMaterial({ // top
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.3,
            flatShading: true
        }),
        new THREE.MeshStandardMaterial({ // bottom
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.3,
            flatShading: true
        }),
        new THREE.MeshStandardMaterial({ // front
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.3,
            flatShading: true,
            map: checkerTexture.clone()
        }),
        new THREE.MeshStandardMaterial({ // back
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.3,
            flatShading: true,
            map: checkerTexture.clone()
        })
    ];
    
    const building = new THREE.Mesh(buildingGeometry, materials);
    building.position.set(x, height/2, z);
    
    // Add subtle edge highlights
    const edges = new THREE.EdgesGeometry(buildingGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ 
        color: 0x000000,
        opacity: 0.2,
        transparent: true
    });
    const edgesMesh = new THREE.LineSegments(edges, edgesMaterial);
    building.add(edgesMesh);
    
    return building;
}

// Function to create a tower
function createTower(x, z, height, color = 0x808080) {
    const towerGeometry = new THREE.BoxGeometry(4, height, 4);
    const towerMaterial = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.2
    });
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(x, height/2, z);
    
    // Add some details to the tower
    const topGeometry = new THREE.CylinderGeometry(3, 3, 4, 8);
    const topMaterial = new THREE.MeshStandardMaterial({
        color: 0x606060,
        roughness: 0.5,
        metalness: 0.3
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = height/2 + 2;
    tower.add(top);
    
    return tower;
}

// Function to create an obstacle course element
function createObstacle(x, y, z) {
    const group = new THREE.Group();
    
    // Create a ring to fly through
    const torusGeometry = new THREE.TorusGeometry(5, 0.5, 16, 32);
    const torusMaterial = new THREE.MeshStandardMaterial({
        color: 0xff4400,
        roughness: 0.6,
        metalness: 0.3
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.position.set(x, y, z);
    // Rotate the ring to make it vertical
    torus.rotation.x = Math.PI / 2;
    group.add(torus);
    
    return group;
}

// Add towers near the edges of the map
const towerPositions = [
    { x: -100, z: -100, height: 50 },
    { x: 100, z: -100, height: 40 },
    { x: -100, z: 100, height: 45 },
    { x: 100, z: 100, height: 35 }
];

towerPositions.forEach(pos => {
    const tower = createTower(pos.x, pos.z, pos.height);
    scene.add(tower);
});

// Add some obstacles for an interesting flight path
const obstacles = [
    { x: 20, y: 15, z: 0 },
    { x: -15, y: 10, z: 20 },
    { x: 0, y: 20, z: -25 },
    { x: -30, y: 25, z: -15 }
];

obstacles.forEach(pos => {
    const obstacle = createObstacle(pos.x, pos.y, pos.z);
    scene.add(obstacle);
});

// Add some buildings in the middle area
for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const radius = 30 + Math.random() * 20;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const building = createBuilding(x, z);
    scene.add(building);
}

// Create the landmark cube
const cubeGeometry = new THREE.BoxGeometry();
const cubeMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x00ff00,
    shininess: 100,
    specular: 0x444444
});
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.y = 15; // Raised from 10.5 to prevent clipping
scene.add(cube);

// Add lights
const light = new THREE.DirectionalLight(0xffffff, 1.5); // Increased intensity
light.position.set(1, 1, 1);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040, 0.8); // Increased intensity
scene.add(ambientLight);

// Add a second directional light for better shading
const secondaryLight = new THREE.DirectionalLight(0xffffff, 0.8);
secondaryLight.position.set(-1, 0.5, -1);
scene.add(secondaryLight);

// Create fog for edge fade-out effect
scene.fog = new THREE.Fog(0x87CEEB, 100, 400); // Sky blue fog that starts at 100 units and ends at 400

// Drone movement state
const droneState = {
    velocity: new THREE.Vector3(),
    rotation: new THREE.Vector3(),
    moveSpeed: 0.1,
    rotationSpeed: 0.02,
    keys: {},
    gamepad: null,
    deadzone: 0.1, // Ignore small stick movements
    diagnostics: {
        speed: 0,
        altitude: 0,
        controllerConnected: false,
        controllerName: '',
        lastInput: 'None'
    },
    // Add initial position and rotation for reset
    initialPosition: new THREE.Vector3(0, 5, 15),
    initialLookAt: new THREE.Vector3(0, 5, 0)
};

// Handle keyboard controls
window.addEventListener('keydown', (e) => {
    droneState.keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    droneState.keys[e.key.toLowerCase()] = false;
});

// Handle gamepad connection/disconnection
window.addEventListener("gamepadconnected", (e) => {
    console.log("Gamepad connected event:", e.gamepad);
    droneState.gamepad = e.gamepad;
    droneState.diagnostics.controllerConnected = true;
    droneState.diagnostics.controllerName = e.gamepad.id;
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.log("Gamepad disconnected event:", e.gamepad);
    droneState.gamepad = null;
    droneState.diagnostics.controllerConnected = false;
    droneState.diagnostics.controllerName = '';
});

// Update gamepad state
function updateGamepadState() {
    const gamepads = navigator.getGamepads();
    console.log("All gamepads:", gamepads);
    
    if (!droneState.gamepad) {
        console.log("No gamepad in state, searching for available gamepads...");
        for (const gamepad of gamepads) {
            if (gamepad) {
                console.log("Found available gamepad:", gamepad);
                droneState.gamepad = gamepad;
                droneState.diagnostics.controllerConnected = true;
                droneState.diagnostics.controllerName = gamepad.id;
                break;
            }
        }
        return;
    }

    // Get fresh gamepad state
    const freshGamepad = navigator.getGamepads()[droneState.gamepad.index];
    console.log("Fresh gamepad state:", freshGamepad);
    
    if (!freshGamepad) {
        console.log("Gamepad no longer available");
        droneState.gamepad = null;
        droneState.diagnostics.controllerConnected = false;
        droneState.diagnostics.controllerName = '';
    } else {
        droneState.gamepad = freshGamepad;
    }
}

// Function to reset drone to initial position and rotation
function resetDrone() {
    camera.position.copy(droneState.initialPosition);
    camera.lookAt(droneState.initialLookAt);
    // Reset velocity and rotation
    droneState.velocity.set(0, 0, 0);
    droneState.rotation.set(0, 0, 0);
}

function handleGamepadInput() {
    if (!droneState.gamepad) {
        droneState.diagnostics.controllerConnected = false;
        droneState.diagnostics.controllerName = '';
        return;
    }

    const gamepad = droneState.gamepad;
    droneState.diagnostics.controllerConnected = true;
    droneState.diagnostics.controllerName = gamepad.id;
    const deadzone = droneState.deadzone;

    // Check for L button press (button 4)
    if (gamepad.buttons[4].pressed) {
        resetDrone();
        return; // Skip other inputs this frame
    }

    // Left stick - Throttle and Yaw
    const leftX = Math.abs(gamepad.axes[0]) > deadzone ? gamepad.axes[0] : 0;
    const leftY = Math.abs(gamepad.axes[1]) > deadzone ? gamepad.axes[1] : 0;
    
    // Right stick - Pitch and Roll
    const rightX = Math.abs(gamepad.axes[2]) > deadzone ? gamepad.axes[2] : 0;
    const rightY = Math.abs(gamepad.axes[3]) > deadzone ? gamepad.axes[3] : 0;

    // Update last input
    if (leftX !== 0 || leftY !== 0 || rightX !== 0 || rightY !== 0) {
        droneState.diagnostics.lastInput = `L:(${leftX.toFixed(2)},${leftY.toFixed(2)}) R:(${rightX.toFixed(2)},${rightY.toFixed(2)})`;
        console.log("Active gamepad input:", droneState.diagnostics.lastInput);
    }

    // Left stick controls
    if (leftY !== 0) {
        // Vertical movement (throttle)
        camera.translateY(-droneState.moveSpeed * leftY);
    }
    if (leftX !== 0) {
        // Yaw (rotate left/right)
        camera.rotateY(-droneState.rotationSpeed * leftX);
    }

    // Right stick controls
    if (rightY !== 0) {
        // Pitch (tilt forward/backward)
        camera.translateZ(droneState.moveSpeed * rightY);
    }
    if (rightX !== 0) {
        // Roll (tilt left/right)
        camera.translateX(droneState.moveSpeed * rightX);
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function updateDroneMovement() {
    // Update gamepad state first
    updateGamepadState();
    handleGamepadInput();

    // Keyboard controls (fallback)
    // Forward/Backward
    if (droneState.keys['w']) {
        camera.translateZ(-droneState.moveSpeed);
    }
    if (droneState.keys['s']) {
        camera.translateZ(droneState.moveSpeed);
    }
    
    // Left/Right strafe
    if (droneState.keys['a']) {
        camera.translateX(-droneState.moveSpeed);
    }
    if (droneState.keys['d']) {
        camera.translateX(droneState.moveSpeed);
    }
    
    // Up/Down
    if (droneState.keys[' ']) { // Space
        camera.translateY(droneState.moveSpeed);
    }
    if (droneState.keys['shift']) {
        camera.translateY(-droneState.moveSpeed);
    }
    
    // Rotation
    if (droneState.keys['arrowleft']) {
        camera.rotateY(droneState.rotationSpeed);
    }
    if (droneState.keys['arrowright']) {
        camera.rotateY(-droneState.rotationSpeed);
    }
    if (droneState.keys['arrowup']) {
        camera.rotateX(droneState.rotationSpeed);
    }
    if (droneState.keys['arrowdown']) {
        camera.rotateX(-droneState.rotationSpeed);
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update diagnostics
    droneState.diagnostics.speed = Math.sqrt(
        Math.pow(camera.position.x, 2) + 
        Math.pow(camera.position.y, 2) + 
        Math.pow(camera.position.z, 2)
    );
    droneState.diagnostics.altitude = camera.position.y;

    // Update overlay with diagnostics
    overlay.innerHTML = `
        <div>Controller: ${droneState.diagnostics.controllerConnected ? 'Connected' : 'Disconnected'}</div>
        <div>Controller Name: ${droneState.diagnostics.controllerName || 'None'}</div>
        <div>Last Input: ${droneState.diagnostics.lastInput}</div>
        <div>Speed: ${droneState.diagnostics.speed.toFixed(2)} m/s</div>
        <div>Altitude: ${droneState.diagnostics.altitude.toFixed(2)} m</div>
        <div>Position: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)})</div>
    `;

    // Update stick positions
    if (droneState.gamepad) {
        const leftX = droneState.gamepad.axes[0];
        const leftY = droneState.gamepad.axes[1];
        const rightX = droneState.gamepad.axes[2];
        const rightY = droneState.gamepad.axes[3];

        // Update left stick position (scale from -1,1 to 0,100)
        leftStickIndicator.style.left = `${50 + leftX * 50}%`;
        leftStickIndicator.style.top = `${50 + leftY * 50}%`;

        // Update right stick position
        rightStickIndicator.style.left = `${50 + rightX * 50}%`;
        rightStickIndicator.style.top = `${50 + rightY * 50}%`;
    }

    // Rotate the cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Update drone movement
    updateDroneMovement();

    renderer.render(scene, camera);
}

animate(); 