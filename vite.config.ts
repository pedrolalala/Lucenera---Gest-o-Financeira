/* Vite config for building the frontend react app: https://vite.dev/config/ */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
// SPEC-246 (05/11): trava de build. O banco OFICIAL é o de São Paulo; o projeto antigo (Ohio) é só backup. Em 05/11 um deploy saiu apontando para o backup e a lista de
// orçamentos apareceu vazia. Em produção, se VITE_SUPABASE_URL não for São Paulo, o build FALHA e a Cloudflare mantém o site que já está no ar.
const BANCO_OFICIAL_REF = 'bgtfrcbipuxnsexbppsh'
const BANCO_ANTIGO_REF = 'vcvcwzmbiftcawncibke'
function exigirBancoOficial(mode: string) {
  if (mode !== 'production') return
  const url = loadEnv(mode, process.cwd(), '').VITE_SUPABASE_URL ?? ''
  if (!url.includes(BANCO_OFICIAL_REF)) {
    throw new Error(
      `BUILD RECUSADO: VITE_SUPABASE_URL (${url || 'vazia'}) não é o banco oficial de São Paulo (${BANCO_OFICIAL_REF})` +
        (url.includes(BANCO_ANTIGO_REF) ? ' — é o banco ANTIGO (backup).' : '.') +
        ' Corrija a variável no painel da Cloudflare (Production) e rode o deploy de novo.',
    )
  }
}

export default defineConfig(({ mode }) => {
  exigirBancoOficial(mode)
  return {
  server: {
    host: '::',
    port: 8080,
  },
  experimental: {
    enableNativePlugin: true
  },
  build: {
    minify: mode !== 'development',
    sourcemap: mode === 'development',
    rolldownOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return
        }
        warn(warning)
      },
    },
  },
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode ?? process.env.NODE_ENV ?? 'production'),
  },
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      {
        find: /zod\/v4\/core/,
        replacement: path.resolve(__dirname, 'node_modules', 'zod', 'v4', 'core'),
      }
    ],
  },
  }
})
