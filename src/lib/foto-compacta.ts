// SPEC-219/223 (cópia do Showroom): foto de celular costuma passar de 5 MB (limite do bucket). Antes de subir, redimensiona
// para no máximo 1600 px no lado maior e grava em JPEG. Formato que o navegador não abre
// (ex.: HEIC fora do Safari) dá erro com mensagem clara.
const LADO_MAX = 1600
const QUALIDADE = 0.82

function carregarImagem(arquivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Não foi possível abrir a foto "${arquivo.name}". Use JPG ou PNG.`))
    }
    img.src = url
  })
}

export async function compactarFoto(arquivo: File): Promise<Blob> {
  const img = await carregarImagem(arquivo)
  const escala = Math.min(1, LADO_MAX / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * escala)
  canvas.height = Math.round(img.naturalHeight * escala)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Navegador sem suporte para preparar a foto.')
  ctx.fillStyle = '#fff' // PNG transparente vira fundo branco no JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', QUALIDADE))
  if (!blob) throw new Error(`Não foi possível preparar a foto "${arquivo.name}".`)
  return blob
}
