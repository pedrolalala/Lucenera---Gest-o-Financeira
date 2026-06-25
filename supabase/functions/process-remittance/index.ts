import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Fetch pending boletos
    const { data: boletos, error } = await supabaseClient
      .from('boletos')
      .select('*')
      .in('status', ['Pendente', 'pendente_registro'])

    if (error) throw error

    if (!boletos || boletos.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum boleto pendente para remessa' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Update to 'Remessa Enviada'
    const ids = boletos.map((b) => b.id)
    await supabaseClient
      .from('boletos')
      .update({ status: 'Remessa Enviada' })
      .in('id', ids)

    // Send mock notification
    await supabaseClient.functions.invoke('sync-teams', {
      body: {
        message: `Arquivo de Remessa processado com ${ids.length} boletos.`,
        to: 'Financeiro',
      },
    })

    return new Response(
      JSON.stringify({ success: true, processed: ids.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
