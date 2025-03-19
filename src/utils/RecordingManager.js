/**
 * RecordingManager.js
 * Minimal recording functionality that integrates with flight routines
 */

class RecordingManager {
  constructor() {
    this.isRecording = false;
    this.recordingStartTime = null;
    this.frames = [];
    this.statusIndicator = null;
  }

  mount(parent) {
    // Find the existing recording status element
    this.statusIndicator = parent.querySelector('#recording-time');
    if (!this.statusIndicator) {
      console.warn('Recording status element not found');
    }
  }

  startRecording(routineName = 'unnamed') {
    this.isRecording = true;
    this.recordingStartTime = performance.now();
    this.frames = [];
    this.currentRoutine = routineName;
    this.updateStatus();
  }

  stopRecording() {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    const duration = (performance.now() - this.recordingStartTime) / 1000;
    
    // Save recording
    this.saveRecording(duration);
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
    if (!this.statusIndicator || !this.isRecording) return;
    
    const duration = ((performance.now() - this.recordingStartTime) / 1000).toFixed(1);
    this.statusIndicator.innerText = `Recording ${this.currentRoutine}: ${duration}s`;
  }

  saveRecording(duration) {
    const filename = `${this.currentRoutine}_${new Date().toISOString()}.json`;
    const data = {
      routine: this.currentRoutine,
      duration,
      frameCount: this.frames.length,
      frames: this.frames
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default RecordingManager; 