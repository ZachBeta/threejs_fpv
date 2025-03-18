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

* [ ] Map Enhancement
  * Extract the map logic to a new file - probably use a class to handle behavior and state
  * More realism by fading out the window when we get too close to the edge

* [ ] Physics and Movement
  * Implement physics acceleration on throttle
  * Add floating mechanics
  * Match feeling of FPV drone sims (focus on playability and transferability over exact realism)

* [ ] Development Tasks
  * Test rendering logging
  * Move completed items from TODO.md to DONE.md