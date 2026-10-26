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
        desk: '#F6F7F9',
        paper: '#FFFFFF',
        surface: '#FFFFFF',
        bg: '#FCFCFC',
        card: '#F5F5F5',
        'card-strong': '#EDEDED',
        ink: {
          DEFAULT: '#1B2431',
          2: '#3D4656',
          3: '#5B6472',
        },
        border: 'rgba(11, 11, 11, 0.08)',
        'border-strong': 'rgba(11, 11, 11, 0.16)',
        rule: '#E6E8EC',
        primary: {
          DEFAULT: '#0285F7',
          hover: '#0071D6',
          soft: 'rgba(2, 133, 247, 0.08)',
          text: '#0069C7',
        },
        cta: '#0062C4',
        success: {
          DEFAULT: '#00BD6C',
          soft: 'rgba(0, 189, 108, 0.08)',
          text: '#00804A',
        },
        warning: {
          DEFAULT: '#F5A500',
          soft: 'rgba(245, 165, 0, 0.10)',
          text: '#946300',
        },
        danger: {
          DEFAULT: '#EE343B',
          soft: 'rgba(238, 52, 59, 0.08)',
          text: '#C4161D',
        },
        violet: {
          DEFAULT: '#A37AFF',
          soft: 'rgba(163, 122, 255, 0.10)',
          text: '#6B3FE0',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
      },
      fontFamily: {
        sans: ['Inter', 'Geist', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Geist Mono', 'monospace'],
        display: ['Newsreader', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
