const { DefinePlugin } = require("webpack");

module.exports = {
  devtool: "source-map",
  mode: "production",
  entry: {
    index: [__dirname + "/src/index.js"]
  },
  output: {
    path: __dirname,
    library: "sift",
    libraryTarget: "umd",
    globalObject: "this",
    filename: `sift.${process.env.CSP_ENABLED ? "csp." : ""}min.js`
  },
  resolve: {
    extensions: [".js"]
  },
  module: {
    rules: []
  },
  plugins: [
    new DefinePlugin({
      "process.env.CSP_ENABLED": JSON.stringify(
        process.env.CSP_ENABLED || false
      )
    })
  ]
};
