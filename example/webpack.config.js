const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const pak = require('../package.json');

const root = path.resolve(__dirname, '..');

const compileNodeModules = [
  'react-native',
  'react-native-web',
  'react-native-web-webview',
  'react-native-webview',
].map((m) => path.resolve(__dirname, 'node_modules', m));

module.exports = (_env, argv) => {
  const isProd = argv && argv.mode === 'production';
  return {
    mode: isProd ? 'production' : 'development',
    entry: path.resolve(__dirname, 'index.web.js'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.[contenthash].js',
      publicPath: '/',
      clean: true,
    },
    resolve: {
      alias: {
        'react-native$': 'react-native-web',
        'react-native-webview$': 'react-native-web-webview',
        [pak.name]: path.resolve(root, pak.source),
      },
      extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
      modules: [
        path.resolve(__dirname, 'node_modules'),
        path.resolve(root, 'node_modules'),
        'node_modules',
      ],
    },
    module: {
      rules: [
        {
          test: /\.(tsx?|jsx?)$/,
          include: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'index.web.js'),
            path.resolve(root, 'src'),
            ...compileNodeModules,
          ],
          use: {
            loader: 'babel-loader',
            options: {
              configFile: false,
              babelrc: false,
              presets: [
                ['@babel/preset-env', { targets: 'defaults' }],
                ['@babel/preset-react', { runtime: 'classic' }],
                '@babel/preset-typescript',
                '@babel/preset-flow',
              ],
              plugins: [
                ['@babel/plugin-proposal-class-properties', { loose: true }],
              ],
            },
          },
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: 'asset/resource',
        },
        {
          test: /postMock\.html$/,
          use: {
            loader: 'file-loader',
            options: { name: '[name].[ext]' },
          },
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(!isProd),
        'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
      }),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'web/index.html'),
      }),
    ],
    devServer: {
      static: { directory: path.resolve(__dirname, 'dist') },
      historyApiFallback: true,
      port: 8082,
      open: true,
      hot: true,
    },
  };
};
