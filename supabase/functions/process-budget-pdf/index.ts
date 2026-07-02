import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { PDFDocument, StandardFonts } from 'npm:pdf-lib@1.17.1'
import { encodeBase64 } from 'jsr:@std/encoding/base64'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    let body
    try {
      body = await req.json()
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Formato de requisição inválido. Esperado JSON.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { quote_id } = body
    if (!quote_id) {
      return new Response(
        JSON.stringify({ error: 'O ID do orçamento (quote_id) é obrigatório.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: budget, error: budgetError } = await supabase
      .from('orcamentos_revenda_ubiqua')
      .select(`
        *,
        cliente:informacoes_cliente_ubiqua!orcamentos_revenda_ubiqua_cliente_id_fkey(nome, email, telefone, cpf_cnpj),
        itens:itens_orcamento_ubiqua(
          id, produto_id, quantidade, valor_unitario, valor_total, desconto_item, referencia_snapshot, descricao_snapshot, observacao_item, ordem
        )
      `)
      .eq('id', quote_id)
      .single()

    if (budgetError || !budget) {
      return new Response(
        JSON.stringify({ error: 'Orçamento não encontrado no banco de dados.' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Generate PDF
    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    let page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    let y = height - 50

    // Header
    page.drawText('Ubiqua - Orçamento', { x: 40, y, size: 20, font: boldFont })
    page.drawText(`Número: ${budget.numero_orcamento || budget.id.split('-')[0].toUpperCase()}`, {
      x: width - 200,
      y,
      size: 12,
      font,
    })
    y -= 40

    // Client Info
    page.drawText('Dados do Cliente:', { x: 40, y, size: 14, font: boldFont })
    y -= 20
    page.drawText(`Nome: ${budget.cliente?.nome || '-'}`, { x: 40, y, size: 10, font })
    page.drawText(`Email: ${budget.cliente?.email || '-'}`, { x: 40, y: y - 15, size: 10, font })
    page.drawText(`Telefone: ${budget.cliente?.telefone || '-'}`, {
      x: 40,
      y: y - 30,
      size: 10,
      font,
    })
    page.drawText(`CPF/CNPJ: ${budget.cliente?.cpf_cnpj || '-'}`, {
      x: 40,
      y: y - 45,
      size: 10,
      font,
    })

    y -= 75

    // Items
    page.drawText('Itens do Orçamento:', { x: 40, y, size: 14, font: boldFont })
    y -= 20

    const headers = ['Ref', 'Descrição', 'Qtd', 'Vl. Unit.', 'Desc.', 'Total']
    const xOffsets = [40, 100, 320, 360, 430, 480]

    headers.forEach((h, i) => page.drawText(h, { x: xOffsets[i], y, size: 10, font: boldFont }))
    y -= 15
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 1 })
    y -= 15

    const formatCurrency = (val: number) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

    const items = (budget.itens || []).sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0))
    items.forEach((item: any) => {
      if (y < 60) {
        page = pdfDoc.addPage()
        y = height - 50
      }

      const desc = String(item.descricao_snapshot || '-').substring(0, 35)

      page.drawText(String(item.referencia_snapshot || '-'), { x: xOffsets[0], y, size: 9, font })
      page.drawText(desc, { x: xOffsets[1], y, size: 9, font })
      page.drawText(String(item.quantidade), { x: xOffsets[2], y, size: 9, font })
      page.drawText(formatCurrency(item.valor_unitario), { x: xOffsets[3], y, size: 9, font })
      page.drawText(formatCurrency(item.desconto_item || 0), { x: xOffsets[4], y, size: 9, font })
      page.drawText(formatCurrency(item.valor_total || item.quantidade * item.valor_unitario), {
        x: xOffsets[5],
        y,
        size: 9,
        font,
      })

      y -= 15
    })

    y -= 20
    page.drawText(`Total Geral: ${formatCurrency(budget.valor_total || 0)}`, {
      x: width - 200,
      y,
      size: 12,
      font: boldFont,
    })

    y -= 40
    page.drawText('Observações:', { x: 40, y, size: 12, font: boldFont })
    y -= 15
    page.drawText(budget.observacoes || '-', { x: 40, y, size: 10, font })

    y -= 30
    page.drawText('Condições de Pagamento:', { x: 40, y, size: 12, font: boldFont })
    y -= 15
    page.drawText(budget.condicoes_pagamento || '-', { x: 40, y, size: 10, font })

    y -= 30
    page.drawText('Prazo de Entrega:', { x: 40, y, size: 12, font: boldFont })
    y -= 15
    page.drawText(budget.prazo_entrega || '-', { x: 40, y, size: 10, font })

    const pdfBytes = await pdfDoc.save()

    // Upload to Supabase Storage
    const numOrcto = budget.numero_orcamento || budget.id.split('-')[0]
    const fileName = `pdfs/${numOrcto}.pdf`
    const { error: uploadError } = await supabase.storage
      .from('orcamentos')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`Failed to upload to storage: ${uploadError.message}`)
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from('orcamentos').getPublicUrl(fileName)
    const fileUrl = publicUrlData.publicUrl

    // Send Email
    if (RESEND_API_KEY) {
      const b64Pdf = encodeBase64(pdfBytes)
      const emailHtml = `
        <h2>Novo Orçamento Recebido</h2>
        <p><strong>Número:</strong> ${budget.numero_orcamento || budget.id}</p>
        <p><strong>Cliente:</strong> ${budget.cliente?.nome}</p>
        <p><strong>Valor Total:</strong> ${formatCurrency(budget.valor_total || 0)}</p>
        <p><a href="${fileUrl}">Clique aqui para baixar o PDF</a></p>
      `

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'suporte@lucenera.com',
          to: ['vinicius@lucenera.com.br', 'pedro@lucenera.com.br'],
          subject: `Novo Orçamento Recebido - ${budget.numero_orcamento || budget.id} - ${budget.cliente?.nome}`,
          html: emailHtml,
          attachments: [
            {
              filename: fileName,
              content: b64Pdf,
            },
          ],
        }),
      })

      if (!res.ok) {
        const errorData = await res.text()
        console.error('Resend API Error:', errorData)
      }
    } else {
      console.warn('RESEND_API_KEY not found. Email not sent.')
    }

    return new Response(JSON.stringify({ success: true, url: fileUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Process error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
