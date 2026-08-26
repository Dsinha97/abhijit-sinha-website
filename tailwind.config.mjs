import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        navy: '#0F172A',
        surface: '#F8FAFC',
        surfaceAlt: '#F1F5F9',
        charcoal: '#1E293B',
        muted: '#475569',
        accent: '#1D4ED8',
      },
    },
  },
  plugins: [typography],
};
