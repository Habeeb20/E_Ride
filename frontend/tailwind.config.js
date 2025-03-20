/** @type {import('tailwindcss').Config} */
export const content = [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
];
export const theme = {
  extend: {
    colors: {
      'e-ride-purple': "rgb(78, 78, 74)",

      customPink: " #BDCE22FF",
      customGreen: " #545C0CFF",
      activeColor: "rgb(78, 78, 74)"
    },
  },
};
export const plugins = [];
