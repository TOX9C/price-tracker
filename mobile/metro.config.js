const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    alias: {
      '@': path.resolve(projectRoot, 'src'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
