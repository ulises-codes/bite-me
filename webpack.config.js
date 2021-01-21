const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: {
    index: './index.ts',
    offscreen: {
      import: './offscreen/index.tsx',
      filename: './offscreen/index.js',
    },
    snake: {
      import: './snake/index.tsx',
      filename: './snake/index.js',
    },
  },
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
    extensions: ['js', '.tsx', '.ts', 'd.ts'],
  },
  output: {
    library: 'bite-me',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '',
  },
  devtool: false,
  externals: {
    react: 'react',
  },
  plugins: [new CleanWebpackPlugin()],
};
