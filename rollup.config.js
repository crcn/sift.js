// rollup.config.js
import typescript from "rollup-plugin-typescript2";
import { terser } from "rollup-plugin-terser";

export default {
  input: "./src/index.ts",
  output: {
    file: "sift.min.js",
    format: "es"
  },
  plugins: [
    terser(),
    typescript({
      useTsconfigDeclarationDir: true,
      tsconfig: "tsconfig.rollup.json"
    })
  ]
};
