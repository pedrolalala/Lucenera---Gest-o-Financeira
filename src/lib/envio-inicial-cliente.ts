import { supabase } from '@/lib/supabase/client'
import { buildClientApprovalLink } from '@/lib/budget-status'
import type { Budget } from '@/stores/useBudgetStore'

// SPEC-067 — helper compartilhado para o envio inicial de um orçamento em
// rascunho ao cliente: download automático do PDF + abertura de um
// `mailto:` pré-preenchido. Usado por DraftBudgetsTab.tsx::handleEnviar e
// pelo branch `rascunho` de BudgetTableRow.tsx::handleEnviarCliente.
//
// NUNCA usar para reenvio (ClientApprovalTab.tsx::handleEnviar ou o botão
// de reenvio `RefreshCw` em BudgetTableRow.tsx) — ver "Distinção obrigatória
// de escopo" na SPEC-067.

type BudgetPdfInfo = Pick<Budget, 'id' | 'numero'>
type BudgetEmailInfo = Pick<Budget, 'id' | 'numero' | 'empresa' | 'cliente'>

function resolveBudgetNumero(budget: BudgetPdfInfo): string {
  return budget.numero || budget.id.split('-')[0].toUpperCase()
}

/**
 * Gera e baixa o PDF do orçamento via Edge Function `generate-report`.
 * Mesmo padrão já usado em `BudgetTableRow.tsx::handleDownloadPdf`
 * (linhas 190-225 antes desta SPEC).
 *
 * Lança um erro se a geração falhar — quem chama decide o toast/fallback
 * (ver P-5 da SPEC-067).
 */
export async function downloadBudgetPdf(budget: BudgetPdfInfo): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession()
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionData.session?.access_token}`,
      },
      body: JSON.stringify({
        reportType: 'orcamento',
        format: 'pdf',
        filters: { id: budget.id },
      }),
    },
  )
  if (!response.ok) throw new Error('Erro ao gerar o PDF.')
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Orcamento_${resolveBudgetNumero(budget)}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(url)
}

/**
 * Monta a URL `mailto:` de envio inicial do orçamento ao cliente, com
 * assunto e corpo fixos definidos na SPEC-067 ("Conteúdo do e-mail").
 *
 * Se `budget.cliente?.email` estiver ausente, o destinatário fica vazio
 * (`mailto:?subject=...&body=...`) e o usuário preenche manualmente
 * (P-2 da SPEC-067).
 */
export function buildBudgetMailtoUrl(
  budget: BudgetEmailInfo,
  token: string,
): string {
  const numero = resolveBudgetNumero(budget)
  const empresa = budget.empresa?.nome || ''
  const cliente = budget.cliente?.razao_social || budget.cliente?.nome || ''
  const email = budget.cliente?.email || ''
  const link = buildClientApprovalLink(budget.id, token)

  const subject = `Orçamento Nº ${numero} - ${empresa}`
  const body = [
    `Olá ${cliente},`,
    '',
    `Segue o orçamento Nº ${numero} para sua análise e aprovação.`,
    '',
    'Para aprovar ou recusar o orçamento, acesse o link abaixo:',
    link,
    '',
    'O PDF do orçamento foi baixado automaticamente neste dispositivo.',
    'Por favor, anexe o arquivo baixado a este e-mail antes de enviar.',
    '',
    'Atenciosamente,',
    empresa,
  ].join('\n')

  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * Executa o comportamento novo do envio inicial (SPEC-067): abre o cliente
 * de e-mail padrão do usuário via `mailto:` pré-preenchido e, em seguida,
 * baixa o PDF do orçamento.
 *
 * O `mailto:` é aberto ANTES do download (não depois) de propósito: o
 * navegador só honra a navegação para um esquema externo como `mailto:`
 * enquanto ainda houver "ativação de usuário" válida a partir do clique
 * original, e essa ativação expira depois de chamadas de rede demoradas
 * (a geração do PDF passa por uma Edge Function, que não é instantânea).
 * Abrir o `mailto:` o mais perto possível do clique é o que garante que
 * ele realmente abra. O download do PDF (via `<a download>`) não sofre
 * dessa restrição, então pode acontecer depois sem prejuízo.
 *
 * Consequência (P-5 revisada, 2026-08-06): se o download do PDF falhar
 * depois, o `mailto:` já foi aberto — quem chama mostra só um toast de
 * erro do PDF, sem afetar o e-mail já aberto. O status do orçamento (já
 * alterado pela RPC `enviar_orcamento_para_cliente`) não é revertido por
 * esta função.
 */
export async function sendInitialBudgetPdfAndEmail(
  budget: BudgetEmailInfo,
  token: string,
): Promise<void> {
  const mailtoUrl = buildBudgetMailtoUrl(budget, token)
  window.location.href = mailtoUrl
  await downloadBudgetPdf(budget)
}
