import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'A pergunta (query) é obrigatória.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: 'Não autorizado. Faça login para usar o chat.',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Obter dados do usuário logado
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: 'Não foi possível autenticar o usuário no chat.',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Identificar role do usuário
    const { data: userData } = await supabaseClient
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = userData?.role || 'funcionario'

    // Identificar funcionario_id caso seja colaborador
    const { data: funcData } = await supabaseClient
      .from('funcionarios')
      .select('id')
      .eq('usuario_id', user.id)
      .maybeSingle()

    const funcionarioId = funcData?.id

    // Preparar queries baseadas no perfil
    let feriasQuery = supabaseClient.from('vw_controle_ferias_clt').select('*')
    let faltasQuery = supabaseClient
      .from('vw_historico_faltas')
      .select('*')
      .order('data_falta', { ascending: false })
      .limit(100)

    if (role === 'funcionario' || role === 'viewer') {
      if (!funcionarioId) {
        return new Response(
          JSON.stringify({
            reply:
              'Seu perfil de colaborador ainda não foi vinculado a um registro de funcionário no sistema. Procure o RH.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
      feriasQuery = feriasQuery.eq('funcionario_id', funcionarioId)
      faltasQuery = faltasQuery.eq('funcionario_id', funcionarioId)
    }

    const [
      { data: feriasContext, error: feriasError },
      { data: faltasContext, error: faltasError },
    ] = await Promise.all([feriasQuery, faltasQuery])

    if (feriasError || faltasError) {
      console.error(
        'Erro ao acessar o banco de dados:',
        feriasError || faltasError,
      )
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar contexto no banco de dados.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const systemPrompt = `Você atua como o Analista de RH da Lucenera. O sistema agora está sincronizado com os dados reais do Excel e possui automações de elegibilidade.
Sua operação deve se adaptar estritamente ao nível de permissão do usuário logado.

NÍVEL DE PERMISSÃO ATUAL: ${role.toUpperCase()}

=== DIRETRIZES DE ATUAÇÃO ===
1. Cálculo de Saldo (Novo Modelo Acumulativo Simples):
- Sempre consulte a View vw_controle_ferias_clt. O saldo atual consolidado é: (Número de Períodos Aquisitivos * 30) - Dias Gozados.
- Cada ciclo de 12 meses concluído gera 30 dias de direito. 
- O total de ciclos pode ser obtido dividindo o direito_total_acumulado por 30.

2. Tratamento de Faltas Injustificadas:
- Ignore totalmente a lógica de redução automática por faltas (antigo Art. 130 CLT).
- As faltas registradas no sistema servem apenas para histórico e NÃO abatem o saldo de férias, a menos que o RH decida convertê-las futuramente de forma manual.

3. Acúmulo de Períodos:
- Se um funcionário completou um novo ciclo de 12 meses sem tirar férias, o saldo dele aumenta automaticamente em 30 dias de forma cumulativa.

4. Transparência na Apresentação:
- Quando perguntado sobre o saldo de férias, apresente sempre de forma matemática:
  * Total de ciclos completados (ex: X ciclos).
  * Direito total acumulado (ex: Y dias).
  * Dias já gozados (ex: Z dias).
  * Saldo disponível para uso imediato (Y - Z = W dias).

5. Padrão de Resposta para Histórico de Faltas:
- Apresente os dados em ordem cronológica inversa.
- Formato: Funcionário (apenas se for ADMIN), Data da Ocorrência, Status, Justificativa. Reforce que isso é apenas um registro histórico que não afetou o saldo atual.

6. Regras de Segurança:
- Visão Administrador (ADMIN/GERENTE): Responde e lista dados de qualquer colaborador.
- Visão Colaborador (FUNCIONARIO/VIEWER): NUNCA forneça dados de terceiros. Responda apenas sobre o próprio funcionário logado.

Responda de forma clara, educada, objetiva e profissional, baseando-se EXCLUSIVAMENTE nos dados em JSON fornecidos abaixo. Não invente dados. Formate em texto simples com quebras de linha e marcadores.

=== DADOS DE FÉRIAS E SALDOS (vw_controle_ferias_clt) ===
${JSON.stringify(feriasContext)}

=== HISTÓRICO DE FALTAS (vw_historico_faltas) ===
${JSON.stringify(faltasContext)}`

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error: 'Chave da API do Gemini não está configurada no servidor.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Chamada para a API do Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${systemPrompt}\n\n=== PERGUNTA DO USUÁRIO ===\n${query}`,
                },
              ],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Erro na API do Gemini:', errorData)
      return new Response(
        JSON.stringify({
          error: 'Erro ao processar a resposta com a Inteligência Artificial.',
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const aiData = await response.json()
    const reply =
      aiData.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Desculpe, não consegui formular uma resposta clara com os dados disponíveis.'

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Erro interno no processamento do chat.',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
