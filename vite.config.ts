import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          icons: ["react-iconly"],
          scanner: ["html5-qrcode"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("firebase")) {
            return "firebase";
          }

          if (id.includes("react-router")) {
            return "router";
          }

          if (id.includes("react-iconly")) {
            return "icons";
          }

          if (
            id.includes("react") ||
            id.includes("scheduler")
          ) {
            return "react-vendor";
          }

          if (
            id.includes("qrcode.react") ||
            id.includes("html5-qrcode")
          ) {
            return "qr-tools";
          }
        },
      },
    },
  },
});
