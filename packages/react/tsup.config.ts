import { defineConfig } from "tsup";
import { vanillaExtractPlugin } from "@vanilla-extract/esbuild-plugin";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "theme-hooks": "src/theme-hooks.ts"
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"],
  esbuildPlugins: [vanillaExtractPlugin()]
});
