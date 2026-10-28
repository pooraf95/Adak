import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#fdf8f6",
          100: "#f2e8e5",
          500: "#ea580c", // Boutique warm terracotta / amber tone
          600: "#c2410c",
          700: "#9a3412",
        },
        adak: {
          dark: "#0f172a",
          card: "#1e293b",
          border: "#334155",
          accent: "#f59e0b", // Gold/Amber luxury boutique accent
          success: "#10b981", // Cash / Full payment
          warning: "#f59e0b", // Partial payment
          danger: "#ef4444",  // Credit / Debt
        }
      },
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
