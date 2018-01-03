module.exports = {
  entry: './src/regress.js',
  output: {
    filename: './src/packed.js',
    libraryExport: 'default',
    libraryTarget: 'commonjs2',
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.js$/,
        // exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        }
      }
    ]
  }
}