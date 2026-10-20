const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Override to prevent Windows path issues with node: modules
config.resolver = {
  ...config.resolver,
  extraNodeModules: new Proxy({}, {
    get: (target, name) => {
      if (typeof name === 'string' && name.startsWith('node:')) {
        return path.join(__dirname, 'node_modules', name.replace('node:', ''));
      }
      return path.join(__dirname, 'node_modules', name);
    }
  })
};

module.exports = config;
