import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders })

  try {
    let body
    try {
      body = await req.json()
    } catch (e) {
      throw new Error('Formato de requisição inválido. Esperado JSON.')
    }

    const { pdfBase64 } = body
    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      throw new Error(
        'O arquivo PDF é obrigatório e deve ser uma string base64.',
      )
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) throw new Error('GEMINI_API_KEY is missing')

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
      throw new Error('O arquivo PDF base64 está vazio ou inválido.')
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
      throw new Error(`Erro na API do Gemini: ${err}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error(
        'Nenhum dado legível retornado pela IA. Verifique se o PDF contém texto legível.',
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
      throw new Error(
        'Falha ao interpretar os dados extraídos. O formato retornado não é um JSON válido.',
      )
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('PDF Parsing error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
