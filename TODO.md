# TODO

## projects
* [ ] Map Enhancement
  * OUT OF SCOPE
    * separate out map and map data when it starts to become an issue
    * Extract the map logic to a new file - probably use a class to handle behavior and state

* [ ] Game State Display
  * display a simple x/y render on the bottom of the screen with the current controller state

* [ ] Physics and Movement
  * [ ] create a demo render of the phsyics engine, maybe simulate simple inputs, this can copy the map and renderer from main.js

* Use physics engine in main game
  * Implement physics acceleration on throttle
  * Add floating mechanics
  * Match feeling of FPV drone sims (focus on playability and transferability over exact realism)
  * add hover toggle for QOL

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

* [ ] Development Tasks
  * Investigate npm clean options for handling previous build issues
  * Note: might be irrelevant after turning off browser cache