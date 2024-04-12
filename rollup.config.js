import ts from "@rollup/plugin-typescript";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";

const config = (options) => {
  const extraOutput = options.file
    ? { file: options.file }
    : { dir: options.dir || options.format };
  return {
    input: "src/index.ts",
    output: {
      sourcemap: true,
      ...extraOutput,
      format: options.format,
      name: options.name,
      plugins: options.outputPlugins,
      exports: "named",
    },
    plugins: [
      ts({
        declaration: false,
        module: "es2015",
        target: options.target || "es5",
      }),
      ...(options.plugins || []),
    ],
  };
};

export default [
  config({ format: "es", target: "es6" }),
  config({ format: "es", dir: "es5m" }),
  config({ format: "umd", name: "sift", dir: "lib" }),
  config({
    format: "umd",
    name: "sift",
    file: "sift.min.js",
    outputPlugins: [
      terser({
        mangle: {
          properties: {
            regex: /^_\w/,
          },
        },
      }),
    ],
  }),
  config({
    format: "umd",
    name: "sift",
    file: "sift.csp.min.js",
    plugins: [replace({ "process.env.CSP_ENABLED": "true" })],
  }),
];
