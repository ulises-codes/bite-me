const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  devtool: 'inline-source-map',
  devServer: {
    hot: false,
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|jpg|gif|mp3)$/,

        type: 'asset/resource',
      },
    ],
  },
  entry: './index.tsx',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      inject: false,
      templateContent: ({ htmlWebpackPlugin }) => `
    <html>
      <body>
        <div id="root"></div>
        ${htmlWebpackPlugin.tags.bodyTags}
      </body>
    </html>
  `,
    }),
  ],
};
