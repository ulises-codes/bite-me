const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: {
    offscreen: {
      import: './offscreen/index.tsx',
      filename: './offscreen/index.js',
    },
    snake: {
      import: './snake/index.tsx',
      filename: './snake/index.js',
    },
  },
  devtool: 'inline-source-map',
  module: {
    rules: [
      // {
      //   test: /\.worker\.ts$/,
      //   use: { loader: 'worker-loader' },
      // },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.d.ts'],
  },
  output: {
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
  },
  // optimization: {
  //   splitChunks: {
  //     chunks: 'all',
  //   },
  //   runtimeChunk: 'single',
  // },
  externals: {
    react: 'react',
  },
  plugins: [new CleanWebpackPlugin()],
};
