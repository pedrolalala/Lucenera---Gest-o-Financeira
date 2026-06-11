import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useOptions() {
  const [empresas, setEmpresas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [arquitetos, setArquitetos] = useState<any[]>([])
  const [vendedores, setVendedores] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [projetos, setProjetos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjetos = async () => {
    const { data } = await supabase
      .from('projetos')
      .select('id, codigo, nome, arquivado')
      .order('codigo', { ascending: false, nullsFirst: false })
    if (data) setProjetos(data)
  }

  useEffect(() => {
    async function load() {
      try {
        const [empRes, cliRes, arqRes, funcRes, prodRes, projRes] =
          await Promise.all([
            supabase.from('empresas').select('id, nome').order('nome'),
            supabase
              .from('contatos')
              .select('id, nome, nome_empresa, codigo_legado')
              .eq('tipo', 'cliente')
              .order('codigo_legado', { ascending: false, nullsFirst: false })
              .order('nome'),
            supabase
              .from('contatos')
              .select('id, nome')
              .eq('tipo', 'arquiteto')
              .order('nome'),
            supabase
              .from('funcionarios')
              .select('id, nome')
              .eq('status', 'Ativo'),
            supabase
              .from('produtos')
              .select('id, nome, preco_venda, sku, referencia, codigo_legado')
              .order('nome'),
            supabase
              .from('projetos')
              .select('id, codigo, nome, arquivado')
              .order('codigo', { ascending: false, nullsFirst: false }),
          ])

        if (empRes.data) setEmpresas(empRes.data)
        if (cliRes.data) setClientes(cliRes.data)
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
        if (prodRes.data) setProdutos(prodRes.data)
        if (projRes.data) setProjetos(projRes.data)
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
    arquitetos,
    vendedores,
    produtos,
    projetos,
    loading,
    fetchProjetos,
  }
}
