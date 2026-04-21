import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'vendor-react';
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
