# TODO

## High Priority

* [ ] Physics and Movement
  * [ ] Create a demo render of the physics engine
    * Copy map and renderer from main.js
    * Implement basic physics simulation
    * Add visual debugging tools
  * [ ] Implement core physics features
    * Add physics acceleration on throttle
    * Implement floating mechanics
    * Match FPV drone sim feel (focus on playability)
    * Add hover toggle for QOL

* [ ] Controller Support
  * [ ] Fix controller mapping to match traditional controls:
    ```
    Left Stick:
      - Neutral: No action
      - Up: Throttle up (move drone vertically up)
      - Down: Throttle down to 0
      - Left: Rotate drone left
      - Right: Rotate drone right
    
    Right Stick:
      - Up: Tilt forward
      - Down: Tilt backward
      - Left: Tilt left
      - Right: Tilt right
    ```
  * [ ] Add controller calibration options
  * [ ] Implement deadzone settings
  * [ ] Add controller connection status indicator

## Development Tasks

* [ ] Testing and Quality
  * [ ] Write unit tests for new features
  * [ ] Add integration tests for physics system
  * [ ] Implement automated performance testing
  * [ ] Add browser compatibility tests

* [ ] Performance Optimization
  * [ ] Profile and optimize render loop
  * [ ] Implement level of detail system
  * [ ] Add object pooling for frequently created/destroyed objects
  * [ ] Optimize physics calculations

* [ ] UI/UX Improvements
  * [ ] Add game state display (controller state, position, etc.)
  * [ ] Implement HUD for important information
  * [ ] Add visual feedback for physics interactions
  * [ ] Create settings menu for controls and graphics

## Future Considerations

* [ ] Map Enhancement
  * [ ] Separate map and map data when it becomes an issue
  * [ ] Extract map logic to a dedicated class
  * [ ] Add procedural generation options
  * [ ] Implement dynamic loading for large maps

* [ ] Additional Features
  * [ ] Add multiplayer support
  * [ ] Implement race mode
  * [ ] Create obstacle course mode
  * [ ] Add drone customization options