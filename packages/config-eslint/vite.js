import reactRefresh from "eslint-plugin-react-refresh";
import { config as reactConfig } from "./react.js";

const viteComponentFiles = ["**/*.{ts,tsx,js,jsx}"];

const reactRefreshViteConfig = {
  files: viteComponentFiles,
  plugins: {
    ...(reactRefresh.configs.vite.plugins ?? {}),
  },
  rules: {
    ...(reactRefresh.configs.vite.rules ?? {}),
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
  },
};

export default [...reactConfig, reactRefreshViteConfig];
