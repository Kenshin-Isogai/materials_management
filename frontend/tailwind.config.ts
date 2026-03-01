import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        body: ["'IBM Plex Sans JP'", "sans-serif"],
        display: ["'Space Grotesk'", "sans-serif"],
      },
      colors: {
        canvas: "#f4f2eb",
        ink: "#1c1d1f",
        signal: "#007568",
        brass: "#be8c3f",
        slatebrand: "#293a4f",
      },
      boxShadow: {
        panel: "0 12px 36px rgba(29, 43, 58, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
