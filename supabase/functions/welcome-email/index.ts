import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name } = await req.json()

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set')
      throw new Error('Server configuration error')
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao Finova</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
          .header { background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #f3f4f6; }
          .logo { font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.025em; }
          .logo span { background-color: #000; color: #fff; padding: 4px 8px; border-radius: 6px; margin-right: 8px; }
          .content { padding: 40px; }
          .greeting { font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 16px; }
          .intro { margin-bottom: 32px; color: #4b5563; }
          .section { margin-bottom: 24px; background-color: #f9fafb; padding: 20px; border-radius: 8px; }
          .section-title { font-weight: 600; color: #111827; font-size: 16px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
          .footer { background-color: #f9fafb; padding: 24px 40px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #f3f4f6; }
          ul { margin: 0; padding-left: 20px; }
          li { margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo"><span>S</span> Finova</div>
          </div>
          <div class="content">
            <div class="greeting">Olá, ${name || 'Usuário'}!</div>
            <p class="intro">Bem-vindo ao Finova! Estamos muito felizes em tê-lo conosco. Para ajudar você a começar, preparamos um guia rápido sobre as principais funcionalidades.</p>
            
            <div class="section">
              <div class="section-title">📊 Dashboard e KPIs</div>
              <p>Acompanhe a saúde das suas finanças com indicadores em tempo real:</p>
              <ul>
                <li><strong>Saldo Total:</strong> O acumulado de todas as suas contas.</li>
                <li><strong>Receita vs Despesa:</strong> Comparativo mensal para identificar tendências.</li>
                <li><strong>Eficiência:</strong> Acompanhe quanto da sua receita está sendo poupada.</li>
              </ul>
            </div>

            <div class="section">
              <div class="section-title">💸 Transações</div>
              <p>Mantenha tudo registrado:</p>
              <ul>
                <li>Use o botão <strong>"Nova Transação"</strong> para adicionar ganhos ou gastos.</li>
                <li>Categorize suas movimentações (ex: Alimentação, Transporte).</li>
                <li>Defina a forma de pagamento (PIX, Cartão, Dinheiro).</li>
              </ul>
            </div>

            <div class="section">
              <div class="section-title">🔒 Segurança</div>
              <p>Seus dados são criptografados e visíveis apenas para você. Fique tranquilo, suas informações financeiras estão seguras.</p>
            </div>

            <p>Se tiver dúvidas, acesse a página de <strong>Ajuda</strong> no aplicativo ou responda a este email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Finova. Todos os direitos reservados.</p>
            <p>Você está recebendo este email porque se cadastrou na plataforma Finova.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'suporte@produto.blog',
        to: [email],
        subject: 'Bem-vindo ao Planejador Financeiro',
        html: htmlContent,
      }),
    })

    if (!res.ok) {
      const errorData = await res.text()
      console.error('Resend API Error:', errorData)
      throw new Error(`Failed to send email: ${errorData}`)
    }

    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
