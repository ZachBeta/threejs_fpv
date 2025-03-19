/**
 * Backflip Analysis Tool
 * A web-based visualization tool for analyzing backflip recordings
 */
import * as THREE from 'three';
import { analyzeBackflip } from '../utils/backflip_analyzer.js';

class BackflipAnalysisTool {
  constructor() {
    this.initUI();
    this.bindEvents();
    this.recordingData = null;
    this.analysis = null;
    this.animationFrameId = null;
    this.playbackSpeed = 1.0;
    this.currentFrameIndex = 0;
    this.isPlaying = false;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.drone = null;
    this.timeline = null;
    this.loadingIndicator = document.getElementById('loading-indicator');
  }

  initUI() {
    // Create main layout
    const container = document.createElement('div');
    container.id = 'analysis-container';
    container.style.padding = '20px';
    container.style.maxWidth = '1200px';
    container.style.margin = '0 auto';
    
    // Create header
    const header = document.createElement('h1');
    header.textContent = 'Backflip Analysis Tool';
    container.appendChild(header);
    
    // Create file input section
    const fileSection = document.createElement('div');
    fileSection.className = 'section';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'recording-file';
    fileInput.accept = '.json';
    
    const fileLabel = document.createElement('label');
    fileLabel.htmlFor = 'recording-file';
    fileLabel.textContent = 'Load Recording File: ';
    
    const analyzeButton = document.createElement('button');
    analyzeButton.textContent = 'Analyze Recording';
    analyzeButton.id = 'analyze-button';
    analyzeButton.disabled = true;
    
    fileSection.appendChild(fileLabel);
    fileSection.appendChild(fileInput);
    fileSection.appendChild(analyzeButton);
    
    container.appendChild(fileSection);
    
    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.textContent = 'Analyzing...';
    loadingIndicator.style.display = 'none';
    container.appendChild(loadingIndicator);
    
    // Create results section
    const resultsSection = document.createElement('div');
    resultsSection.className = 'section';
    resultsSection.id = 'results-section';
    resultsSection.style.display = 'none';
    
    // Create two-column layout
    const resultsLayout = document.createElement('div');
    resultsLayout.style.display = 'flex';
    resultsLayout.style.gap = '20px';
    
    // Left column - analysis results
    const analysisResults = document.createElement('div');
    analysisResults.id = 'analysis-results';
    analysisResults.style.flex = '1';
    analysisResults.style.minWidth = '300px';
    
    // Right column - visualization
    const visualization = document.createElement('div');
    visualization.id = 'visualization';
    visualization.style.flex = '2';
    
    // Create visualization tabs
    const tabs = document.createElement('div');
    tabs.className = 'tabs';
    tabs.style.display = 'flex';
    tabs.style.marginBottom = '10px';
    
    const tabNames = ['3D View', 'Orientation Graph', 'Quaternion Graph'];
    tabNames.forEach((name, index) => {
      const tab = document.createElement('div');
      tab.className = 'tab';
      tab.dataset.tab = index;
      tab.textContent = name;
      tab.style.padding = '8px 16px';
      tab.style.cursor = 'pointer';
      tab.style.backgroundColor = index === 0 ? '#4CAF50' : '#ddd';
      tab.style.color = index === 0 ? 'white' : 'black';
      tab.style.marginRight = '5px';
      tab.style.borderRadius = '4px 4px 0 0';
      tabs.appendChild(tab);
    });
    
    visualization.appendChild(tabs);
    
    // Create visualization content
    const visContent = document.createElement('div');
    visContent.id = 'visualization-content';
    visContent.style.border = '1px solid #ddd';
    visContent.style.padding = '10px';
    visContent.style.minHeight = '400px';
    visContent.style.position = 'relative';
    
    // 3D View container
    const view3d = document.createElement('div');
    view3d.id = '3d-view';
    view3d.style.height = '400px';
    view3d.style.width = '100%';
    visContent.appendChild(view3d);
    
    // Orientation graph
    const orientationGraph = document.createElement('div');
    orientationGraph.id = 'orientation-graph';
    orientationGraph.style.height = '400px';
    orientationGraph.style.width = '100%';
    orientationGraph.style.display = 'none';
    visContent.appendChild(orientationGraph);
    
    // Quaternion graph
    const quaternionGraph = document.createElement('div');
    quaternionGraph.id = 'quaternion-graph';
    quaternionGraph.style.height = '400px';
    quaternionGraph.style.width = '100%';
    quaternionGraph.style.display = 'none';
    visContent.appendChild(quaternionGraph);
    
    visualization.appendChild(visContent);
    
    // Create playback controls
    const playbackControls = document.createElement('div');
    playbackControls.className = 'playback-controls';
    playbackControls.style.marginTop = '10px';
    playbackControls.style.display = 'flex';
    playbackControls.style.alignItems = 'center';
    
    // Play/pause button
    const playPauseButton = document.createElement('button');
    playPauseButton.id = 'play-pause';
    playPauseButton.textContent = 'Play';
    playPauseButton.style.marginRight = '10px';
    
    // Timeline slider
    const timeline = document.createElement('input');
    timeline.type = 'range';
    timeline.id = 'timeline';
    timeline.min = 0;
    timeline.max = 100;
    timeline.value = 0;
    timeline.style.flex = '1';
    timeline.style.marginRight = '10px';
    
    // Current time/frame display
    const timeDisplay = document.createElement('div');
    timeDisplay.id = 'time-display';
    timeDisplay.textContent = '0.00s / 0';
    timeDisplay.style.marginRight = '15px';
    timeDisplay.style.fontFamily = 'monospace';
    
    // Playback speed
    const speedLabel = document.createElement('label');
    speedLabel.htmlFor = 'playback-speed';
    speedLabel.textContent = 'Speed: ';
    
    const speedSelect = document.createElement('select');
    speedSelect.id = 'playback-speed';
    const speeds = [0.25, 0.5, 1.0, 2.0, 4.0];
    speeds.forEach(speed => {
      const option = document.createElement('option');
      option.value = speed;
      option.textContent = `${speed}x`;
      if (speed === 1.0) option.selected = true;
      speedSelect.appendChild(option);
    });
    
    playbackControls.appendChild(playPauseButton);
    playbackControls.appendChild(timeline);
    playbackControls.appendChild(timeDisplay);
    playbackControls.appendChild(speedLabel);
    playbackControls.appendChild(speedSelect);
    
    visualization.appendChild(playbackControls);
    
    // Assemble the results layout
    resultsLayout.appendChild(analysisResults);
    resultsLayout.appendChild(visualization);
    resultsSection.appendChild(resultsLayout);
    container.appendChild(resultsSection);
    
    // Add to document
    document.body.appendChild(container);
    
    // Store references to elements
    this.fileInput = fileInput;
    this.analyzeButton = analyzeButton;
    this.resultsSection = resultsSection;
    this.analysisResults = analysisResults;
    this.view3d = view3d;
    this.orientationGraph = orientationGraph;
    this.quaternionGraph = quaternionGraph;
    this.timeline = timeline;
    this.timeDisplay = timeDisplay;
    this.playPauseButton = playPauseButton;
    this.speedSelect = speedSelect;
    this.tabs = tabs;
    
    // Add styles
    this.addStyles();
  }
  
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
      }
      
      .section {
        margin-bottom: 20px;
      }
      
      button {
        background-color: #4CAF50;
        color: white;
        border: none;
        padding: 8px 16px;
        cursor: pointer;
        border-radius: 4px;
        margin-left: 10px;
      }
      
      button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
      
      input[type="file"] {
        padding: 8px;
        margin-right: 10px;
      }
      
      #loading-indicator {
        padding: 10px;
        background-color: #f8f9fa;
        color: #333;
        text-align: center;
        font-weight: bold;
        margin: 10px 0;
      }
      
      .success {
        color: #28a745;
        font-weight: bold;
      }
      
      .error {
        color: #dc3545;
        font-weight: bold;
      }
      
      .warning {
        color: #ffc107;
        font-weight: bold;
      }
      
      .phases-container {
        display: flex;
        margin: 20px 0;
        justify-content: space-between;
      }
      
      .phase {
        text-align: center;
        width: 22%;
      }
      
      .phase-icon {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 5px;
        color: white;
      }
      
      .completed .phase-icon {
        background-color: #28a745;
      }
      
      .missing .phase-icon {
        background-color: #dc3545;
      }
      
      .issue {
        margin: 5px 0;
        padding: 5px;
        border-radius: 3px;
      }
      
      .issue.high {
        background-color: rgba(220, 53, 69, 0.1);
        border-left: 3px solid #dc3545;
      }
      
      .issue.medium {
        background-color: rgba(255, 193, 7, 0.1);
        border-left: 3px solid #ffc107;
      }
      
      .issue.low {
        background-color: rgba(23, 162, 184, 0.1);
        border-left: 3px solid #17a2b8;
      }
    `;
    document.head.appendChild(style);
  }
  
  bindEvents() {
    this.fileInput.addEventListener('change', () => {
      this.analyzeButton.disabled = !this.fileInput.files.length;
    });
    
    this.analyzeButton.addEventListener('click', () => {
      this.loadAndAnalyzeRecording();
    });
    
    this.tabs.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });
    
    this.playPauseButton.addEventListener('click', () => {
      this.togglePlayback();
    });
    
    this.timeline.addEventListener('input', () => {
      if (this.recordingData) {
        const frameIndex = Math.floor((this.timeline.value / 100) * (this.recordingData.length - 1));
        this.currentFrameIndex = frameIndex;
        this.updateVisualization(frameIndex);
      }
    });
    
    this.speedSelect.addEventListener('change', () => {
      this.playbackSpeed = parseFloat(this.speedSelect.value);
    });
  }
  
  async loadAndAnalyzeRecording() {
    const file = this.fileInput.files[0];
    if (!file) return;
    
    this.loadingIndicator.style.display = 'block';
    this.loadingIndicator.textContent = 'Loading recording file...';
    this.analyzeButton.disabled = true;
    
    try {
      // Read the file
      const fileContent = await this.readFile(file);
      this.recordingData = JSON.parse(fileContent);
      
      // Analyze the recording
      this.loadingIndicator.textContent = 'Analyzing recording...';
      this.analysis = analyzeBackflip(this.recordingData);
      
      // Update timeline range
      this.timeline.max = 100;
      this.timeline.value = 0;
      this.currentFrameIndex = 0;
      
      // Display results
      this.displayAnalysisResults();
      this.initVisualization();
      
      // Show results section
      this.resultsSection.style.display = 'block';
      this.loadingIndicator.style.display = 'none';
      
    } catch (error) {
      this.loadingIndicator.textContent = `Error: ${error.message}`;
      this.loadingIndicator.style.color = 'red';
      console.error('Error analyzing recording:', error);
    } finally {
      this.analyzeButton.disabled = false;
    }
  }
  
  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  displayAnalysisResults() {
    if (!this.analysis) return;
    
    const results = this.analysisResults;
    results.innerHTML = '';
    
    // Create header
    const header = document.createElement('h2');
    header.textContent = 'Analysis Results';
    results.appendChild(header);
    
    // Overall status
    const status = document.createElement('div');
    status.className = this.analysis.success ? 'success' : 'error';
    status.textContent = this.analysis.success 
      ? '✓ Backflip successfully executed' 
      : `✗ Backflip issues detected (${this.analysis.completionPercentage}% complete)`;
    status.style.fontSize = '18px';
    status.style.marginBottom = '15px';
    results.appendChild(status);
    
    // Recording info
    const infoSection = document.createElement('div');
    infoSection.innerHTML = `
      <h3>Recording Information</h3>
      <p>Duration: ${this.analysis.duration.toFixed(2)} seconds</p>
      <p>Frame Count: ${this.analysis.frameCount}</p>
    `;
    results.appendChild(infoSection);
    
    // Backflip phases
    const phasesSection = document.createElement('div');
    phasesSection.innerHTML = '<h3>Backflip Phases</h3>';
    
    const phasesContainer = document.createElement('div');
    phasesContainer.className = 'phases-container';
    
    const phases = [
      { name: 'Pitch Up', key: 'pitchUpStart' },
      { name: 'Inverted', key: 'inverted' },
      { name: 'Pitch Down', key: 'pitchDown' },
      { name: 'Recovery', key: 'recovery' }
    ];
    
    phases.forEach(phase => {
      const phaseEl = document.createElement('div');
      phaseEl.className = `phase ${this.analysis.keyFrames[phase.key] ? 'completed' : 'missing'}`;
      
      const icon = document.createElement('div');
      icon.className = 'phase-icon';
      icon.textContent = this.analysis.keyFrames[phase.key] ? '✓' : '✗';
      
      const label = document.createElement('div');
      label.className = 'phase-label';
      label.textContent = phase.name;
      
      // Find transition for this phase
      const transition = this.analysis.orientationTransitions.find(
        t => t.phase === phase.key.replace(/([A-Z])/g, '_$1').toLowerCase()
      );
      
      if (transition) {
        const time = document.createElement('div');
        time.className = 'phase-time';
        time.textContent = `${transition.timestamp.toFixed(2)}s`;
        phaseEl.appendChild(icon);
        phaseEl.appendChild(label);
        phaseEl.appendChild(time);
      } else {
        phaseEl.appendChild(icon);
        phaseEl.appendChild(label);
      }
      
      phasesContainer.appendChild(phaseEl);
    });
    
    phasesSection.appendChild(phasesContainer);
    results.appendChild(phasesSection);
    
    // Stats
    const statsSection = document.createElement('div');
    statsSection.innerHTML = `
      <h3>Maneuver Stats</h3>
      <p>Max Pitch: ${this.analysis.maxPitch.toFixed(2)}</p>
      <p>Max Roll Deviation: ${this.analysis.maxRollDeviation.toFixed(2)}</p>
      <p>Max Yaw Deviation: ${this.analysis.maxYawDeviation.toFixed(2)}</p>
    `;
    results.appendChild(statsSection);
    
    // Issues
    if (this.analysis.issues.length > 0) {
      const issuesSection = document.createElement('div');
      issuesSection.innerHTML = '<h3>Issues Detected</h3>';
      
      const issuesList = document.createElement('div');
      this.analysis.issues.forEach(issue => {
        const issueItem = document.createElement('div');
        issueItem.className = `issue ${issue.severity}`;
        issueItem.textContent = issue.description;
        issuesList.appendChild(issueItem);
      });
      
      issuesSection.appendChild(issuesList);
      results.appendChild(issuesSection);
    }
  }
  
  initVisualization() {
    // Set up 3D scene
    this.setup3DScene();
    
    // Initialize with first frame
    this.updateVisualization(0);
    
    // Initialize graphs
    this.initOrientationGraph();
    this.initQuaternionGraph();
  }
  
  setup3DScene() {
    // Clean up previous scene if it exists
    if (this.scene) {
      this.cancelAnimationFrame(this.animationFrameId);
      this.scene = null;
      this.renderer.dispose();
      while (this.view3d.firstChild) {
        this.view3d.removeChild(this.view3d.firstChild);
      }
    }
    
    // Create new scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75, 
      this.view3d.clientWidth / this.view3d.clientHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(3, 3, 5);
    this.camera.lookAt(0, 0, 0);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.view3d.clientWidth, this.view3d.clientHeight);
    this.view3d.appendChild(this.renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 2, 1);
    this.scene.add(directionalLight);
    
    // Add ground plane
    const groundGeometry = new THREE.PlaneGeometry(10, 10);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xcccccc,
      side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = -2;
    this.scene.add(ground);
    
    // Add grid
    const gridHelper = new THREE.GridHelper(10, 10);
    gridHelper.position.y = -1.999;
    this.scene.add(gridHelper);
    
    // Add axes
    const axesHelper = new THREE.AxesHelper(2);
    this.scene.add(axesHelper);
    
    // Create drone model
    this.createDroneModel();
    
    // Create coordinate system helper that follows the drone
    this.createCoordinateSystem();
    
    // Start render loop
    this.animate();
  }
  
  createDroneModel() {
    // Create drone group
    this.drone = new THREE.Group();
    
    // Create drone body
    const bodyGeometry = new THREE.BoxGeometry(1, 0.2, 1);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.drone.add(body);
    
    // Create directional indicator (front)
    const frontGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
    const frontMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const front = new THREE.Mesh(frontGeometry, frontMaterial);
    front.rotation.x = Math.PI / 2;
    front.position.z = 0.6;
    this.drone.add(front);
    
    // Add to scene
    this.scene.add(this.drone);
  }
  
  createCoordinateSystem() {
    // Create a coordinate system that follows the drone
    this.coordinateSystem = new THREE.Group();
    
    // X axis (red)
    const xGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5);
    const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const xAxis = new THREE.Mesh(xGeometry, xMaterial);
    xAxis.rotation.z = -Math.PI / 2;
    xAxis.position.x = 0.75;
    this.coordinateSystem.add(xAxis);
    
    // Y axis (green)
    const yGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5);
    const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yAxis = new THREE.Mesh(yGeometry, yMaterial);
    yAxis.position.y = 0.75;
    this.coordinateSystem.add(yAxis);
    
    // Z axis (blue)
    const zGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5);
    const zMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const zAxis = new THREE.Mesh(zGeometry, zMaterial);
    zAxis.rotation.x = Math.PI / 2;
    zAxis.position.z = 0.75;
    this.coordinateSystem.add(zAxis);
    
    // Position above the drone
    this.coordinateSystem.position.y = 2;
    
    // Add to scene
    this.scene.add(this.coordinateSystem);
  }
  
  animate() {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    // Automatic playback
    if (this.isPlaying && this.recordingData) {
      const nextFrameIndex = this.currentFrameIndex + this.playbackSpeed;
      
      if (nextFrameIndex >= this.recordingData.length) {
        // Reached the end, stop playback
        this.isPlaying = false;
        this.playPauseButton.textContent = 'Play';
      } else {
        this.currentFrameIndex = nextFrameIndex;
        const frameIndex = Math.floor(this.currentFrameIndex);
        
        // Update timeline position
        this.timeline.value = (frameIndex / (this.recordingData.length - 1)) * 100;
        
        // Update visualization
        this.updateVisualization(frameIndex);
      }
    }
    
    // Rotate camera around scene
    if (this.camera && !this.isPlaying) {
      const time = Date.now() * 0.0005;
      this.camera.position.x = Math.cos(time) * 7;
      this.camera.position.z = Math.sin(time) * 7;
      this.camera.lookAt(0, 0, 0);
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  updateVisualization(frameIndex) {
    if (!this.recordingData || !this.recordingData[frameIndex]) return;
    
    const frame = this.recordingData[frameIndex];
    
    // Update time display
    this.timeDisplay.textContent = `${frame.timestamp.toFixed(2)}s / ${frameIndex}`;
    
    // Update drone position and rotation
    if (this.drone) {
      // Get drone position and convert to scene space (may need adjustment based on data format)
      const pos = frame.physics.position;
      this.drone.position.set(pos.x, pos.y, pos.z);
      
      // Get drone quaternion
      const quat = frame.physics.quaternion;
      this.drone.quaternion.set(quat.x, quat.y, quat.z, quat.w);
      
      // Update coordinate system position
      this.coordinateSystem.position.set(pos.x, pos.y + 2, pos.z);
      
      // Update coordinate system orientation to match the drone
      this.coordinateSystem.quaternion.set(quat.x, quat.y, quat.z, quat.w);
    }
    
    // Update orientation graph marker
    if (this.orientationChart) {
      // Implementation dependent on charting library
    }
    
    // Update quaternion graph marker
    if (this.quaternionChart) {
      // Implementation dependent on charting library
    }
  }
  
  initOrientationGraph() {
    // This would use a charting library like Chart.js to plot orientation data
    // For simplicity, we'll just show a placeholder
    this.orientationGraph.innerHTML = '<p>Orientation graph would be shown here. This would plot the up vector (y) over time.</p>';
  }
  
  initQuaternionGraph() {
    // This would use a charting library to plot quaternion components
    // For simplicity, we'll just show a placeholder
    this.quaternionGraph.innerHTML = '<p>Quaternion graph would be shown here. This would plot the quaternion components (x,y,z,w) over time.</p>';
  }
  
  switchTab(tabIndex) {
    // Update tab styles
    this.tabs.querySelectorAll('.tab').forEach((tab, index) => {
      tab.style.backgroundColor = index === parseInt(tabIndex) ? '#4CAF50' : '#ddd';
      tab.style.color = index === parseInt(tabIndex) ? 'white' : 'black';
    });
    
    // Show selected content
    this.view3d.style.display = tabIndex === '0' ? 'block' : 'none';
    this.orientationGraph.style.display = tabIndex === '1' ? 'block' : 'none';
    this.quaternionGraph.style.display = tabIndex === '2' ? 'block' : 'none';
    
    // Resize renderer if needed
    if (tabIndex === '0' && this.renderer) {
      this.renderer.setSize(this.view3d.clientWidth, this.view3d.clientHeight);
    }
  }
  
  togglePlayback() {
    if (!this.recordingData) return;
    
    this.isPlaying = !this.isPlaying;
    this.playPauseButton.textContent = this.isPlaying ? 'Pause' : 'Play';
    
    // If playback has reached the end, restart from beginning
    if (this.currentFrameIndex >= this.recordingData.length - 1) {
      this.currentFrameIndex = 0;
      this.timeline.value = 0;
      this.updateVisualization(0);
    }
  }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BackflipAnalysisTool();
}); 