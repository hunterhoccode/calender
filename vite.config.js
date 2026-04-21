import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('firebase/auth'))      return 'firebase-auth';
          if (id.includes('firebase/firestore')) return 'firebase-firestore';
          if (id.includes('firebase/storage'))   return 'firebase-storage';
          if (id.includes('firebase/app'))       return 'firebase-app';
          if (id.includes('@firebase'))          return 'firebase-core';
          if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react';
          if (id.includes('lucide-react'))       return 'vendor-icons';
          if (id.includes('html2canvas'))        return 'vendor-export';
          if (id.includes('marked') || id.includes('dompurify')) return 'vendor-markdown';
          if (id.includes('date-fns'))           return 'vendor-date';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
