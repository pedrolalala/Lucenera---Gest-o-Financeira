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

interface AuthContextType {
  user: User | null
  session: Session | null
  role: Role | null
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
  const [canApproveQuotes, setCanApproveQuotes] = useState(false)
  const [loading, setLoading] = useState(true)
  const userIdRef = useRef<string | null>(null)

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
        if (mounted) {
          setLoading(false)
        }
      }
    }

    if (user?.id) {
      getRole()
    } else {
      // If no user, ensure loading is false
      setLoading(false)
    }

    return () => {
      mounted = false
    }
  }, [user?.id]) // Depend only on user ID to avoid unnecessary re-fetches

  useEffect(() => {
    let mounted = true

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return

      setSession(session)
      const newUser = session?.user ?? null

      // If we have a new user (different ID), we should show loading until role is fetched
      if (newUser && newUser.id !== userIdRef.current) {
        setLoading(true)
        userIdRef.current = newUser.id
      } else if (!newUser) {
        // If logged out, clear everything
        setRole(null)
        setCanApproveQuotes(false)
        setLoading(false)
        userIdRef.current = null
      }

      setUser(newUser)
    })

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return

      setSession(session)
      const newUser = session?.user ?? null

      if (newUser) {
        // Loading is true by default, so we just set the ref
        userIdRef.current = newUser.id
      } else {
        setLoading(false)
      }
      setUser(newUser)
    })

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
    canApproveQuotes,
    signUp,
    signIn,
    signOut,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
