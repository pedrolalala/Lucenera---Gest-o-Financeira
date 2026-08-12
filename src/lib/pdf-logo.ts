import logoImg from '@/assets/lucenera-vertical-527dd.png'

let cachedLogoBase64: string | null = null

// O PNG original (lucenera-vertical-527dd.png, também usado em
// Header.tsx/BudgetFormPage.tsx) tem ~17-22% de margem transparente
// simétrica ao redor do logo de verdade — boa pra um ícone de app, mas
// fazia o logo desenhado no PDF do orçamento sair pequeno demais e
// desalinhado (não flush) com o texto da empresa logo abaixo. Recorte
// medido uma vez (bounding box do conteúdo opaco) numa imagem
// 1920x1512 — se o arquivo de origem for trocado, essas coordenadas
// precisam ser remedidas.
const CROP = { x: 329, y: 329, width: 1262, height: 854 }

function cropLogo(): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = CROP.width
      canvas.height = CROP.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context indisponível'))
        return
      }
      ctx.drawImage(
        img,
        CROP.x,
        CROP.y,
        CROP.width,
        CROP.height,
        0,
        0,
        CROP.width,
        CROP.height,
      )
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = logoImg
  })
}

// Converte o logo (recortado, sem a margem transparente) pra data URL
// base64 — formato que a Edge Function `generate-report` espera em
// `filters.logoBase64` pra embutir no cabeçalho do PDF do orçamento.
// Sem isso, o PDF sai sem logo (a Edge Function só desenha a imagem se
// receber `logoBase64`, mesmo já tendo toda a lógica pronta).
export async function getLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64) return cachedLogoBase64
  try {
    const base64 = await cropLogo()
    cachedLogoBase64 = base64
    return base64
  } catch (error) {
    console.error('Erro ao carregar logo para o PDF', error)
    return null
  }
}
