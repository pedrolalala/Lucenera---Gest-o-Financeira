import * as React from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChatLoader } from '@/components/ui/chat-loader'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'

interface ChatBubbleProps {
  variant?: 'sent' | 'received'
  layout?: 'default' | 'ai'
  avatar?: {
    src: string
    fallback: string
  }
  children?: React.ReactNode
  isLoading?: boolean
  markdown?: boolean
}

export function ChatBubble({
  variant = 'received',
  layout = 'default',
  avatar,
  children,
  isLoading,
  markdown,
}: ChatBubbleProps) {
  return (
    <div
      className={cn(
        'flex gap-2.5 mb-4 w-full',
        variant === 'sent' && 'flex-row-reverse',
      )}
    >
      {avatar && (
        <Avatar className="h-8 w-8 mt-0.5 shrink-0 border border-gray-100 bg-white">
          <AvatarImage src={avatar.src} />
          <AvatarFallback>{avatar.fallback}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'relative px-4 py-2.5 max-w-[85%] text-sm shadow-sm transition-all duration-300',
          variant === 'sent'
            ? 'bg-primary text-primary-foreground rounded-[1.25rem] rounded-tr-sm'
            : isLoading
              ? 'bg-zinc-950 border border-zinc-800 text-zinc-50 rounded-[1.25rem] rounded-tl-sm shadow-md'
              : 'bg-white border border-gray-100 text-gray-800 rounded-[1.25rem] rounded-tl-sm',
        )}
      >
        {isLoading ? (
          <ChatLoader />
        ) : markdown && typeof children === 'string' ? (
          <MarkdownRenderer content={children} />
        ) : (
          children
        )}
      </div>
    </div>
  )
}
