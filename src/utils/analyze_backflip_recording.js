/**
 * Command-line script to analyze backflip recording files
 * Usage: node analyze_backflip_recording.js <path-to-recording.json> [--output pretty.json]
 */

import fs from 'fs';
import path from 'path';
import { analyzeBackflip } from './backflip_analyzer.js';

// Function to print colorized text to the console
function colorize(text, color) {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  };
  
  return `${colors[color] || ''}${text}${colors.reset}`;
}

/**
 * Fixes and parses potentially malformed JSON
 * @param {string} jsonString - The raw JSON string to parse
 * @returns {Object} The parsed JSON data
 */
function parseJSON(jsonString) {
  try {
    // First try direct parsing
    return JSON.parse(jsonString);
  } catch (error) {
    console.log(colorize('Warning: Initial JSON parsing failed, attempting to fix...', 'yellow'));
    
    // Try to fix common JSON issues
    let fixedString = jsonString.trim();
    
    // Fix missing opening bracket
    if (!fixedString.startsWith('[') && !fixedString.startsWith('{')) {
      fixedString = '[' + fixedString;
    }
    
    // Fix missing closing bracket
    if (!fixedString.endsWith(']') && !fixedString.endsWith('}')) {
      fixedString = fixedString.replace(/\}\%$/, '}]');
      fixedString = fixedString.replace(/\}$/, '}]');
    }
    
    try {
      return JSON.parse(fixedString);
    } catch (e) {
      throw new Error(`Failed to parse JSON after attempted fixes: ${e.message}`);
    }
  }
}

/**
 * Analyzes the velocity and position data from the recording
 * @param {Array} data - The parsed recording data
 * @returns {Object} Velocity and position analysis
 */
function analyzeMotion(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { error: 'Invalid data for motion analysis' };
  }
  
  const results = {
    maxHeight: 0,
    maxVerticalVelocity: 0,
    maxHorizontalVelocity: 0,
    heightChange: 0,
    positionDeviation: { x: 0, z: 0 },
    initialPosition: { ...data[0].physics.position },
    finalPosition: { ...data[data.length - 1].physics.position }
  };
  
  // Track position and calculate velocities
  let prevPos = data[0].physics.position;
  let prevTime = data[0].timestamp;
  
  for (let i = 1; i < data.length; i++) {
    const frame = data[i];
    const pos = frame.physics.position;
    const time = frame.timestamp;
    const deltaTime = time - prevTime;
    
    // Skip frames with no time difference to avoid division by zero
    if (deltaTime === 0) continue;
    
    // Calculate velocities
    const verticalVelocity = Math.abs((pos.y - prevPos.y) / deltaTime);
    const horizontalVelocity = Math.sqrt(
      Math.pow((pos.x - prevPos.x) / deltaTime, 2) + 
      Math.pow((pos.z - prevPos.z) / deltaTime, 2)
    );
    
    // Track maximum values
    results.maxHeight = Math.max(results.maxHeight, pos.y);
    results.maxVerticalVelocity = Math.max(results.maxVerticalVelocity, verticalVelocity);
    results.maxHorizontalVelocity = Math.max(results.maxHorizontalVelocity, horizontalVelocity);
    
    // Track position deviation from start
    results.positionDeviation.x = Math.max(
      results.positionDeviation.x, 
      Math.abs(pos.x - results.initialPosition.x)
    );
    results.positionDeviation.z = Math.max(
      results.positionDeviation.z, 
      Math.abs(pos.z - results.initialPosition.z)
    );
    
    prevPos = pos;
    prevTime = time;
  }
  
  // Calculate overall height change
  results.heightChange = results.finalPosition.y - results.initialPosition.y;
  
  return results;
}

/**
 * Analyzes quaternion data for the backflip
 * @param {Array} data - The parsed recording data
 * @returns {Object} Quaternion analysis
 */
function analyzeQuaternions(data) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { error: 'Invalid data for quaternion analysis' };
  }
  
  const results = {
    physicsQuaternionChanges: 0,
    renderQuaternionChanges: 0,
    maxDiscrepancy: 0,
    discrepancyFrames: []
  };
  
  for (let i = 1; i < data.length; i++) {
    const prev = data[i-1];
    const curr = data[i];
    
    // Check for quaternion changes in physics
    if (!quaternionsEqual(prev.physics.quaternion, curr.physics.quaternion)) {
      results.physicsQuaternionChanges++;
    }
    
    // Check for quaternion changes in render
    if (!quaternionsEqual(prev.render.quaternion, curr.render.quaternion)) {
      results.renderQuaternionChanges++;
    }
    
    // Calculate discrepancy between physics and render quaternions
    const discrepancy = quaternionDiscrepancy(curr.physics.quaternion, curr.render.quaternion);
    
    if (discrepancy > results.maxDiscrepancy) {
      results.maxDiscrepancy = discrepancy;
    }
    
    // Track significant discrepancies
    if (discrepancy > 0.1) {
      results.discrepancyFrames.push({
        frameIndex: i,
        timestamp: curr.timestamp,
        discrepancy
      });
    }
  }
  
  return results;
}

/**
 * Compares two quaternions for equality
 * @param {Object} q1 - First quaternion
 * @param {Object} q2 - Second quaternion
 * @returns {boolean} Whether quaternions are equal
 */
function quaternionsEqual(q1, q2) {
  const threshold = 0.000001;
  return (
    Math.abs(q1.x - q2.x) < threshold &&
    Math.abs(q1.y - q2.y) < threshold &&
    Math.abs(q1.z - q2.z) < threshold &&
    Math.abs(q1.w - q2.w) < threshold
  );
}

/**
 * Calculates discrepancy between two quaternions (0-1 scale)
 * @param {Object} q1 - First quaternion
 * @param {Object} q2 - Second quaternion
 * @returns {number} Discrepancy value (0 = identical, 1 = opposite)
 */
function quaternionDiscrepancy(q1, q2) {
  // Calculate dot product
  const dot = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;
  // Return normalized discrepancy (1 - |dot|)
  return 1 - Math.abs(dot);
}

// Main function
async function main() {
  // Get the file path from command line arguments
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(colorize('Error: No recording file specified', 'red'));
    console.log('Usage: node analyze_backflip_recording.js <path-to-recording.json> [--output pretty.json]');
    process.exit(1);
  }
  
  const filePath = args[0];
  let outputPath = null;
  
  // Check for output flag
  const outputIndex = args.indexOf('--output');
  if (outputIndex !== -1 && args.length > outputIndex + 1) {
    outputPath = args[outputIndex + 1];
  }
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(colorize(`Error: File not found: ${filePath}`, 'red'));
    process.exit(1);
  }
  
  try {
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse the JSON with robust error handling
    const recordingData = parseJSON(fileContent);
    
    // Save prettified JSON if output path specified
    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(recordingData, null, 2), 'utf8');
      console.log(colorize(`Saved pretty-printed JSON to: ${outputPath}`, 'green'));
    }
    
    // Analyze the recording
    const analysis = analyzeBackflip(recordingData);
    
    // Analyze motion data
    const motionAnalysis = analyzeMotion(recordingData);
    
    // Analyze quaternion data
    const quaternionAnalysis = analyzeQuaternions(recordingData);
    
    // Print results
    console.log(colorize('\n===== BACKFLIP ANALYSIS RESULTS =====\n', 'cyan'));
    
    // Print overall status
    if (analysis.success) {
      console.log(colorize('✓ BACKFLIP SUCCESSFULLY EXECUTED', 'green'));
    } else {
      console.log(colorize(`✗ BACKFLIP ISSUES DETECTED (${analysis.completionPercentage}% complete)`, 'red'));
    }
    
    console.log(colorize('\n----- Recording Information -----', 'cyan'));
    console.log(`Duration: ${analysis.duration.toFixed(2)} seconds`);
    console.log(`Frame Count: ${analysis.frameCount}`);
    console.log(`Frames Per Second: ${(analysis.frameCount / analysis.duration).toFixed(2)}`);
    
    // Print phase transitions
    console.log(colorize('\n----- Backflip Phases -----', 'cyan'));
    const phases = [
      { name: 'Pitch Up Start', key: 'pitch_up_start' },
      { name: 'Inverted Position', key: 'inverted' },
      { name: 'Pitch Down', key: 'pitch_down' },
      { name: 'Recovery', key: 'recovery' }
    ];
    
    phases.forEach(phase => {
      const transition = analysis.orientationTransitions.find(t => t.phase === phase.key);
      
      if (transition) {
        console.log(`${colorize('✓', 'green')} ${phase.name}: Detected at ${transition.timestamp.toFixed(2)}s (frame ${transition.frameIndex})`);
      } else {
        console.log(`${colorize('✗', 'red')} ${phase.name}: Not detected`);
      }
    });
    
    // Print orientation stats
    console.log(colorize('\n----- Orientation Stats -----', 'cyan'));
    console.log(`Max Pitch: ${analysis.maxPitch.toFixed(2)}`);
    console.log(`Max Roll Deviation: ${analysis.maxRollDeviation.toFixed(2)}`);
    console.log(`Max Yaw Deviation: ${analysis.maxYawDeviation.toFixed(2)}`);
    
    // Print motion stats
    console.log(colorize('\n----- Motion Stats -----', 'cyan'));
    console.log(`Max Height: ${motionAnalysis.maxHeight.toFixed(2)}`);
    console.log(`Max Vertical Velocity: ${motionAnalysis.maxVerticalVelocity.toFixed(2)} units/s`);
    console.log(`Max Horizontal Velocity: ${motionAnalysis.maxHorizontalVelocity.toFixed(2)} units/s`);
    console.log(`Height Change: ${motionAnalysis.heightChange.toFixed(2)} units`);
    console.log(`Position Deviation X: ${motionAnalysis.positionDeviation.x.toFixed(2)} units`);
    console.log(`Position Deviation Z: ${motionAnalysis.positionDeviation.z.toFixed(2)} units`);
    
    // Print quaternion stats
    console.log(colorize('\n----- Quaternion Stats -----', 'cyan'));
    console.log(`Physics Quaternion Changes: ${quaternionAnalysis.physicsQuaternionChanges}`);
    console.log(`Render Quaternion Changes: ${quaternionAnalysis.renderQuaternionChanges}`);
    console.log(`Max Physics/Render Discrepancy: ${quaternionAnalysis.maxDiscrepancy.toFixed(4)}`);
    
    if (quaternionAnalysis.discrepancyFrames.length > 0) {
      console.log(`Significant Discrepancies: ${quaternionAnalysis.discrepancyFrames.length} frames`);
      if (quaternionAnalysis.discrepancyFrames.length <= 5) {
        quaternionAnalysis.discrepancyFrames.forEach(frame => {
          console.log(`  - Frame ${frame.frameIndex} (${frame.timestamp.toFixed(2)}s): ${frame.discrepancy.toFixed(4)}`);
        });
      }
    } else {
      console.log(`Significant Discrepancies: None`);
    }
    
    // Print control input analysis
    console.log(colorize('\n----- Control Input Analysis -----', 'cyan'));
    let hasPitchInput = false;
    let hasRollInput = false;
    let hasYawInput = false;
    let hasThrottleChanges = false;
    
    // Sample frames to check for control inputs
    for (let i = 0; i < recordingData.length; i++) {
      const frame = recordingData[i];
      if (frame.physics.pitch !== 0) hasPitchInput = true;
      if (frame.physics.roll !== 0) hasRollInput = true;
      if (frame.physics.yaw !== 0 && frame.physics.yaw !== null) hasYawInput = true;
      if (frame.physics.throttle !== 1) hasThrottleChanges = true;
    }
    
    console.log(`Pitch Input: ${hasPitchInput ? colorize('Yes', 'green') : colorize('No', 'red')}`);
    console.log(`Roll Input: ${hasRollInput ? colorize('Yes', 'green') : colorize('No', 'red')}`);
    console.log(`Yaw Input: ${hasYawInput ? colorize('Yes', 'green') : colorize('No', 'red')}`);
    console.log(`Throttle Changes: ${hasThrottleChanges ? colorize('Yes', 'green') : colorize('No', 'red')}`);
    
    // Print issues
    if (analysis.issues.length > 0) {
      console.log(colorize('\n----- Issues Detected -----', 'yellow'));
      analysis.issues.forEach(issue => {
        const severityColor = {
          high: 'red',
          medium: 'yellow',
          low: 'blue'
        }[issue.severity] || 'white';
        
        console.log(`- ${colorize(issue.description, severityColor)}`);
      });
    }
    
    console.log(colorize('\n===== END OF ANALYSIS =====\n', 'cyan'));
    
  } catch (error) {
    console.error(colorize(`Error analyzing recording: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// Run the main function
main().catch(err => {
  console.error(colorize(`Unhandled error: ${err.message}`, 'red'));
  process.exit(1);
}); 