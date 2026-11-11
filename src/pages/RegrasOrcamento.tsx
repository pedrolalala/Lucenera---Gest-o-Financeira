// SPEC-282 Parte A: tela "Regras do orçamento". Mostra e altera as regras de validade e de aviso de
// preço (antes o "10" ficava fixo no código). Só administrador altera; o banco confere de novo.
import { useCallback, useEffect, useState } from 'react'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import AccessDenied from '@/pages/AccessDenied'
import { supabase } from '@/lib/supabase/client'
import { carregarRegras } from '@/lib/budget-regras'

interface Linha {
  chave: string
  valor: any
  descricao: string | null
  atualizado_em: string
  atualizado_por_nome: string | null
}

const STATUS_OPCOES: { v: string; t: string }[] = [
  { v: 'rascunho', t: 'Rascunho' },
  { v: 'Aprovação da Equipe', t: 'Revisão da Equipe (Pós-Visita)' },
  { v: 'enviado_cliente', t: 'Enviado para o Cliente' },
  { v: 'Aprovação Financeira', t: 'Revisão Financeira Pendente' },
]

const TITULOS: Record<string, string> = {
  validade_dias: 'Validade padrão do orçamento (dias)',
  aviso_preco_dias: 'Perguntar sobre atualizar preços depois de (dias)',
  aviso_preco_quando_mudou: 'Perguntar também quando a peça foi reajustada no cadastro',
  status_que_avisam: 'Status em que a pergunta de preço aparece',
}
const ORDEM = ['validade_dias', 'aviso_preco_dias', 'aviso_preco_quando_mudou', 'status_que_avisam']

export default function RegrasOrcamento() {
  const { role } = useAuth()
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [rascunho, setRascunho] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    const { data, error } = await (supabase.from as any)('orcamento_regras').select(
      'chave, valor, descricao, atualizado_em, atualizado_por_nome',
    )
    if (error) toast.error('Não foi possível carregar as regras', { description: error.message })
    const ls = ((data as Linha[]) || []).sort((a, b) => ORDEM.indexOf(a.chave) - ORDEM.indexOf(b.chave))
    setLinhas(ls)
    setRascunho(Object.fromEntries(ls.map((l) => [l.chave, l.valor])))
    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function salvar(chave: string) {
    setSalvando(chave)
    let valor = rascunho[chave]
    if (chave === 'validade_dias' || chave === 'aviso_preco_dias') valor = Number(valor)
    const { error } = await (supabase.rpc as any)('orcamento_regra_salvar', { p_chave: chave, p_valor: valor })
    setSalvando(null)
    if (error) {
      toast.error('Não foi possível salvar', { description: error.message })
      return
    }
    toast.success('Regra salva')
    await carregarRegras(true)
    carregar()
  }

  if (role !== 'admin') return <AccessDenied />

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-5 h-5 text-gray-600" />
        <h1 className="text-2xl font-bold tracking-tight">Regras do orçamento</h1>
      </div>
      <p className="text-sm text-gray-500">
        Estas regras valem para todo o Orçamentos. Mudar os <b>dias de validade</b> vale só para orçamentos novos: os
        antigos sem validade gravada continuam com o valor de antes.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
        </div>
      ) : (
        linhas.map((l) => {
          const mudou = JSON.stringify(rascunho[l.chave]) !== JSON.stringify(l.valor)
          return (
            <div key={l.chave} className="rounded-lg border bg-white p-4 space-y-2">
              <p className="font-medium">{TITULOS[l.chave] || l.chave}</p>
              {l.descricao && <p className="text-xs text-gray-500">{l.descricao}</p>}

              {(l.chave === 'validade_dias' || l.chave === 'aviso_preco_dias') && (
                <Input
                  type="number"
                  min={1}
                  max={365}
                  className="w-32"
                  value={rascunho[l.chave] ?? ''}
                  onChange={(e) => setRascunho({ ...rascunho, [l.chave]: e.target.value })}
                />
              )}
              {l.chave === 'aviso_preco_quando_mudou' && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rascunho[l.chave] === true}
                    onCheckedChange={(v) => setRascunho({ ...rascunho, [l.chave]: v })}
                  />
                  <span className="text-sm">{rascunho[l.chave] === true ? 'Ligado' : 'Desligado'}</span>
                </div>
              )}
              {l.chave === 'status_que_avisam' && (
                <div className="space-y-1">
                  {STATUS_OPCOES.map((o) => {
                    const lista: string[] = Array.isArray(rascunho[l.chave]) ? rascunho[l.chave] : []
                    return (
                      <label key={o.v} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={lista.includes(o.v)}
                          onChange={(e) =>
                            setRascunho({
                              ...rascunho,
                              [l.chave]: e.target.checked ? [...lista, o.v] : lista.filter((x) => x !== o.v),
                            })
                          }
                        />
                        {o.t}
                      </label>
                    )
                  })}
                  <p className="text-xs text-gray-500">Orçamento aprovado e devolução nunca perguntam.</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-gray-400">
                  Última alteração: {new Date(l.atualizado_em).toLocaleString('pt-BR')}
                  {l.atualizado_por_nome ? ` · ${l.atualizado_por_nome}` : ''}
                </span>
                <Button size="sm" disabled={!mudou || salvando === l.chave} onClick={() => salvar(l.chave)}>
                  {salvando === l.chave ? 'Salvando…' : 'Salvar'}
                </Button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
