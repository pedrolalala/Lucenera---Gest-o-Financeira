import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { Role } from '@/lib/types'
import { consumeCodeFromUrl } from '@/lib/cross-system-auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  role: Role | null
  hasAccess: boolean | null
  canApproveQuotes: boolean
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [canApproveQuotes, setCanApproveQuotes] = useState(false)
  const [loading, setLoading] = useState(true)
  const userIdRef = useRef<string | null>(null)
  // Fica true só depois que a resolução inicial (consumeCodeFromUrl +
  // getSession) terminou — ver comentário no efeito de auth state abaixo.
  const initializedRef = useRef(false)

  // SPEC-069: além do role legado (visitante/viewer já bloqueados no
  // ProtectedRoute), consulta a mesma RPC que o Hub usa (hub_pode_executar,
  // SPEC-006) para o sistema inteiro ('orcamentos', sem módulo/ação
  // específicos) — cobre os 6 papéis novos da matriz.
  useEffect(() => {
    if (!user?.id) {
      setHasAccess(null)
      return
    }
    supabase
      .rpc('hub_pode_executar', {
        p_usuario_id: user.id,
        p_system_slug: 'orcamentos',
        p_modulo_chave: null,
        p_acao: null,
      })
      .then(({ data }) => setHasAccess(Boolean(data)))
  }, [user?.id])

  const fetchUserInfo = async (
    userId: string,
  ): Promise<{ role: Role; canApproveQuotes: boolean }> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('role, can_approve_quotes')
        .eq('id', userId)
        .single()

      if (error || !data) {
        console.warn('Error fetching role, defaulting to viewer:', error)
        return { role: 'viewer', canApproveQuotes: false }
      }
      return {
        role: (data.role as Role) || 'viewer',
        canApproveQuotes: (data as any).can_approve_quotes ?? false,
      }
    } catch (error) {
      console.error('Exception fetching role:', error)
      return { role: 'viewer', canApproveQuotes: false }
    }
  }

  // Effect for fetching role when user changes
  useEffect(() => {
    let mounted = true

    const getRole = async () => {
      if (!user) return

      try {
        const userInfo = await fetchUserInfo(user.id)
        if (mounted) {
          setRole(userInfo.role)
          setCanApproveQuotes(userInfo.canApproveQuotes)
        }
      } catch (error) {
        console.error('Error in getRole:', error)
      } finally {
        // Só resolve "loading" se a inicialização (troca do sso_code, se
        // houver) já terminou — ver efeito abaixo.
        if (mounted && initializedRef.current) {
          setLoading(false)
        }
      }
    }

    if (user?.id) {
      getRole()
    } else if (initializedRef.current) {
      // If no user, ensure loading is false
      setLoading(false)
    }

    return () => {
      mounted = false
    }
  }, [user?.id]) // Depend only on user ID to avoid unnecessary re-fetches

  useEffect(() => {
    let mounted = true

    // Acesso vindo da Central chega com ?sso_code na URL. onAuthStateChange
    // dispara um evento inicial com a sessão que já existia ANTES da troca
    // desse código terminar (normalmente nula, numa aba nova) — se esse
    // evento resolvesse "loading" pra false direto (como acontecia antes),
    // o ProtectedRoute achava que ninguém tinha logado e mandava pra tela
    // de login antes da troca terminar, "bugando" o clique vindo da
    // Central. `initializedRef` bloqueia isso: só depois que a resolução
    // inicial abaixo (consumeCodeFromUrl + getSession) rodar uma vez é que
    // eventos de auth state passam a poder resolver loading de verdade.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return

      setSession(nextSession)
      const newUser = nextSession?.user ?? null

      // If we have a new user (different ID), we should show loading until role is fetched
      if (newUser && newUser.id !== userIdRef.current) {
        if (initializedRef.current) setLoading(true)
        userIdRef.current = newUser.id
      } else if (!newUser) {
        // If logged out, clear everything
        setRole(null)
        setCanApproveQuotes(false)
        if (initializedRef.current) setLoading(false)
        userIdRef.current = null
      }

      setUser(newUser)
    })

    // Initial session check
    consumeCodeFromUrl('orcamentos').finally(() =>
      supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
        if (!mounted) return

        setSession(initialSession)
        const newUser = initialSession?.user ?? null

        if (newUser) {
          // Loading is true by default, so we just set the ref
          userIdRef.current = newUser.id
        }
        setUser(newUser)
        initializedRef.current = true
        // Sem usuário: nada mais vai resolver loading (o efeito de role só
        // roda com user?.id truthy), resolve aqui. Com usuário: o efeito de
        // role acima cuida de resolver loading depois de buscar o papel.
        if (!newUser) setLoading(false)
      }),
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          nome: fullName,
          name: fullName,
        },
      },
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (!error) {
      setRole(null)
      setCanApproveQuotes(false)
      setSession(null)
      setUser(null)
      userIdRef.current = null
    }
    return { error }
  }

  const value = {
    user,
    session,
    role,
    hasAccess,
    canApproveQuotes,
    signUp,
    signIn,
    signOut,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
