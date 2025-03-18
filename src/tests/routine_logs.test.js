import { DronePhysics } from '../physics.js';

describe('Routine Log Analysis', () => {
  let logs;
  let physics;

  beforeEach(() => {
    // Create a new physics instance for reference
    physics = new DronePhysics();
    logs = [];
  });

  // Helper function to create a log entry
  const createLogEntry = (timestamp, position, rotation, controls, step) => ({
    timestamp,
    position,
    rotation,
    controls,
    currentStep: step
  });

  // Helper function to analyze logs
  const analyzeLogs = (logs) => {
    const analysis = {
      steps: {},
      transitions: [],
      maxHeight: 0,
      maxTilt: 0,
      controlRanges: {
        throttle: { min: 0, max: 0 },
        pitch: { min: 0, max: 0 },
        roll: { min: 0, max: 0 },
        yaw: { min: 0, max: 0 }
      }
    };

    logs.forEach((log, index) => {
      // Track step durations
      if (!analysis.steps[log.currentStep]) {
        analysis.steps[log.currentStep] = {
          startTime: log.timestamp,
          endTime: log.timestamp,
          duration: 0
        };
      } else {
        analysis.steps[log.currentStep].endTime = log.timestamp;
        analysis.steps[log.currentStep].duration = 
          log.timestamp - analysis.steps[log.currentStep].startTime;
      }

      // Track transitions between steps
      if (index > 0 && logs[index - 1].currentStep !== log.currentStep) {
        analysis.transitions.push({
          from: logs[index - 1].currentStep,
          to: log.currentStep,
          timestamp: log.timestamp
        });
      }

      // Track maximum height and tilt
      analysis.maxHeight = Math.max(analysis.maxHeight, parseFloat(log.position.y));
      analysis.maxTilt = Math.max(
        analysis.maxTilt,
        Math.abs(parseFloat(log.rotation.x)),
        Math.abs(parseFloat(log.rotation.z))
      );

      // Track control ranges
      const controls = log.controls;
      analysis.controlRanges.throttle.max = Math.max(
        analysis.controlRanges.throttle.max,
        parseFloat(controls.throttle)
      );
      analysis.controlRanges.pitch.max = Math.max(
        analysis.controlRanges.pitch.max,
        Math.abs(parseFloat(controls.pitch))
      );
      analysis.controlRanges.roll.max = Math.max(
        analysis.controlRanges.roll.max,
        Math.abs(parseFloat(controls.roll))
      );
      analysis.controlRanges.yaw.max = Math.max(
        analysis.controlRanges.yaw.max,
        Math.abs(parseFloat(controls.yaw))
      );
    });

    return analysis;
  };

  test('should verify takeoff behavior', () => {
    // Simulate takeoff logs
    for (let i = 0; i < 20; i++) {
      logs.push(createLogEntry(
        i * 100,
        { x: '0.00', y: (10 + i * 0.5).toFixed(2), z: '0.00' },
        { x: '0.00', y: '0.00', z: '0.00' },
        { throttle: '1.00', pitch: '0.00', roll: '0.00', yaw: '0.00' },
        'Takeoff'
      ));
    }

    const analysis = analyzeLogs(logs);
    const takeoffStep = analysis.steps['Takeoff'];

    // Verify takeoff behavior
    expect(takeoffStep.duration).toBeGreaterThanOrEqual(1900); // Should be ~2 seconds
    expect(analysis.maxHeight).toBeGreaterThan(10); // Should rise above starting height
    expect(analysis.controlRanges.throttle.max).toBe(1.0); // Full throttle
  });

  test('should verify hover behavior', () => {
    // Simulate hover logs
    for (let i = 0; i < 20; i++) {
      logs.push(createLogEntry(
        i * 100,
        { x: '0.00', y: '15.00', z: '0.00' },
        { x: '0.00', y: '0.00', z: '0.00' },
        { throttle: '0.50', pitch: '0.00', roll: '0.00', yaw: '0.00' },
        'Hover'
      ));
    }

    const analysis = analyzeLogs(logs);
    const hoverStep = analysis.steps['Hover'];

    // Verify hover behavior
    expect(hoverStep.duration).toBeGreaterThanOrEqual(1900); // Should be ~2 seconds
    expect(analysis.maxTilt).toBeLessThan(0.1); // Should maintain stable orientation
  });

  test('should verify forward movement', () => {
    // Simulate forward movement logs
    for (let i = 0; i < 20; i++) {
      logs.push(createLogEntry(
        i * 100,
        { x: (i * 0.5).toFixed(2), y: '15.00', z: '0.00' },
        { x: '0.50', y: '0.00', z: '0.00' },
        { throttle: '0.50', pitch: '1.00', roll: '0.00', yaw: '0.00' },
        'Forward'
      ));
    }

    const analysis = analyzeLogs(logs);
    const forwardStep = analysis.steps['Forward'];

    // Verify forward movement
    expect(forwardStep.duration).toBeGreaterThanOrEqual(1900); // Should be ~2 seconds
    expect(analysis.controlRanges.pitch.max).toBe(1.0); // Full forward pitch
    expect(parseFloat(logs[logs.length - 1].position.x)).toBeGreaterThan(0); // Should move forward
  });

  test('should verify complete routine sequence', () => {
    // Simulate a complete routine sequence
    const steps = [
      'Takeoff', 'Hover', 'Forward', 'Backward', 'Left', 'Right',
      'Rotate Left', 'Rotate Right', 'Land', 'Reset'
    ];

    steps.forEach((step, stepIndex) => {
      for (let i = 0; i < 20; i++) {
        logs.push(createLogEntry(
          (stepIndex * 20 + i) * 100,
          { x: '0.00', y: '15.00', z: '0.00' },
          { x: '0.00', y: '0.00', z: '0.00' },
          { throttle: '0.50', pitch: '0.00', roll: '0.00', yaw: '0.00' },
          step
        ));
      }
    });

    const analysis = analyzeLogs(logs);

    // Verify routine sequence
    expect(analysis.transitions.length).toBe(steps.length - 1); // Should have transitions between all steps
    expect(Object.keys(analysis.steps).length).toBe(steps.length); // Should have all steps
    steps.forEach(step => {
      expect(analysis.steps[step].duration).toBeGreaterThanOrEqual(1900); // Each step ~2 seconds
    });
  });
}); 