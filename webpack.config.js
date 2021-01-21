const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: {
    offscreen: {
      import: './offscreen/index.tsx',
      filename: './offscreen/index.js',
      dependOn: ['helper', 'comlink'],
    },
    snake: {
      import: './snake/index.tsx',
      filename: './snake/index.js',
      dependOn: 'helper',
    },
    helper: {
      import: './helper/index.ts',
      filename: './helper/index.js',
    },
    comlink: 'comlink',
  },
  // devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts'],
  },
  output: {
    library: 'biteMe',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    concatenateModules: false,
    splitChunks: {
      chunks: 'all',
    },
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}`,
    },
  },
  externals: {
    react: 'react',
  },
  plugins: [new CleanWebpackPlugin()],
};
