# Three.js FPV Demo

A simple 3D demo using Three.js that features a first-person view (FPV) drone-like camera movement system in a large open space with a central landmark.

## Features

- FPV drone-like controls for intuitive navigation
- Large open map with a central landmark
  - Rotating green cube on a tall pedestal as a reference point
  - 1000x1000 unit ground plane with edge fade-out effect
  - Tall towers dispersed near the edges for better depth perception
  - Checkerboard textures and improved shading for better visual feedback
- Enhanced lighting system
  - Multiple directional lights
  - Adjusted light intensities for better depth perception
  - Ambient lighting for improved visibility
- Responsive design that adapts to window resizing
- Modern development setup using Vite
- SQLite-based telemetry logging system
  - Captures frame timing data
  - Records performance metrics
  - Stores system information
- Real-time performance monitoring
- Automatic error handling and logging
- Gamepad support with traditional FPV drone controls

## Controls

The demo supports both keyboard and gamepad controls:

### Keyboard Controls
- `W/S`: Move forward/backward
- `A/D`: Strafe left/right
- `Space`: Move up
- `Shift`: Move down
- `Arrow Keys`: Rotate the view (left/right/up/down)

### Gamepad Controls
- Left Stick:
  - Up: Throttle up (move drone vertically up)
  - Down: Throttle down to 0
  - Left: Rotate drone left
  - Right: Rotate drone right
- Right Stick:
  - Up: Tilt forward
  - Down: Tilt backward
  - Left: Tilt left
  - Right: Tilt right
- L Button: Reset drone to starting position and orientation

The control scheme follows traditional FPV drone controls for intuitive flying.

Note: The gamepad controls will automatically activate when a controller is connected. Keyboard controls remain available as a fallback.

## Prerequisites

- Node.js LTS (v20.x recommended, currently using v20.19.0)
- npm (comes with Node.js)

If you're using a different Node.js version and encounter issues, especially with `better-sqlite3`, we recommend switching to Node.js 20 LTS. You can install it via:

```bash
# Using homebrew on macOS
brew install node@20
brew link --overwrite --force node@20

# Using nvm (Node Version Manager)
nvm install 20
nvm use 20
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ZachBeta/threejs_fpv.git
cd threejs_fpv
```

2. Install dependencies:
```bash
npm install
```

## Development

To start the development server:

```bash
npm run dev
```

This will start the Vite development server. Open your browser and navigate to http://localhost:5173 to see the demo.

## Building for Production

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Project Structure

- `index.html` - Main HTML file
- `src/main.js` - Main JavaScript file containing Three.js scene setup and animation
- `src/logger.js` - Telemetry logging system implementation
- `src/demos/` - Demo-specific code and implementations
- `demos/` - Demo HTML files and assets
- `package.json` - Project configuration and dependencies
- `logs.db` - SQLite database for storing telemetry data

## Technologies Used

- [Three.js](https://threejs.org/) - 3D graphics library
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - Fast and simple SQLite3 library

## Telemetry Logging

The project includes a comprehensive telemetry logging system that captures performance metrics and system information:

### Logged Data
- Frame timing and FPS metrics
- System information
- Error events and stack traces
- Performance bottlenecks

### Database Structure
The telemetry data is stored in a SQLite database (`logs.db`) with tables for:
- Frame metrics
- System information
- Error logs

### Accessing Logs
You can query the logs using any SQLite client. For example:

```bash
# Using sqlite3 command line tool
sqlite3 logs.db "SELECT * FROM frame_metrics LIMIT 5;"
```

## Contributing

Please read our [RULES.md](RULES.md) for guidelines on contributing to this project.

## License

MIT