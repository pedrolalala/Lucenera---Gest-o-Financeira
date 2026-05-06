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
}
