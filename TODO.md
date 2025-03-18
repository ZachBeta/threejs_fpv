# TODO

## projects
* [ ] Map Enhancement
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

## Soon

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
- [ ] is there an npm clean we can use? previous build can cause issues
  * might be irrelevant after turning off browser cache