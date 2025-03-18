import { DronePhysics } from '../physics.js';
import { GameStateApi } from '../game_state_api.js';

class LoggingDemo {
  constructor() {
    console.log('Creating new LoggingDemo instance');
    this.isRoutineRunning = false;
    this.currentStep = 0;
    this.stepStartTime = 0;
    this.routine = [
      { name: 'Takeoff', duration: 2000, action: () => this.setThrottle(0.8) },
      { name: 'Hover', duration: 2000, action: () => this.setThrottle(0.5) },
      { name: 'Forward', duration: 2000, action: () => this.setPitch(0.5) },
      { name: 'Backward', duration: 2000, action: () => this.setPitch(-0.5) },
      { name: 'Left', duration: 2000, action: () => this.setRoll(-0.5) },
      { name: 'Right', duration: 2000, action: () => this.setRoll(0.5) },
      { name: 'Rotate Left', duration: 2000, action: () => this.setYaw(-0.5) },
      { name: 'Rotate Right', duration: 2000, action: () => this.setYaw(0.5) },
      { name: 'Land', duration: 2000, action: () => this.setThrottle(0.2) },
      { name: 'Reset', duration: 1000, action: () => this.reset() }
    ];

    // Initialize logging
    this.logger = new GameStateApi();
    this.logs = [];
    this.lastLogTime = 0;
    this.logInterval = 100; // Log every 100ms

    // Initialize physics
    this.physics = new DronePhysics();

    // Start simulation loop
    this.simulate();
  }

  simulate() {
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
          console.log('Routine completed');
        } else {
          this.stepStartTime = currentTime;
          console.log(`Starting step: ${this.routine[this.currentStep].name}`);
          this.routine[this.currentStep].action();
        }
      }
    }

    // Update physics
    this.physics.updatePhysics(0.016); // Assuming 60fps

    // Schedule next simulation frame
    setTimeout(() => this.simulate(), 16);
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
    if (!this.isRoutineRunning) {
      console.log('Starting routine');
      this.isRoutineRunning = true;
      this.currentStep = 0;
      this.stepStartTime = performance.now();
      this.logger.enable();
      this.routine[this.currentStep].action();
      
      // Store the routine interval ID so we can clear it later
      this.routineInterval = setInterval(() => this.simulate(), 16); // ~60fps
    }
  }

  stopRoutine() {
    if (this.isRoutineRunning) {
      console.log('Stopping routine');
      this.isRoutineRunning = false;
      this.logger.disable();
      this.setThrottle(0);
      this.setPitch(0);
      this.setRoll(0);
      this.setYaw(0);
      
      // Clear the interval to prevent memory leaks
      if (this.routineInterval) {
        clearInterval(this.routineInterval);
        this.routineInterval = null;
      }
    }
  }

  saveLogs() {
    const logData = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `routine_logs_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Create and export the demo instance
let demo = null;

export function initializeDemo() {
    if (!demo) {
        demo = new LoggingDemo();
    }
    return demo;
}

export function startDemo() {
    if (!demo) {
        demo = initializeDemo();
    }
    demo.startRoutine();
    return demo;
}

export function stopDemo() {
    if (demo) {
        demo.stopRoutine();
        // Clear any potential demo references to allow garbage collection
        demo = null;
    }
}

export function isDemoRunning() {
    return demo ? demo.isRoutineRunning : false;
}

export default demo; 