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
          "register",
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
          "driver-login",
          "driver",
        ].map((page) => [page, resolve(import.meta.dirname, `${page}.html`)]),
      ),
    },
  },
});
