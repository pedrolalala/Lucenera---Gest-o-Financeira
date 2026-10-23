/**
 * SPEC-223: painel do empréstimo dentro do orçamento (Outros → EMPRESTIMO) e no detalhe da aba
 * Empréstimos. Antes de confirmar: fotos da saída + "Confirmar empréstimo" (cria o EMP- e baixa o
 * termo). Depois: termo em PDF, devolução peça a peça (ou parte, com foto, OK ou com dano),
 * "Virar venda" (cria um orçamento de venda só com as peças que o cliente ficou) e cancelar
 * (só enquanto nada voltou nem virou venda). Mesmas regras do /admin do Showroom (SPEC-219).
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FileDown, Loader2, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  adicionarFotosSaida,
  cancelarEmprestimo,
  confirmarEmprestimo,
  converterEmVenda,
  emAbertoPorProduto,
  emprestimoDoOrcamento,
  listarFotos,
  numeroEmprestimo,
  obterEmprestimo,
  registrarDevolucao,
  ROTULO_SITUACAO,
  type EmprestimoDetalhe,
  type FotoEmprestimo,
  type ItemEmprestimo,
} from '@/services/emprestimosService'
import { StatusEmprestimoBadge } from './StatusEmprestimoBadge'
import { GaleriaFotos, SeletorFotos } from './FotosEmprestimo'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtDia = (v: string | null) => {
  if (!v) return '-'
  const [a, m, d] = v.slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}

const brParaNumero = (t: string) => {
  const n = Number(t.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

const lerInteiro = (t: string | undefined, max: number) => {
  const n = parseInt(t ?? '', 10)
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0
}

interface Devolucao {
  item: ItemEmprestimo
  comDano: boolean
}

interface Props {
  /** orçamento de empréstimo (painel dentro do formulário) */
  orcamentoId?: string
  /** empréstimo já conhecido (detalhe da aba Empréstimos) */
  emprestimoId?: string
  /** motivo para não deixar confirmar agora (ex.: alterações não salvas) */
  bloqueioConfirmar?: string | null
  /** peças do orçamento (aviso de estoque antes de confirmar; não bloqueia — decisão 5) */
  pecas?: { produto_id: string; nome: string; quantidade: number }[]
  onAlterado?: () => void
}

export function EmprestimoPainel({ orcamentoId, emprestimoId, bloqueioConfirmar, pecas, onAlterado }: Props) {
  const navigate = useNavigate()
  const [carregando, setCarregando] = useState(true)
  const [emp, setEmp] = useState<EmprestimoDetalhe | null>(null)
  const [fotos, setFotos] = useState<FotoEmprestimo[]>([])
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  // confirmação (antes do EMP- existir)
  const [fotosSaida, setFotosSaida] = useState<File[]>([])
  // devolução em edição (uma peça por vez)
  const [devolucao, setDevolucao] = useState<Devolucao | null>(null)
  const [qtdDevolver, setQtdDevolver] = useState('')
  const [fotosVolta, setFotosVolta] = useState<File[]>([])
  const [danoDescricao, setDanoDescricao] = useState('')
  const [danoValor, setDanoValor] = useState('')
  // mais fotos da saída
  const [novasSaida, setNovasSaida] = useState<File[]>([])
  // virar venda: item_id -> quantidade (texto)
  const [vendendo, setVendendo] = useState(false)
  const [venda, setVenda] = useState<Record<string, string>>({})
  const [cancelando, setCancelando] = useState(false)
  const [motivo, setMotivo] = useState('')

  // aviso: emprestar mais do que há no estoque geral + showroom (menos o já emprestado)
  const [avisosEstoque, setAvisosEstoque] = useState<string[]>([])
  const chavePecas = JSON.stringify(pecas ?? [])

  const erro = (e: unknown, padrao: string) => toast.error(e instanceof Error ? e.message : padrao)

  const carregar = useCallback(async () => {
    try {
      const d = emprestimoId
        ? await obterEmprestimo(emprestimoId)
        : orcamentoId
          ? await emprestimoDoOrcamento(orcamentoId)
          : null
      setEmp(d)
      setFotos(d ? await listarFotos(d.id) : [])
    } catch (e) {
      erro(e, 'Falha ao abrir o empréstimo')
    } finally {
      setCarregando(false)
    }
  }, [emprestimoId, orcamentoId])

  useEffect(() => {
    setCarregando(true)
    setDevolucao(null)
    setVendendo(false)
    setCancelando(false)
    void carregar()
  }, [carregar])

  useEffect(() => {
    const lista = (JSON.parse(chavePecas) as NonNullable<Props['pecas']>).filter((p) => p.produto_id)
    if (emp || lista.length === 0) {
      setAvisosEstoque([])
      return
    }
    let vivo = true
    emAbertoPorProduto([...new Set(lista.map((p) => p.produto_id))])
      .then((r) => {
        if (!vivo) return
        const porId = new Map(r.map((x) => [x.produto_id, x]))
        const somado = new Map<string, { nome: string; qtd: number }>()
        for (const p of lista) {
          const a = somado.get(p.produto_id)
          somado.set(p.produto_id, { nome: a?.nome || p.nome, qtd: (a?.qtd ?? 0) + p.quantidade })
        }
        const avisos: string[] = []
        somado.forEach((v, id) => {
          const x = porId.get(id)
          if (!x) return
          const livre = x.estoque_geral + x.estoque_showroom - x.quantidade_em_aberto
          if (v.qtd > livre)
            avisos.push(
              `${v.nome}: emprestando ${v.qtd}, no sistema há ${x.estoque_geral} no estoque geral + ${x.estoque_showroom} no showroom${
                x.quantidade_em_aberto ? `, ${x.quantidade_em_aberto} já emprestada(s)` : ''
              }.`,
            )
        })
        setAvisosEstoque(avisos)
      })
      .catch(() => setAvisosEstoque([]))
    return () => {
      vivo = false
    }
  }, [chavePecas, emp])

  const alterado = async () => {
    await carregar()
    onAlterado?.()
  }

  async function baixarPdf(alvo: EmprestimoDetalhe | null = emp) {
    if (!alvo) return
    setGerandoPdf(true)
    try {
      // links novos: os da tela podem ter passado dos 10 minutos
      const atuais = await listarFotos(alvo.id)
      const { baixarTermoEmprestimo } = await import('@/lib/pdf-termo-emprestimo')
      await baixarTermoEmprestimo(alvo, atuais.filter((f) => f.momento === 'saida'))
    } catch (e) {
      erro(e, 'Erro ao gerar o PDF')
    } finally {
      setGerandoPdf(false)
    }
  }

  async function confirmar() {
    if (!orcamentoId) return
    if (fotosSaida.length === 0) return toast.error('Tire pelo menos 1 foto de como as peças estão saindo.')
    setOcupado('Confirmando…')
    let criado: { id: string; numero: number } | null = null
    try {
      criado = await confirmarEmprestimo(orcamentoId)
    } catch (e) {
      setOcupado(null)
      return erro(e, 'Erro ao confirmar o empréstimo')
    }
    try {
      setOcupado('Enviando fotos…')
      await adicionarFotosSaida(criado.id, fotosSaida)
      setFotosSaida([])
    } catch (e) {
      toast.warning(
        `Empréstimo ${numeroEmprestimo(criado.numero)} confirmado, mas as fotos não subiram: ${e instanceof Error ? e.message : ''}. Adicione as fotos abaixo.`,
        { duration: 10000 },
      )
    }
    toast.success(`Empréstimo ${numeroEmprestimo(criado.numero)} confirmado`)
    setOcupado(null)
    await alterado()
    try {
      await baixarPdf(await obterEmprestimo(criado.id))
    } catch {
      /* o botão "Baixar termo" continua disponível */
    }
  }

  function abrirDevolucao(item: ItemEmprestimo, comDano: boolean) {
    setVendendo(false)
    setDevolucao({ item, comDano })
    setQtdDevolver(String(item.quantidade))
    setFotosVolta([])
    setDanoDescricao('')
    setDanoValor((item.valor_unitario * item.quantidade).toFixed(2).replace('.', ','))
  }

  async function confirmarDevolucao() {
    if (!devolucao || !emp) return
    const { item, comDano } = devolucao
    const qtd = lerInteiro(qtdDevolver, item.quantidade)
    if (qtd < 1) return toast.error(`Quantidade entre 1 e ${item.quantidade}.`)
    if (fotosVolta.length === 0) return toast.error('Tire pelo menos 1 foto de como a peça voltou.')
    let valor: number | null = null
    if (comDano) {
      valor = brParaNumero(danoValor)
      const integral = item.valor_unitario * qtd
      if (!danoDescricao.trim()) return toast.error('Descreva o dano.')
      if (Number.isNaN(valor) || valor < 0 || valor > integral + 0.005)
        return toast.error(`O valor deve ficar entre R$ 0,00 e ${brl(integral)} (valor integral).`)
    }
    setOcupado('Enviando fotos e registrando…')
    try {
      await registrarDevolucao(emp.id, item.id, qtd, fotosVolta, comDano, danoDescricao, valor)
      toast.success(`${comDano ? 'Devolução com dano' : 'Devolução'} registrada: ${item.nome}`)
      setDevolucao(null)
      await alterado()
    } catch (e) {
      erro(e, 'Erro ao registrar a devolução')
    } finally {
      setOcupado(null)
    }
  }

  async function enviarMaisSaida() {
    if (!emp || novasSaida.length === 0) return
    setOcupado('Enviando fotos…')
    try {
      await adicionarFotosSaida(emp.id, novasSaida)
      toast.success('Fotos da saída adicionadas')
      setNovasSaida([])
      await alterado()
    } catch (e) {
      erro(e, 'Erro ao enviar fotos')
    } finally {
      setOcupado(null)
    }
  }

  async function criarVenda() {
    if (!emp) return
    const itens = emp.itens
      .filter((i) => i.situacao === 'emprestado' && venda[i.id] !== undefined)
      .map((i) => ({ item_id: i.id, quantidade: lerInteiro(venda[i.id], i.quantidade) }))
      .filter((i) => i.quantidade > 0)
    if (itens.length === 0) return toast.error('Marque as peças que o cliente ficou.')
    setOcupado('Criando o orçamento de venda…')
    try {
      const r = await converterEmVenda(emp.id, itens)
      toast.success(`Orçamento de venda ${r.numero} criado`, {
        description: 'Complete o pagamento e siga o fluxo normal. As peças já vêm marcadas "Já está com o cliente".',
        duration: 10000,
      })
      onAlterado?.()
      navigate(`/budgets/${r.orcamento_id}`)
    } catch (e) {
      erro(e, 'Erro ao virar venda')
    } finally {
      setOcupado(null)
    }
  }

  async function confirmarCancelamento() {
    if (!emp || !motivo.trim()) return
    setOcupado('Cancelando…')
    try {
      await cancelarEmprestimo(emp.id, motivo)
      toast.success(`Empréstimo ${numeroEmprestimo(emp.numero)} cancelado`)
      setCancelando(false)
      await alterado()
    } catch (e) {
      erro(e, 'Erro ao cancelar')
    } finally {
      setOcupado(null)
    }
  }

  if (carregando) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ---------- Ainda não confirmado ----------
  if (!emp) {
    if (!orcamentoId) return null
    return (
      <div className="space-y-3 text-sm">
        <p>
          Ao confirmar, o sistema gera o número <strong>EMP-</strong> e o termo em PDF para o cliente assinar. As peças
          não saem do estoque e não geram financeiro. Depois de confirmado, as peças não podem mais ser alteradas.
        </p>
        <div className="space-y-1">
          <Label>Fotos de como as peças estão saindo (obrigatório)</Label>
          <SeletorFotos
            arquivos={fotosSaida}
            onChange={setFotosSaida}
            rotulo="Tirar / escolher fotos"
            disabled={!!ocupado || !!bloqueioConfirmar}
          />
        </div>
        {avisosEstoque.length > 0 && (
          <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
            <p className="font-medium">Atenção ao estoque (não bloqueia — a peça precisa estar aqui para sair):</p>
            <ul className="mt-1 list-disc pl-4">
              {avisosEstoque.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        )}
        {bloqueioConfirmar && <p className="text-xs font-medium text-amber-700">{bloqueioConfirmar}</p>}
        <Button
          type="button"
          disabled={!!ocupado || !!bloqueioConfirmar || fotosSaida.length === 0}
          onClick={confirmar}
        >
          {ocupado ?? 'Confirmar empréstimo e baixar o termo'}
        </Button>
      </div>
    )
  }

  // ---------- Confirmado ----------
  const cancelado = !!emp.cancelado_em
  const emAberto = emp.itens.filter((i) => i.situacao === 'emprestado')
  const podeCancelar = !cancelado && emp.itens.every((i) => i.situacao === 'emprestado')
  const total = emp.itens.reduce((a, i) => a + i.valor_unitario * i.quantidade, 0)
  const saida = fotos.filter((f) => f.momento === 'saida')
  const vendas = Array.from(
    new Map(
      emp.itens.filter((i) => i.orcamento_venda_id).map((i) => [i.orcamento_venda_id, i.orcamento_venda_numero]),
    ),
  )

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-semibold">{numeroEmprestimo(emp.numero)}</span>
        <StatusEmprestimoBadge status={emp.status} />
        <span className="text-xs text-muted-foreground">
          {emp.empresa.nome} · emprestado em {fmtDia(emp.data_emprestimo)} · devolver até{' '}
          {fmtDia(emp.data_prevista_devolucao)}
          {emp.origem === 'showroom' ? ' · feito no Showroom' : ''}
          {emp.criado_por ? ` · por ${emp.criado_por}` : ''}
        </span>
      </div>

      <div className="rounded border px-3 py-2">
        <div className="font-medium">{emp.cliente.nome}</div>
        <div className="text-xs text-muted-foreground">
          {[emp.cliente.cpf_cnpj, emp.cliente.telefone, emp.cliente.email].filter(Boolean).join(' · ') ||
            'Sem documento/contato no cadastro'}
        </div>
        {emp.observacoes && <p className="mt-1 text-xs">Obs.: {emp.observacoes}</p>}
        {cancelado && (
          <p className="mt-1 text-xs text-destructive">
            Cancelado em {new Date(emp.cancelado_em as string).toLocaleDateString('pt-BR')}: {emp.cancelado_motivo}
          </p>
        )}
        {vendas.length > 0 && (
          <p className="mt-1 text-xs">
            Virou venda:{' '}
            {vendas.map(([id, numero], k) => (
              <span key={id}>
                {k > 0 && ', '}
                <button
                  type="button"
                  className="font-medium text-primary underline"
                  onClick={() => navigate(`/budgets/${id}`)}
                >
                  {numero ?? 'orçamento'}
                </button>
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="space-y-2 rounded border px-3 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Como as peças saíram ({saida.length} foto{saida.length === 1 ? '' : 's'})
        </h3>
        <GaleriaFotos fotos={saida} />
        {saida.length === 0 && (
          <p className="text-xs font-medium text-destructive">
            Sem foto da saída. Tire as fotos antes de entregar as peças ao cliente.
          </p>
        )}
        {!cancelado && (
          <div className="space-y-2">
            <SeletorFotos
              arquivos={novasSaida}
              onChange={setNovasSaida}
              rotulo="Adicionar fotos da saída"
              disabled={!!ocupado}
            />
            {novasSaida.length > 0 && (
              <Button type="button" size="sm" disabled={!!ocupado} onClick={enviarMaisSaida}>
                Enviar {novasSaida.length} foto{novasSaida.length === 1 ? '' : 's'}
              </Button>
            )}
          </div>
        )}
      </div>

      <ul className="space-y-2">
        {emp.itens.map((i) => {
          const fotosItem = fotos.filter((f) => f.momento === 'devolucao' && f.item_id === i.id)
          const editando = devolucao?.item.id === i.id
          const marcado = venda[i.id] !== undefined
          return (
            <li key={i.id} className="rounded border px-3 py-2">
              <div className="flex flex-wrap items-start gap-2">
                {vendendo && i.situacao === 'emprestado' && (
                  <Checkbox
                    className="mt-1"
                    checked={marcado}
                    onCheckedChange={(v) => {
                      const n = { ...venda }
                      if (v) n[i.id] = String(i.quantidade)
                      else delete n[i.id]
                      setVenda(n)
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-xs text-muted-foreground">{i.codigo_produto}</span>{' '}
                  <span className="font-medium">{i.nome}</span>
                  <div className="text-xs text-muted-foreground">
                    {i.quantidade} × {brl(i.valor_unitario)} = {brl(i.quantidade * i.valor_unitario)} ·{' '}
                    {ROTULO_SITUACAO[i.situacao]}
                    {i.situacao === 'convertido_venda' && i.orcamento_venda_numero && ` (${i.orcamento_venda_numero})`}
                    {i.data_devolucao && ` em ${fmtDia(i.data_devolucao)}`}
                  </div>
                  {i.situacao === 'devolvido_com_dano' && (
                    <p className="mt-0.5 text-xs text-destructive">
                      Dano: {i.descricao_dano} — cobrar {brl(i.valor_dano ?? 0)}
                    </p>
                  )}
                </div>
                {vendendo && marcado && i.quantidade > 1 && (
                  <div className="flex items-center gap-1 text-xs">
                    ficou com
                    <Input
                      inputMode="numeric"
                      className="h-8 w-16 text-right"
                      value={venda[i.id]}
                      onChange={(e) => setVenda({ ...venda, [i.id]: e.target.value })}
                    />
                    de {i.quantidade}
                  </div>
                )}
                {i.situacao === 'emprestado' && !cancelado && !editando && !vendendo && (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!!ocupado}
                      onClick={() => abrirDevolucao(i, false)}
                    >
                      Devolvida OK
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      disabled={!!ocupado}
                      onClick={() => abrirDevolucao(i, true)}
                    >
                      Com dano
                    </Button>
                  </div>
                )}
              </div>

              {fotosItem.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">Como voltou:</p>
                  <GaleriaFotos fotos={fotosItem} />
                </div>
              )}

              {editando && devolucao && (
                <div className="mt-2 space-y-2 rounded bg-muted/50 p-2">
                  <p className="text-xs font-semibold">
                    {devolucao.comDano ? 'Devolução com dano' : 'Devolução sem dano'}
                  </p>
                  {i.quantidade > 1 && (
                    <div className="flex items-center gap-2 text-xs">
                      <Label htmlFor="qtd-dev">Quantas voltaram?</Label>
                      <Input
                        id="qtd-dev"
                        inputMode="numeric"
                        className="h-8 w-16 text-right"
                        value={qtdDevolver}
                        onChange={(e) => {
                          setQtdDevolver(e.target.value)
                          const q = lerInteiro(e.target.value, i.quantidade)
                          setDanoValor((i.valor_unitario * q).toFixed(2).replace('.', ','))
                        }}
                      />
                      de {i.quantidade} (o resto continua com o cliente)
                    </div>
                  )}
                  <div className="space-y-1">
                    <Label>Fotos de como a peça voltou (obrigatório)</Label>
                    <SeletorFotos
                      arquivos={fotosVolta}
                      onChange={setFotosVolta}
                      rotulo="Tirar / escolher fotos"
                      disabled={!!ocupado}
                    />
                  </div>
                  {devolucao.comDano && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="dano-desc">O que aconteceu com a peça?</Label>
                        <Textarea
                          id="dano-desc"
                          rows={2}
                          value={danoDescricao}
                          onChange={(e) => setDanoDescricao(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="dano-valor">Valor a cobrar (R$)</Label>
                        <Input
                          id="dano-valor"
                          value={danoValor}
                          onChange={(e) => setDanoValor(e.target.value)}
                          inputMode="decimal"
                          className="h-8 w-40"
                        />
                        <p className="text-xs text-muted-foreground">
                          Valor integral: {brl(i.valor_unitario * lerInteiro(qtdDevolver, i.quantidade))}. Só
                          diminua se nem todas as unidades voltaram danificadas.
                        </p>
                      </div>
                    </>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={devolucao.comDano ? 'destructive' : 'default'}
                      disabled={!!ocupado || fotosVolta.length === 0}
                      onClick={confirmarDevolucao}
                    >
                      {ocupado ?? (devolucao.comDano ? 'Registrar devolução com dano' : 'Registrar devolução')}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" disabled={!!ocupado} onClick={() => setDevolucao(null)}>
                      Voltar
                    </Button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <div className="rounded bg-muted/50 px-3 py-2">
        Valor total das peças: <strong>{brl(total)}</strong>
      </div>

      {vendendo && (
        <div className="space-y-2 rounded border border-blue-300 bg-blue-50 p-3 text-blue-950">
          <p className="text-xs">
            Marque as peças que o cliente ficou. O sistema cria um <strong>orçamento de venda</strong> novo só com elas
            (no valor do empréstimo, editável), que segue o fluxo normal até o financeiro. As peças vêm marcadas{' '}
            <strong>"Já está com o cliente"</strong> e vão direto para Entregue na aprovação (dá para desmarcar no
            orçamento). O que não for marcado continua emprestado.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={!!ocupado} onClick={criarVenda}>
              {ocupado ?? 'Criar orçamento de venda'}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!!ocupado}
              onClick={() => {
                setVendendo(false)
                setVenda({})
              }}
            >
              Voltar
            </Button>
          </div>
        </div>
      )}

      {cancelando && (
        <div className="space-y-2 rounded border border-destructive/40 p-2">
          <Label htmlFor="cancel-motivo">Motivo do cancelamento</Label>
          <Textarea id="cancel-motivo" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={!!ocupado || !motivo.trim()}
              onClick={confirmarCancelamento}
            >
              Confirmar cancelamento
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={!!ocupado} onClick={() => setCancelando(false)}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {podeCancelar && !cancelando && !vendendo ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={!!ocupado}
            onClick={() => setCancelando(true)}
          >
            Cancelar empréstimo
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap gap-2">
          {!cancelado && emAberto.length > 0 && !vendendo && (
            <Button
              type="button"
              variant="outline"
              disabled={!!ocupado}
              onClick={() => {
                setDevolucao(null)
                setCancelando(false)
                setVenda({})
                setVendendo(true)
              }}
            >
              <ShoppingCart className="mr-1 h-4 w-4" />
              Virar venda
            </Button>
          )}
          <Button type="button" onClick={() => baixarPdf()} disabled={gerandoPdf}>
            <FileDown className="mr-1 h-4 w-4" />
            {gerandoPdf ? 'Gerando…' : 'Baixar termo (PDF)'}
          </Button>
        </div>
      </div>
    </div>
  )
}
