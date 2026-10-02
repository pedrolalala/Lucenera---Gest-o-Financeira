import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2, Truck } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface TeamApprovalDeliveryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** SPEC-167: valor atual de orcamentos.previsao_entrega, para pré-carregar o campo. */
  initialDate: Date | null
  budgetNumero?: string | null
  onConfirm: (date: Date) => Promise<void>
}

// SPEC-174 N2a: pop-up obrigatório na "Aprovação da Equipe" -- a vendedora
// preenche a previsão de entrega (SPEC-167) na criação do orçamento e quase
// nunca atualiza quando o cliente fecha meses depois. Mesmo padrão
// visual/estrutural do "digite APROVAR" da FinancialApprovalDialog: botão
// de confirmar fica desabilitado até a condição (data válida, não anterior
// a hoje) ser satisfeita. Não cria coluna nova — grava no mesmo
// orcamentos.previsao_entrega da SPEC-167.
export function TeamApprovalDeliveryDialog({
  open,
  onOpenChange,
  initialDate,
  budgetNumero,
  onConfirm,
}: TeamApprovalDeliveryDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedDate(initialDate)
      setSubmitting(false)
    }
  }, [open, initialDate])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isPastDate = (() => {
    if (!selectedDate) return false
    const d = new Date(selectedDate)
    d.setHours(0, 0, 0, 0)
    return d < today
  })()

  const canConfirm = Boolean(selectedDate) && !isPastDate

  const handleConfirm = async () => {
    if (!canConfirm || !selectedDate) return
    setSubmitting(true)
    try {
      await onConfirm(selectedDate)
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Erro ao confirmar previsão de entrega', {
        description: error?.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next)
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-700">
            <Truck className="h-5 w-5" />
            Confirmar Previsão de Entrega
          </DialogTitle>
          <DialogDescription>
            {budgetNumero ? `Orçamento ${budgetNumero}. ` : ''}
            Confirme (ou atualize) a data prevista de entrega ao cliente antes
            de seguir. Ela costuma ficar desatualizada quando o cliente fecha
            meses depois da criação do orçamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Previsão de Entrega (obrigatório)
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'w-full pl-3 text-left font-normal',
                  !selectedDate && 'text-muted-foreground',
                )}
              >
                {selectedDate ? (
                  format(selectedDate, 'PPP', { locale: ptBR })
                ) : (
                  <span>Selecione a data</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(d) => setSelectedDate(d ?? null)}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
          {isPastDate && (
            <p className="text-xs text-red-600">
              A previsão de entrega não pode ser anterior a hoje.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm || submitting}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar e Avançar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
