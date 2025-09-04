import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8001,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          'office-docs': ['mammoth', 'docx'],
          'export-utils': ['jspdf', 'html2canvas', 'file-saver'],
          'pdf-parser': ['pdfjs-dist']
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'mammoth',
      'docx',
      'file-saver',
      'jspdf',
      'html2canvas',
      'pdfjs-dist'
    ],
  },
}));
