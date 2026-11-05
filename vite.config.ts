import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        [
          "index",
          "faq",
          "pricing",
          "contact",
          "login",
          "dashboard",
          "profile",
          "create-ad",
          "advertisements",
          "view-ad",
          "payments",
          "admin-login",
          "admin",
        ].map((page) => [page, resolve(import.meta.dirname, `${page}.html`)]),
      ),
    },
  },
});
