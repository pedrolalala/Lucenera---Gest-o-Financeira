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

  page.drawText(`Relatorio: ${title.toUpperCase()}`, { x: 40, y, size: 16, font })
  y -= 30

  if (!data || !data.length) {
    page.drawText('Nenhum dado encontrado.', { x: 40, y, size: 12, font })
    return await pdfDoc.save()
  }

  const headers = Object.keys(data[0])
  page.drawText(headers.join(' | '), { x: 40, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) })
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { reportType, format, filters } = await req.json()
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Acesso não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single()

    if (reportType !== 'orcamento' && profile?.role !== 'admin' && profile?.role !== 'gerente') {
      return new Response(
        JSON.stringify({
          error: 'Acesso negado. Apenas administradores e gerentes podem gerar relatórios.',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (reportType === 'orcamento') {
      const { id, logoBase64 } = filters || {}

      if (!id) {
        return new Response(JSON.stringify({ error: 'ID do orçamento não fornecido.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const { data: budget, error: budgetError } = await supabase
        .from('orcamentos')
        .select(`
          *,
          cliente:contatos!orcamentos_cliente_id_fkey(nome, email, telefone, cpf_cnpj),
          empresa:empresas!orcamentos_empresa_id_fkey(nome, razao_social, logradouro, numero, bairro, cidade, estado, cep, cnpj),
          vendedor:funcionarios!orcamentos_vendedor_id_fkey(nome),
          itens:orcamento_itens(
            id, produto_id, quantidade, preco_unitario, desconto, descricao, custom_id,
            produto:produtos(nome, referencia, sku, codigo_produto)
          )
        `)
        .eq('id', id)
        .single()

      if (budgetError || !budget) {
        return new Response(JSON.stringify({ error: 'Orçamento não encontrado.' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const pdfDoc = await PDFDocument.create()
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      let page = pdfDoc.addPage()
      const { width, height } = page.getSize()
      let y = height - 50

      let logoBottomY = height - 40
      let headerTextX = 40
      const maxLogoWidth = 140
      const maxLogoHeight = 80

      if (logoBase64) {
        try {
          const base64Data = logoBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
          const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
          let image
          if (logoBase64.includes('image/jpeg') || logoBase64.includes('image/jpg')) {
            image = await pdfDoc.embedJpg(imageBytes)
          } else {
            image = await pdfDoc.embedPng(imageBytes)
          }

          const scale = Math.min(maxLogoWidth / image.width, maxLogoHeight / image.height)
          const imgWidth = image.width * scale
          const imgHeight = image.height * scale

          const containerX = 40
          const logoX = containerX + (maxLogoWidth - imgWidth) / 2
          const logoY = height - 40 - imgHeight

          page.drawImage(image, {
            x: logoX,
            y: logoY,
            width: imgWidth,
            height: imgHeight,
          })

          headerTextX = containerX + maxLogoWidth + 20
          logoBottomY = height - 40
        } catch (e) {
          console.error('Error embedding logo:', e)
        }
      }

      const empresa = budget.empresa || {}
      const empresaNomeLogo = empresa.nome || 'Luce Nera'
      const empresaNomeAssinatura = empresa.nome || 'Lucenera'
      const empresaRazao = empresa.razao_social || 'Manoella Zauith Leite Lopes'
      const empresaEnd = `${empresa.cep || '14.025-270'} ${empresa.logradouro || 'Rua Ayrton Roxo'} ${empresa.numero || '867'}`
      const empresaCidade = `${empresa.bairro || 'Alto Da Boa Vista'}, ${empresa.cidade || 'Ribeirao Preto'}/${empresa.estado || 'SP'}`

      let textY = logoBottomY - 14
      page.drawText(empresaNomeLogo, { x: headerTextX, y: textY, size: 14, font: boldFont })
      page.drawText(empresaRazao, { x: headerTextX, y: textY - 15, size: 9, font })
      page.drawText(empresaEnd, { x: headerTextX, y: textY - 27, size: 9, font })
      page.drawText(empresaCidade, { x: headerTextX, y: textY - 39, size: 9, font })
      page.drawText('(16) 3442 - 3545', { x: headerTextX, y: textY - 51, size: 9, font })

      page.drawText('1 de 1', { x: width - 60, y: textY, size: 9, font: boldFont })
      page.drawLine({
        start: { x: width - 200, y: textY - 20 },
        end: { x: width - 40, y: textY - 20 },
        thickness: 1,
      })
      page.drawText('Aprovação do Cliente', { x: width - 195, y: textY - 15, size: 8, font })

      page.drawLine({
        start: { x: width - 200, y: textY - 50 },
        end: { x: width - 40, y: textY - 50 },
        thickness: 1,
      })
      page.drawText(empresaNomeAssinatura, { x: width - 195, y: textY - 45, size: 8, font })

      page.drawText(
        `Data Impressão ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
        { x: width - 150, y: textY - 62, size: 6, font, color: rgb(0.4, 0.4, 0.4) },
      )

      y = textY - maxLogoHeight - 10
      page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 2 })

      y -= 25
      page.drawText('Orçamento para', { x: 40, y, size: 11, font })

      const projName = budget.cliente?.nome || 'CLIENTE NÃO INFORMADO'
      page.drawText(projName.toUpperCase(), { x: 40, y: y - 18, size: 13, font: boldFont })

      page.drawText(`CPF/CNPJ: ${budget.cliente?.cpf_cnpj || '-'}`, {
        x: 40,
        y: y - 35,
        size: 9,
        font,
      })
      page.drawText(`TEL: ${budget.cliente?.telefone || '-'}`, { x: 40, y: y - 47, size: 9, font })

      page.drawText('Orçamento', { x: width - 120, y, size: 11, font })
      page.drawText(`${budget.numero || budget.id.split('-')[0].toUpperCase()}`, {
        x: width - 120,
        y: y - 18,
        size: 13,
        font: boldFont,
      })

      y -= 75

      page.drawText('Vendedor', { x: 40, y, size: 9, font })

      let vendedorNome = 'Equipe Comercial'
      if (budget.vendedor?.nome) {
        vendedorNome = budget.vendedor.nome
      }

      page.drawText(vendedorNome, { x: 40, y: y - 12, size: 9, font: boldFont })

      y -= 30

      const headersList = ['Código', 'Descrição', 'Qtd.', 'Vl. Unit.', 'Subtotal']
      const xOffsets = [40, 90, 390, 430, 490]

      headersList.forEach((h, i) => {
        page.drawText(h, { x: xOffsets[i], y, size: 9, font: boldFont })
      })
      y -= 10
      page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1 })
      y -= 15

      let subtotal = 0

      const items = (budget.itens || []).sort((a: any, b: any) => {
        const idA = (a.custom_id || '').toUpperCase()
        const idB = (b.custom_id || '').toUpperCase()
        const numA = parseInt(idA.replace(/^L/, ''), 10)
        const numB = parseInt(idB.replace(/^L/, ''), 10)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        if (!idA && idB) return 1
        if (idA && !idB) return -1
        return idA.localeCompare(idB)
      })

      items.forEach((item: any) => {
        if (y < 60) {
          page = pdfDoc.addPage()
          y = height - 50
        }

        const cod = item.custom_id || item.produto?.referencia || '-'
        let desc = String(item.descricao || item.produto?.nome || 'Produto sem nome').substring(
          0,
          55,
        )

        const qtd = String(item.quantidade || 1)
        const preco = Number(item.preco_unitario || 0)

        const descItem = Number(item.desconto || 0)
        const finalVal = preco * Number(item.quantidade || 1) - descItem

        subtotal += finalVal

        page.drawText(cod, { x: xOffsets[0], y, size: 8, font: boldFont })
        page.drawText(desc, { x: xOffsets[1], y, size: 8, font })
        page.drawText(qtd, { x: xOffsets[2], y, size: 8, font })

        const fmtPreco = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(preco)
        const fmtFinalVal = new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(finalVal)
        page.drawText(fmtPreco, { x: xOffsets[3], y, size: 8, font })
        page.drawText(fmtFinalVal, { x: xOffsets[4], y, size: 8, font })

        y -= 15
      })

      y -= 5

      const globalDesc = Number(budget.desconto_global || 0)
      const finalTotal = Number(budget.valor_total || subtotal - globalDesc)

      if (y < 200) {
        page = pdfDoc.addPage()
        y = height - 50
      }

      page.drawRectangle({
        x: width - 270,
        y: y - 60,
        width: 230,
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

      page.drawText(`SubTotal:`, { x: width - 250, y: y - 15, size: 10, font })
      page.drawText(fmtSubtotal, {
        x: rightPadX - font.widthOfTextAtSize(fmtSubtotal, 10),
        y: y - 15,
        size: 10,
        font,
      })

      page.drawText(`Desconto:`, { x: width - 250, y: y - 30, size: 10, font })
      page.drawText(fmtGlobalDesc, {
        x: rightPadX - font.widthOfTextAtSize(fmtGlobalDesc, 10),
        y: y - 30,
        size: 10,
        font,
      })

      page.drawText(`Valor Total:`, { x: width - 250, y: y - 48, size: 12, font: boldFont })
      page.drawText(fmtFinalTotal, {
        x: rightPadX - boldFont.widthOfTextAtSize(fmtFinalTotal, 12),
        y: y - 48,
        size: 12,
        font: boldFont,
      })

      y -= 80
      page.drawText('Condições de Pagamento:', { x: width - 250, y, size: 8, font })

      page.drawText(budget.condicoes_pagamento || 'A Combinar', {
        x: width - 250,
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
        : new Date(new Date(budget.created_at || new Date()).getTime() + 10 * 24 * 60 * 60 * 1000)
      const validadeStr = validadeDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' })

      // Dynamic Policy Filtering: Include only specific items (originally 1, 4, 6) renumbered to 1, 2, 3
      const obsLines = [
        `1- Este orçamento tem validade até ${validadeStr}.`,
        '2- A LuceNera se reserva no direito de não aceitar trocas e devoluções, de acordo com o Código de Defesa do Consumidor.',
        '3- O prazo de entrega padrão dos materiais é de 30 dias, a partir da aprovação das fichas técnicas. Pelos materiais especiais, prazo a consultar.',
      ]

      obsLines.forEach((line) => {
        if (y < 40) {
          page = pdfDoc.addPage()
          y = height - 50
        }
        page.drawText(line, { x: 40, y, size: 8, font })
        y -= 12
      })

      page.drawText('Connect Systems Enterprise Technologies, Inc. All rights reserved.', {
        x: width / 2 - 120,
        y: 20,
        size: 7,
        font,
        color: rgb(0.5, 0.5, 0.5),
      })

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
        .select('*, funcionarios_rh!inner(nome, departamento_id, departamentos_rh(nome))')
      if (filters.deptId) query = query.eq('funcionarios_rh.departamento_id', filters.deptId)
      if (filters.empId) query = query.eq('funcionario_id', filters.empId)
      if (filters.startDate) query = query.gte('data_inicio', filters.startDate.split('T')[0])
      if (filters.endDate) query = query.lte('data_fim', filters.endDate.split('T')[0])

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
        .select('*, funcionarios_rh!inner(nome, departamento_id, departamentos_rh(nome))')
      if (filters.deptId) query = query.eq('funcionarios_rh.departamento_id', filters.deptId)
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
        .select('*, funcionarios_rh!inner(nome, departamento_id, departamentos_rh(nome))')
      if (filters.deptId) query = query.eq('funcionarios_rh.departamento_id', filters.deptId)
      if (filters.empId) query = query.eq('funcionario_id', filters.empId)
      if (filters.startDate) query = query.gte('data_avaliacao', filters.startDate)
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
        .select('*, funcionarios_rh!inner(nome, departamento_id, departamentos_rh(nome))')
      if (filters.deptId) query = query.eq('funcionarios_rh.departamento_id', filters.deptId)
      if (filters.empId) query = query.eq('funcionario_id', filters.empId)
      if (filters.month && filters.year) {
        const start = new Date(filters.year, filters.month - 1, 1).toISOString().split('T')[0]
        const end = new Date(filters.year, filters.month, 0).toISOString().split('T')[0]
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
      return new Response(csvStr, { headers: { ...corsHeaders, 'Content-Type': 'text/csv' } })
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
