const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  devtool:
    process.env.NODE_ENV === 'development' ? 'inline-source-map' : undefined,
  target: 'web',
  entry: {
    worker: {
      import: './src/worker.ts',
      filename: 'worker.js',
    },
    snake: {
      import: './src/snake.tsx',
      filename: 'snake.js',
    },
    offscreen: {
      import: './src/offscreen.tsx',
      filename: 'offscreen.js',
    },
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    plugins: [new TsconfigPathsPlugin()],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [new CleanWebpackPlugin()],
  externals: ['react'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: 'umd',
      name: 'BiteMe',
    },
  },
};
