import { supabase } from '@/lib/supabase/client'

export interface ChatResponse {
  response: string
  [key: string]: any
}

export const chatService = {
  async sendMessage(message: string): Promise<ChatResponse> {
    const { data, error } = await supabase.functions.invoke('chat-agent', {
      body: { message },
    })

    if (error) {
      console.error('Error calling chat-agent:', error)
      throw error
    }

    return data
  },
}
