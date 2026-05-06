import * as React from 'react'
import { Bot, X, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { ChatBubble } from './chat-bubble'
import { ChatMessageList } from './chat-message-list'
import { ChatInput } from './chat-input'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { chatService } from '@/services/chatService'

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
}

export function ExpandableChat() {
  const { role } = useAuth()
  const [isOpen, setIsOpen] = React.useState(false)
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: '1',
      content:
        'Olá! Sou o assistente virtual do Finova. Como posso ajudar você a gerenciar suas finanças hoje?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = React.useState(false)

  // Strict role check
  if (role !== 'admin') return null

  const handleSend = async (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setIsLoading(true)

    try {
      const data = await chatService.sendMessage(content)

      // The n8n workflow should return a JSON object with a 'response' field
      // If the field is missing, we provide a fallback
      const aiContent =
        data.response ||
        (typeof data === 'string' ? data : 'Recebi sua mensagem.')

      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        sender: 'ai',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, response])
    } catch (error) {
      toast.error('Erro ao conectar com o assistente virtual.')
      console.error(error)
      // Optional: Add a visual error message in the chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          'Desculpe, tive um problema ao processar sua solicitação. Tente novamente mais tarde.',
        sender: 'ai',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <Card className="w-[90vw] md:w-[380px] h-[500px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300 border-none ring-1 ring-black/5 rounded-2xl overflow-hidden">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between bg-primary text-primary-foreground space-y-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/80 to-primary pointer-events-none" />
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/10 shadow-inner">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-none mb-1">
                  Finova Assistente
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_4px_theme(colors.green.400)]"></span>
                  <span className="text-[10px] font-medium opacity-90">
                    Online
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded-full h-8 w-8 relative z-10"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Fechar</span>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden flex flex-col bg-[#F8F9FB]">
            <ChatMessageList>
              <div className="text-center text-xs text-gray-400 my-4 flex items-center justify-center gap-2">
                <span className="h-px w-8 bg-gray-200"></span>
                <span>Hoje</span>
                <span className="h-px w-8 bg-gray-200"></span>
              </div>
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  variant={msg.sender === 'user' ? 'sent' : 'received'}
                  avatar={
                    msg.sender === 'ai'
                      ? {
                          src: 'https://img.usecurling.com/i?q=bot&color=blue',
                          fallback: 'AI',
                        }
                      : undefined
                  }
                  markdown={msg.sender === 'ai'}
                >
                  {msg.content}
                </ChatBubble>
              ))}
              {isLoading && (
                <ChatBubble
                  variant="received"
                  avatar={{
                    src: 'https://img.usecurling.com/i?q=bot&color=blue',
                    fallback: 'AI',
                  }}
                  isLoading
                />
              )}
            </ChatMessageList>
          </CardContent>
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </Card>
      )}

      <Button
        onClick={toggleChat}
        size="icon"
        className={cn(
          'h-14 w-14 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-all duration-300 hover:scale-105 hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)]',
          isOpen
            ? 'bg-gray-900 hover:bg-gray-800 rotate-90'
            : 'bg-primary hover:bg-primary/90',
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </Button>
    </div>
  )
}
