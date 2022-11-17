const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
module.exports = {
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "trash.js",
  },

  module: {
    rules: [
      {
        test: /\.png$/,
        type: "asset/resource",
      },
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      {
        test: /\.(css)$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "./index.html",
    }),
  ],
};
