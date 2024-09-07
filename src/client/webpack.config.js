const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const AutoImport = require('unplugin-auto-import/webpack');
const Components = require('unplugin-vue-components/webpack');
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers');
const Dotenv = require('dotenv-webpack');

const cwd = process.cwd();

module.exports = [
  {
    mode: 'production',
    entry: './src/client/cdp/index.js',
    output: {
      filename: 'cdp.js',
      path: path.resolve(cwd, './dist'),
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
        },
      ],
    },
    plugins: [
      new Dotenv({
        path: path.resolve(cwd, '.env'),
      }),
    ],
  },
  {
    mode: 'production',
    entry: './src/client/page/app.js',
    output: {
      filename: 'index.js',
      path: path.resolve(cwd, './dist/page'),
      publicPath: './dist/page'
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
        },
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader']
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.vue', '.json'],
    },
    plugins: [
      new Dotenv({
        path: path.resolve(cwd, '.env'),
      }),
      new VueLoaderPlugin(),
      new MiniCssExtractPlugin({
        filename: 'index.css'
      }),
      new HtmlWebpackPlugin({
        template: './src/client/page/index.html',
        filename: 'index.html'
      }),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ]
  }
];
