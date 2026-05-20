import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const body = await req.json()

    const {
      codigo,
      nome,
      status,
      cidade,
      estado,
      arquiteto_id,
      responsavel_obra_id,
      responsavel_id,
      responsavel_nome,
      cliente_id,
      data_entrada,
      nivel_estrategico,
    } = body

    if (!codigo || String(codigo).trim() === '') {
      return new Response(JSON.stringify({ error: 'O campo Código é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!nome || String(nome).trim() === '') {
      return new Response(JSON.stringify({ error: 'O campo Nome é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payloadInsercao = {
      codigo: String(codigo).trim(),
      nome,
      status: status || 'Estudo Inicial',
      cidade,
      estado,
      arquiteto_id,
      responsavel_obra_id,
      responsavel_id,
      responsavel_nome,
      cliente_id,
      data_entrada: data_entrada || null,
      nivel_estrategico: nivel_estrategico || null,
    }

    const { data, error } = await supabase
      .from('projetos')
      .insert([payloadInsercao])
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Erro interno no servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
