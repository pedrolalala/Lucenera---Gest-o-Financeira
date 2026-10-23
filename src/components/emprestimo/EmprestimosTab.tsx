/**
 * SPEC-223: aba "Empréstimos" da lista de orçamentos — empréstimos feitos pelo orçamento e pelo
 * /admin do Showroom (é o mesmo registro). Clique abre o orçamento; empréstimo feito no Showroom
 * abre o painel num diálogo (dá para devolver e virar venda daqui).
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Loader2, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  listarEmprestimos,
  numeroEmprestimo,
  type EmprestimoResumo,
  type StatusEmprestimo,
} from '@/services/emprestimosService'
import { StatusEmprestimoBadge } from './StatusEmprestimoBadge'
import { EmprestimoPainel } from './EmprestimoPainel'

const FILTROS: { valor: StatusEmprestimo | null; rotulo: string }[] = [
  { valor: 'em_aberto', rotulo: 'Em aberto' },
  { valor: 'atrasado', rotulo: 'Atrasados' },
  { valor: 'parcial', rotulo: 'Parcial' },
  { valor: 'virou_venda', rotulo: 'Viraram venda' },
  { valor: 'devolvido_com_dano', rotulo: 'Com dano' },
  { valor: null, rotulo: 'Todos' },
]

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDia = (v: string) => v.slice(0, 10).split('-').reverse().join('/')

export function EmprestimosTab() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<StatusEmprestimo | null>('em_aberto')
  const [termo, setTermo] = useState('')
  const [lista, setLista] = useState<EmprestimoResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [aberto, setAberto] = useState<EmprestimoResumo | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      setLista(await listarEmprestimos(status, termo))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao listar empréstimos')
    } finally {
      setCarregando(false)
    }
  }, [status, termo])

  useEffect(() => {
    const t = setTimeout(() => void carregar(), 300)
    return () => clearTimeout(t)
  }, [carregar])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Pesquisar por cliente, EMP ou orçamento..."
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {FILTROS.map((f) => (
            <Button
              key={f.rotulo}
              type="button"
              size="sm"
              variant={status === f.valor ? 'default' : 'outline'}
              onClick={() => setStatus(f.valor)}
            >
              {f.rotulo}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        {carregando ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : lista.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">Nenhum empréstimo neste filtro.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empréstimo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Emprestado</TableHead>
                <TableHead>Devolver até</TableHead>
                <TableHead className="text-right">Peças</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lista.map((r) => (
                <TableRow
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => (r.orcamento_id ? navigate(`/budgets/${r.orcamento_id}`) : setAberto(r))}
                >
                  <TableCell className="font-medium">
                    {numeroEmprestimo(r.numero)}
                    {r.fotos_saida === 0 && r.status !== 'cancelado' && (
                      <span className="block text-[11px] font-normal text-destructive">Sem foto da saída</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.cliente_nome}
                    <span className="block text-[11px] text-gray-500">{r.empresa_nome}</span>
                  </TableCell>
                  <TableCell>{r.origem === 'orcamento' ? (r.orcamento_numero ?? 'Orçamento') : 'Showroom'}</TableCell>
                  <TableCell>{fmtDia(r.data_emprestimo)}</TableCell>
                  <TableCell>{fmtDia(r.data_prevista_devolucao)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.qtd_pecas_em_aberto > 0 && r.qtd_pecas_em_aberto !== r.qtd_pecas
                      ? `${r.qtd_pecas_em_aberto} de ${r.qtd_pecas}`
                      : r.qtd_pecas}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{brl(r.valor_total)}</TableCell>
                  <TableCell>
                    <StatusEmprestimoBadge status={r.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAberto(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Empréstimo {aberto ? numeroEmprestimo(aberto.numero) : ''}</DialogTitle>
            <DialogDescription>Feito no /admin do Showroom.</DialogDescription>
          </DialogHeader>
          {aberto && <EmprestimoPainel emprestimoId={aberto.id} onAlterado={() => void carregar()} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
