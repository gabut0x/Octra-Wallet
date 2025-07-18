import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://octra.network', // Default fallback
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
        configure: (proxy, options) => {
          // Handle dynamic target based on request headers
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const rpcUrl = req.headers['x-rpc-url'];
            if (rpcUrl && typeof rpcUrl === 'string') {
              try {
                const url = new URL(rpcUrl);
                
                // Update the proxy target dynamically
                proxyReq.path = url.pathname + (proxyReq.path || '');
                proxyReq.host = url.host;
                
                // Set the correct headers for the target server
                proxyReq.setHeader('Host', url.host);
                
                console.log(`Proxying request to: ${url.origin}${proxyReq.path}`);
              } catch (error) {
                console.warn('Invalid RPC URL in header:', rpcUrl);
              }
            }
          });
          
          // Handle target change dynamically
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const rpcUrl = req.headers['x-rpc-url'];
            if (rpcUrl && typeof rpcUrl === 'string') {
              try {
                const url = new URL(rpcUrl);
                // Change the target for this specific request
                proxy.options.target = url.origin;
              } catch (error) {
                console.warn('Failed to update proxy target:', error);
              }
            }
          });
        }
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer/',
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true,
        }),
      ],
    },
  },
});