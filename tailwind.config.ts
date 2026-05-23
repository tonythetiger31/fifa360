import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        fifa: {
          blue: '#003DA5',
          red: '#E8112D',
          gold: '#FFD700',
        },
      },
    },
  },
  plugins: [],
};

export default config;
