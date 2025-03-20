/** @type {import('tailwindcss').Config} */
export const content = [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
];
export const theme = {
  extend: {
    colors: {
      'e-ride-purple': '#9333EA',

      customPink: " #BDCE22FF",
      activeColor: "rgb(78, 78, 74)"
    },
  },
};
export const plugins = [];
