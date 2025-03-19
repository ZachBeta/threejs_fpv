import * as THREE from 'three';

export class Controls {
  constructor({ 
    window = globalThis.window,
    navigator = globalThis.navigator,
    gamepadConfig = {
      deadzone: 0.1,
      axisMapping: {
        leftStickX: 0,
        leftStickY: 1,
        rightStickX: 2,
        rightStickY: 3
      },
      buttonMapping: {
        reset: 4, // L button
        hover: 5  // R button
      }
    }
  } = {}) {
    this.window = window;
    this.navigator = navigator;
    this.gamepadConfig = gamepadConfig;

    this.state = {
      gamepad: null,
      diagnostics: {
        speed: 0,
        altitude: 0,
        controllerConnected: false,
        controllerName: '',
        lastInput: 'None',
        debugState: {
          rawInputs: {},
          processedControls: {},
          droneOrientation: {}
        }
      },
      controls: {
        throttle: 0,
        yaw: 0,
        pitch: 0,
        roll: 0,
        hover: false
      }
    };

    this.setupGamepadListeners();
  }

  setupGamepadListeners() {
    this.window.addEventListener("gamepadconnected", (e) => {
      console.log("Gamepad connected:", e.gamepad);
      this.state.gamepad = e.gamepad;
      this.state.diagnostics.controllerConnected = true;
      this.state.diagnostics.controllerName = e.gamepad.id;
    });

    this.window.addEventListener("gamepaddisconnected", (e) => {
      console.log("Gamepad disconnected");
      this.state.gamepad = null;
      this.state.diagnostics.controllerConnected = false;
      this.state.diagnostics.controllerName = '';
    });
  }

  handleGamepadInput() {
    if (!this.state.gamepad) {
      this.state.diagnostics.controllerConnected = false;
      this.state.diagnostics.controllerName = '';
      return;
    }

    const gamepad = this.state.gamepad;
    this.state.diagnostics.controllerConnected = true;
    this.state.diagnostics.controllerName = gamepad.id;
    const { deadzone, axisMapping, buttonMapping } = this.gamepadConfig;

    // Get raw inputs with deadzone applied
    const leftX = Math.abs(gamepad.axes[axisMapping.leftStickX]) > deadzone ? 
                 gamepad.axes[axisMapping.leftStickX] : 0;
    const leftY = Math.abs(gamepad.axes[axisMapping.leftStickY]) > deadzone ? 
                 gamepad.axes[axisMapping.leftStickY] : 0;
    const rightX = Math.abs(gamepad.axes[axisMapping.rightStickX]) > deadzone ? 
                  gamepad.axes[axisMapping.rightStickX] : 0;
    const rightY = Math.abs(gamepad.axes[axisMapping.rightStickY]) > deadzone ? 
                  gamepad.axes[axisMapping.rightStickY] : 0;

    // Store raw inputs for debugging
    this.state.diagnostics.debugState.rawInputs = {
      leftStick: { x: leftX, y: leftY },
      rightStick: { x: rightX, y: rightY }
    };

    // Update last input for diagnostics
    if (leftX !== 0 || leftY !== 0 || rightX !== 0 || rightY !== 0) {
      this.state.diagnostics.lastInput = `L:(${leftX.toFixed(2)},${leftY.toFixed(2)}) R:(${rightX.toFixed(2)},${rightY.toFixed(2)})`;
    }

    // Process controls
    const controls = {
      throttle: leftY !== 0 ? -leftY : 0,
      yaw: leftX !== 0 ? -leftX : 0,
      pitch: rightY !== 0 ? rightY : 0,
      roll: rightX !== 0 ? -rightX : 0  // Inverted to match keyboard controls
    };

    // Store processed controls for debugging
    this.state.diagnostics.debugState.processedControls = { ...controls };

    // Update game state
    Object.assign(this.state.controls, controls);

    // Handle button presses
    if (gamepad.buttons[buttonMapping.reset]?.pressed && !this._lastResetState) {
      this.reset();
    }
    if (gamepad.buttons[buttonMapping.hover]?.pressed && !this._lastHoverState) {
      this.toggleHoverMode();
    }
    this._lastResetState = gamepad.buttons[buttonMapping.reset]?.pressed;
    this._lastHoverState = gamepad.buttons[buttonMapping.hover]?.pressed;
  }

  updateGamepadState() {
    const gamepads = this.navigator.getGamepads();
    
    if (!this.state.gamepad) {
      for (const gamepad of gamepads) {
        if (gamepad) {
          this.state.gamepad = gamepad;
          this.state.diagnostics.controllerConnected = true;
          this.state.diagnostics.controllerName = gamepad.id;
          break;
        }
      }
      return;
    }

    // Get fresh gamepad state
    const freshGamepad = this.navigator.getGamepads()[this.state.gamepad.index];
    
    if (!freshGamepad) {
      this.state.gamepad = null;
      this.state.diagnostics.controllerConnected = false;
      this.state.diagnostics.controllerName = '';
    } else {
      this.state.gamepad = freshGamepad;
    }
  }

  // Control methods
  setThrottle(value) {
    this.state.controls.throttle = value;
    this.logControlChange('throttle', value);
  }

  setPitch(value) {
    this.state.controls.pitch = value;
    this.logControlChange('pitch', value);
  }

  setRoll(value) {
    this.state.controls.roll = value;
    this.logControlChange('roll', value);
  }

  setYaw(value) {
    this.state.controls.yaw = value;
    this.logControlChange('yaw', value);
  }

  toggleHoverMode() {
    this.state.controls.hover = !this.state.controls.hover;
    console.log('Hover mode:', this.state.controls.hover);
  }

  reset() {
    this.state.controls = {
      throttle: 0,
      yaw: 0,
      pitch: 0,
      roll: 0,
      hover: false
    };
    console.log('Controls reset');
  }

  // Debug helpers
  logControlChange(control, value) {
    console.log(`Control ${control} set to ${value}`);
    this.state.diagnostics.debugState.processedControls[control] = value;
  }

  updateDroneOrientation(rotation) {
    this.state.diagnostics.debugState.droneOrientation = {
      pitch: rotation.x,
      yaw: rotation.y,
      roll: rotation.z
    };
  }

  getDiagnostics() {
    return this.state.diagnostics;
  }

  getControls() {
    return this.state.controls;
  }
} 