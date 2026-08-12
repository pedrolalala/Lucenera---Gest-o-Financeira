import logoImg from '@/assets/lucenera-vertical-527dd.png'

let cachedLogoBase64: string | null = null

// Converte o logo vertical (já usado no cabeçalho do app) pra data URL
// base64 — formato que a Edge Function `generate-report` espera em
// `filters.logoBase64` pra embutir no cabeçalho do PDF do orçamento.
// Sem isso, o PDF sai sem logo (a Edge Function só desenha a imagem se
// receber `logoBase64`, mesmo já tendo toda a lógica pronta).
export async function getLogoBase64(): Promise<string | null> {
  if (cachedLogoBase64) return cachedLogoBase64
  try {
    const response = await fetch(logoImg)
    const blob = await response.blob()
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    cachedLogoBase64 = base64
    return base64
  } catch (error) {
    console.error('Erro ao carregar logo para o PDF', error)
    return null
  }
}
