/**
 * Backflip Analysis Script
 * 
 * Analyzes recorded backflip maneuver data to validate proper execution
 * and identify potential issues in the physics or rendering.
 */

/**
 * Analyzes a backflip recording to determine if it was executed correctly
 * @param {Object|string} recordingData - Either the parsed JSON object or a string containing JSON data
 * @returns {Object} Analysis results
 */
export function analyzeBackflip(recordingData) {
  // Parse JSON if a string was provided
  let data;
  try {
    data = typeof recordingData === 'string' ? JSON.parse(recordingData) : recordingData;
  } catch (error) {
    return {
      success: false,
      error: 'Invalid JSON format',
      details: error.message
    };
  }
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {
      success: false,
      error: 'Invalid recording data',
      details: 'Recording data is empty or in an invalid format'
    };
  }
  
  // Initialize analysis results
  const results = {
    success: true,
    maneuverDetected: false,
    duration: data[data.length - 1].timestamp,
    frameCount: data.length,
    completionPercentage: 0,
    maxPitch: 0,
    maxRollDeviation: 0,
    maxYawDeviation: 0,
    averagePitch: 0,
    averageRoll: 0,
    averageYaw: 0,
    orientationTransitions: [],
    orientationData: {
      pitchSamples: [],
      rollSamples: [],
      yawSamples: []
    },
    issues: [],
    keyFrames: {},
    isStaticRecording: true,  // Default assumption until proven otherwise
    orientationChangeDetected: false
  };
  
  // Validate required fields and structure in data
  for (let i = 0; i < Math.min(data.length, 10); i++) {
    const frame = data[i];
    if (!frame.physics || !frame.physics.up || !frame.physics.position) {
      results.issues.push({
        type: 'missing_data',
        severity: 'high',
        description: `Frame ${i} is missing required physics data`
      });
      results.success = false;
      return results;
    }
  }
  
  // Extract vectors and orientation data for each frame
  const orientationData = data.map(frame => ({
    timestamp: frame.timestamp,
    frameIndex: frame.frameIndex,
    up: frame.physics.up,
    forward: frame.physics.forward,
    pitch: frame.physics.pitch || 0,
    roll: frame.physics.roll || 0,
    yaw: frame.physics.yaw || 0,
    position: frame.physics.position,
    quaternion: frame.physics.quaternion
  }));
  
  // Check if there's any significant orientation change to detect a static recording
  let upVectorChangeDetected = false;
  let orientationChangeCount = 0;
  let prevUp = orientationData[0].up;
  
  // Calculate pitch, roll, and yaw statistics
  let totalPitch = 0;
  let totalRoll = 0;
  let totalYaw = 0;
  let pitchSampleCount = 0;
  let rollSampleCount = 0;
  let yawSampleCount = 0;
  
  for (let i = 1; i < orientationData.length; i++) {
    const frame = orientationData[i];
    const upVector = frame.up;
    const prevUpVector = orientationData[i-1].up;
    
    // Check for meaningful changes in up vector
    const upVectorDiff = Math.sqrt(
      Math.pow(upVector.x - prevUpVector.x, 2) +
      Math.pow(upVector.y - prevUpVector.y, 2) +
      Math.pow(upVector.z - prevUpVector.z, 2)
    );
    
    if (upVectorDiff > 0.05) {
      upVectorChangeDetected = true;
      orientationChangeCount++;
    }
    
    // Track pitch, roll, and yaw
    if (frame.pitch !== null && !isNaN(frame.pitch)) {
      results.maxPitch = Math.max(results.maxPitch, Math.abs(frame.pitch));
      results.orientationData.pitchSamples.push(frame.pitch);
      totalPitch += frame.pitch;
      pitchSampleCount++;
    }
    
    if (frame.roll !== null && !isNaN(frame.roll)) {
      results.maxRollDeviation = Math.max(results.maxRollDeviation, Math.abs(frame.roll));
      results.orientationData.rollSamples.push(frame.roll);
      totalRoll += frame.roll;
      rollSampleCount++;
    }
    
    if (frame.yaw !== null && !isNaN(frame.yaw)) {
      results.maxYawDeviation = Math.max(results.maxYawDeviation, Math.abs(frame.yaw));
      results.orientationData.yawSamples.push(frame.yaw);
      totalYaw += frame.yaw;
      yawSampleCount++;
    }
    
    prevUp = upVector;
  }
  
  // Calculate averages
  results.averagePitch = pitchSampleCount > 0 ? totalPitch / pitchSampleCount : 0;
  results.averageRoll = rollSampleCount > 0 ? totalRoll / rollSampleCount : 0;
  results.averageYaw = yawSampleCount > 0 ? totalYaw / yawSampleCount : 0;
  
  // Determine if this is a static recording (no significant orientation changes)
  results.isStaticRecording = !upVectorChangeDetected || orientationChangeCount < 5;
  results.orientationChangeDetected = upVectorChangeDetected;
  
  // If recording is static, mark as failed and return early
  if (results.isStaticRecording) {
    results.success = false;
    results.maneuverDetected = false;
    results.completionPercentage = 0;
    results.issues.push({
      type: 'static_recording',
      severity: 'high',
      description: 'No significant orientation changes detected in the recording'
    });
    return results;
  }
  
  // Enhanced phase detection for the backflip
  let pitchUpStart = -1;
  let invertedPosition = -1;
  let pitchDownStart = -1;
  let recoveryStart = -1;
  
  // Analyze frame by frame with improved detection
  for (let i = 1; i < orientationData.length; i++) {
    const frame = orientationData[i];
    const upY = frame.up.y;
    const upZ = frame.up.z;
    const time = frame.timestamp;
    
    // Detect state transitions with more precise conditions
    // Pitch up start: Up vector starts tilting back (y decreases, z increases)
    if (pitchUpStart === -1 && 
        upY < 0.95 && upY > 0.7 && 
        upZ > 0.05 && 
        i > 5) { // Avoid false detection at start
      pitchUpStart = i;
      results.orientationTransitions.push({
        phase: 'pitch_up_start',
        timestamp: time,
        frameIndex: i
      });
      results.keyFrames.pitchUpStart = data[i];
    }
    
    // Inverted position: Up vector is pointing down (y becomes negative)
    if (pitchUpStart !== -1 && 
        invertedPosition === -1 && 
        upY < -0.5) {
      invertedPosition = i;
      results.orientationTransitions.push({
        phase: 'inverted',
        timestamp: time,
        frameIndex: i
      });
      results.keyFrames.inverted = data[i];
    }
    
    // Pitch down start: Up vector still pointing down but moving forward (z becomes negative)
    if (invertedPosition !== -1 && 
        pitchDownStart === -1 && 
        upY < 0 && upZ < -0.1) {
      pitchDownStart = i;
      results.orientationTransitions.push({
        phase: 'pitch_down',
        timestamp: time,
        frameIndex: i
      });
      results.keyFrames.pitchDown = data[i];
    }
    
    // Recovery: Up vector returning to normal (y becomes positive again)
    if (pitchDownStart !== -1 && 
        recoveryStart === -1 && 
        upY > 0.5 && Math.abs(upZ) < 0.5) {
      recoveryStart = i;
      results.orientationTransitions.push({
        phase: 'recovery',
        timestamp: time,
        frameIndex: i
      });
      results.keyFrames.recovery = data[i];
    }
  }
  
  // Determine if a complete backflip was detected
  const phaseDetected = {
    pitchUp: pitchUpStart !== -1,
    inverted: invertedPosition !== -1,
    pitchDown: pitchDownStart !== -1,
    recovery: recoveryStart !== -1
  };
  
  results.maneuverDetected = phaseDetected.pitchUp && 
                             phaseDetected.inverted && 
                             phaseDetected.pitchDown && 
                             phaseDetected.recovery;
  
  // Calculate completion percentage with more granularity
  if (results.maneuverDetected) {
    results.completionPercentage = 100;
  } else {
    let completionPoints = 0;
    let totalPoints = 0;
    
    // Weight each phase
    if (phaseDetected.pitchUp) completionPoints += 25;
    totalPoints += 25;
    
    if (phaseDetected.inverted) completionPoints += 30;
    totalPoints += 30;
    
    if (phaseDetected.pitchDown) completionPoints += 25;
    totalPoints += 25;
    
    if (phaseDetected.recovery) completionPoints += 20;
    totalPoints += 20;
    
    results.completionPercentage = totalPoints > 0 ? Math.round((completionPoints / totalPoints) * 100) : 0;
  }
  
  // Analyze control inputs to check if a backflip was intentionally attempted
  let hasPitchInput = false;
  for (const frame of data) {
    if (frame.physics.pitch !== 0 && frame.physics.pitch !== null) {
      hasPitchInput = true;
      break;
    }
  }
  
  // If no pitch input was detected, note this as an issue
  if (!hasPitchInput) {
    results.issues.push({
      type: 'no_pitch_input',
      severity: 'high',
      description: 'No pitch control input detected. A backflip requires pitch input.'
    });
  }
  
  // Identify issues
  if (!results.maneuverDetected) {
    results.success = false;
    results.issues.push({
      type: 'incomplete_backflip',
      severity: 'high',
      description: `Backflip was incomplete (${results.completionPercentage}% completion)`
    });
    
    // Add more specific issues for missing phases
    if (!phaseDetected.pitchUp) {
      results.issues.push({
        type: 'missing_pitch_up',
        severity: 'medium',
        description: 'Initial pitch up phase not detected'
      });
    }
    
    if (!phaseDetected.inverted) {
      results.issues.push({
        type: 'missing_inversion',
        severity: 'medium',
        description: 'Drone did not reach inverted position'
      });
    }
    
    if (!phaseDetected.pitchDown) {
      results.issues.push({
        type: 'missing_pitch_down',
        severity: 'medium',
        description: 'Pitch down phase after inversion not detected'
      });
    }
    
    if (!phaseDetected.recovery) {
      results.issues.push({
        type: 'missing_recovery',
        severity: 'medium',
        description: 'Recovery phase not detected'
      });
    }
  }
  
  if (results.maxRollDeviation > 0.3) {
    results.issues.push({
      type: 'excessive_roll',
      severity: 'medium',
      description: `Excessive roll detected during backflip (${results.maxRollDeviation.toFixed(2)})`
    });
  }
  
  if (results.maxYawDeviation > 0.3 && results.maxYawDeviation !== null) {
    results.issues.push({
      type: 'excessive_yaw',
      severity: 'medium',
      description: `Excessive yaw detected during backflip (${results.maxYawDeviation.toFixed(2)})`
    });
  }
  
  // Check for quaternion discontinuities
  let maxQuaternionJump = 0;
  let jumpFrame = null;
  
  for (let i = 1; i < data.length; i++) {
    const prev = data[i-1];
    const curr = data[i];
    
    if (!prev.physics.quaternion || !curr.physics.quaternion) continue;
    
    // Calculate quaternion dot product to detect sudden jumps
    const quatDot = Math.abs(
      prev.physics.quaternion.x * curr.physics.quaternion.x +
      prev.physics.quaternion.y * curr.physics.quaternion.y +
      prev.physics.quaternion.z * curr.physics.quaternion.z +
      prev.physics.quaternion.w * curr.physics.quaternion.w
    );
    
    const quatJump = Math.acos(Math.min(1, quatDot)) * 2 * (180 / Math.PI);
    
    if (quatJump > maxQuaternionJump) {
      maxQuaternionJump = quatJump;
      jumpFrame = i;
    }
  }
  
  // Add issue if quaternion jump is too large
  if (maxQuaternionJump > 45) {
    results.issues.push({
      type: 'quaternion_discontinuity',
      severity: 'high',
      description: `Large quaternion jump detected (${maxQuaternionJump.toFixed(2)}° at frame ${jumpFrame})`,
      frameIndex: jumpFrame
    });
  }
  
  return results;
}

/**
 * Loads a backflip recording from JSON file and runs analysis
 * @param {string} jsonFilePath - Path to the JSON file
 * @returns {Promise<Object>} Analysis results
 */
export async function loadAndAnalyzeBackflip(jsonFilePath) {
  try {
    const response = await fetch(jsonFilePath);
    const jsonData = await response.json();
    return analyzeBackflip(jsonData);
  } catch (error) {
    return {
      success: false,
      error: 'Failed to load or parse recording file',
      details: error.message
    };
  }
}

/**
 * Visualizes key frames from the backflip analysis
 * @param {Object} analysis - The analysis results from analyzeBackflip
 * @param {HTMLElement} container - Container element to render visualization
 */
export function visualizeBackflip(analysis, container) {
  if (!analysis || !analysis.keyFrames || !container) {
    console.error('Invalid analysis data or container for visualization');
    return;
  }
  
  // Clear container
  container.innerHTML = '';
  
  // Create header
  const header = document.createElement('h3');
  header.textContent = 'Backflip Visualization';
  container.appendChild(header);
  
  // Create status display
  const status = document.createElement('div');
  status.className = analysis.success ? 'success' : 'error';
  status.textContent = analysis.success 
    ? 'Backflip successfully executed' 
    : `Backflip issues detected (${analysis.completionPercentage}% complete)`;
  container.appendChild(status);
  
  // Add key phases visualization
  const phases = [
    { key: 'pitchUpStart', label: 'Pitch Up' },
    { key: 'inverted', label: 'Inverted' },
    { key: 'pitchDown', label: 'Pitch Down' },
    { key: 'recovery', label: 'Recovery' }
  ];
  
  const phasesContainer = document.createElement('div');
  phasesContainer.className = 'phases-container';
  
  phases.forEach(phase => {
    const phaseEl = document.createElement('div');
    phaseEl.className = `phase ${analysis.keyFrames[phase.key] ? 'completed' : 'missing'}`;
    
    const icon = document.createElement('div');
    icon.className = 'phase-icon';
    icon.textContent = analysis.keyFrames[phase.key] ? '✓' : '✗';
    
    const label = document.createElement('div');
    label.className = 'phase-label';
    label.textContent = phase.label;
    
    phaseEl.appendChild(icon);
    phaseEl.appendChild(label);
    phasesContainer.appendChild(phaseEl);
  });
  
  container.appendChild(phasesContainer);
  
  // Add issues section if issues exist
  if (analysis.issues && analysis.issues.length > 0) {
    const issuesHeader = document.createElement('h4');
    issuesHeader.textContent = 'Issues Detected';
    container.appendChild(issuesHeader);
    
    const issueList = document.createElement('ul');
    issueList.className = 'issues-list';
    
    analysis.issues.forEach(issue => {
      const issueItem = document.createElement('li');
      issueItem.className = `issue ${issue.severity}`;
      issueItem.textContent = issue.description;
      issueList.appendChild(issueItem);
    });
    
    container.appendChild(issueList);
  }
  
  // Add orientation data visualization if available
  if (analysis.orientationData) {
    const orientationHeader = document.createElement('h4');
    orientationHeader.textContent = 'Orientation Data';
    container.appendChild(orientationHeader);
    
    const stats = document.createElement('div');
    stats.className = 'orientation-stats';
    stats.innerHTML = `
      <div>Max Pitch: ${analysis.maxPitch.toFixed(2)}</div>
      <div>Max Roll: ${analysis.maxRollDeviation.toFixed(2)}</div>
      <div>Max Yaw: ${analysis.maxYawDeviation.toFixed(2)}</div>
    `;
    container.appendChild(stats);
    
    // TODO: Add canvas-based visualization of orientation data over time
  }
} 