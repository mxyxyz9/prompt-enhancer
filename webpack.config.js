const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
  entry: './background.js',
  output: {
    filename: 'background.bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'production',
  resolve: {
    extensions: ['.js']
  },
  plugins: [
    new Dotenv({
      path: './.env',
      safe: true,
      systemvars: true
    })
  ]
};