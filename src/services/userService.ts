import { supabase } from '@/lib/supabase/client'
import { UserProfile, Role } from '@/lib/types'

export const userService = {
  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, nome, role, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map((u: any) => ({
      id: u.id,
      full_name: u.nome,
      role: u.role || 'viewer',
      created_at: u.created_at,
      updated_at: u.updated_at,
    }))
  },

  async updateUserRole(userId: string, newRole: Role): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ role: newRole as any })
      .eq('id', userId)

    if (error) throw error
  },

  async getAllUsersWithApproval(): Promise<
    Array<{
      id: string
      full_name: string | null
      email: string
      role: Role
      can_approve_quotes: boolean
      created_at: string | null
      updated_at: string | null
    }>
  > {
    const { data, error } = await supabase
      .from('usuarios')
      .select(
        'id, email, nome, role, can_approve_quotes, created_at, updated_at',
      )
      .order('created_at', { ascending: false })

    if (error) throw error
    return data.map((u: any) => ({
      id: u.id,
      full_name: u.nome,
      email: u.email || '',
      role: u.role || 'viewer',
      can_approve_quotes: u.can_approve_quotes ?? false,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }))
  },

  async updateApproveQuotes(
    userId: string,
    canApprove: boolean,
  ): Promise<void> {
    const { error } = await supabase
      .from('usuarios')
      .update({ can_approve_quotes: canApprove })
      .eq('id', userId)

    if (error) throw error
  },
}
