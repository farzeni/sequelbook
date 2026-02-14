import react from "@vitejs/plugin-react"
import { resolve } from "path"
import { defineConfig } from "vite"

console.log(resolve(__dirname, "./src"))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/"),
      "@lib": resolve(__dirname, "src/lib/"),
      "@hooks": resolve(__dirname, "src/hooks/"),
      "@components": resolve(__dirname, "src/components/"),
      "@assets": resolve(__dirname, "src/assets/"),
      "@store": resolve(__dirname, "src/store/"),
      "@app": resolve(__dirname, "src/app/"),
    },
  },
})
