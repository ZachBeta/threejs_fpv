/**
 * State recorder for tracking drone physics and render states
 * Used for debugging maneuvers and analyzing rendering issues
 */

import RecordingService from './recording_service.js';

export class StateRecorder {
  constructor() {
    this.recordingService = new RecordingService();
    this.isRecording = false;
    this.currentRecordingId = null;
    this.frameCount = 0;
    this.maxFrames = 1000; // Prevent memory issues with very long recordings
  }

  /**
   * Start recording drone state
   * @param {string} maneuverType - Type of maneuver being recorded (default: 'backflip')
   * @param {string} droneType - Type of drone being used (default: 'standard')
   * @returns {Promise<boolean>} Success status
   */
  async startRecording(maneuverType = 'backflip', droneType = 'standard') {
    if (this.isRecording) {
      console.warn('Already recording. Stop current recording first.');
      return false;
    }
    
    try {
      const recording = await this.recordingService.startRecording();
      this.currentRecordingId = recording.recordingId;
      this.isRecording = true;
      this.frameCount = 0;
      console.log(`Started recording: ${this.currentRecordingId}`);
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  /**
   * Stop the current recording and save it
   * @returns {Promise<Object|null>} Recording data or null if not recording
   */
  async stopRecording() {
    if (!this.isRecording) {
      console.warn('Not currently recording.');
      return null;
    }
    
    try {
      const data = await this.recordingService.stopRecording();
      console.log(`Stopped recording: ${this.currentRecordingId} (${this.frameCount} frames)`);
      
      this.isRecording = false;
      this.currentRecordingId = null;
      this.frameCount = 0;
      
      return data;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      return null;
    }
  }

  /**
   * Record a frame of drone state
   * @param {Object} dronePhysicsState - The drone's physics state
   * @param {Object} droneRenderState - The drone's render state
   * @param {number} timeElapsed - Time elapsed since start of recording
   */
  async recordFrame(dronePhysicsState, droneRenderState, timeElapsed) {
    if (!this.isRecording || !this.currentRecordingId) {
      return;
    }
    
    if (this.frameCount >= this.maxFrames) {
      console.warn(`Reached maximum number of frames (${this.maxFrames}). Stopping recording.`);
      await this.stopRecording();
      return;
    }
    
    const frameData = {
      timestamp: timeElapsed,
      frameIndex: this.frameCount,
      physics: {
        position: { ...dronePhysicsState.position },
        rotation: { ...dronePhysicsState.localRotation },
        velocity: { ...dronePhysicsState.velocity },
        angularVelocity: { ...dronePhysicsState.angularVelocity },
        quaternion: {
          x: dronePhysicsState.quaternion.x,
          y: dronePhysicsState.quaternion.y,
          z: dronePhysicsState.quaternion.z,
          w: dronePhysicsState.quaternion.w
        },
        up: {
          x: dronePhysicsState.up.x,
          y: dronePhysicsState.up.y,
          z: dronePhysicsState.up.z
        },
        forward: {
          x: dronePhysicsState.forward.x,
          y: dronePhysicsState.forward.y,
          z: dronePhysicsState.forward.z
        },
        throttle: dronePhysicsState.throttle,
        pitch: dronePhysicsState.pitch,
        roll: dronePhysicsState.roll,
        yaw: dronePhysicsState.yaw
      },
      render: {
        position: { 
          x: droneRenderState.position.x,
          y: droneRenderState.position.y,
          z: droneRenderState.position.z
        },
        quaternion: {
          x: droneRenderState.quaternion.x,
          y: droneRenderState.quaternion.y,
          z: droneRenderState.quaternion.z,
          w: droneRenderState.quaternion.w
        }
      }
    };
    
    try {
      await this.recordingService.recordFrame(frameData);
      this.frameCount++;
    } catch (error) {
      console.error('Failed to record frame:', error);
    }
  }

  /**
   * Get a specific recording by ID
   * @param {string} recordingId - ID of the recording to retrieve
   * @returns {Promise<Object|null>} The recording data or null if not found
   */
  async getRecording(recordingId) {
    try {
      return await this.recordingService.getRecording(recordingId);
    } catch (error) {
      console.error(`Failed to get recording ${recordingId}:`, error);
      return null;
    }
  }

  /**
   * Get a list of all available recordings
   * @returns {Promise<Array>} List of recordings
   */
  async getRecordingsList() {
    try {
      return await this.recordingService.getRecordings();
    } catch (error) {
      console.error('Failed to get recordings list:', error);
      return [];
    }
  }

  /**
   * Delete a recording
   * @param {string} recordingId - ID of the recording to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteRecording(recordingId) {
    try {
      return await this.recordingService.deleteRecording(recordingId);
    } catch (error) {
      console.error(`Failed to delete recording ${recordingId}:`, error);
      return false;
    }
  }

  /**
   * Generate an analysis of a recording, focusing on quaternion transitions
   * @param {string} recordingId - ID of the recording to analyze
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeRecording(recordingId) {
    const recording = await this.getRecording(recordingId);
    if (!recording || recording.length === 0) {
      return { error: 'Recording not found or empty' };
    }
    
    const analysis = {
      recordingId,
      frameCount: recording.length,
      duration: recording[recording.length - 1].timestamp,
      physics: {
        maxQuaternionJump: 0,
        maxPositionJump: 0
      },
      render: {
        maxQuaternionJump: 0,
        maxPositionJump: 0
      },
      physicsVsRender: {
        maxQuaternionDifference: 0
      },
      keyPoints: []
    };
    
    // Analyze transitions between frames
    for (let i = 1; i < recording.length; i++) {
      const prev = recording[i-1];
      const curr = recording[i];
      
      // Physics quaternion jumps
      const physQuatDot = Math.abs(
        prev.physics.quaternion.x * curr.physics.quaternion.x +
        prev.physics.quaternion.y * curr.physics.quaternion.y +
        prev.physics.quaternion.z * curr.physics.quaternion.z +
        prev.physics.quaternion.w * curr.physics.quaternion.w
      );
      const physQuatJump = Math.acos(Math.min(1, physQuatDot)) * 2 * (180 / Math.PI);
      analysis.physics.maxQuaternionJump = Math.max(analysis.physics.maxQuaternionJump, physQuatJump);
      
      // Render quaternion jumps
      const renderQuatDot = Math.abs(
        prev.render.quaternion.x * curr.render.quaternion.x +
        prev.render.quaternion.y * curr.render.quaternion.y +
        prev.render.quaternion.z * curr.render.quaternion.z +
        prev.render.quaternion.w * curr.render.quaternion.w
      );
      const renderQuatJump = Math.acos(Math.min(1, renderQuatDot)) * 2 * (180 / Math.PI);
      analysis.render.maxQuaternionJump = Math.max(analysis.render.maxQuaternionJump, renderQuatJump);
      
      // Position jumps
      const physPosDiff = Math.sqrt(
        Math.pow(curr.physics.position.x - prev.physics.position.x, 2) +
        Math.pow(curr.physics.position.y - prev.physics.position.y, 2) +
        Math.pow(curr.physics.position.z - prev.physics.position.z, 2)
      );
      analysis.physics.maxPositionJump = Math.max(analysis.physics.maxPositionJump, physPosDiff);
      
      const renderPosDiff = Math.sqrt(
        Math.pow(curr.render.position.x - prev.render.position.x, 2) +
        Math.pow(curr.render.position.y - prev.render.position.y, 2) +
        Math.pow(curr.render.position.z - prev.render.position.z, 2)
      );
      analysis.render.maxPositionJump = Math.max(analysis.render.maxPositionJump, renderPosDiff);
      
      // Physics vs Render difference
      // Note that we should take into account Y rotation difference in the model vs physics
      const physVsRenderDot = Math.abs(
        curr.physics.quaternion.x * curr.render.quaternion.x +
        curr.physics.quaternion.y * curr.render.quaternion.y +
        curr.physics.quaternion.z * curr.render.quaternion.z +
        curr.physics.quaternion.w * curr.render.quaternion.w
      );
      const physVsRenderDiff = Math.acos(Math.min(1, physVsRenderDot)) * 2 * (180 / Math.PI);
      analysis.physicsVsRender.maxQuaternionDifference = Math.max(
        analysis.physicsVsRender.maxQuaternionDifference, 
        physVsRenderDiff
      );
      
      // Record large quaternion jumps in render
      if (renderQuatJump > 30) {
        analysis.keyPoints.push({
          frameIndex: i,
          time: curr.timestamp,
          type: 'large_render_quaternion_jump',
          value: renderQuatJump.toFixed(2),
          physics: {
            quaternion: { ...curr.physics.quaternion },
            up: { ...curr.physics.up }
          },
          render: {
            quaternion: { ...curr.render.quaternion }
          }
        });
      }
    }
    
    // Identify key frames for analysis (beginning, middle, end)
    const addKeyFrame = (index, label) => {
      if (index >= 0 && index < recording.length) {
        const frame = recording[index];
        analysis.keyPoints.push({
          frameIndex: index,
          time: frame.timestamp,
          type: 'key_frame',
          label: label,
          physics: {
            quaternion: { ...frame.physics.quaternion },
            up: { ...frame.physics.up },
            rotation: { ...frame.physics.rotation }
          },
          render: {
            quaternion: { ...frame.render.quaternion }
          }
        });
      }
    };
    
    addKeyFrame(0, 'start');
    addKeyFrame(Math.floor(recording.length / 4), 'quarter');
    addKeyFrame(Math.floor(recording.length / 2), 'middle');
    addKeyFrame(Math.floor(recording.length * 3 / 4), 'three_quarter');
    addKeyFrame(recording.length - 1, 'end');
    
    return analysis;
  }

  /**
   * Export recording data as JSON
   * @param {string} recordingId - ID of the recording to export
   * @returns {Promise<string>} JSON string of the recording data
   */
  async exportRecording(recordingId) {
    const recording = await this.getRecording(recordingId);
    if (!recording) {
      return '{"error": "Recording not found"}';
    }
    
    // Simplify quaternions for serialization
    const simplified = recording.map(frame => ({
      timestamp: frame.timestamp,
      frameIndex: frame.frameIndex,
      physics: {
        position: frame.physics.position,
        rotation: frame.physics.rotation,
        quaternion: {
          x: frame.physics.quaternion.x,
          y: frame.physics.quaternion.y,
          z: frame.physics.quaternion.z,
          w: frame.physics.quaternion.w
        },
        up: {
          x: frame.physics.up.x,
          y: frame.physics.up.y,
          z: frame.physics.up.z
        },
        forward: {
          x: frame.physics.forward.x,
          y: frame.physics.forward.y,
          z: frame.physics.forward.z
        },
        throttle: frame.physics.throttle,
        pitch: frame.physics.pitch,
        roll: frame.physics.roll,
        yaw: frame.physics.yaw
      },
      render: {
        position: frame.render.position,
        quaternion: {
          x: frame.render.quaternion.x,
          y: frame.render.quaternion.y,
          z: frame.render.quaternion.z,
          w: frame.render.quaternion.w
        }
      }
    }));
    
    return JSON.stringify(simplified);
  }
}

// Singleton instance for application-wide use
export const stateRecorder = new StateRecorder(); 