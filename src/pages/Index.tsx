import { useDashboard } from '@/hooks/use-dashboard'
import { KPICard } from '@/components/dashboard/KPICard'
import { PerformanceChart } from '@/components/dashboard/PerformanceChart'
import { CategoryDistributionChart } from '@/components/dashboard/CategoryDistribution'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { ExpenseDistribution } from '@/components/dashboard/ExpenseDistribution'
import { KPIMetric } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

const Index = () => {
  const {
    kpis,
    recentTransactions,
    chartData,
    categoryDistribution,
    paymentDistribution,
    loading,
  } = useDashboard()

  // Transform API data to KPI card format
  const kpiData: KPIMetric[] = kpis
    ? [
        {
          label: 'Saldo Total',
          value: kpis.totalBalance,
          subValue: 'Acumulado',
          trend: 0, // Total balance trend is complex without historical snapshots
          trendLabel: 'Tempo real',
          progress: 100,
          color: 'blue',
        },
        {
          label: 'Receita Mensal',
          value: kpis.monthIncome,
          subValue: 'Este mês',
          trend:
            kpis.lastMonthIncome > 0
              ? Math.round(
                  ((kpis.monthIncome - kpis.lastMonthIncome) /
                    kpis.lastMonthIncome) *
                    100,
                )
              : 0,
          trendLabel: 'vs Mês anterior',
          progress: 75, // Could be vs goal
          color: 'green',
        },
        {
          label: 'Despesa Mensal',
          value: kpis.monthExpense,
          subValue: 'Este mês',
          trend:
            kpis.lastMonthExpense > 0
              ? Math.round(
                  ((kpis.monthExpense - kpis.lastMonthExpense) /
                    kpis.lastMonthExpense) *
                    100,
                )
              : 0,
          trendLabel: 'vs Mês anterior',
          progress:
            kpis.monthIncome > 0
              ? (kpis.monthExpense / kpis.monthIncome) * 100
              : 0,
          color: 'red',
        },
        {
          label: 'Eficiência',
          value:
            kpis.monthIncome > 0
              ? `${Math.round(((kpis.monthIncome - kpis.monthExpense) / kpis.monthIncome) * 100)}%`
              : '0%',
          subValue: 'Margem',
          trend: 0,
          trendLabel: 'Atual',
          progress:
            kpis.monthIncome > 0
              ? ((kpis.monthIncome - kpis.monthExpense) / kpis.monthIncome) *
                100
              : 0,
          color: 'purple',
        },
      ]
    : []

  if (loading && !kpis) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[140px] rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[400px]">
          <Skeleton className="xl:col-span-2 h-full rounded-3xl" />
          <Skeleton className="h-full rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[400px]">
          <Skeleton className="h-full rounded-3xl" />
          <Skeleton className="h-full rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <div key={index} className="h-[140px]">
            <KPICard data={kpi} />
          </div>
        ))}
      </div>

      {/* Middle Section: Performance + Categories */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-auto min-h-[400px]">
        <div className="xl:col-span-2 h-[400px] xl:h-full">
          <PerformanceChart data={chartData} />
        </div>
        <div className="h-[400px] xl:h-full">
          <CategoryDistributionChart data={categoryDistribution} />
        </div>
      </div>

      {/* Bottom Section: Recent Transactions + Expense Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-auto min-h-[400px]">
        <div className="h-full min-h-[400px]">
          <RecentTransactions transactions={recentTransactions} />
        </div>
        <div className="h-full min-h-[400px]">
          <ExpenseDistribution data={paymentDistribution} />
        </div>
      </div>
    </div>
  )
}

export default Index
