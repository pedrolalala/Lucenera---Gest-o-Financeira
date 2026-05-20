import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useOptions() {
  const [empresas, setEmpresas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [arquitetos, setArquitetos] = useState<any[]>([])
  const [vendedores, setVendedores] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [empRes, cliRes, arqRes, funcRes, prodRes] = await Promise.all([
          supabase.from('empresas').select('id, nome').order('nome'),
          supabase
            .from('contatos')
            .select('id, nome, nome_empresa')
            .eq('tipo', 'cliente')
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
          const sorted = uniqueVendedores.sort((a, b) =>
            a.nome.localeCompare(b.nome),
          )

          setVendedores(sorted)
        }
        if (prodRes.data) setProdutos(prodRes.data)
      } catch (error) {
        console.error('Error loading options', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { empresas, clientes, arquitetos, vendedores, produtos, loading }
}
