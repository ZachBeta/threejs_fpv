import { Controls } from '../controls.js';

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
        reset: 4
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
}); 