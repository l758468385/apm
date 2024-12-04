const path = require('path');
const baseConfig = require('../webpack.config.js');

module.exports = {
  ...baseConfig,
  mode: 'development',
  devtool: 'source-map',
  output: {
    ...baseConfig.output,
    path: path.resolve(__dirname, 'dist')
  }
}; 