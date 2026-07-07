import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function sanitizePath(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) return '/'
  if (!value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const authorization = req.headers.get('Authorization') ?? ''

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração Supabase incompleta.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const body = await req.json().catch(() => ({}))
    const sistemaOrigem =
      typeof body.sistema_origem === 'string' && body.sistema_origem.trim()
        ? body.sistema_origem.trim()
        : 'desconhecido'
    const sistemaDestino =
      typeof body.sistema_destino === 'string' && body.sistema_destino.trim()
        ? body.sistema_destino.trim()
        : null
    const redirectTo = sanitizePath(body.redirect_to)

    await adminClient
      .from('cross_system_session_codes')
      .delete()
      .or(`expira_em.lt.${new Date().toISOString()},usado_em.not.is.null`)

    const { data, error } = await adminClient
      .from('cross_system_session_codes')
      .insert({
        usuario_id: user.id,
        sistema_origem: sistemaOrigem,
        sistema_destino: sistemaDestino,
        contexto: { redirect_to: redirectTo },
      })
      .select('code, expira_em')
      .single()

    if (error || !data) {
      return new Response(
        JSON.stringify({ error: error?.message ?? 'Falha ao gerar código.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
