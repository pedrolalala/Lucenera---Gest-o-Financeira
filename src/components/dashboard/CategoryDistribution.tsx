import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryDistribution } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CategoryDistributionProps {
  data: CategoryDistribution[]
}

export function CategoryDistributionChart({ data }: CategoryDistributionProps) {
  const hasData = data.length > 0

  return (
    <Card className="rounded-3xl border-none shadow-sm h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          Top Categorias de Gastos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {hasData ? (
          <div className="space-y-6">
            {data.map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-gray-700">{cat.name}</span>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 block">
                      R$ {cat.value.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-gray-500 text-[10px]">
                      {cat.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      cat.color,
                    )}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm min-h-[200px]">
            Sem gastos este mês
          </div>
        )}
      </CardContent>
    </Card>
  )
}
