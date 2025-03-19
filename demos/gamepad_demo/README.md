# Gamepad Button Tester

This tool helps identify the correct button and axis mappings for different controllers. Use it to ensure your gamepad controls work correctly with the application.

## How to Use

1. Open `index.html` in a web browser
2. Connect your gamepad and press any button to activate it
3. Test all buttons and axes to see their corresponding numbers
4. Look specifically for the button numbers that correspond to the Left and Right Bumpers (typically buttons 4 and 5)
5. Use the Configuration Generator at the bottom of the page to create a custom configuration for your controller
6. Copy the generated configuration to `config.js`

## Files

- **index.html**: The main tester interface
- **config.js**: Contains controller configurations
- **integration.js**: Example of how to integrate with the main application

## Why This is Needed

Different controllers have different button and axis mappings. For example:

- Xbox controllers typically use buttons 4 and 5 for LB and RB
- PlayStation controllers may use different mappings
- Third-party controllers often have their own unique mappings

This tool helps ensure that no matter what controller you use, the buttons will be mapped correctly to their functions in the application.

## Updating the Main Application

After identifying the correct mappings:

1. Update `config.js` with your controller's configuration
2. Follow the implementation example in `integration.js` to update the main application

For more details on implementing controller-specific configurations, see the example in `integration.js`.

## Common Controller Mappings

Here are the default mappings for some common controllers:

### Xbox Controller (Standard Mapping)
- Left Stick X: Axis 0
- Left Stick Y: Axis 1
- Right Stick X: Axis 2
- Right Stick Y: Axis 3
- Left Bumper (LB): Button 4 (Reset)
- Right Bumper (RB): Button 5 (Hover Mode)

### PlayStation DualShock/DualSense
- Left Stick X: Axis 0
- Left Stick Y: Axis 1
- Right Stick X: Axis 2
- Right Stick Y: Axis 3
- L1 Button: Button 4 (Reset)
- R1 Button: Button 5 (Hover Mode)

These mappings may vary depending on browser, operating system, and controller drivers. Always test with your specific controller to verify. 