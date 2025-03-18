import * as THREE from 'three';

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

// Create the landmark cube
const cubeGeometry = new THREE.BoxGeometry();
const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
cube.position.y = 10.5; // Place on top of pedestal
scene.add(cube);

// Add lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Drone movement state
const droneState = {
    velocity: new THREE.Vector3(),
    rotation: new THREE.Vector3(),
    moveSpeed: 0.1,
    rotationSpeed: 0.02,
    keys: {}
};

// Handle keyboard controls
window.addEventListener('keydown', (e) => {
    droneState.keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
    droneState.keys[e.key.toLowerCase()] = false;
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function updateDroneMovement() {
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

    // Rotate the cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Update drone movement
    updateDroneMovement();

    renderer.render(scene, camera);
}

animate(); 