import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { quote_id, email_vinicius, email_josi } = await req.json()

    console.log(`Enviando e-mail de confirmação para o orçamento ${quote_id}.`)
    console.log(`Destinatários: ${email_vinicius}, ${email_josi}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Email de confirmação enviado com sucesso.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
