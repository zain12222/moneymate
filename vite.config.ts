
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['moneymate.svg'],
      manifest: {
        name: 'MoneyMate - Budget Tracker',
        short_name: 'MoneyMate',
        description: 'Track expenses, manage budgets and save money.',
        theme_color: '#101020',
        background_color: '#101020',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/moneymate.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      }
    })
  ]
});
