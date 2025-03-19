# Three.js FPV Demo Rules

Simple guidelines for working with this project.

## Manual overrides
* NEVER DELETE INBOX.md - it's SACRED
* LEAVE drone_flight_demo.js app ALONE - it's legacy
* It is also untracked intentionally leave it alone
* prefer realitic tests over mocked tests
* cat any output from git to avoid view waiting for user input
* use dependency injection to help make objects easier to test

## Development Environment Rules

1. **Node.js Requirements**
   - Use Node.js LTS (v20.x recommended)
   - Ensure npm is up to date
   - Document any version-specific issues

2. **Development Tools**
   - Use Vite for development and building
   - Follow the established npm scripts
   - Handle git commits with appropriate flags to commit from a single line with new lines in the commit message - a series of `-m` tags should work
   - Prefer longer more expressive commits

## Code Rules

1. **Keep It Clean**
   - Put all Three.js code in `src/`
   - Use clear variable names
   - Add comments for complex 3D stuff
   - Clean up resources you create
   - Follow established code style

2. **Performance Matters**
   - Use `requestAnimationFrame` for animations
   - Handle window resizing
   - Clean up unused 3D objects
   - Monitor frame rates and performance metrics
   - Log performance issues appropriately

## File Organization Rules

1. **Project Structure**
   - Put demo-specific code in `src/demos/`
   - Keep related functionality together
   - Avoid duplicate code across files
   - When combining files, ensure all imports are updated
   - Maintain clear separation between core and demo code

2. **Demo Structure**
   - Each demo should have its own directory in `demos/`
   - Demo HTML files should import from the correct path in `src/demos/`
   - Keep demo-specific styles in the demo's HTML file
   - Use consistent naming across related files
   - Include proper documentation for each demo

## Telemetry Logging Rules

1. **Logging Requirements**
   - Log all frame timing data
   - Record performance metrics
   - Store system information
   - Handle errors gracefully with proper logging
   - Maintain database integrity

2. **Data Management**
   - Use SQLite for telemetry storage
   - Follow established database schema
   - Clean up old logs periodically
   - Document any schema changes

## Documentation Rules

1. **Keep Everyone Informed**
   - Update README.md for new features
   - Explain what your code does
   - Document any new dependencies
   - Keep CONTROLS.md up to date
   - Document performance considerations

## Version Control Rules

1. **Commit Smart**
   - Write clear commit messages
   - One feature per commit
   - Never commit secrets or API keys
   - Keep commits focused and atomic
   - Include relevant issue references

## Safety Rules

1. **Play It Safe**
   - Test your changes thoroughly
   - Check for memory leaks
   - Handle errors gracefully
   - Validate user inputs
   - Follow security best practices

2. **Testing Requirements**
   - Write unit tests for new features
   - Test across different browsers
   - Verify performance impact
   - Check mobile compatibility
   - Document test cases

## UI Overlay Conventions

1. **Standard Positioning**
   - Diagnostic/Debug Information: Bottom right corner
   - Controls Information: Top right corner
   - Status Messages: Bottom left corner
   - Controller/Input Visualization: Bottom center
   - Home Link: Top left corner (not in menus)
   - Menus: Center of screen

2. **Styling Consistency**
   - Use semi-transparent black backgrounds (rgba(0, 0, 0, 0.7))
   - Use green text (#00ff00) for controls, home links, and diagnostic information
   - Use white text for general status messages
   - Use consistent padding (10px) and border radius (5px)
   - Use monospace font for all technical information

3. **Menu Design**
   - All demos should include a menu accessible via ESC key
   - Menus should include a "Home" link to return to the home page
   - Menus should follow the established button styling
   - Menu home links should use the same styling as other menu buttons

4. **Home Link Implementation**
   - Home links in demos should always be placed in the top left corner using the standard styling
   - All demos should have a home link both in the top left corner and in the ESC menu for consistency
   - The top left home link should be styled consistently across all demos

5. **Responsiveness**
   - All overlays should maintain readability at different screen sizes
   - Ensure overlays don't overlap at common resolutions
   - Handle window resize events properly

That's it! Keep it simple, keep it working. 