/** @type {import('tailwindcss').Config} */
export const content = [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
];
export const theme = {
  extend: {
    colors: {
      'e-ride-purple': "rgb(78, 78, 74)",

      customPink: " #22CE4DFF",
      customGreen: " #373B0BFF",
      activeColor: "#323327FF"
    },
  },
};
export const plugins = [];
