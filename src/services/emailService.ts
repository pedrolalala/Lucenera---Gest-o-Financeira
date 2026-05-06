import { supabase } from '@/lib/supabase/client'

export const emailService = {
  async sendWelcomeEmail(email: string, name: string) {
    try {
      const { data, error } = await supabase.functions.invoke('welcome-email', {
        body: { email, name },
      })
      return { data, error }
    } catch (error) {
      console.error('Error sending welcome email:', error)
      return { error }
    }
  },
}
