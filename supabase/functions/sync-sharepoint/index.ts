import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

function findFieldValue(fields: any, possibleNames: string[]) {
  if (!fields) return null
  const keys = Object.keys(fields)
  for (const name of possibleNames) {
    const match = keys.find(
      (k) => k.toLowerCase() === name.toLowerCase() || k.toLowerCase().includes(name.toLowerCase()),
    )
    if (match && fields[match] !== undefined && fields[match] !== null) {
      return fields[match]
    }
  }
  return null
}

function getNumberValue(fields: any, possibleNames: string[]) {
  const val = findFieldValue(fields, possibleNames)
  if (val === null || val === undefined || val === '') return 0
  const parsed = parseFloat(val)
  return isNaN(parsed) ? 0 : parsed
}

function getDateValue(fields: any, possibleNames: string[]) {
  const val = findFieldValue(fields, possibleNames)
  if (!val) return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Não autorizado. Token de acesso ausente.')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const supabaseUserClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser()
    if (userError || !user) throw new Error('Falha ao autenticar usuário.')

    const { data: profile } = await supabaseAdmin
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      throw new Error('Acesso negado. Apenas administradores podem executar a sincronização.')
    }

    const tenantId = Deno.env.get('SHAREPOINT_TENANT_ID')
    const clientId = Deno.env.get('SHAREPOINT_CLIENT_ID')
    const clientSecret = Deno.env.get('SHAREPOINT_CLIENT_SECRET')

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error(
        'Credenciais do SharePoint ausentes no ambiente. Verifique as variáveis SHAREPOINT_TENANT_ID, SHAREPOINT_CLIENT_ID e SHAREPOINT_CLIENT_SECRET.',
      )
    }

    // Authenticate with Microsoft Graph API
    const bodyParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    })

    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParams.toString(),
      },
    )

    if (!tokenResponse.ok) {
      const errTxt = await tokenResponse.text()
      console.error('Microsoft Graph Token Error Details:', errTxt)

      let errorMessage = 'Falha ao obter token do Microsoft Graph API.'
      try {
        const errObj = JSON.parse(errTxt)
        if (errObj.error_description) {
          errorMessage += ` Detalhes: ${errObj.error_description}`
        } else if (errObj.error) {
          errorMessage += ` Erro: ${errObj.error}`
        }
      } catch (e) {
        errorMessage += ` Resposta: ${errTxt}`
      }

      throw new Error(errorMessage)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Resolve site ID
    const siteResponse = await fetch(
      'https://graph.microsoft.com/v1.0/sites/lucenera.sharepoint.com:/sites/LUCENERAPROJETOS345',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )

    if (!siteResponse.ok) {
      const errTxt = await siteResponse.text()
      console.error('Site Error:', errTxt)
      throw new Error(`Falha ao acessar o site do SharePoint. Detalhes: ${errTxt}`)
    }

    const siteData = await siteResponse.json()
    const siteId = siteData.id

    // Get lists
    const listsResponse = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!listsResponse.ok) {
      const errTxt = await listsResponse.text()
      console.error('Lists Error:', errTxt)
      throw new Error(`Falha ao obter listas do SharePoint. Detalhes: ${errTxt}`)
    }

    const listsData = await listsResponse.json()
    const projetosList = listsData.value.find(
      (l: any) => l.displayName === 'Organização Projetos' || l.name === 'Organização Projetos',
    )
    const precosList = listsData.value.find(
      (l: any) => l.displayName === 'Tabelas de Preços' || l.name === 'Tabelas de Preços',
    )

    let projetosCount = 0
    let precosCount = 0

    if (projetosList) {
      const pItemsRes = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${projetosList.id}/items?expand=fields`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly',
          },
        },
      )
      if (pItemsRes.ok) {
        const pItems = await pItemsRes.json()
        const extractedProjetos = pItems.value.map((item: any) => ({
          codigo: findFieldValue(item.fields, ['Codigo', 'Código', 'Code']) || null,
          nome: findFieldValue(item.fields, ['Projeto', 'Title', 'Nome']) || 'Projeto Sem Nome',
          responsavel:
            findFieldValue(item.fields, ['Responsavel', 'Responsável']) || 'Não Definido',
          arquiteto_responsavel:
            findFieldValue(item.fields, [
              'Arquiteto Responsavel',
              'Arquiteto Responsável',
              'Arquiteto',
            ]) || null,
          responsavel_obra:
            findFieldValue(item.fields, [
              'Responsavel da Obra',
              'Responsável da Obra',
              'Responsável Obra',
            ]) || null,
          cidade: findFieldValue(item.fields, ['Cidade']) || null,
          estado: findFieldValue(item.fields, ['Estado', 'UF']) || null,
          status: findFieldValue(item.fields, ['Status']) || 'Pendente',
          prazo: getDateValue(item.fields, ['Prazo', 'Data', 'Deadline']),
          data_entrada: getDateValue(item.fields, [
            'Data Entrada',
            'Data de Entrada',
            'DataEntrada',
          ]),
          valor: getNumberValue(item.fields, ['Valor', 'Orcamento', 'Orçamento']),
          observacoes: findFieldValue(item.fields, ['Observacoes', 'Observações', 'Notas']) || null,
        }))

        const uniqueProjetosMap = new Map()
        for (const p of extractedProjetos) {
          uniqueProjetosMap.set(p.nome.toLowerCase(), p)
        }
        const uniqueProjetos = Array.from(uniqueProjetosMap.values())

        const { data: existingProjetos } = await supabaseAdmin.from('projetos').select('id, nome')

        const upsertData = uniqueProjetos.map((projeto: any) => {
          const existing = existingProjetos?.find(
            (p: any) => p.nome.toLowerCase() === projeto.nome.toLowerCase(),
          )
          return existing ? { id: existing.id, ...projeto } : projeto
        })

        if (upsertData.length > 0) {
          const { error: upsertError } = await supabaseAdmin.from('projetos').upsert(upsertData)
          if (upsertError)
            throw new Error(`Erro ao salvar projetos no banco de dados: ${upsertError.message}`)
          projetosCount = upsertData.length
        }
      } else {
        const errTxt = await pItemsRes.text()
        console.error('Erro ao buscar itens de Projetos:', errTxt)
        throw new Error(`Erro ao buscar itens de Projetos no SharePoint. Detalhes: ${errTxt}`)
      }
    } else {
      console.warn('Lista "Organização Projetos" não encontrada no SharePoint.')
    }

    if (precosList) {
      const prItemsRes = await fetch(
        `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${precosList.id}/items?expand=fields`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Prefer: 'HonorNonIndexedQueriesWarningMayFailRandomly',
          },
        },
      )
      if (prItemsRes.ok) {
        const prItems = await prItemsRes.json()
        const extractedPrecos = prItems.value.map((item: any) => ({
          servico:
            findFieldValue(item.fields, ['Title', 'Servico', 'Serviço']) || 'Serviço Sem Nome',
          categoria: findFieldValue(item.fields, ['Categoria']) || 'Geral',
          preco: getNumberValue(item.fields, ['Preco', 'Preço', 'Valor']),
          vigencia: findFieldValue(item.fields, ['Vigencia', 'Vigência', 'Periodo']) || '-',
          observacao: findFieldValue(item.fields, ['Observacao', 'Observação', 'Notas']) || null,
        }))

        const uniquePrecosMap = new Map()
        for (const p of extractedPrecos) {
          uniquePrecosMap.set(p.servico.toLowerCase(), p)
        }
        const uniquePrecos = Array.from(uniquePrecosMap.values())

        const { data: existingPrecos } = await supabaseAdmin
          .from('tabela_precos')
          .select('id, servico')

        const upsertData = uniquePrecos.map((preco: any) => {
          const existing = existingPrecos?.find(
            (p: any) => p.servico.toLowerCase() === preco.servico.toLowerCase(),
          )
          return existing ? { id: existing.id, ...preco } : preco
        })

        if (upsertData.length > 0) {
          const { error: upsertError } = await supabaseAdmin
            .from('tabela_precos')
            .upsert(upsertData)
          if (upsertError)
            throw new Error(`Erro ao salvar preços no banco de dados: ${upsertError.message}`)
          precosCount = upsertData.length
        }
      } else {
        const errTxt = await prItemsRes.text()
        console.error('Erro ao buscar itens de Tabela de Preços:', errTxt)
        throw new Error(
          `Erro ao buscar itens de Tabela de Preços no SharePoint. Detalhes: ${errTxt}`,
        )
      }
    } else {
      console.warn('Lista "Tabelas de Preços" não encontrada no SharePoint.')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sincronização concluída com sucesso. ${projetosCount} projetos e ${precosCount} preços sincronizados.`,
        stats: { projetos: projetosCount, precos: precosCount },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Edge Function Error (sync-sharepoint):', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno no servidor ao sincronizar dados.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
