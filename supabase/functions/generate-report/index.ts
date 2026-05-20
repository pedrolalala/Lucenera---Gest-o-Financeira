import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

function toCSV(data: any[]) {
  if (!data || !data.length) return 'Nenhum dado encontrado'
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map((r) =>
    Object.values(r)
      .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
      .join(','),
  )
  return [headers, ...rows].join('\n')
}

async function toPDF(data: any[], title: string) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  let page = pdfDoc.addPage()
  const { height } = page.getSize()
  let y = height - 50

  page.drawText(`Relatorio: ${title.toUpperCase()}`, {
    x: 40,
    y,
    size: 16,
    font,
  })
  y -= 30

  if (!data || !data.length) {
    page.drawText('Nenhum dado encontrado.', { x: 40, y, size: 12, font })
    return await pdfDoc.save()
  }

  const headers = Object.keys(data[0])
  page.drawText(headers.join(' | '), {
    x: 40,
    y,
    size: 9,
    font,
    color: rgb(0.3, 0.3, 0.3),
  })
  y -= 20

  for (const row of data) {
    if (y < 40) {
      page = pdfDoc.addPage()
      y = height - 50
    }
    const line = Object.values(row)
      .map((v) => String(v ?? '').substring(0, 25))
      .join(' | ')
    page.drawText(line, { x: 40, y, size: 9, font })
    y -= 15
  }

  return await pdfDoc.save()
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders })

  try {
    const { reportType, format, filters } = await req.json()
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Acesso não autorizado.')

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuário não autenticado.')

    const { data: profile } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single()

    if (
      reportType !== 'orcamento' &&
      profile?.role !== 'admin' &&
      profile?.role !== 'gerente'
    ) {
      throw new Error(
        'Acesso negado. Apenas administradores e gerentes podem gerar relatórios.',
      )
    }

    if (reportType === 'orcamento') {
      const { id, logoBase64 } = filters || {}

      if (!id) throw new Error('ID do orçamento não fornecido.')

      const { data: budget, error: budgetError } = await supabase
        .from('orcamentos')
        .select(
          `
          *,
          empresa:empresas(nome, razao_social, logradouro, numero, bairro, cidade, estado, cep, cnpj),
          cliente:contatos!orcamentos_cliente_id_fkey(nome, endereco, bairro, cidade, estado, cep, telefone, celular, cpf_cnpj),
          arquiteto:contatos!orcamentos_arquiteto_id_fkey(nome),
          itens:orcamento_itens(
            id, produto_id, quantidade, preco_unitario, desconto, custom_id, item_pai_id, descricao,
            produto:produtos(nome, codigo_produto, codigo_legado, referencia, unidade)
          )
        `,
        )
        .eq('id', id)
        .single()

      if (budgetError || !budget) throw new Error('Orçamento não encontrado.')

      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      let page = pdfDoc.addPage()
      const { width, height } = page.getSize()
      let y = height - 50

      let logoBottomY = height - 40
      if (logoBase64) {
        try {
          const base64Data = logoBase64.replace(
            /^data:image\/(png|jpeg|jpg);base64,/,
            '',
          )
          const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
            c.charCodeAt(0),
          )
          let image
          if (
            logoBase64.includes('image/jpeg') ||
            logoBase64.includes('image/jpg')
          ) {
            image = await pdfDoc.embedJpg(imageBytes)
          } else {
            image = await pdfDoc.embedPng(imageBytes)
          }
          // The image needs to be larger and centered
          const imgWidth = 220
          const imgHeight = image.height * (imgWidth / image.width)
          const contentWidth = width - 80
          page.drawImage(image, {
            x: 40 + (contentWidth - imgWidth) / 2,
            y: height - 40 - imgHeight,
            width: imgWidth,
            height: imgHeight,
          })

          logoBottomY = height - 40 - imgHeight - 20 // Padding below the logo
        } catch (e) {
          console.error('Error embedding logo:', e)
        }
      }

      // Header Text
      page.drawText('Luce Nera', {
        x: 40,
        y: logoBottomY,
        size: 14,
        font: boldFont,
      })
      page.drawText('Manoella Zauith Leite Lopes', {
        x: 40,
        y: logoBottomY - 15,
        size: 9,
        font,
      })
      page.drawText('14.025-270 Rua Ayrton Roxo 867', {
        x: 40,
        y: logoBottomY - 27,
        size: 9,
        font,
      })
      page.drawText('Alto Da Boa Vista, Ribeirao Preto/sp', {
        x: 40,
        y: logoBottomY - 39,
        size: 9,
        font,
      })
      page.drawText('(16) 3442 - 3545', {
        x: 40,
        y: logoBottomY - 51,
        size: 9,
        font,
      })

      // Approval
      page.drawText('1 de 1', {
        x: width - 60,
        y: logoBottomY,
        size: 9,
        font: boldFont,
      })
      page.drawLine({
        start: { x: width - 200, y: logoBottomY - 20 },
        end: { x: width - 40, y: logoBottomY - 20 },
        thickness: 1,
      })
      page.drawText('Aprovação do Cliente', {
        x: width - 195,
        y: logoBottomY - 15,
        size: 8,
        font,
      })

      page.drawLine({
        start: { x: width - 200, y: logoBottomY - 50 },
        end: { x: width - 40, y: logoBottomY - 50 },
        thickness: 1,
      })
      page.drawText('Lucenera', {
        x: width - 195,
        y: logoBottomY - 45,
        size: 8,
        font,
      })

      page.drawText(
        `Data Impressão ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
        {
          x: width - 150,
          y: logoBottomY - 62,
          size: 6,
          font,
          color: rgb(0.4, 0.4, 0.4),
        },
      )

      y = logoBottomY - 80
      page.drawLine({
        start: { x: 40, y },
        end: { x: width - 40, y },
        thickness: 2,
      })

      y -= 25
      page.drawText('Orçamento para', { x: 40, y, size: 11, font })

      const projName = budget.cliente?.nome || 'CLIENTE NÃO INFORMADO'
      page.drawText(projName.toUpperCase(), {
        x: 40,
        y: y - 18,
        size: 13,
        font: boldFont,
      })

      page.drawText(`CEP: ${budget.cliente?.cep || '-'}`, {
        x: 40,
        y: y - 35,
        size: 9,
        font,
      })
      page.drawText(
        `TEL: ${budget.cliente?.telefone || budget.cliente?.celular || '-'}`,
        { x: 40, y: y - 47, size: 9, font },
      )

      page.drawText('Orçamento', { x: width - 120, y, size: 11, font })
      page.drawText(
        `#${budget.numero || budget.id.split('-')[0].toUpperCase()}`,
        { x: width - 120, y: y - 18, size: 13, font: boldFont },
      )

      y -= 75

      // Vendedor / Arquiteto
      page.drawText('Vendedor', { x: 40, y, size: 9, font })
      page.drawText('Arquiteto Externo', { x: 200, y, size: 9, font })

      let vendedorNome = 'Não informado'
      if (budget.vendedor_id) {
        const { data: v } = await supabase
          .from('usuarios')
          .select('nome')
          .eq('id', budget.vendedor_id)
          .single()
        if (v) vendedorNome = v.nome
      }

      page.drawText(vendedorNome, { x: 40, y: y - 12, size: 9, font: boldFont })
      page.drawText(budget.arquiteto?.nome || 'Não informado', {
        x: 200,
        y: y - 12,
        size: 9,
        font: boldFont,
      })

      y -= 30

      // Headers
      const headersList = [
        'ID',
        'Código',
        'Descrição',
        'Qtd.',
        'Vl. Unit.',
        'Subtotal',
      ]
      const xOffsets = [40, 70, 130, 390, 430, 490]

      headersList.forEach((h, i) => {
        page.drawText(h, { x: xOffsets[i], y, size: 9, font: boldFont })
      })
      y -= 10
      page.drawLine({
        start: { x: 40, y },
        end: { x: width - 40, y },
        thickness: 1,
      })
      y -= 15

      let subtotal = 0

      const items = (budget.itens || []).sort((a: any, b: any) => {
        const idA = a.custom_id || ''
        const idB = b.custom_id || ''
        if (idA === idB) {
          return (a.created_at || '').localeCompare(b.created_at || '')
        }
        return idA.localeCompare(idB)
      })

      let currentCustomId: string | null = null

      items.forEach((item: any) => {
        if (y < 60) {
          page = pdfDoc.addPage()
          y = height - 50
        }
        const isAccessory = item.custom_id && item.custom_id === currentCustomId
        currentCustomId = item.custom_id || null

        const cod = isAccessory ? '' : item.custom_id || '-'
        const produtoCod =
          item.produto?.codigo_legado || item.produto?.codigo_produto || '-'
        let desc = String(
          item.produto?.nome || item.descricao || 'Produto sem nome',
        ).substring(0, 55)
        if (isAccessory) desc = `  -> ${desc}`

        const qtd = String(item.quantidade)
        const preco = Number(item.preco_unitario)
        const descPerc = Math.round(Number(item.desconto || 0))

        const gross = Number(item.quantidade) * preco
        const finalVal = gross * (1 - descPerc / 100)

        subtotal += finalVal

        page.drawText(cod, { x: xOffsets[0], y, size: 8, font: boldFont })
        page.drawText(String(produtoCod), { x: xOffsets[1], y, size: 8, font })
        page.drawText(desc, {
          x: xOffsets[2],
          y,
          size: 8,
          font,
          color: isAccessory ? rgb(0.3, 0.3, 0.3) : rgb(0, 0, 0),
        })
        page.drawText(qtd, { x: xOffsets[3], y, size: 8, font })

        const fmtPreco = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(preco)
        const fmtFinalVal = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(finalVal)
        page.drawText(fmtPreco, { x: xOffsets[4], y, size: 8, font })
        page.drawText(fmtFinalVal, { x: xOffsets[5], y, size: 8, font })

        y -= 15
      })

      y -= 5

      const globalDesc = Number(budget.desconto_global || 0)
      const finalTotal = subtotal - globalDesc

      if (y < 200) {
        page = pdfDoc.addPage()
        y = height - 50
      }

      page.drawRectangle({
        x: width - 230,
        y: y - 60,
        width: 190,
        height: 70,
        color: rgb(0.95, 0.95, 0.95),
      })

      const fmtSubtotal = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(subtotal)
      const fmtGlobalDesc = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(globalDesc)
      const fmtFinalTotal = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(finalTotal)

      const rightPadX = width - 56

      page.drawText(`SubTotal:`, { x: width - 210, y: y - 15, size: 10, font })
      page.drawText(fmtSubtotal, {
        x: rightPadX - font.widthOfTextAtSize(fmtSubtotal, 10),
        y: y - 15,
        size: 10,
        font,
      })

      page.drawText(`Desconto:`, { x: width - 210, y: y - 30, size: 10, font })
      page.drawText(fmtGlobalDesc, {
        x: rightPadX - font.widthOfTextAtSize(fmtGlobalDesc, 10),
        y: y - 30,
        size: 10,
        font,
      })

      page.drawText(`Valor Total:`, {
        x: width - 210,
        y: y - 48,
        size: 12,
        font: boldFont,
      })
      page.drawText(fmtFinalTotal, {
        x: rightPadX - boldFont.widthOfTextAtSize(fmtFinalTotal, 12),
        y: y - 48,
        size: 12,
        font: boldFont,
      })

      y -= 80
      page.drawText('Forma de Pagamento:', { x: width - 210, y, size: 8, font })
      page.drawText(budget.condicoes_pagamento || 'Dinheiro', {
        x: width - 210,
        y: y - 12,
        size: 9,
        font: boldFont,
      })

      y -= 40
      page.drawText('OBSERVAÇÕES: POLÍTICA DE TROCA / DEVOLUÇÃO:', {
        x: 40,
        y,
        size: 9,
        font: boldFont,
      })
      y -= 15

      const validadeDate = budget.validade
        ? new Date(budget.validade)
        : new Date(
            new Date(budget.data_emissao || new Date()).getTime() +
              10 * 24 * 60 * 60 * 1000,
          )
      const validadeStr = validadeDate.toLocaleDateString('pt-BR', {
        timeZone: 'UTC',
      })

      const obsLines = [
        `1- Este orçamento tem validade de 10 dias (${validadeStr}).`,
        '2- Considera-se inclusas 3 visitas técnicas em obras na cidade de Ribeirão Preto, visitas extras serão cobradas à parte.',
        '3- Não estão inclusas visitas em obras fora da cidade de Ribeirão Preto e em vendas que o projeto não seja',
        '    realizado pela Lucenera.',
        '4- A LuceNera se reserva no direito de não aceitar trocas e devoluções, de acordo com o Código de Defesa do Consumidor.',
        '5- Quando a obra for na cidade de Ribeirão Preto/SP o frete dos produtos será por conta da LuceNera, caso a obra',
        '    for em outra cidade o frete fica por conta do cliente.',
        '6- O prazo de entrega padrão dos materiais é de 30 dias, a partir da aprovação das fichas técnicas.',
        '    Pelos materiais especiais, prazo a consultar.',
      ]

      obsLines.forEach((line) => {
        if (y < 40) {
          page = pdfDoc.addPage()
          y = height - 50
        }
        page.drawText(line, { x: 40, y, size: 8, font })
        y -= 12
      })

      page.drawText(
        'Connect Systems Enterprise Technologies, Inc. All rights reserved.',
        { x: width / 2 - 120, y: 20, size: 7, font, color: rgb(0.5, 0.5, 0.5) },
      )

      const pdfBytes = await pdfDoc.save()
      return new Response(pdfBytes, {
        headers: { ...corsHeaders, 'Content-Type': 'application/pdf' },
      })
    }

    let query: any
    let flatData: any[] = []

    if (reportType === 'ferias') {
      query = supabase
        .from('ferias')
        .select(
          '*, funcionarios_rh!inner(nome, departamento_id, departamentos_rh(nome))',
        )
      if (filters.deptId)
        query = query.eq('funcionarios_rh.departamento_id', filters.deptId)
      if (filters.empId) query = query.eq('funcionario_id', filters.empId)
      if (filters.startDate)
        query = query.gte('data_inicio', filters.startDate.split('T')[0])
      if (filters.endDate)
        query = query.lte('data_fim', filters.endDate.split('T')[0])

      const { data } = await query
      flatData = (data || []).map((d: any) => ({
        Funcionario: d.funcionarios_rh?.nome,
        Departamento: d.funcionarios_rh?.departamentos_rh?.nome,
        Inicio: d.data_inicio,
        Fim: d.data_fim,
        Dias: d.dias,
        Status: d.status,
      }))
    } else if (reportType === 'folha') {
      query = supabase
        .from('folha_pagamento')
        .select(
          '*, funcionarios_rh!inner(nome, departamento_id, departamentos_rh(nome))',
        )
      if (filters.deptId)
        query = query.eq('funcionarios_rh.departamento_id', filters.deptId)
      if (filters.empId) query = query.eq('funcionario_id', filters.empId)
      if (filters.month) query = query.eq('mes', filters.month)
      if (filters.year) query = query.eq('ano', filters.year)

      const { data } = await query
      flatData = (data || []).map((d: any) => ({
        Funcionario: d.funcionarios_rh?.nome,
        Departamento: d.funcionarios_rh?.departamentos_rh?.nome,
        Mes: d.mes,
        Ano: d.ano,
        Base: d.salario_base,
        Liquido: d.salario_liquido,
      }))
    } else if (reportType === 'avaliacoes') {
      query = supabase
        .from('avaliacoes')
        .select(
          '*, funcionarios_rh!inner(nome, departamento_id, departamentos_rh(nome))',
        )
      if (filters.deptId)
        query = query.eq('funcionarios_rh.departamento_id', filters.deptId)
      if (filters.empId) query = query.eq('funcionario_id', filters.empId)
      if (filters.startDate)
        query = query.gte('data_avaliacao', filters.startDate)
      if (filters.endDate) query = query.lte('data_avaliacao', filters.endDate)

      const { data } = await query
      flatData = (data || []).map((d: any) => ({
        Funcionario: d.funcionarios_rh?.nome,
        Departamento: d.funcionarios_rh?.departamentos_rh?.nome,
        Data: new Date(d.data_avaliacao).toLocaleDateString('pt-BR'),
        Produtiv: d.produtividade,
        Qualidad: d.qualidade,
        Pontual: d.pontualidade,
        Equipe: d.trabalho_equipe,
      }))
    } else if (reportType === 'ponto') {
      query = supabase
        .from('controle_ponto')
        .select(
          '*, funcionarios_rh!inner(nome, departamento_id, departamentos_rh(nome))',
        )
      if (filters.deptId)
        query = query.eq('funcionarios_rh.departamento_id', filters.deptId)
      if (filters.empId) query = query.eq('funcionario_id', filters.empId)
      if (filters.month && filters.year) {
        const start = new Date(filters.year, filters.month - 1, 1)
          .toISOString()
          .split('T')[0]
        const end = new Date(filters.year, filters.month, 0)
          .toISOString()
          .split('T')[0]
        query = query.gte('data', start).lte('data', end)
      }

      const { data } = await query
      flatData = (data || []).map((d: any) => ({
        Funcionario: d.funcionarios_rh?.nome,
        Departamento: d.funcionarios_rh?.departamentos_rh?.nome,
        Data: d.data,
        Entrada: d.hora_entrada || '-',
        Saida: d.hora_saida || '-',
        Horas: d.total_horas || 0,
        Status: d.status,
      }))
    }

    if (format === 'csv') {
      const csvStr = toCSV(flatData)
      return new Response(csvStr, {
        headers: { ...corsHeaders, 'Content-Type': 'text/csv' },
      })
    } else {
      const pdfBytes = await toPDF(flatData, reportType)
      return new Response(pdfBytes, {
        headers: { ...corsHeaders, 'Content-Type': 'application/pdf' },
      })
    }
  } catch (error: any) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
