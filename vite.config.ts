/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@lib": path.resolve(__dirname, "./lib"),
      "@src": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    root: "./",
    typecheck: {
      exclude: ["src", "lib/core", "lib/react"],
      include: ["lib/**/*.test-d.ts"],
      tsconfig: "tsconfig.vitest.json",
    },
  },
});
