import * as React from 'react'
import { Send, Paperclip, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = React.useState('')
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (message.trim()) {
      onSend(message)
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-3 border-t bg-white">
      <div className="relative flex items-end gap-2">
        <div className="relative flex-1 group">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="min-h-[48px] max-h-[150px] resize-none pr-12 py-3 rounded-2xl bg-gray-50 border-gray-200 focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
            disabled={disabled}
          />
          <div className="absolute right-2 bottom-1.5 flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="icon"
          className="h-12 w-12 rounded-2xl shrink-0 shadow-sm transition-all hover:scale-105 active:scale-95"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
