/**
 * Recording Service
 * Handles storing and retrieving maneuver recordings via API
 */

class RecordingService {
  constructor(apiBaseUrl = '/api/recordings') {
    this.apiBaseUrl = apiBaseUrl;
    this.currentRecording = null;
    this.isRecording = false;
  }

  /**
   * Start recording drone maneuver data
   * @returns {Promise<Object>} Recording session info
   */
  async startRecording() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: Date.now(),
          droneType: 'standard',
          maneuverType: 'backflip'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start recording: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.currentRecording = data;
      this.isRecording = true;
      
      console.log(`Recording started with ID: ${data.recordingId}`);
      return data;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Add frame data to current recording
   * @param {Object} frameData - The frame data to record
   * @returns {Promise<void>}
   */
  async recordFrame(frameData) {
    if (!this.isRecording || !this.currentRecording) {
      console.warn('Cannot record frame: No active recording session');
      return;
    }
    
    try {
      await fetch(`${this.apiBaseUrl}/${this.currentRecording.recordingId}/frames`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...frameData,
          timestamp: Date.now(),
          recordingId: this.currentRecording.recordingId
        })
      });
    } catch (error) {
      console.error('Error recording frame:', error);
    }
  }

  /**
   * Stop current recording and finalize
   * @returns {Promise<Object>} The completed recording data
   */
  async stopRecording() {
    if (!this.isRecording || !this.currentRecording) {
      console.warn('Cannot stop recording: No active recording session');
      return null;
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/${this.currentRecording.recordingId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to stop recording: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Recording ${this.currentRecording.recordingId} completed`);
      
      this.isRecording = false;
      this.currentRecording = null;
      
      return data;
    } catch (error) {
      console.error('Error stopping recording:', error);
      throw error;
    }
  }

  /**
   * Get list of all recordings
   * @returns {Promise<Array>} List of recordings
   */
  async getRecordings() {
    try {
      const response = await fetch(this.apiBaseUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recordings: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching recordings:', error);
      throw error;
    }
  }

  /**
   * Get a specific recording by ID
   * @param {string} recordingId - The ID of the recording to fetch
   * @returns {Promise<Object>} The recording data
   */
  async getRecording(recordingId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${recordingId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recording: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching recording ${recordingId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a recording
   * @param {string} recordingId - The ID of the recording to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteRecording(recordingId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${recordingId}`, {
        method: 'DELETE'
      });
      
      return response.ok;
    } catch (error) {
      console.error(`Error deleting recording ${recordingId}:`, error);
      throw error;
    }
  }
}

export default RecordingService; 