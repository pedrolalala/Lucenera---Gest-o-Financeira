import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

const PAGE_SIZE = 1000

// O PostgREST do projeto trunca silenciosamente qualquer resposta em 1000
// linhas (db-max-rows), mesmo pedindo `.limit()` maior no código — sem
// paginação manual, tabelas com mais de 1000 linhas (clientes, projetos,
// produtos) perdem registros sem erro nenhum, e como a query tem `order`,
// são sempre os MESMOS registros que somem (os que caem depois do corte).
// Foi a causa raiz de um bug real: clientes sem `codigo_legado` (criados
// direto no sistema, sem código legado) ficavam depois do corte e
// desapareciam tanto do autopreenchimento quanto da busca.
async function fetchAllPages<T>(
  buildQuery: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const all: T[] = []
  let from = 0
  for (;;) {
    const { data, error } = await buildQuery(from, from + PAGE_SIZE - 1)
    if (error) {
      console.error('Error paginating query', error)
      break
    }
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return all
}

export function useOptions() {
  const [empresas, setEmpresas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [arquitetos, setArquitetos] = useState<any[]>([])
  const [vendedores, setVendedores] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [projetos, setProjetos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjetos = async () => {
    const data = await fetchAllPages<any>((from, to) =>
      supabase
        .from('projetos')
        .select('id, codigo, nome, arquivado')
        .order('codigo', { ascending: false, nullsFirst: false })
        .range(from, to),
    )
    setProjetos(
      data.map((p: any) => ({
        ...p,
        originalNome: p.nome,
        nome: p.codigo ? `[${p.codigo}] ${p.nome}` : p.nome,
      })),
    )
  }

  const fetchClientes = async () => {
    const data = await fetchAllPages<any>((from, to) =>
      supabase
        .from('contatos')
        .select('id, nome, nome_empresa, codigo_legado, razao_social')
        .eq('tipo', 'cliente')
        .order('codigo_legado', { ascending: false, nullsFirst: false })
        .order('nome')
        .range(from, to),
    )
    setClientes(data)
  }

  useEffect(() => {
    async function load() {
      try {
        const [empRes, cliData, arqRes, funcRes, prodData, revendaRes, projData] =
          await Promise.all([
            supabase
              .from('empresas')
              .select(
                'id, nome, codigo, cnpj, razao_social, logradouro, numero, bairro, cidade, estado, cep',
              )
              .order('nome'),
            fetchAllPages<any>((from, to) =>
              supabase
                .from('contatos')
                .select('id, nome, nome_empresa, codigo_legado, razao_social')
                .eq('tipo', 'cliente')
                .order('codigo_legado', { ascending: false, nullsFirst: false })
                .order('nome')
                .range(from, to),
            ),
            supabase
              .from('contatos')
              .select('id, nome')
              .eq('tipo', 'arquiteto')
              .limit(10000)
              .order('nome'),
            supabase
              .from('funcionarios')
              .select('id, nome')
              .eq('status', 'Ativo')
              .limit(10000),
            fetchAllPages<any>((from, to) =>
              supabase
                .from('produtos')
                .select(
                  'id, nome, preco_venda, sku, referencia, codigo_legado, codigo_produto',
                )
                .order('nome')
                .range(from, to),
            ),
            supabase
              .from('revenda_ubiqua')
              .select('id, referencia, descricao, valor_revenda')
              .limit(50000)
              .order('descricao'),
            fetchAllPages<any>((from, to) =>
              supabase
                .from('projetos')
                .select('id, codigo, nome, arquivado')
                .order('codigo', { ascending: false, nullsFirst: false })
                .range(from, to),
            ),
          ])

        if (empRes.data) setEmpresas(empRes.data)
        setClientes(cliData)
        if (arqRes.data) setArquitetos(arqRes.data)
        if (funcRes.data) {
          const uniqueMap = new Map()
          funcRes.data.forEach((item) => {
            if (item.nome && !uniqueMap.has(item.nome.trim())) {
              uniqueMap.set(item.nome.trim(), item)
            }
          })

          const uniqueVendedores = Array.from(uniqueMap.values())

          const priority1 = [
            'marina pousa barbara gregorio',
            'thairine cristina da silva',
            'thais gomes pegrucci favaron',
          ]
          const priority2 = ['teresinha do amaral figueiredo']

          const normalize = (name: string) =>
            name.trim().toLowerCase().replace(/\s+/g, ' ')

          const sorted = uniqueVendedores.sort((a, b) => {
            const nomeA = normalize(a.nome)
            const nomeB = normalize(b.nome)

            const getPriority = (nome: string) => {
              const p1Index = priority1.indexOf(nome)
              if (p1Index !== -1) return p1Index
              const p2Index = priority2.indexOf(nome)
              if (p2Index !== -1) return priority1.length + p2Index
              return priority1.length + priority2.length
            }

            const prioA = getPriority(nomeA)
            const prioB = getPriority(nomeB)

            if (prioA !== prioB) {
              return prioA - prioB
            }

            return a.nome.localeCompare(b.nome)
          })

          setVendedores(sorted)
        }
        if (prodData.length || revendaRes?.data) {
          const normalProds = prodData.map((p: any) => ({
            ...p,
            originalNome: p.nome,
            nome: `${p.nome}${p.sku ? ` | SKU: ${p.sku}` : ''}${p.referencia ? ` | Ref: ${p.referencia}` : ''}`,
            source: 'produtos',
          }))
          const revendaProds = (revendaRes?.data || []).map((r: any) => ({
            id: String(r.id),
            nome: `${r.descricao}${r.referencia ? ` | Ref: ${r.referencia}` : ''} [Ubiqua]`,
            preco_venda: r.valor_revenda,
            sku: r.referencia,
            referencia: r.referencia,
            originalNome: r.descricao,
            source: 'revenda_ubiqua',
          }))
          setProdutos([...normalProds, ...revendaProds])
        }
        setProjetos(
          projData.map((p: any) => ({
            ...p,
            originalNome: p.nome,
            nome: p.codigo ? `[${p.codigo}] ${p.nome}` : p.nome,
          })),
        )
      } catch (error) {
        console.error('Error loading options', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return {
    empresas,
    clientes,
    setClientes,
    arquitetos,
    vendedores,
    produtos,
    projetos,
    loading,
    fetchProjetos,
    fetchClientes,
  }
}
