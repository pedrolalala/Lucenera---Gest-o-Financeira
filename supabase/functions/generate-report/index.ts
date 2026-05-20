import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb } from 'npm:pdf-lib@1.17.1'
import { corsHeaders } from '../_shared/cors.ts'

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
    if (profile?.role !== 'admin' && profile?.role !== 'gerente') {
      throw new Error('Acesso negado. Apenas administradores e gerentes podem gerar relatórios.')
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
