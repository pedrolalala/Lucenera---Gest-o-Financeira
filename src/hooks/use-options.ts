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
        const [empRes, cliRes, arqRes, usuRes, prodRes] = await Promise.all([
          supabase.from('empresas').select('id, nome').order('nome'),
          supabase
            .from('contatos')
            .select('id, nome')
            .eq('tipo', 'cliente')
            .order('nome'),
          supabase
            .from('contatos')
            .select('id, nome')
            .eq('tipo', 'arquiteto')
            .order('nome'),
          supabase.from('usuarios').select('id, nome').order('nome'),
          supabase
            .from('produtos')
            .select('id, nome, preco_venda')
            .order('nome'),
        ])

        if (empRes.data) setEmpresas(empRes.data)
        if (cliRes.data) setClientes(cliRes.data)
        if (arqRes.data) setArquitetos(arqRes.data)
        if (usuRes.data) setVendedores(usuRes.data)
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
