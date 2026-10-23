// SPEC-219/223: PDF "Termo de Empréstimo de Peças" (cópia do Showroom — manter os dois iguais). Mesmo visual do PDF do
// pedido de compra da Compras (SPEC-211, src/lib/pdf-pedido-fornecedor-desenho.ts): logo + dados
// da empresa à esquerda, número à direita, bloco do cliente, tabela de peças, caixa de total.
// Gerado no navegador (pdf-lib, carregada só no clique).
import type { PDFDocument as TPDFDocument } from 'pdf-lib'
import logoImg from '@/assets/lucenera-vertical-527dd.png'
import { numeroEmprestimo, type EmprestimoDetalhe, type FotoEmprestimo } from '@/services/emprestimosService'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
function dia(v: string | null | undefined) {
  if (!v) return '-'
  const [a, m, d] = String(v).slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

// Texto da SPEC-219 ("Texto do termo"). [EMPRESA] = nome da empresa escolhida.
function clausulas(empresa: string, comFotos: boolean): string[] {
  return [
    `1. O CLIENTE recebe as peças listadas acima, a título de empréstimo gratuito, e declara que as recebeu em perfeito estado de conservação e funcionamento${
      comFotos ? ', conforme as fotos anexas a este termo, que dele fazem parte' : ''
    }.`,
    '2. O CLIENTE se compromete a devolver as peças até a data prevista de devolução, no mesmo estado em que as recebeu, com embalagens e acessórios.',
    '3. Em caso de dano, perda, furto ou extravio causado pelo CLIENTE ou ocorrido enquanto as peças estiverem sob sua responsabilidade, o CLIENTE pagará o valor integral da peça indicado neste termo.',
    `4. As peças continuam sendo propriedade da ${empresa} e não podem ser vendidas, cedidas ou emprestadas a terceiros.`,
    `5. A conferência na devolução será feita pela ${empresa}, que registrará o estado de cada peça.`,
  ]
}

/** fotosSaida: JPEGs de como as peças saíram (viram anexo, com rubrica do cliente). */
export async function gerarPdfTermoEmprestimo(
  emp: EmprestimoDetalhe,
  logo: string | null,
  fotosSaida: Uint8Array[] = [],
): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
  const pdf: TPDFDocument = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const cinza = rgb(0.4, 0.4, 0.4)

  // Helvetica padrão só tem o conjunto WinAnsi (acentos do português ok); troca o resto por '?'.
  const limpo = (t: unknown) =>
    Array.from(String(t ?? ''))
      .map((ch) => {
        try {
          font.encodeText(ch)
          return ch
        } catch {
          return '?'
        }
      })
      .join('')
  // corta o texto para caber na largura (com "...")
  const caber = (t: unknown, f: typeof font, size: number, max: number) => {
    let s = limpo(t)
    if (f.widthOfTextAtSize(s, size) <= max) return s
    while (s.length > 1 && f.widthOfTextAtSize(`${s}...`, size) > max) s = s.slice(0, -1)
    return `${s}...`
  }
  // quebra em linhas pela largura
  const quebrar = (t: unknown, f: typeof font, size: number, max: number) => {
    const linhas: string[] = []
    for (const par of String(t ?? '').split(/\r?\n/).map(limpo)) {
      let atual = ''
      for (const palavra of par.split(/\s+/)) {
        const tenta = atual ? `${atual} ${palavra}` : palavra
        if (f.widthOfTextAtSize(tenta, size) > max && atual) {
          linhas.push(atual)
          atual = palavra
        } else atual = tenta
      }
      linhas.push(atual)
    }
    return linhas
  }

  let page = pdf.addPage([595.28, 841.89])
  const { width, height } = page.getSize()
  const novaPagina = () => {
    page = pdf.addPage([595.28, 841.89])
    return height - 50
  }

  // ---------- Cabeçalho: logo + empresa que empresta ----------
  let textY = height - 15
  if (logo) {
    try {
      const bytes = Uint8Array.from(atob(logo.split(',')[1]), (c) => c.charCodeAt(0))
      const img = await pdf.embedPng(bytes)
      const escala = Math.min(110 / img.width, 50 / img.height)
      const w = img.width * escala
      const h = img.height * escala
      page.drawImage(img, { x: 40, y: height - 15 - h, width: w, height: h })
      textY = height - 15 - h - 14
    } catch {
      /* sem logo */
    }
  }
  const e = emp.empresa
  const nomeEmpresa = e.razao_social || e.nome
  const linhasEmpresa = [
    e.razao_social && e.razao_social !== e.nome ? e.razao_social : null,
    e.cnpj ? `CNPJ: ${e.cnpj}${e.inscricao_estadual ? `  IE: ${e.inscricao_estadual}` : ''}` : null,
    [e.logradouro, e.numero, e.complemento].filter(Boolean).join(', ') || null,
    [e.bairro, e.cidade && `${e.cidade}/${e.estado || ''}`, e.cep && `CEP ${e.cep}`]
      .filter(Boolean)
      .join(' - ') || null,
    '(16) 3442 - 3545',
  ].filter(Boolean) as string[]
  page.drawText(caber(e.nome, bold, 10, 300), { x: 40, y: textY, size: 10, font: bold })
  linhasEmpresa.forEach((l, i) =>
    page.drawText(caber(l, font, 8, 300), { x: 40, y: textY - 10 * (i + 1), size: 8, font }),
  )
  const fimEmpresaY = textY - 10 * linhasEmpresa.length

  // ---------- Direita: número e datas ----------
  const topo = height - 40
  page.drawText('Termo de Empréstimo', { x: width - 200, y: topo, size: 11, font })
  page.drawText(numeroEmprestimo(emp.numero), { x: width - 200, y: topo - 18, size: 15, font: bold })
  page.drawText(`Data do empréstimo: ${dia(emp.data_emprestimo)}`, {
    x: width - 200,
    y: topo - 34,
    size: 8,
    font,
  })
  page.drawText(
    `Data Impressão ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    { x: width - 200, y: topo - 45, size: 6, font, color: cinza },
  )

  let y = Math.min(fimEmpresaY, topo - 45) - 15
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 2 })

  // ---------- Título ----------
  y -= 25
  const titulo = 'TERMO DE EMPRÉSTIMO DE PEÇAS'
  page.drawText(titulo, { x: (width - bold.widthOfTextAtSize(titulo, 13)) / 2, y, size: 13, font: bold })

  // ---------- Cliente ----------
  y -= 25
  const cli = emp.cliente
  page.drawText('Cliente', { x: 40, y, size: 9, font })
  page.drawText(caber(String(cli.nome || '').toUpperCase(), bold, 12, width - 80), {
    x: 40,
    y: y - 16,
    size: 12,
    font: bold,
  })
  let fy = y - 30
  const linhaCli = (t: string | null) => {
    if (!t) return
    page.drawText(caber(t, font, 9, width - 80), { x: 40, y: fy, size: 9, font })
    fy -= 12
  }
  if (cli.razao_social && cli.razao_social !== cli.nome) linhaCli(cli.razao_social)
  linhaCli(cli.cpf_cnpj ? `CPF/CNPJ: ${cli.cpf_cnpj}` : null)
  linhaCli([cli.endereco, cli.numero, cli.complemento, cli.bairro].filter(Boolean).join(', ') || null)
  linhaCli(
    [cli.cep && `CEP: ${cli.cep}`, cli.cidade && `${cli.cidade}${cli.estado ? `/${cli.estado}` : ''}`]
      .filter(Boolean)
      .join(' - ') || null,
  )
  linhaCli(`TEL: ${cli.telefone || '-'}${cli.email ? `   E-MAIL: ${cli.email}` : ''}`)

  // ---------- Prazo ----------
  y = fy - 12
  page.drawText('Data prevista de devolução', { x: 40, y, size: 9, font })
  page.drawText(dia(emp.data_prevista_devolucao), { x: 40, y: y - 13, size: 11, font: bold })
  y -= 35

  // ---------- Peças ----------
  const col = { cod: 40, ref: 85, desc: 175, qtd: 430, unit: 495, sub: width - 40 }
  const cabecalho = () => {
    page.drawText('Código', { x: col.cod, y, size: 9, font: bold })
    page.drawText('Referência', { x: col.ref, y, size: 9, font: bold })
    page.drawText('Peça', { x: col.desc, y, size: 9, font: bold })
    const dir = (t: string, x: number) =>
      page.drawText(t, { x: x - bold.widthOfTextAtSize(t, 9), y, size: 9, font: bold })
    dir('Qtd.', col.qtd)
    dir('Vl. Unit.', col.unit)
    dir('Valor', col.sub)
    y -= 10
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1 })
    y -= 15
  }
  cabecalho()

  let total = 0
  for (const i of emp.itens) {
    if (y < 60) {
      y = novaPagina()
      cabecalho()
    }
    const sub = i.quantidade * i.valor_unitario
    total += sub
    page.drawText(caber(i.codigo_produto, bold, 8, col.ref - col.cod - 4), { x: col.cod, y, size: 8, font: bold })
    page.drawText(caber(i.referencia || '-', font, 8, col.desc - col.ref - 4), { x: col.ref, y, size: 8, font })
    page.drawText(caber(i.nome, font, 8, col.qtd - col.desc - 30), { x: col.desc, y, size: 8, font })
    const dir = (t: string, x: number) =>
      page.drawText(t, { x: x - font.widthOfTextAtSize(t, 8), y, size: 8, font })
    dir(String(i.quantidade), col.qtd)
    dir(brl(i.valor_unitario), col.unit)
    dir(brl(sub), col.sub)
    y -= 15
  }
  y -= 5

  // ---------- Total ----------
  if (y - 40 < 60) y = novaPagina()
  page.drawRectangle({ x: width - 270, y: y - 25, width: 230, height: 30, color: rgb(0.95, 0.95, 0.95) })
  const tTotal = brl(total)
  page.drawText('Valor total das peças:', { x: width - 260, y: y - 15, size: 10, font: bold })
  page.drawText(tTotal, { x: width - 50 - bold.widthOfTextAtSize(tTotal, 11), y: y - 15, size: 11, font: bold })
  y -= 50

  // ---------- Observações ----------
  if (emp.observacoes) {
    if (y < 80) y = novaPagina()
    page.drawText('OBSERVAÇÕES:', { x: 40, y, size: 9, font: bold })
    y -= 13
    for (const l of quebrar(emp.observacoes, font, 8, width - 80)) {
      if (y < 40) y = novaPagina()
      page.drawText(l, { x: 40, y, size: 8, font })
      y -= 11
    }
    y -= 10
  }

  // ---------- Cláusulas ----------
  if (y < 120) y = novaPagina()
  page.drawText('CONDIÇÕES DO EMPRÉSTIMO', { x: 40, y, size: 9, font: bold })
  y -= 14
  for (const c of clausulas(nomeEmpresa, fotosSaida.length > 0)) {
    for (const l of quebrar(c, font, 8.5, width - 80)) {
      if (y < 40) y = novaPagina()
      page.drawText(l, { x: 40, y, size: 8.5, font })
      y -= 11
    }
    y -= 4
  }

  // ---------- Local, data e assinaturas ----------
  if (y < 130) y = novaPagina()
  y -= 15
  const local = `${e.cidade || 'Ribeirão Preto'}/${e.estado || 'SP'}, ${dia(emp.data_emprestimo)}.`
  page.drawText(limpo(local), { x: 40, y, size: 9, font })
  y -= 55
  const larg = (width - 80 - 40) / 2
  const assinatura = (x: number, linha1: string, linha2: string | null) => {
    page.drawLine({ start: { x, y }, end: { x: x + larg, y }, thickness: 1 })
    page.drawText(caber(linha1, bold, 8.5, larg), { x, y: y - 12, size: 8.5, font: bold })
    if (linha2) page.drawText(caber(linha2, font, 8, larg), { x, y: y - 23, size: 8, font })
  }
  assinatura(40, `CLIENTE: ${cli.nome || ''}`, cli.cpf_cnpj ? `CPF/CNPJ: ${cli.cpf_cnpj}` : null)
  assinatura(40 + larg + 40, nomeEmpresa, 'Responsável')

  // ---------- Anexo: fotos de como as peças saíram (4 por página, 2x2) ----------
  const imagens: Awaited<ReturnType<typeof pdf.embedJpg>>[] = []
  for (const bytes of fotosSaida) {
    try {
      imagens.push(await pdf.embedJpg(bytes))
    } catch {
      /* foto ilegível: pula */
    }
  }
  const celW = (width - 80 - 20) / 2
  const celH = 300
  for (let k = 0; k < imagens.length; k++) {
    if (k % 4 === 0) {
      y = novaPagina() + 15
      const t = `ANEXO — FOTOS DE COMO AS PEÇAS SAÍRAM (${numeroEmprestimo(emp.numero)})`
      page.drawText(limpo(t), { x: 40, y, size: 10, font: bold })
      page.drawText(
        limpo(`Data do empréstimo: ${dia(emp.data_emprestimo)}. Este anexo faz parte do termo de empréstimo.`),
        { x: 40, y: y - 13, size: 8, font, color: cinza },
      )
      // rubrica do cliente no rodapé de cada página do anexo
      page.drawLine({ start: { x: width - 220, y: 45 }, end: { x: width - 40, y: 45 }, thickness: 1 })
      page.drawText('Rubrica do cliente', { x: width - 220, y: 34, size: 8, font })
    }
    const img = imagens[k]
    const pos = k % 4
    const cx = 40 + (pos % 2) * (celW + 20)
    const topoCel = y - 30 - Math.floor(pos / 2) * (celH + 20)
    const escala = Math.min(celW / img.width, celH / img.height)
    const w = img.width * escala
    const h = img.height * escala
    page.drawImage(img, { x: cx + (celW - w) / 2, y: topoCel - h, width: w, height: h })
  }

  // numeração "1 de N" no canto de cada página
  const paginas = pdf.getPages()
  paginas.forEach((pg, i) => {
    const t = `${i + 1} de ${paginas.length}`
    pg.drawText(t, { x: width - 40 - bold.widthOfTextAtSize(t, 9), y: height - 15, size: 9, font: bold })
  })

  return await pdf.save()
}

// O PNG da logo tem ~17-22% de margem transparente; recorte medido no arquivo de 1920x1512
// (mesmo recorte do PDF de pedido da Compras e de src/lib/pdf-logo.ts do Orçamentos).
const CROP = { x: 329, y: 329, width: 1262, height: 854 }

function logoRecortada(): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = CROP.width
      canvas.height = CROP.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(null)
      ctx.drawImage(img, CROP.x, CROP.y, CROP.width, CROP.height, 0, 0, CROP.width, CROP.height)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = logoImg
  })
}

function nomeArquivo(emp: EmprestimoDetalhe) {
  const cliente = (emp.cliente.nome || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40)
    .replace(/_$/, '')
  return `Termo_Emprestimo_${numeroEmprestimo(emp.numero)}${cliente ? `_${cliente}` : ''}.pdf`
}

async function baixarFoto(f: FotoEmprestimo): Promise<Uint8Array | null> {
  if (!f.url) return null
  try {
    const r = await fetch(f.url)
    if (!r.ok) return null
    return new Uint8Array(await r.arrayBuffer())
  } catch {
    return null
  }
}

export async function baixarTermoEmprestimo(emp: EmprestimoDetalhe, fotosSaida: FotoEmprestimo[] = []) {
  const [logo, fotos] = await Promise.all([logoRecortada(), Promise.all(fotosSaida.map(baixarFoto))])
  const bytes = await gerarPdfTermoEmprestimo(
    emp,
    logo,
    fotos.filter((f): f is Uint8Array => !!f),
  )
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo(emp)
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
