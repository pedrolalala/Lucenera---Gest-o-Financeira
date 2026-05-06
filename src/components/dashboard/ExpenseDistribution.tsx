import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PaymentMethodDistribution } from '@/lib/types'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartContainer } from '@/components/ui/chart'

interface ExpenseDistributionProps {
  data: PaymentMethodDistribution[]
}

export function ExpenseDistribution({ data }: ExpenseDistributionProps) {
  const hasData = data.length > 0 && data.some((d) => d.value > 0)

  return (
    <Card className="rounded-3xl border-none shadow-sm h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-bold">
          Fluxo por Pagamento (Despesas)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-[250px] relative">
        {hasData ? (
          <ChartContainer config={{}} className="w-full h-full">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  `R$ ${value.toLocaleString('pt-BR')}`
                }
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            Nenhum dado para este mês
          </div>
        )}
      </CardContent>
    </Card>
  )
}
