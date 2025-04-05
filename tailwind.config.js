/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './interface/src/**/*.{js,ts,jsx,tsx}', // Scan interface/src for Tailwind classes
    ],
    theme: {
      extend: {
        colors: {
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          card: 'hsl(var(--card))',
          'card-foreground': 'hsl(var(--card-foreground))',
          popover: 'hsl(var(--popover))',
          'popover-foreground': 'hsl(var(--popover-foreground))',
          primary: 'hsl(var(--primary))',
          'primary-foreground': 'hsl(var(--primary-foreground))',
          secondary: 'hsl(var(--secondary))',
          'secondary-foreground': 'hsl(var(--secondary-foreground))',
          muted: 'hsl(var(--muted))',
          'muted-foreground': 'hsl(var(--muted-foreground))',
          accent: 'hsl(var(--accent))',
          'accent-foreground': 'hsl(var(--accent-foreground))',
          destructive: 'hsl(var(--destructive))',
          'destructive-foreground': 'hsl(var(--destructive-foreground))',
          border: 'hsl(var(--border))',
          input: 'hsl(var(--input))',
          ring: 'hsl(var(--ring))',
          'console-bg': 'hsl(var(--console-bg))',
          'console-fg': 'hsl(var(--console-fg))',
          'console-accent': 'hsl(var(--console-accent))',
          'console-highlight': 'hsl(var(--console-highlight))',
          'console-muted': 'hsl(var(--console-muted))',
          'console-border': 'hsl(var(--console-border))',
          'art-primary': 'hsl(var(--art-primary))',
          'art-secondary': 'hsl(var(--art-secondary))',
          'art-accent': 'hsl(var(--art-accent))',
          'art-muted': 'hsl(var(--art-muted))',
        },
        borderRadius: {
          DEFAULT: 'var(--radius)',
        },
      },
    },
    plugins: [],
  };