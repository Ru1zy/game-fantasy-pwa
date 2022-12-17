const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'trash.js',
  },
  devServer: { open: { app: { name: 'firefox' } } },
  module: {
    rules: [
      {
        test: /\.png$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.(css)$/,
        use: ['style-loader', 'css-loader'],
      },

      {
        test: /\.mp3$/,
        use: ['file-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: './index.html',
      meta: {
        'og:image': { property: 'og:image', content: './src/img/banner.png' },
      },
    }),
    new CopyPlugin({
      patterns: [
        { from: './src/favicon.ico', to: '' },
        { from: './src/manifest.json', to: '' },
        { from: './src/logo192.png', to: '' },
        { from: './src/logo512.png', to: '' },
      ],
    }),
    new WorkboxPlugin.InjectManifest({
      swSrc: './src/src-sw.js',
      swDest: 'sw.js',
    }),
  ],
};
