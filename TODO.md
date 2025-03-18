- [ ] is there an npm clean we can use? previous build can cause issues

* [ ] Map Enhancement
  * More realism by fading out the window when we get too close to the edge
  * floating demo cube is clipping, raise its height
  * we want to better be able to visualize each side of an object, we need a simple approach to handle this
    * maybe add some simple shading so we can discern each side of a building
* OUT OF SCOPE
  * separate out map and map data when it starts to become an issue
  * Extract the map logic to a new file - probably use a class to handle behavior and state

* game state display
  * display a simple x/y render on the botton of the screen with the current controller state

* [ ] Physics and Movement
  * Implement physics acceleration on throttle
  * Add floating mechanics
  * Match feeling of FPV drone sims (focus on playability and transferability over exact realism)

* [ ] Development Tasks
  * Test rendering logging
  * Move completed items from TODO.md to DONE.md

* [ ] Controller Support
  * Fix controller mapping to match traditional controls:
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