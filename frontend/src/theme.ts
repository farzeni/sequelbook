import {
  createSystem,
  defaultConfig,
  defineConfig,
} from "@chakra-ui/react"

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        body: {
          value:
            '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        },
        heading: {
          value:
            '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        },
        mono: {
          value:
            '"Cascadia Code", "Cascadia Mono", Consolas, "Courier New", monospace',
        },
      },
      radii: {
        sm: { value: "2px" },
        md: { value: "2px" },
        lg: { value: "4px" },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: { base: "#ffffff", _dark: "#1e1e1e" } },
          subtle: { value: { base: "#f3f3f3", _dark: "#252526" } },
          muted: { value: { base: "#e8e8e8", _dark: "#2d2d2d" } },
          emphasized: { value: { base: "#d4d4d4", _dark: "#3e3e42" } },
          panel: { value: { base: "#f3f3f3", _dark: "#252526" } },
        },
        fg: {
          DEFAULT: { value: { base: "#1e1e1e", _dark: "#d4d4d4" } },
          muted: { value: { base: "#616161", _dark: "#9e9e9e" } },
          subtle: { value: { base: "#9e9e9e", _dark: "#6b6b6b" } },
        },
        border: {
          DEFAULT: { value: { base: "#e5e5e5", _dark: "#3e3e42" } },
          emphasized: { value: { base: "#c8c8c8", _dark: "#565656" } },
        },
      },
    },
  },
  globalCss: {
    body: {
      fontFamily:
        '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    },
  },
})

export const system = createSystem(defaultConfig, config)
