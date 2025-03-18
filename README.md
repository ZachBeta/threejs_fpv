# Three.js FPV Demo

A simple 3D demo using Three.js that displays a rotating cube with proper lighting.

## Features

- 3D scene with a rotating green cube
- Directional and ambient lighting
- Responsive design that adapts to window resizing
- Modern development setup using Vite

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

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
- `package.json` - Project configuration and dependencies

## Technologies Used

- [Three.js](https://threejs.org/) - 3D graphics library
- [Vite](https://vitejs.dev/) - Next generation frontend tooling

## License

ISC