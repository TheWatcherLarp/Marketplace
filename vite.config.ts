import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { readFileSync } from 'fs'; // Import fs to read package.json

export default defineConfig(() => {
  // Read package.json to get the homepage field
  const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));
  const homepage = packageJson.homepage;

  // Determine the base path for GitHub Pages
  // It should be the repository name, extracted from the homepage URL
  let base = '/';
  if (homepage) {
    try {
      const url = new URL(homepage);
      base = url.pathname; // This will give you '/YOUR_REPOSITORY_NAME/'
    } catch (e) {
      console.warn('Invalid homepage URL in package.json, using default base "/"');
    }
  }

  return {
    base: base, // Set the base path here
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [dyadComponentTagger(), react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});