# Drone Controls

## Manual Controls

### Keyboard Controls
- **Spacebar**: Throttle (hold to go up)
- **W/S**: Pitch (forward/backward tilt)
- **A/D**: Roll (left/right tilt)
- **Q/E**: Yaw (rotate left/right)
- **H**: Toggle hover mode
- **R**: Reset drone

### Gamepad Controls
- **Left Stick**:
  - Up: Throttle up (move drone vertically up)
  - Down: Throttle down to 0
  - Left: Rotate drone left (yaw)
  - Right: Rotate drone right (yaw)

- **Right Stick**:
  - Up: Tilt forward (pitch)
  - Down: Tilt backward (pitch)
  - Left: Tilt left (roll)
  - Right: Tilt right (roll)

- **L Button**: Reset drone

## Automated Routine Controls

### Routine Steps
1. **Takeoff** (2s)
   - Throttle: 1.0
   - Pitch: 0
   - Roll: 0
   - Yaw: 0

2. **Hover** (2s)
   - Throttle: 0.5 (maintains altitude)
   - Pitch: 0
   - Roll: 0
   - Yaw: 0

3. **Forward** (2s)
   - Throttle: 0.5
   - Pitch: 1.0
   - Roll: 0
   - Yaw: 0

4. **Backward** (2s)
   - Throttle: 0.5
   - Pitch: -1.0
   - Roll: 0
   - Yaw: 0

5. **Left** (2s)
   - Throttle: 0.5
   - Pitch: 0
   - Roll: -1.0
   - Yaw: 0

6. **Right** (2s)
   - Throttle: 0.5
   - Pitch: 0
   - Roll: 1.0
   - Yaw: 0

7. **Rotate Left** (2s)
   - Throttle: 0.5
   - Pitch: 0
   - Roll: 0
   - Yaw: -1.0

8. **Rotate Right** (2s)
   - Throttle: 0.5
   - Pitch: 0
   - Roll: 0
   - Yaw: 1.0

9. **Land** (2s)
   - Throttle: 0.0
   - Pitch: 0
   - Roll: 0
   - Yaw: 0

10. **Reset** (1s)
    - Returns to initial position and orientation

### Routine Controls
- **Spacebar**: Start/Stop routine
- **R**: Reset drone (interrupts routine)

## Control Stick Visualization
The control stick display shows the current input values for both manual and automated controls:

### Left Stick
- X-axis: Yaw (-1.0 to 1.0)
- Y-axis: Throttle (0.0 to 1.0)

### Right Stick
- X-axis: Roll (-1.0 to 1.0)
- Y-axis: Pitch (-1.0 to 1.0)

## Notes
- All automated movements maintain a base throttle of 0.5 to maintain altitude
- Hover mode can be toggled at any time to stabilize the drone
- The reset function can be used to interrupt the routine and return to the starting position 