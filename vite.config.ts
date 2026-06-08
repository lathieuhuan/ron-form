/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import checker from "vite-plugin-checker";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    checker({
      typescript: true,
    }),
  ],
  resolve: {
    alias: {
      "@lib": path.resolve(__dirname, "./lib"),
      "@src": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    root: "./",
    typecheck: {
      exclude: ["src", "lib/react"],
      include: ["lib/**/*.test-d.ts"],
      tsconfig: "tsconfig.vitest.json",
    },
  },
});
