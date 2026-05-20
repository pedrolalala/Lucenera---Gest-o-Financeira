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
          const imgDims = image.scale(0.3)
          page.drawImage(image, {
            x: 40,
            y: y - 30,
            width: imgDims.width > 120 ? 120 : imgDims.width,
            height:
              imgDims.width > 120
                ? 120 * (imgDims.height / imgDims.width)
                : imgDims.height,
          })
          y -=
            (imgDims.width > 120
              ? 120 * (imgDims.height / imgDims.width)
              : imgDims.height) + 10
        } catch (e) {
          console.error('Error embedding logo:', e)
        }
      }

      page.drawText(
        `ORÇAMENTO #${budget.numero || budget.id.split('-')[0].toUpperCase()}`,
        { x: 40, y, size: 14, font: boldFont },
      )
      y -= 20

      const clienteNome = budget.cliente?.nome || 'CLIENTE NÃO INFORMADO'
      page.drawText(`Cliente: ${clienteNome}`, { x: 40, y, size: 10, font })
      if (budget.cliente?.telefone || budget.cliente?.celular) {
        page.drawText(
          `Telefone: ${budget.cliente?.telefone || budget.cliente?.celular}`,
          { x: 300, y, size: 10, font },
        )
      }
      y -= 15

      if (budget.data_emissao) {
        const emitDate = new Date(budget.data_emissao)
        if (!isNaN(emitDate.getTime())) {
          page.drawText(`Data: ${emitDate.toLocaleDateString('pt-BR')}`, {
            x: 40,
            y,
            size: 10,
            font,
          })
          y -= 20
        }
      }

      // Headers
      const headers = [
        'Código',
        'Descrição',
        'Qtd',
        'Un',
        'Preço Unit',
        'Desc %',
        'Total',
      ]
      const xOffsets = [40, 100, 300, 330, 360, 440, 490]

      headers.forEach((h, i) => {
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
      let totalDiscounts = 0

      const items = (budget.itens || []).sort((a: any, b: any) => {
        const idA = a.custom_id || ''
        const idB = b.custom_id || ''
        if (idA === idB) {
          if (!a.item_pai_id && b.item_pai_id) return -1
          if (a.item_pai_id && !b.item_pai_id) return 1
          return 0
        }
        return idA.localeCompare(idB)
      })

      items.forEach((item: any) => {
        if (y < 60) {
          page = pdfDoc.addPage()
          y = height - 50
        }
        const isAccessory = !!item.item_pai_id
        const cod = isAccessory ? '' : item.custom_id || '-'
        const desc = String(
          item.produto?.nome || item.descricao || 'Produto sem nome',
        ).substring(0, 45)
        const qtd = String(item.quantidade)
        const un = item.produto?.unidade || 'UN'
        const preco = Number(item.preco_unitario).toFixed(2)
        const descPerc = Math.round(Number(item.desconto || 0))

        const gross = Number(item.quantidade) * Number(item.preco_unitario)
        const finalVal = gross * (1 - descPerc / 100)

        subtotal += gross
        totalDiscounts += gross * (descPerc / 100)

        page.drawText(cod, { x: xOffsets[0], y, size: 8, font })
        page.drawText(isAccessory ? `  -> ${desc}` : desc, {
          x: xOffsets[1],
          y,
          size: 8,
          font,
        })
        page.drawText(qtd, { x: xOffsets[2], y, size: 8, font })
        page.drawText(un, { x: xOffsets[3], y, size: 8, font })
        page.drawText(`R$ ${preco}`, { x: xOffsets[4], y, size: 8, font })
        page.drawText(descPerc > 0 ? `${descPerc}%` : '-', {
          x: xOffsets[5],
          y,
          size: 8,
          font,
        })
        page.drawText(`R$ ${finalVal.toFixed(2)}`, {
          x: xOffsets[6],
          y,
          size: 8,
          font,
        })

        y -= 15
      })

      y -= 5
      page.drawLine({
        start: { x: 40, y },
        end: { x: width - 40, y },
        thickness: 1,
      })
      y -= 20

      const globalDesc = Number(budget.desconto_global || 0)
      const finalTotal = subtotal - totalDiscounts - globalDesc

      page.drawText(`Subtotal:`, { x: 360, y, size: 10, font })
      page.drawText(`R$ ${subtotal.toFixed(2)}`, { x: 460, y, size: 10, font })
      y -= 15

      const descVal = totalDiscounts + globalDesc
      if (descVal > 0) {
        page.drawText(`Desconto:`, { x: 360, y, size: 10, font })
        page.drawText(`R$ ${descVal.toFixed(2)}`, { x: 460, y, size: 10, font })
        y -= 15
      }

      page.drawText(`Valor Total:`, { x: 360, y, size: 11, font: boldFont })
      page.drawText(`R$ ${finalTotal.toFixed(2)}`, {
        x: 460,
        y,
        size: 11,
        font: boldFont,
      })

      y -= 40
      page.drawText('Condições de Pagamento:', {
        x: 40,
        y,
        size: 9,
        font: boldFont,
      })
      y -= 15
      page.drawText(budget.condicoes_pagamento || 'Não informada', {
        x: 40,
        y,
        size: 9,
        font,
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
