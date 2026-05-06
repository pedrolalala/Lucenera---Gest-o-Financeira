import * as React from 'react'
import { cn } from '@/lib/utils'
import { useAutoScroll } from '@/components/hooks/use-auto-scroll'

interface ChatMessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function ChatMessageList({
  className,
  children,
  ...props
}: ChatMessageListProps) {
  const scrollRef = useAutoScroll([children])

  return (
    <div
      ref={scrollRef}
      className={cn('flex-1 overflow-y-auto p-4 scroll-smooth', className)}
      {...props}
    >
      {children}
    </div>
  )
}
