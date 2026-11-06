import { fileURLToPath } from "node:url";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [here("./index.html"), here("./src/**/*.{js,ts,jsx,tsx}")],
  theme: {
    extend: {
      colors: {
        "primary-light": "#e0f7ed",
        primary: "#21ce99",
        "primary-dark": "#1db586",
        "grey-light": "#e0eaff",
        grey: "#f1f5ff",
        "grey-dark": "#96abc6",
        "font-color": "#b4b4b4",
      },
    },
  },
  plugins: [],
};
