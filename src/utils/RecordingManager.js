/**
 * RecordingManager.js
 * Centralized recording functionality for drone maneuvers
 */

class RecordingManager {
  constructor() {
    this.isRecording = false;
    this.currentRecording = null;
    this.recordingStartTime = null;
    this.frames = [];
    this.setupUI();
  }

  setupUI() {
    // Create and style container
    this.container = document.createElement('div');
    this.container.className = 'recording-controls';
    this.container.style.position = 'absolute';
    this.container.style.top = '20px';
    this.container.style.right = '20px';
    this.container.style.padding = '10px';
    this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.container.style.borderRadius = '4px';
    this.container.style.zIndex = '1000';

    // Create record button
    this.recordButton = document.createElement('button');
    this.recordButton.className = 'record-button';
    this.recordButton.innerText = 'Record';
    this.recordButton.onclick = () => this.toggleRecording();
    this.container.appendChild(this.recordButton);

    // Create status indicator
    this.statusIndicator = document.createElement('div');
    this.statusIndicator.className = 'recording-status';
    this.statusIndicator.style.display = 'none';
    this.statusIndicator.style.marginTop = '10px';
    this.container.appendChild(this.statusIndicator);

    // Create results area
    this.resultsArea = document.createElement('div');
    this.resultsArea.className = 'recording-results';
    this.resultsArea.style.display = 'none';
    this.resultsArea.style.marginTop = '10px';
    this.resultsArea.style.maxHeight = '200px';
    this.resultsArea.style.overflowY = 'auto';
    this.container.appendChild(this.resultsArea);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .recording-controls button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.3s;
      }
      .record-button {
        background-color: #f44336;
        color: white;
      }
      .record-button.recording {
        background-color: #4CAF50;
      }
      .recording-status {
        color: #ff0000;
        font-weight: bold;
      }
      .recording-results {
        color: white;
        font-size: 14px;
      }
    `;
    document.head.appendChild(style);
  }

  mount(parent) {
    parent.appendChild(this.container);
  }

  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording() {
    this.isRecording = true;
    this.recordingStartTime = performance.now();
    this.frames = [];
    
    // Update UI
    this.recordButton.innerText = 'Stop';
    this.recordButton.classList.add('recording');
    this.statusIndicator.style.display = 'block';
    this.resultsArea.style.display = 'none';
    
    // Start frame collection
    this.updateStatus();
  }

  stopRecording() {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    const duration = (performance.now() - this.recordingStartTime) / 1000;
    
    // Update UI
    this.recordButton.innerText = 'Record';
    this.recordButton.classList.remove('recording');
    this.statusIndicator.style.display = 'none';
    
    // Analyze recording
    this.analyzeRecording(duration);
  }

  recordFrame(frameData) {
    if (!this.isRecording) return;
    
    this.frames.push({
      frameIndex: this.frames.length,
      timestamp: (performance.now() - this.recordingStartTime) / 1000,
      ...frameData
    });
    
    this.updateStatus();
  }

  updateStatus() {
    const duration = ((performance.now() - this.recordingStartTime) / 1000).toFixed(1);
    this.statusIndicator.innerText = `Recording: ${duration}s (${this.frames.length} frames)`;
  }

  async analyzeRecording(duration) {
    this.resultsArea.style.display = 'block';
    this.resultsArea.innerHTML = '<p>Analyzing recording...</p>';

    try {
      const analysis = await this.analyze(this.frames);
      
      // Display results
      this.resultsArea.innerHTML = `
        <h3>Recording Analysis</h3>
        <p>Duration: ${duration.toFixed(1)}s</p>
        <p>Frames: ${this.frames.length}</p>
        <p>Success: ${analysis.success ? '✓' : '✗'}</p>
        <p>Completion: ${analysis.completionPercentage}%</p>
        ${analysis.issues.map(issue => 
          `<p style="color: ${issue.severity === 'high' ? '#ff4444' : '#ffaa44'}">${issue.description}</p>`
        ).join('')}
      `;

      // Add download button
      const downloadButton = document.createElement('button');
      downloadButton.innerText = 'Download Recording';
      downloadButton.onclick = () => this.downloadRecording();
      downloadButton.style.marginTop = '10px';
      downloadButton.style.backgroundColor = '#2196F3';
      this.resultsArea.appendChild(downloadButton);

    } catch (error) {
      this.resultsArea.innerHTML = `<p style="color: #ff4444">Analysis failed: ${error.message}</p>`;
    }
  }

  async analyze(frames) {
    if (!frames || frames.length === 0) {
      throw new Error('No frames to analyze');
    }

    // Extract orientation data
    const orientationData = frames.map(frame => ({
      timestamp: frame.timestamp,
      frameIndex: frame.frameIndex,
      up: frame.physics.up,
      forward: frame.physics.forward,
      quaternion: frame.physics.quaternion,
      renderQuaternion: frame.render?.quaternion
    }));

    // Initialize analysis results
    const results = {
      success: false,
      completionPercentage: 0,
      duration: frames[frames.length - 1].timestamp,
      frameCount: frames.length,
      maxPitch: 0,
      maxRollDeviation: 0,
      maxYawDeviation: 0,
      orientationTransitions: [],
      issues: []
    };

    // Detect backflip phases
    let pitchUpStart = -1;
    let invertedPosition = -1;
    let pitchDownStart = -1;
    let recoveryStart = -1;

    // Analyze frame by frame
    for (let i = 1; i < orientationData.length; i++) {
      const frame = orientationData[i];
      const upY = frame.up.y;
      const upZ = frame.up.z;
      const time = frame.timestamp;

      // Detect state transitions
      if (pitchUpStart === -1 && upY < 0.95 && upY > 0.7 && upZ > 0.05 && i > 5) {
        pitchUpStart = i;
        results.orientationTransitions.push({
          phase: 'pitch_up_start',
          timestamp: time,
          frameIndex: i
        });
      }

      if (pitchUpStart !== -1 && invertedPosition === -1 && upY < -0.5) {
        invertedPosition = i;
        results.orientationTransitions.push({
          phase: 'inverted',
          timestamp: time,
          frameIndex: i
        });
      }

      if (invertedPosition !== -1 && pitchDownStart === -1 && upY < 0 && upZ < -0.1) {
        pitchDownStart = i;
        results.orientationTransitions.push({
          phase: 'pitch_down',
          timestamp: time,
          frameIndex: i
        });
      }

      if (pitchDownStart !== -1 && recoveryStart === -1 && upY > 0.5 && Math.abs(upZ) < 0.5) {
        recoveryStart = i;
        results.orientationTransitions.push({
          phase: 'recovery',
          timestamp: time,
          frameIndex: i
        });
      }

      // Check for physics vs render discrepancies
      if (frame.quaternion && frame.renderQuaternion) {
        const discrepancy = this.calculateQuaternionDiscrepancy(frame.quaternion, frame.renderQuaternion);
        if (discrepancy > 0.1) {
          results.issues.push({
            type: 'physics_render_mismatch',
            severity: 'high',
            description: `Large physics/render discrepancy at ${time.toFixed(2)}s (${discrepancy.toFixed(2)}°)`
          });
        }
      }
    }

    // Calculate completion percentage
    const phases = {
      pitchUp: pitchUpStart !== -1,
      inverted: invertedPosition !== -1,
      pitchDown: pitchDownStart !== -1,
      recovery: recoveryStart !== -1
    };

    results.success = phases.pitchUp && phases.inverted && phases.pitchDown && phases.recovery;

    if (results.success) {
      results.completionPercentage = 100;
    } else {
      let completionPoints = 0;
      if (phases.pitchUp) completionPoints += 25;
      if (phases.inverted) completionPoints += 30;
      if (phases.pitchDown) completionPoints += 25;
      if (phases.recovery) completionPoints += 20;
      results.completionPercentage = completionPoints;
    }

    // Add missing phase issues
    if (!phases.pitchUp) {
      results.issues.push({
        type: 'missing_phase',
        severity: 'high',
        description: 'Initial pitch up phase not detected'
      });
    }
    if (!phases.inverted) {
      results.issues.push({
        type: 'missing_phase',
        severity: 'high',
        description: 'Drone did not reach inverted position'
      });
    }
    if (!phases.pitchDown) {
      results.issues.push({
        type: 'missing_phase',
        severity: 'high',
        description: 'Pitch down phase after inversion not detected'
      });
    }
    if (!phases.recovery) {
      results.issues.push({
        type: 'missing_phase',
        severity: 'high',
        description: 'Recovery phase not detected'
      });
    }

    return results;
  }

  calculateQuaternionDiscrepancy(q1, q2) {
    // Calculate angle between quaternions in degrees
    const dot = q1.x * q2.x + q1.y * q2.y + q1.z * q2.z + q1.w * q2.w;
    const angle = 2 * Math.acos(Math.abs(Math.min(1, Math.max(-1, dot)))) * (180 / Math.PI);
    return angle;
  }

  downloadRecording() {
    const data = JSON.stringify(this.frames, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `drone_recording_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default RecordingManager; 