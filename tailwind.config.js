/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: {
          950: "#02120b",
          900: "#062419",
          850: "#083323",
          800: "#0b452f",
          700: "#0f5e3f",
          600: "#157d54",
        },
        gold: {
          400: "#fcd34d",
          500: "#f59e0b",
          600: "#d97706",
        },
        action: {
          hit: "#2563eb",
          stand: "#059669",
          double: "#d97706",
          split: "#8b5cf6",
          surrender: "#dc2626",
        }
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      animation: {
        "deal-card": "dealCard 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-subtle": "pulseSubtle 2s infinite ease-in-out",
        "bounce-short": "bounceShort 0.4s ease-out",
      },
      keyframes: {
        dealCard: {
          "0%": { opacity: "0", transform: "translateY(-30px) scale(0.92) rotate(-3deg)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1) rotate(0deg)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.75" },
        },
        bounceShort: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        }
      }
    },
  },
  plugins: [],
};
