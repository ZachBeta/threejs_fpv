# Three.js FPV Demo Rules

Simple guidelines for working with this project.

## Dev tool rules
* handle git commits with appropriate flags to commit from a single line with new lines in the commit message - a series of `-m` tags should work
* prefer longer more expressive commits

## Code Rules

1. **Keep It Clean**
   - Put all Three.js code in `src/`
   - Use clear variable names
   - Add comments for complex 3D stuff
   - Clean up resources you create

2. **Performance Matters**
   - Use `requestAnimationFrame` for animations
   - Handle window resizing
   - Clean up unused 3D objects

## Documentation Rules

1. **Keep Everyone Informed**
   - Update README.md for new features
   - Explain what your code does
   - Document any new dependencies

## Version Control Rules

1. **Commit Smart**
   - Write clear commit messages
   - One feature per commit
   - Never commit secrets or API keys

## Safety Rules

1. **Play It Safe**
   - Test your changes
   - Check for memory leaks
   - Handle errors gracefully

## File Organization Rules

1. **Keep It Organized**
   - Put demo-specific code in `src/demos/`
   - Keep related functionality together
   - Avoid duplicate code across files
   - When combining files, ensure all imports are updated

2. **Demo Structure**
   - Each demo should have its own directory in `demos/`
   - Demo HTML files should import from the correct path in `src/demos/`
   - Keep demo-specific styles in the demo's HTML file
   - Use consistent naming across related files

That's it! Keep it simple, keep it working. 