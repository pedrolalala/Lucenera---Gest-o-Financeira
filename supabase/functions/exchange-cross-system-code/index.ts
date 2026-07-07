import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

type CodeContext = {
  redirect_to?: unknown
}

function sanitizePath(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) return '/'
  if (!value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração Supabase incompleta.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey)
    const body = await req.json().catch(() => ({}))
    const code = body.code
    const sistemaDestino =
      typeof body.sistema_destino === 'string' && body.sistema_destino.trim()
        ? body.sistema_destino.trim()
        : null

    if (!isUuid(code)) {
      return new Response(JSON.stringify({ error: 'Código inválido.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    let query = adminClient
      .from('cross_system_session_codes')
      .update({ usado_em: new Date().toISOString() })
      .eq('code', code)
      .is('usado_em', null)
      .gt('expira_em', new Date().toISOString())

    if (sistemaDestino) {
      query = query.or(
        `sistema_destino.is.null,sistema_destino.eq.${sistemaDestino}`,
      )
    }

    const { data: codeRow, error: codeError } = await query
      .select('usuario_id, contexto')
      .single()

    if (codeError || !codeRow) {
      return new Response(
        JSON.stringify({ error: 'Código expirado, usado ou não autorizado.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        },
      )
    }

    const { data: usuario, error: usuarioError } = await adminClient
      .from('usuarios')
      .select('email')
      .eq('id', codeRow.usuario_id)
      .single()

    if (usuarioError || !usuario?.email) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado para a troca.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        },
      )
    }

    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: usuario.email,
      })

    const tokenHash = linkData?.properties?.hashed_token

    if (linkError || !tokenHash) {
      return new Response(
        JSON.stringify({
          error: linkError?.message ?? 'Falha ao criar sessão.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }

    const { data: verifyData } = await adminClient.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    })

    const contexto = (codeRow.contexto ?? {}) as CodeContext
    const payload = verifyData?.session
      ? {
          access_token: verifyData.session.access_token,
          refresh_token: verifyData.session.refresh_token,
          redirect_to: sanitizePath(contexto.redirect_to),
        }
      : {
          token_hash: tokenHash,
          redirect_to: sanitizePath(contexto.redirect_to),
        }

    return new Response(JSON.stringify(payload), {
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
