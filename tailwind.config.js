/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",     // ✅ app directory (Next.js App Router)
    "./components/**/*.{js,ts,jsx,tsx}", // ✅ components directory
    "./pages/**/*.{js,ts,jsx,tsx}",   // ✅ optional (if you still have pages/)
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
