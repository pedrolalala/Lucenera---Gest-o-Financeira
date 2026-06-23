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

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { data: fechamentos, error: fetchError } = await supabase
      .from('projetos_fechados')
      .select('cod, valor_fechado, data_fechamento')
      .order('data_fechamento', { ascending: true })

    if (fetchError) throw fetchError

    const agrupados: Record<string, any[]> = {}
    for (const row of fechamentos || []) {
      if (!row.cod) continue
      const codigo = String(row.cod).trim()
      if (!agrupados[codigo]) {
        agrupados[codigo] = []
      }
      agrupados[codigo].push(row)
    }

    for (const cod in agrupados) {
      agrupados[cod].sort((a, b) => {
        const parseDate = (dStr: string) => {
          if (!dStr) return 0
          if (dStr.includes('/')) {
            const parts = dStr.split('/')
            if (parts.length === 3) {
              return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime()
            }
          }
          return new Date(dStr).getTime() || 0
        }
        return parseDate(a.data_fechamento) - parseDate(b.data_fechamento)
      })
    }

    let projetosAtualizados = 0

    for (const cod in agrupados) {
      const registros = agrupados[cod]

      const { data: projeto } = await supabase
        .from('projetos')
        .select('id')
        .eq('codigo', cod)
        .maybeSingle()

      if (projeto) {
        const { data: parcelasExistentes } = await supabase
          .from('projeto_parcelas')
          .select('id, numero_parcela')
          .eq('projeto_id', projeto.id)

        const limite = Math.min(registros.length, 10)
        for (let i = 0; i < limite; i++) {
          const numParcela = i + 1
          const parcelaExistente = parcelasExistentes?.find((p) => p.numero_parcela === numParcela)

          const payload = {
            projeto_id: projeto.id,
            numero_parcela: numParcela,
            valor: registros[i].valor_fechado ? parseFloat(registros[i].valor_fechado) : 0,
            data_fechamento: registros[i].data_fechamento || null,
          }

          if (parcelaExistente) {
            await supabase.from('projeto_parcelas').update(payload).eq('id', parcelaExistente.id)
          } else {
            await supabase.from('projeto_parcelas').insert([{ ...payload, status: 'pendente' }])
          }
        }
        projetosAtualizados++
      }
    }

    const mensagemSucesso = 'Sincronização concluída com sucesso'
    await supabase.from('sync_history').insert([
      {
        registros_atualizados: projetosAtualizados,
        status: 'sucesso',
        mensagem: mensagemSucesso,
      },
    ])

    return new Response(
      JSON.stringify({
        success: true,
        projetos_atualizados: projetosAtualizados,
        mensagem: mensagemSucesso,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    const errorMsg = error.message || 'Erro desconhecido'
    await supabase.from('sync_history').insert([
      {
        registros_atualizados: 0,
        status: 'erro',
        mensagem: errorMsg,
      },
    ])

    return new Response(
      JSON.stringify({
        success: false,
        projetos_atualizados: 0,
        mensagem: errorMsg,
        error: error,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
