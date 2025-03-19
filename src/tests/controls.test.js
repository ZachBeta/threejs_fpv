import { Controls } from '../controls.js';
import { jest } from '@jest/globals';

describe('Controls', () => {
  let controls;
  let mockWindow;
  let mockNavigator;
  let mockGamepadConfig;
  let gamepadConnectHandlers;
  let gamepadDisconnectHandlers;

  beforeEach(() => {
    // Set up mock handlers arrays
    gamepadConnectHandlers = [];
    gamepadDisconnectHandlers = [];

    // Create mock window
    mockWindow = {
      addEventListener: (event, handler) => {
        if (event === 'gamepadconnected') {
          gamepadConnectHandlers.push(handler);
        } else if (event === 'gamepaddisconnected') {
          gamepadDisconnectHandlers.push(handler);
        }
      }
    };

    // Create mock navigator with gamepad support
    mockNavigator = {
      getGamepads: jest.fn().mockReturnValue([])
    };

    // Create mock gamepad config
    mockGamepadConfig = {
      deadzone: 0.1,
      axisMapping: {
        leftStickX: 0,
        leftStickY: 1,
        rightStickX: 2,
        rightStickY: 3
      },
      buttonMapping: {
        reset: 4,
        hover: 5
      }
    };

    // Initialize controls with mocks
    controls = new Controls({
      window: mockWindow,
      navigator: mockNavigator,
      gamepadConfig: mockGamepadConfig
    });
  });

  describe('Basic Control Input', () => {
    test('setPitch should update pitch control and log state', () => {
      controls.setPitch(1.0);
      const state = controls.getControls();
      const diagnostics = controls.getDiagnostics();
      
      expect(state.pitch).toBe(1.0);
      expect(diagnostics.debugState.processedControls.pitch).toBe(1.0);
    });

    test('setPitch negative should update pitch control correctly', () => {
      controls.setPitch(-1.0);
      const state = controls.getControls();
      expect(state.pitch).toBe(-1.0);
    });

    test('setRoll should update roll control', () => {
      controls.setRoll(1.0);
      const state = controls.getControls();
      expect(state.roll).toBe(1.0);
    });
  });

  describe('Gamepad Connection', () => {
    test('should handle gamepad connection', () => {
      const mockGamepad = { id: 'Test Controller', index: 0 };
      gamepadConnectHandlers[0]({ gamepad: mockGamepad });
      
      const diagnostics = controls.getDiagnostics();
      expect(diagnostics.controllerConnected).toBe(true);
      expect(diagnostics.controllerName).toBe('Test Controller');
    });

    test('should handle gamepad disconnection', () => {
      // First connect a gamepad
      const mockGamepad = { id: 'Test Controller', index: 0 };
      gamepadConnectHandlers[0]({ gamepad: mockGamepad });
      
      // Then disconnect it
      gamepadDisconnectHandlers[0]({});
      
      const diagnostics = controls.getDiagnostics();
      expect(diagnostics.controllerConnected).toBe(false);
      expect(diagnostics.controllerName).toBe('');
    });
  });

  describe('Gamepad Input Processing', () => {
    beforeEach(() => {
      // Connect a mock gamepad
      const mockGamepad = {
        id: 'Test Controller',
        index: 0,
        axes: [0, 0, 0, 0],
        buttons: Array(16).fill({ pressed: false })
      };
      gamepadConnectHandlers[0]({ gamepad: mockGamepad });
    });

    test('should process forward pitch (stick forward)', () => {
      // Mock gamepad with right stick pushed forward
      const mockGamepad = {
        axes: [0, 0, 0, -1], // Right stick Y at -1 (forward)
        buttons: Array(16).fill({ pressed: false }),
        id: 'Test Controller'
      };
      
      controls.state.gamepad = mockGamepad;
      controls.handleGamepadInput();
      
      const state = controls.getControls();
      const diagnostics = controls.getDiagnostics();
      
      expect(state.pitch).toBe(-1.0); // Should be negative for forward pitch
      expect(diagnostics.debugState.rawInputs.rightStick.y).toBe(-1);
    });

    test('should process backward pitch (stick back)', () => {
      // Mock gamepad with right stick pulled back
      const mockGamepad = {
        axes: [0, 0, 0, 1], // Right stick Y at 1 (backward)
        buttons: Array(16).fill({ pressed: false }),
        id: 'Test Controller'
      };
      
      controls.state.gamepad = mockGamepad;
      controls.handleGamepadInput();
      
      const state = controls.getControls();
      expect(state.pitch).toBe(1.0); // Should be positive for backward pitch
    });

    test('should respect deadzone', () => {
      // Mock gamepad with right stick barely moved
      const mockGamepad = {
        axes: [0, 0, 0, 0.05], // Right stick Y at 0.05 (less than deadzone)
        buttons: Array(16).fill({ pressed: false }),
        id: 'Test Controller'
      };
      
      controls.state.gamepad = mockGamepad;
      controls.handleGamepadInput();
      
      const state = controls.getControls();
      expect(state.pitch).toBe(0); // Should be zero due to deadzone
    });
  });

  describe('Roll Direction Consistency', () => {
    test('roll direction should be consistent between keyboard and gamepad', () => {
      // Test keyboard-style direct roll setting
      controls.setRoll(1.0); // Roll left
      let state = controls.getControls();
      expect(state.roll).toBe(1.0);
      
      controls.setRoll(-1.0); // Roll right
      state = controls.getControls();
      expect(state.roll).toBe(-1.0);
      
      // Test gamepad-style input
      const mockGamepadLeft = {
        axes: [0, 0, -1, 0], // Right stick X at -1 (left)
        buttons: Array(16).fill({ pressed: false }),
        id: 'Test Controller'
      };
      
      controls.state.gamepad = mockGamepadLeft;
      controls.handleGamepadInput();
      state = controls.getControls();
      expect(state.roll).toBe(-1.0); // Left on stick should be negative (roll right)
      
      const mockGamepadRight = {
        axes: [0, 0, 1, 0], // Right stick X at 1 (right)
        buttons: Array(16).fill({ pressed: false }),
        id: 'Test Controller'
      };
      
      controls.state.gamepad = mockGamepadRight;
      controls.handleGamepadInput();
      state = controls.getControls();
      expect(state.roll).toBe(1.0); // Right on stick should be positive (roll left)
    });

    test('roll input should respect deadzone', () => {
      const mockGamepad = {
        axes: [0, 0, 0.05, 0], // Right stick X barely moved right
        buttons: Array(16).fill({ pressed: false }),
        id: 'Test Controller'
      };
      
      controls.state.gamepad = mockGamepad;
      controls.handleGamepadInput();
      const state = controls.getControls();
      expect(state.roll).toBe(0); // Should be zero due to deadzone
    });
  });

  describe('Yaw Direction Consistency', () => {
    test('yaw direction should be consistent between keyboard and gamepad', () => {
      // Test keyboard-style direct yaw setting
      controls.setYaw(-1.0); // Yaw left
      let state = controls.getControls();
      expect(state.yaw).toBe(-1.0);
      
      controls.setYaw(1.0); // Yaw right
      state = controls.getControls();
      expect(state.yaw).toBe(1.0);
      
      // Test gamepad-style input
      const mockGamepadLeft = {
        axes: [-1, 0, 0, 0], // Left stick X at -1 (left)
        buttons: Array(16).fill({ pressed: false }),
        id: 'Test Controller'
      };
      
      controls.state.gamepad = mockGamepadLeft;
      controls.handleGamepadInput();
      state = controls.getControls();
      expect(state.yaw).toBe(1.0); // Left on stick should be positive (yaw left)
      
      const mockGamepadRight = {
        axes: [1, 0, 0, 0], // Left stick X at 1 (right)
        buttons: Array(16).fill({ pressed: false }),
        id: 'Test Controller'
      };
      
      controls.state.gamepad = mockGamepadRight;
      controls.handleGamepadInput();
      state = controls.getControls();
      expect(state.yaw).toBe(-1.0); // Right on stick should be negative (yaw right)
    });

    test('yaw input should respect deadzone', () => {
      const mockGamepad = {
        axes: [0.05, 0, 0, 0], // Left stick X barely moved right
        buttons: Array(16).fill({ pressed: false }),
        id: 'Test Controller'
      };
      
      controls.state.gamepad = mockGamepad;
      controls.handleGamepadInput();
      const state = controls.getControls();
      expect(state.yaw).toBe(0); // Should be zero due to deadzone
    });

    test('keyboard yaw controls should match documented behavior', () => {
      // Test A key (yaw left)
      controls.setYaw(-1.0);
      let state = controls.getControls();
      expect(state.yaw).toBe(-1.0); // A key should make drone yaw left (negative)
      
      // Test D key (yaw right)
      controls.setYaw(1.0);
      state = controls.getControls();
      expect(state.yaw).toBe(1.0); // D key should make drone yaw right (positive)
    });
  });

  describe('Orientation Tracking', () => {
    test('updateDroneOrientation should track pitch changes', () => {
      const mockRotation = { x: 0.5, y: 0, z: 0 }; // Pitched up by 0.5 radians
      controls.updateDroneOrientation(mockRotation);
      
      const diagnostics = controls.getDiagnostics();
      expect(diagnostics.debugState.droneOrientation.pitch).toBe(0.5);
    });

    test('reset should clear all controls and orientation', () => {
      // Set some control values
      controls.setPitch(1.0);
      controls.setRoll(0.5);
      controls.updateDroneOrientation({ x: 0.5, y: 0, z: 0.3 });
      
      // Reset
      controls.reset();
      
      const state = controls.getControls();
      expect(state.pitch).toBe(0);
      expect(state.roll).toBe(0);
    });
  });

  describe('Gamepad Button Controls', () => {
    beforeEach(() => {
      // Connect a mock gamepad
      const mockGamepad = {
        id: 'Test Controller',
        index: 0,
        axes: [0, 0, 0, 0],
        buttons: Array(16).fill({ pressed: false })
      };
      gamepadConnectHandlers[0]({ gamepad: mockGamepad });
    });

    test('L button (button 4) should reset controls', () => {
      // First set some non-zero controls
      controls.setThrottle(1.0);
      controls.setPitch(0.5);
      controls.setYaw(-0.3);
      controls.setRoll(0.7);
      
      // Create gamepad state with L button pressed
      const mockGamepad = {
        axes: [0, 0, 0, 0],
        buttons: Array(16).fill({ pressed: false }),
        id: 'Test Controller'
      };
      mockGamepad.buttons[4] = { pressed: true }; // L button pressed
      
      controls.state.gamepad = mockGamepad;
      controls.handleGamepadInput();
      
      // Verify all controls are reset to zero
      const state = controls.getControls();
      expect(state.throttle).toBe(0);
      expect(state.pitch).toBe(0);
      expect(state.yaw).toBe(0);
      expect(state.roll).toBe(0);
      expect(state.hover).toBe(false);
    });

    test('R button (button 5) should toggle hover mode', () => {
      // Create gamepad state with R button pressed
      const mockGamepad = {
        axes: [0, 0, 0, 0],
        buttons: Array(16).fill({ pressed: false }),
        id: 'Test Controller'
      };
      mockGamepad.buttons[5] = { pressed: true }; // R button pressed
      
      // Initial state
      let state = controls.getControls();
      expect(state.hover).toBe(false);
      
      // Press R button
      controls.state.gamepad = mockGamepad;
      controls.handleGamepadInput();
      state = controls.getControls();
      expect(state.hover).toBe(true);
      
      // Release and press R button again
      mockGamepad.buttons[5] = { pressed: false };
      controls.handleGamepadInput();
      mockGamepad.buttons[5] = { pressed: true };
      controls.handleGamepadInput();
      state = controls.getControls();
      expect(state.hover).toBe(false);
    });
  });

  describe('Browser Input Flow', () => {
    let mockPhysicsDemo;
    
    beforeEach(() => {
      // Create a minimal mock of PhysicsDemo that matches the real implementation
      mockPhysicsDemo = {
        controls: controls,
        setRoll: function(value) {
          this.controls.setRoll(value);
        },
        setThrottle: function(value) {
          this.controls.setThrottle(value);
        },
        setPitch: function(value) {
          this.controls.setPitch(value);
        },
        setYaw: function(value) {
          this.controls.setYaw(value);
        }
      };
    });

    test('keyboard roll inputs should flow correctly through PhysicsDemo', () => {
      // Simulate keyboard events as they would come from the browser
      const rollLeftEvent = new Event('keydown');
      rollLeftEvent.key = 'j';  // Roll left key
      
      const rollRightEvent = new Event('keydown');
      rollRightEvent.key = 'l';  // Roll right key
      
      const releaseEvent = new Event('keyup');
      releaseEvent.key = 'j';

      // Simulate the exact handler from physics_demo.js
      function handleKeyDown(event) {
        switch(event.key) {
          case 'j': // Roll left
            mockPhysicsDemo.setRoll(1.0);
            break;
          case 'l': // Roll right
            mockPhysicsDemo.setRoll(-1.0);
            break;
        }
      }

      function handleKeyUp(event) {
        switch(event.key) {
          case 'j':
          case 'l':
            mockPhysicsDemo.setRoll(0);
            break;
        }
      }

      // Test roll left
      handleKeyDown(rollLeftEvent);
      let state = controls.getControls();
      expect(state.roll).toBe(1.0); // Should be positive for left roll

      // Test roll right
      handleKeyDown(rollRightEvent);
      state = controls.getControls();
      expect(state.roll).toBe(-1.0); // Should be negative for right roll

      // Test release
      handleKeyUp(releaseEvent);
      state = controls.getControls();
      expect(state.roll).toBe(0); // Should reset to zero
    });

    test('gamepad roll inputs should flow correctly through PhysicsDemo', () => {
      // Mock the gamepad API input as it would come from the browser
      const mockGamepad = {
        axes: [0, 0, 1, 0], // Right stick X at 1 (right)
        buttons: Array(16).fill({ pressed: false }),
        id: 'Test Controller',
        index: 0
      };

      // Connect gamepad
      gamepadConnectHandlers[0]({ gamepad: mockGamepad });
      
      // Update gamepad state as PhysicsDemo would
      controls.state.gamepad = mockGamepad;
      controls.handleGamepadInput();

      // Verify the flow through controls to final state
      const state = controls.getControls();
      const diagnostics = controls.getDiagnostics();
      
      expect(state.roll).toBe(1.0); // Right on stick = roll left = positive
      expect(diagnostics.debugState.rawInputs.rightStick.x).toBe(1);
      expect(diagnostics.debugState.processedControls.roll).toBe(1.0);
    });
  });
}); 