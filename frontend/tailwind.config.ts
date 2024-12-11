import type { Config } from "tailwindcss";

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		textColor: {
  			skin: {
  				primary: 'var(--color-text-primary)'
  			}
  		},
  		backgroundColor: {
  			skin: {
  				primary: 'var(--color-background-primary)',
  				secondary: 'var(--color-background-secondary)',
				'primary-hover': 'var(--color-background-primary-hover)',
  			}
  		},
		borderColor: {
			skin: {
				'navigation-tree': 'var(--color-text-primary)',
			}
		},
  	}
  },
  plugins: [require("tailwindcss-animate"), require('@tailwindcss/typography')],
} satisfies Config;

