// SPEC-282 Parte A: regras do orçamento (validade e aviso de preço) vêm da tabela `orcamento_regras`
// (editável por admin na tela "Regras do orçamento"), em vez do "10" fixo no código.
// Se a leitura falhar (sem rede, tabela ainda não criada), vale o PADRÃO abaixo = comportamento antigo.
import { supabase } from '@/lib/supabase/client'

export interface RegrasOrcamento {
  /** Validade padrão = emissão + N dias (orçamentos novos). */
  validadeDias: number
  /** Valor antes da última mudança: orçamentos antigos sem validade gravada, emitidos antes de `validadeVigenteDesde`, usam este. */
  validadeDiasAnterior: number | null
  validadeVigenteDesde: Date | null
  /** Ao editar orçamento com mais de N dias de emissão, pergunta se quer atualizar os preços. */
  avisoPrecoDias: number
  /** Também pergunta quando alguma peça teve o preço reajustado no cadastro. */
  avisoPrecoQuandoMudou: boolean
  /** Status em que o aviso de preço aparece. */
  statusQueAvisam: string[]
}

export const REGRAS_PADRAO: RegrasOrcamento = {
  validadeDias: 10,
  validadeDiasAnterior: null,
  validadeVigenteDesde: null,
  avisoPrecoDias: 10,
  avisoPrecoQuandoMudou: true,
  statusQueAvisam: ['rascunho', 'Aprovação da Equipe', 'enviado_cliente', 'Aprovação Financeira'],
}

let atual: RegrasOrcamento = REGRAS_PADRAO
let carregando: Promise<RegrasOrcamento> | null = null
let carregadoEm = 0
const VALIDADE_CACHE_MS = 60_000

/** Leitura síncrona (usa o que foi carregado; antes da 1ª carga, o padrão). */
export function getRegras(): RegrasOrcamento {
  return atual
}

export function interpretarRegras(linhas: any[]): RegrasOrcamento {
  const r: RegrasOrcamento = { ...REGRAS_PADRAO }
  for (const l of linhas || []) {
    const v = l.valor
    switch (l.chave) {
      case 'validade_dias':
        if (typeof v === 'number' && v >= 1) {
          r.validadeDias = v
          r.validadeDiasAnterior = typeof l.valor_anterior === 'number' ? l.valor_anterior : null
          r.validadeVigenteDesde = l.vigente_desde ? new Date(l.vigente_desde) : null
        }
        break
      case 'aviso_preco_dias':
        if (typeof v === 'number' && v >= 1) r.avisoPrecoDias = v
        break
      case 'aviso_preco_quando_mudou':
        if (typeof v === 'boolean') r.avisoPrecoQuandoMudou = v
        break
      case 'status_que_avisam':
        if (Array.isArray(v)) r.statusQueAvisam = v.filter((x) => typeof x === 'string')
        break
    }
  }
  return r
}

/** Carrega do banco (com cache curto). Nunca lança: em erro mantém o que já tinha. */
export function carregarRegras(forcar = false): Promise<RegrasOrcamento> {
  if (!forcar && carregando) return carregando
  if (!forcar && Date.now() - carregadoEm < VALIDADE_CACHE_MS) return Promise.resolve(atual)
  carregando = (async () => {
    try {
      const { data, error } = await (supabase.from as any)('orcamento_regras').select(
        'chave, valor, valor_anterior, vigente_desde',
      )
      if (!error && data) {
        atual = interpretarRegras(data)
        carregadoEm = Date.now()
      }
    } catch {
      // mantém o valor atual / padrão
    }
    carregando = null
    return atual
  })()
  return carregando
}
