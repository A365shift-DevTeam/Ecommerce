import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// .env.local lives one level up, next to the source frames.
export default defineConfig({
  envDir: "..",
  plugins: [react(), tailwindcss()],
});
