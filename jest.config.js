export default {
  testEnvironment: 'jsdom',
  transform: {},
  moduleNameMapper: {
    '^three$': '<rootDir>/node_modules/three/build/three.module.js'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(three)/)'
  ]
}; 