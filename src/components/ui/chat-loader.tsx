import { useState, useEffect } from 'react'
import { Database, Search, Terminal, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LoaderStep {
  text: string
  icon: React.ElementType
  color: string
  badgeVariant: string
}

const steps: LoaderStep[] = [
  {
    text: 'Consultando Banco de Dados',
    icon: Database,
    color: 'text-blue-400',
    badgeVariant: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    text: 'Agente analisando',
    icon: Search,
    color: 'text-purple-400',
    badgeVariant: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
  {
    text: 'Executando análise',
    icon: Terminal,
    color: 'text-amber-400',
    badgeVariant: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    text: 'Preparando Resposta',
    icon: MessageSquare,
    color: 'text-green-400',
    badgeVariant: 'bg-green-500/10 text-green-400 border-green-500/20',
  },
]

export function ChatLoader() {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const step = steps[currentStep]
  const Icon = step.icon

  return (
    <div className="flex items-center gap-3 w-full min-w-[240px] h-6">
      <div className="flex items-center justify-center w-5 h-5">
        <Icon
          className={cn(
            'w-4 h-4 animate-pulse transition-colors duration-500',
            step.color,
          )}
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <span className="font-medium opacity-70">Status:</span>
        <Badge
          key={currentStep}
          variant="outline"
          className={cn(
            'text-[10px] font-mono tracking-wide px-2 py-0.5 h-5 border animate-in fade-in slide-in-from-bottom-1 duration-500',
            step.badgeVariant,
          )}
        >
          {step.text}
        </Badge>
      </div>
    </div>
  )
}
