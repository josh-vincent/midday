import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "providers/index": "src/providers/index.ts",
    "storage/index": "src/storage/index.ts",
    "utils/events": "src/utils/events.ts",
    "utils/retry": "src/utils/retry.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
});
