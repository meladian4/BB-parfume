import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        bb: {
          dark: "#090D16",
          card: "#0F172A",
          surface: "#162036",
          border: "#1E293B",
          gold: "#D4AF37",
          goldLight: "#F3E5AB",
          goldDark: "#997D22",
          champagne: "#E5C365",
          bronze: "#C59B27",
          cream: "#FAF8F5",
        },
      },
    },
  },
  plugins: [],
};
export default config;
