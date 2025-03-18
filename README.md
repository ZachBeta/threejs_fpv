# Three.js FPV Demo

A simple 3D demo using Three.js that displays a rotating cube with proper lighting.

## Features

- 3D scene with a rotating green cube
- Directional and ambient lighting
- Responsive design that adapts to window resizing
- Modern development setup using Vite

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
- `package.json` - Project configuration and dependencies

## Technologies Used

- [Three.js](https://threejs.org/) - 3D graphics library
- [Vite](https://vitejs.dev/) - Next generation frontend tooling

## License

ISC