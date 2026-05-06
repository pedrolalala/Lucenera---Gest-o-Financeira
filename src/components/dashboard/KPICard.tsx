import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { KPIMetric } from '@/lib/types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KPICardProps {
  data: KPIMetric
}

export function KPICard({ data }: KPICardProps) {
  const isPositive = data.trend > 0
  const isNeutral = data.trend === 0

  const colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-400',
    red: 'bg-red-500',
    gray: 'bg-gray-400',
  }

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(val)
    }
    return val
  }

  return (
    <Card className="rounded-3xl border-none shadow-sm hover:scale-[1.02] transition-transform duration-300 h-full">
      <CardContent className="p-6 flex justify-between items-center h-full">
        <div className="flex flex-col justify-between h-full gap-4 w-full">
          <h3 className="text-sm font-medium text-gray-500 truncate">
            {data.label}
          </h3>

          <div className="flex flex-col">
            <span className="text-2xl font-bold text-gray-900">
              {formatValue(data.value)}
            </span>
            {data.subValue && (
              <span className="text-xs text-gray-400 font-medium">
                {data.subValue}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1',
                isNeutral
                  ? 'bg-gray-100 text-gray-600'
                  : isPositive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700',
              )}
            >
              {isNeutral ? (
                <Minus className="w-3 h-3" />
              ) : isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(data.trend)}%
            </div>
            <span className="text-xs text-gray-400 truncate">
              {data.trendLabel}
            </span>
          </div>
        </div>

        <div className="h-full flex items-end ml-4">
          {/* Simple progress ring or bar could go here, but omitted for cleaner real-time UI */}
          <div className="h-16 w-1.5 rounded-full bg-gray-100 relative overflow-hidden">
            <div
              className={cn(
                'absolute bottom-0 left-0 w-full rounded-full transition-all duration-1000',
                colorMap[data.color],
              )}
              style={{
                height: `${Math.min(Math.max(data.progress, 0), 100)}%`,
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
