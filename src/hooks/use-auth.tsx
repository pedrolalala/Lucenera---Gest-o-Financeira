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
  // "loading" é derivado (ver abaixo), não mais um estado ligado/desligado
  // em vários pontos. Antes, entrando pela Central (?sso_code), o evento de
  // login chegava antes da inicialização terminar: o papel era buscado,
  // mas como a inicialização ainda não tinha terminado ninguém desligava o
  // loading, e depois o mesmo usuário não disparava nova busca — a tela
  // ficava em "Carregando..." até dar F5.
  const [initialized, setInitialized] = useState(false)
  const [roleLoadedFor, setRoleLoadedFor] = useState<string | null>(null)
  const userIdRef = useRef<string | null>(null)
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
        if (mounted) setRoleLoadedFor(user.id)
      }
    }

    if (user?.id) {
      getRole()
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

      if (newUser && newUser.id !== userIdRef.current) {
        userIdRef.current = newUser.id
      } else if (!newUser) {
        // If logged out, clear everything
        setRole(null)
        setCanApproveQuotes(false)
        setRoleLoadedFor(null)
        userIdRef.current = null
      }

      setUser(newUser)
    })

    // Initial session check
    consumeCodeFromUrl('orcamentos')
      .catch(() => false)
      .finally(() =>
        supabase.auth
          .getSession()
          .then(({ data: { session: initialSession } }) => {
            if (!mounted) return

            setSession(initialSession)
            const newUser = initialSession?.user ?? null
            if (newUser) userIdRef.current = newUser.id
            setUser(newUser)
          })
          .finally(() => {
            if (!mounted) return
            initializedRef.current = true
            setInitialized(true)
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
      setRoleLoadedFor(null)
      userIdRef.current = null
    }
    return { error }
  }

  // Carregando enquanto a resolução inicial (troca do sso_code + sessão)
  // não terminou, ou enquanto o papel do usuário atual ainda não chegou.
  const loading = !initialized || (!!user && roleLoadedFor !== user.id)

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
