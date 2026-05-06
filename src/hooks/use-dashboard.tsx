import { useState, useEffect, useCallback } from 'react'
import { dashboardService } from '@/services/dashboardService'
import {
  DashboardKPIs,
  Transacao,
  ChartDataPoint,
  CategoryDistribution,
  TipoTransacao,
  PaymentMethodDistribution,
} from '@/lib/types'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { mockCategories } from '@/lib/data'
import { toast } from 'sonner'
import useTransactionStore from '@/stores/useTransactionStore'
import { useAuth } from '@/hooks/use-auth'

export const useDashboard = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<Transacao[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [categoryDistribution, setCategoryDistribution] = useState<
    CategoryDistribution[]
  >([])
  const [paymentDistribution, setPaymentDistribution] = useState<
    PaymentMethodDistribution[]
  >([])
  const [loading, setLoading] = useState(true)

  // Listen to transaction store changes to refresh dashboard
  const { transactions: storeTransactions } = useTransactionStore()
  const { role } = useAuth()

  const fetchData = useCallback(async () => {
    // If role is not yet determined or is visitante, we might handle it early
    if (role === 'visitante') {
      setLoading(false)
      setKpis(null)
      setRecentTransactions([])
      setChartData([])
      setCategoryDistribution([])
      setPaymentDistribution([])
      return
    }

    try {
      setLoading(true)
      // We fetch data regardless of role, trusting RLS and service logic to filter
      const [kpiData, recentData, monthData] = await Promise.all([
        dashboardService.getKPIs(),
        dashboardService.getRecentTransactions(6),
        dashboardService.getTransactionsForPeriod(
          startOfMonth(new Date()),
          endOfMonth(new Date()),
        ),
      ])

      setKpis(kpiData)
      setRecentTransactions(recentData)
      processChartData(monthData)
      processCategoryData(monthData)
      processPaymentData(monthData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }, [role])

  // Process data for charts
  const processChartData = (transactions: Transacao[]) => {
    // For collaborators, 'transactions' might only contain 1 item if it falls in the current month
    const start = startOfMonth(new Date())
    const end = endOfMonth(new Date())
    const days = eachDayOfInterval({ start, end })

    const data: ChartDataPoint[] = days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayTrans = transactions.filter(
        (t) => format(t.data, 'yyyy-MM-dd') === dayStr,
      )

      return {
        date: format(day, 'd MMM', { locale: ptBR }),
        revenue: dayTrans
          .filter((t) => t.tipo_id === TipoTransacao.Receita)
          .reduce((acc, curr) => acc + curr.valor, 0),
        expenses: dayTrans
          .filter((t) => t.tipo_id === TipoTransacao.Despesa)
          .reduce((acc, curr) => acc + curr.valor, 0),
      }
    })
    setChartData(data)
  }

  const processCategoryData = (transactions: Transacao[]) => {
    const expenses = transactions.filter(
      (t) => t.tipo_id === TipoTransacao.Despesa,
    )
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.valor, 0)

    const categoryMap = new Map<string, number>()
    expenses.forEach((t) => {
      const current = categoryMap.get(t.categoria_id) || 0
      categoryMap.set(t.categoria_id, current + t.valor)
    })

    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
    ]

    const distribution: CategoryDistribution[] = Array.from(
      categoryMap.entries(),
    )
      .map(([id, value], index) => {
        const catName =
          mockCategories.find((c) => c.id === id)?.nome || 'Outros'
        return {
          name: catName,
          value,
          percentage: totalExpenses > 0 ? (value / totalExpenses) * 100 : 0,
          color: colors[index % colors.length],
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) // Top 5 categories

    setCategoryDistribution(distribution)
  }

  const processPaymentData = (transactions: Transacao[]) => {
    const expenses = transactions.filter(
      (t) => t.tipo_id === TipoTransacao.Despesa,
    )
    const methodMap = new Map<string, number>()

    expenses.forEach((t) => {
      const current = methodMap.get(t.forma_pagamento_id) || 0
      methodMap.set(t.forma_pagamento_id, current + t.valor)
    })

    const colors = [
      '#3B82F6', // blue
      '#10B981', // green
      '#F59E0B', // yellow
      '#8B5CF6', // purple
      '#EC4899', // pink
    ]

    const distribution: PaymentMethodDistribution[] = Array.from(
      methodMap.entries(),
    ).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }))

    setPaymentDistribution(distribution)
  }

  useEffect(() => {
    fetchData()
  }, [fetchData, storeTransactions]) // Refresh when transactions change in store

  return {
    kpis,
    recentTransactions,
    chartData,
    categoryDistribution,
    paymentDistribution,
    loading,
    refresh: fetchData,
  }
}
