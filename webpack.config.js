const { DefinePlugin } = require("webpack");

module.exports = {
  devtool: "source-map",
  mode: "production",
  entry: {
    index: [__dirname + "/src/index.ts"]
  },
  output: {
    path: __dirname,
    library: "sift",
    libraryTarget: "umd",
    globalObject: "this",
    filename: `sift.${process.env.CSP_ENABLED ? "csp." : ""}min.js`
  },
  resolve: {
    extensions: [".js", ".ts"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /(node_modules|bower_components)/,
        use: ["ts-loader"]
      }
    ]
  },
  plugins: [
    new DefinePlugin({
      "process.env.CSP_ENABLED": JSON.stringify(
        process.env.CSP_ENABLED || false
      )
    })
  ]
};
