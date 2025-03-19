import fs from 'fs';

function analyzeLogs(logs) {
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
    },
    issues: []
  };

  logs.forEach((log, index) => {
    // Track step durations
    if (!analysis.steps[log.currentStep]) {
      analysis.steps[log.currentStep] = {
        startTime: log.timestamp,
        endTime: log.timestamp,
        duration: 0,
        position: {
          start: { ...log.position },
          end: { ...log.position }
        }
      };
    } else {
      analysis.steps[log.currentStep].endTime = log.timestamp;
      analysis.steps[log.currentStep].duration = 
        log.timestamp - analysis.steps[log.currentStep].startTime;
      analysis.steps[log.currentStep].position.end = { ...log.position };
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

  // Check for issues
  Object.entries(analysis.steps).forEach(([step, data]) => {
    // Check step duration
    if (data.duration < 1900) {
      analysis.issues.push(`${step} duration too short: ${data.duration}ms`);
    }
    if (data.duration > 2100) {
      analysis.issues.push(`${step} duration too long: ${data.duration}ms`);
    }

    // Check position changes
    const startPos = data.position.start;
    const endPos = data.position.end;
    const distance = Math.sqrt(
      Math.pow(parseFloat(endPos.x) - parseFloat(startPos.x), 2) +
      Math.pow(parseFloat(endPos.y) - parseFloat(startPos.y), 2) +
      Math.pow(parseFloat(endPos.z) - parseFloat(startPos.z), 2)
    );

    // Add position-based checks for specific steps
    switch (step) {
      case 'Takeoff':
        if (parseFloat(endPos.y) <= parseFloat(startPos.y)) {
          analysis.issues.push('Takeoff failed: Drone did not gain height');
        }
        break;
      case 'Forward':
        if (parseFloat(endPos.x) <= parseFloat(startPos.x)) {
          analysis.issues.push('Forward movement failed: Drone did not move forward');
        }
        break;
      case 'Backward':
        if (parseFloat(endPos.x) >= parseFloat(startPos.x)) {
          analysis.issues.push('Backward movement failed: Drone did not move backward');
        }
        break;
      case 'Left':
        if (parseFloat(endPos.z) >= parseFloat(startPos.z)) {
          analysis.issues.push('Left movement failed: Drone did not move left');
        }
        break;
      case 'Right':
        if (parseFloat(endPos.z) <= parseFloat(startPos.z)) {
          analysis.issues.push('Right movement failed: Drone did not move right');
        }
        break;
    }
  });

  return analysis;
}

// Get the log file path from command line argument
const logFile = process.argv[2];
if (!logFile) {
  console.error('Please provide a log file path as an argument');
  process.exit(1);
}

try {
  // Read and parse the log file
  const logData = JSON.parse(fs.readFileSync(logFile, 'utf8'));
  
  // Analyze the logs
  const analysis = analyzeLogs(logData);

  // Print the analysis results
  console.log('\n=== Routine Analysis ===\n');
  
  console.log('Step Durations:');
  Object.entries(analysis.steps).forEach(([step, data]) => {
    console.log(`  ${step}: ${data.duration.toFixed(0)}ms`);
  });

  console.log('\nTransitions:');
  analysis.transitions.forEach(transition => {
    console.log(`  ${transition.from} -> ${transition.to}`);
  });

  console.log('\nMaximum Values:');
  console.log(`  Height: ${analysis.maxHeight.toFixed(2)}`);
  console.log(`  Tilt: ${analysis.maxTilt.toFixed(2)}`);

  console.log('\nControl Ranges:');
  Object.entries(analysis.controlRanges).forEach(([control, range]) => {
    console.log(`  ${control}: ${range.min.toFixed(2)} to ${range.max.toFixed(2)}`);
  });

  if (analysis.issues.length > 0) {
    console.log('\nIssues Found:');
    analysis.issues.forEach(issue => {
      console.log(`  ⚠️  ${issue}`);
    });
  } else {
    console.log('\n✅ No issues found!');
  }

} catch (error) {
  console.error('Error analyzing logs:', error.message);
  process.exit(1);
} 