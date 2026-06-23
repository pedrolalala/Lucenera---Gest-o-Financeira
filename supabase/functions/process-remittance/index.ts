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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch boletos ready for remittance
    const { data: boletos, error } = await supabaseClient
      .from('boletos')
      .select('*')
      .in('status', ['Remessa Pendente', 'pendente_registro'])

    if (error) throw error

    if (!boletos || boletos.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum boleto pronto para remessa.', processed: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Update to 'Aguardando Retorno'
    const ids = boletos.map(b => b.id)
    await supabaseClient
      .from('boletos')
      .update({ status: 'Aguardando Retorno' })
      .in('id', ids)

    // Send mock notification to Teams
    await supabaseClient.functions.invoke('sync-teams', {
      body: { 
        message: `Arquivo de Remessa processado com ${ids.length} boletos. Aguardando retorno bancário.`,
        to: 'Financeiro'
      }
    })

    return new Response(JSON.stringify({ success: true, processed: ids.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
