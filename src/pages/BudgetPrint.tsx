import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Budget } from '@/stores/useBudgetStore'
import { Loader2, Download } from 'lucide-react'
import { toast } from 'sonner'
import logoImg from '@/assets/lucenera-vertical-87b48.png'

export default function BudgetPrint() {
  const { id } = useParams()
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function load() {
      if (!id) return
      try {
        const { data, error } = await supabase
          .from('orcamentos')
          .select('id, numero')
          .eq('id', id)
          .single()

        if (error) throw error
        setBudget(data as any)
      } catch (err) {
        console.error('Error loading budget', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleExportPDF = async () => {
    try {
      setExporting(true)
      toast.info('Gerando PDF, por favor aguarde...')

      let logoBase64 = ''
      try {
        const res = await fetch(logoImg)
        const blob = await res.blob()
        logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
      } catch (err) {
        console.error('Error fetching logo', err)
      }

      const { data, error } = await supabase.functions.invoke(
        'generate-report',
        {
          body: {
            reportType: 'orcamento',
            format: 'pdf',
            filters: { id, logoBase64 },
          },
        },
      )

      if (error) throw error

      if (data) {
        const url = window.URL.createObjectURL(data)
        const a = document.createElement('a')
        a.href = url
        a.download = `Orcamento_${budget?.numero || id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('PDF exportado com sucesso!')
      } else {
        toast.error('Ocorreu um erro ao gerar o documento.')
      }
    } catch (err) {
      console.error('Error exporting PDF', err)
      toast.error('Erro ao exportar o PDF')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!budget) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <p className="text-gray-500">Orçamento não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl text-center">
        <img
          src={logoImg}
          alt="Lucenera"
          className="h-16 w-auto mx-auto mb-6 object-contain"
        />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Exportar Orçamento
        </h2>
        <p className="text-gray-500 mb-8">
          Orçamento #{budget.numero || budget.id.split('-')[0].toUpperCase()}
        </p>

        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="w-full bg-black hover:bg-gray-800 text-white rounded-xl p-4 shadow-md flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100"
        >
          {exporting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          <span className="font-semibold">
            {exporting ? 'Gerando Documento...' : 'Exportar PDF'}
          </span>
        </button>
      </div>
    </div>
  )
}
