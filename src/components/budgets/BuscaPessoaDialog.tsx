// SPEC-235 F (reunião 27/10): o mesmo "dois cliques abre a busca do cadastro" do Contas a Pagar/Receber
// (SPEC-231 E1), no Novo Orçamento — cliente, projeto e arquiteto. Mostra razão social e CPF/CNPJ para
// diferenciar cadastros com o mesmo nome (vários "Vinícius", cliente com 2–3 casas).
import { useEffect, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export type ModoBuscaPessoa = 'cliente' | 'projeto' | 'arquiteto'

export interface PessoaEscolhida {
  /** contatos.id (cliente/arquiteto) ou projetos.codigo (projeto) */
  valor: string
  nome: string
}

interface Linha {
  chave: string
  valor: string
  nome: string
  colunas: string[]
}

// vírgula e parênteses quebram o filtro .or() do PostgREST
const limpar = (t: string) => t.replace(/[,()*%]/g, ' ').trim()
// o documento pode estar em cpf_cnpj ou separado em cnpj / cpf
const doc = (c: any) => c?.cpf_cnpj || c?.cnpj || c?.cpf || ''
const um = (x: any) => (Array.isArray(x) ? x[0] : x)

const CABECALHO: Record<ModoBuscaPessoa, string[]> = {
  cliente: ['Nome', 'Razão social', 'CPF/CNPJ', 'Projetos'],
  projeto: ['Cód. projeto', 'Projeto', 'Cliente (razão social)', 'CPF/CNPJ'],
  arquiteto: ['Nome', 'Razão social / escritório', 'CPF/CNPJ'],
}

const TITULO: Record<ModoBuscaPessoa, string> = {
  cliente: 'Buscar cliente',
  projeto: 'Buscar projeto',
  arquiteto: 'Buscar arquiteto',
}

async function buscar(modo: ModoBuscaPessoa, termo: string): Promise<Linha[]> {
  const t = limpar(termo)
  const filtroContato = `nome.ilike.*${t}*,razao_social.ilike.*${t}*,nome_empresa.ilike.*${t}*,cpf_cnpj.ilike.*${t}*,cnpj.ilike.*${t}*,cpf.ilike.*${t}*`

  if (modo === 'projeto') {
    const [porProjeto, porCliente] = await Promise.all([
      supabase
        .from('projetos')
        .select('id, codigo, nome, arquivado, cliente:contatos!projetos_cliente_id_fkey(nome, razao_social, cpf_cnpj, cnpj, cpf)')
        .or(`codigo.ilike.*${t}*,nome.ilike.*${t}*`)
        .limit(40),
      supabase
        .from('contatos')
        .select('nome, razao_social, cpf_cnpj, cnpj, cpf, projetos:projetos!projetos_cliente_id_fkey(id, codigo, nome, arquivado)')
        .eq('tipo', 'cliente')
        .or(filtroContato)
        .limit(30),
    ])
    if (porProjeto.error) throw porProjeto.error
    if (porCliente.error) throw porCliente.error
    const linhas = new Map<string, Linha>()
    const add = (p: any, c: any) => {
      if (!p?.codigo || p.arquivado) return
      linhas.set(p.id, {
        chave: p.id,
        valor: p.codigo,
        nome: p.codigo,
        colunas: [p.codigo, p.nome || '-', c?.razao_social || c?.nome || '-', doc(c) || '-'],
      })
    }
    for (const p of (porProjeto.data as any[]) || []) add(p, um(p.cliente))
    for (const c of (porCliente.data as any[]) || []) for (const p of (c.projetos as any[]) || []) add(p, c)
    return Array.from(linhas.values())
  }

  const { data, error } = await supabase
    .from('contatos')
    .select(
      modo === 'cliente'
        ? 'id, nome, nome_empresa, razao_social, cpf_cnpj, cnpj, cpf, projetos:projetos!projetos_cliente_id_fkey(codigo)'
        : 'id, nome, nome_empresa, razao_social, cpf_cnpj, cnpj, cpf',
    )
    .eq('tipo', modo)
    .or(filtroContato)
    .order('nome')
    .limit(50)
  if (error) throw error
  return ((data as any[]) || []).map((c) => {
    const colunas = [c.nome || '-', c.razao_social || c.nome_empresa || '-', doc(c) || '-']
    if (modo === 'cliente') {
      const cods = ((c.projetos as any[]) || []).map((p) => p.codigo).filter(Boolean)
      colunas.push(cods.length ? cods.join(', ') : '-')
    }
    return { chave: c.id, valor: c.id, nome: c.nome || c.razao_social || '', colunas }
  })
}

export function BuscaPessoaDialog({
  modo,
  open,
  onClose,
  onSelect,
}: {
  modo: ModoBuscaPessoa
  open: boolean
  onClose: () => void
  onSelect: (p: PessoaEscolhida) => void
}) {
  const [termo, setTermo] = useState('')
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (open) {
      setTermo('')
      setLinhas([])
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (limpar(termo).length < 2) {
      setLinhas([])
      return
    }
    let cancelado = false
    setCarregando(true)
    setErro('')
    const t = setTimeout(() => {
      buscar(modo, termo)
        .then((r) => !cancelado && setLinhas(r))
        .catch((e) => !cancelado && setErro(e?.message ?? 'Erro na busca'))
        .finally(() => !cancelado && setCarregando(false))
    }, 300)
    return () => {
      cancelado = true
      clearTimeout(t)
    }
  }, [termo, open, modo])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{TITULO[modo]}</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
          <Input
            autoFocus
            className="pl-8"
            placeholder={
              modo === 'projeto'
                ? 'Código ou nome do projeto, nome/razão social/CPF/CNPJ do cliente...'
                : 'Nome, razão social ou CPF/CNPJ...'
            }
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-auto border rounded-md min-h-[240px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100">
              <tr>
                {CABECALHO[modo].map((h) => (
                  <th key={h} className="text-left font-medium p-2 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr
                  key={l.chave}
                  className="border-t cursor-pointer hover:bg-sky-50"
                  title="Clique para escolher"
                  onClick={() => {
                    onSelect({ valor: l.valor, nome: l.nome })
                    onClose()
                  }}
                >
                  {l.colunas.map((c, i) => (
                    <td key={i} className={i === 0 && modo === 'projeto' ? 'p-2 font-mono' : 'p-2'}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {carregando && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          )}
          {!carregando && erro && <p className="p-3 text-xs text-red-600">{erro}</p>}
          {!carregando && !erro && linhas.length === 0 && (
            <p className="p-3 text-xs text-slate-500">
              {limpar(termo).length < 2 ? 'Digite ao menos 2 letras.' : 'Nada encontrado.'}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
