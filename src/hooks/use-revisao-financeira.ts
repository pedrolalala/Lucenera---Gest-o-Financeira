import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

// SPEC-271: quem trabalha no financeiro (acesso 'financeiro' em Acesso a Sistemas — ex.: a Caroline,
// assistente administrativa) revisa, edita e aprova na aba "Revisão Financeira Pendente", mesmo sem
// ser admin/gerente no cadastro legado (usuarios.role). O banco já libera por papel; isto só mostra a aba.
// Não usa can_approve_quotes: esse flag também libera aprovar nas etapas de cliente e equipe.
export function usePodeRevisaoFinanceira(): boolean {
  const { user, role } = useAuth()
  const [temFinanceiro, setTemFinanceiro] = useState(false)

  useEffect(() => {
    if (!user?.id) {
      setTemFinanceiro(false)
      return
    }
    let ativo = true
    ;(supabase as any)
      .rpc('pode_acessar_sistema', { p_slug: 'financeiro' })
      .then(({ data, error }: { data: unknown; error: unknown }) => {
        if (ativo) setTemFinanceiro(error ? false : Boolean(data))
      })
    return () => {
      ativo = false
    }
  }, [user?.id])

  return role === 'admin' || role === 'gerente' || temFinanceiro
}
