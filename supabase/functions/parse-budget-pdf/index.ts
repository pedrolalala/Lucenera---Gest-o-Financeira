import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado. Token de acesso ausente.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Falha ao autenticar usuário.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let body
    try {
      body = await req.json()
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Formato de requisição inválido. Esperado JSON.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { pdfBase64 } = body
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return new Response(
        JSON.stringify({ error: 'O arquivo PDF é obrigatório e deve ser uma string base64.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          error:
            'Chave da API do Gemini (GEMINI_API_KEY) não está configurada no servidor. Por favor, adicione este secret no Supabase.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const prompt = `Você é um extrator de dados de orçamento em PDF.
Extraia as informações comerciais e retorne ESTRITAMENTE um JSON válido, sem markdown (\`\`\`json) e sem explicações, no seguinte formato exato:
{
  "empresa_nome": "Nome da empresa emissora (Ex: Luce Nera)",
  "cliente_nome": "Nome do cliente",
  "arquiteto_nome": "Nome do arquiteto",
  "vendedor_nome": "Nome do vendedor",
  "status": "Rascunho",
  "forma_pagamento": "pix, cartao, boleto, transferencia, cheque ou dinheiro",
  "desconto_global": 0,
  "observacoes": "quaisquer observacoes",
  "itens": [
    {
      "custom_id": "código se houver",
      "descricao": "nome ou descrição do produto",
      "quantidade": 1,
      "preco_unitario": 100.50,
      "desconto": 0
    }
  ]
}
Se uma informação não existir, retorne null ou string vazia.`

    const base64Data = pdfBase64.replace(/^data:.*?;base64,/, '')

    if (!base64Data) {
      return new Response(
        JSON.stringify({ error: 'O arquivo PDF base64 está vazio ou inválido.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

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
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      },
    )

    if (!response.ok) {
      const err = await response.text()
      console.error('Gemini API Error:', response.status, err)
      return new Response(
        JSON.stringify({
          error: 'Erro ao processar o documento. Verifique o arquivo e tente novamente.',
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      console.error('No text returned from Gemini API', data)
      return new Response(
        JSON.stringify({
          error: 'Nenhum dado legível retornado pela IA. Verifique se o PDF contém texto legível.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    let cleanText = text.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText
        .replace(/^```json/, '')
        .replace(/```$/, '')
        .trim()
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim()
    }

    let parsed
    try {
      parsed = JSON.parse(cleanText)
    } catch (e) {
      console.error('Failed to parse JSON from Gemini:', cleanText)
      return new Response(
        JSON.stringify({
          error: 'Erro ao processar o documento. Verifique o arquivo e tente novamente.',
        }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('PDF Parsing error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Erro interno no servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
