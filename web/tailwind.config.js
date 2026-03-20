/** @type {import('tailwindcss').Config} */
export default {
 darkMode: 'class',
 content: [
 "./index.html",
 "./src/**/*.{js,ts,jsx,tsx}",
 ],
 theme: {
 extend: {
 fontFamily: {
 headline: ['Outfit', 'sans-serif'],
 body: ['Plus Jakarta Sans', 'sans-serif'],
 },
 colors: {
 border: 'hsl(var(--border))',
 input: 'hsl(var(--input))',
 ring: 'hsl(var(--ring))',
 background: 'hsl(var(--background))',
 foreground: 'hsl(var(--foreground))',
 primary: {
 DEFAULT: 'hsl(var(--primary))',
 foreground: 'hsl(var(--primary-foreground))',
 dark: 'hsl(var(--primary-dark))',
 },
 secondary: {
 DEFAULT: 'hsl(var(--secondary))',
 foreground: 'hsl(var(--secondary-foreground))',
 },
 destructive: {
 DEFAULT: 'hsl(var(--destructive))',
 foreground: 'hsl(var(--destructive-foreground))',
 },
 muted: {
 DEFAULT: 'hsl(var(--muted))',
 foreground: 'hsl(var(--muted-foreground))',
 },
 accent: {
 DEFAULT: 'hsl(var(--accent))',
 foreground: 'hsl(var(--accent-foreground))',
 },
 success: {
 DEFAULT: 'hsl(var(--success))',
 foreground: 'hsl(var(--success-foreground))',
 },
 popover: {
 DEFAULT: 'hsl(var(--popover))',
 foreground: 'hsl(var(--popover-foreground))',
 },
 card: {
 DEFAULT: 'hsl(var(--card))',
 foreground: 'hsl(var(--card-foreground))',
 },
 },
 borderRadius: {
 sm: '6px',
 md: '8px',
 lg: '10px',
 xl: '12px',
 '2xl': '16px',
 },
 boxShadow: {
 sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
 md: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
 lg: '0 4px 16px rgba(245,158,11,0.3)',
 card: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
 'card-hover': '0 4px 8px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.06)',
 glow: '0 4px 16px rgba(245,158,11,0.3)',
 'glow-lg': '0 6px 24px rgba(245,158,11,0.4)',
 },
 },
 },
 plugins: [],
}
