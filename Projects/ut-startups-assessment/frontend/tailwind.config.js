/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable dark mode based on the 'dark' class on the HTML element
    theme: {
        extend: {},
    },
    plugins: [],
}