import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, Loader2, Paperclip, Truck, X } from 'lucide-react'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { semPrefixo } from '@/lib/numeros'
import { validarAnexo } from '@/services/orcamentoAnexosService'

interface TeamApprovalDeliveryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** SPEC-167: valor atual de orcamentos.previsao_entrega, para pré-carregar o campo. */
  initialDate: Date | null
  budgetNumero?: string | null
  /** SPEC-254: os arquivos escolhidos (comprovante de Pix/depósito) seguem junto com a data. */
  onConfirm: (date: Date, anexos: File[]) => Promise<void>
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
  const [anexos, setAnexos] = useState<File[]>([])

  useEffect(() => {
    if (open) {
      setSelectedDate(initialDate)
      setSubmitting(false)
      setAnexos([])
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
      await onConfirm(selectedDate, anexos)
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
            {budgetNumero ? `Orçamento ${semPrefixo(budgetNumero)}. ` : ''}
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

        {/* SPEC-254 A: comprovante (Pix, depósito) segue para a revisão financeira; opcional */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Paperclip className="h-4 w-4" />
            Comprovante de pagamento (opcional)
          </label>
          <input
            type="file"
            multiple
            accept="application/pdf,image/png,image/jpeg,image/webp"
            disabled={submitting}
            onChange={(e) => {
              const escolhidos = Array.from(e.target.files ?? [])
              e.target.value = ''
              const validos: File[] = []
              for (const f of escolhidos) {
                const erro = validarAnexo(f)
                if (erro) toast.error(erro)
                else validos.push(f)
              }
              setAnexos((atual) => [...atual, ...validos])
            }}
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-50"
          />
          {anexos.length > 0 && (
            <ul className="space-y-1">
              {anexos.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between rounded border bg-gray-50 px-2 py-1 text-xs text-gray-700"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setAnexos((atual) => atual.filter((_, j) => j !== i))}
                    className="ml-2 text-gray-400 hover:text-red-600"
                    title="Tirar este arquivo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-gray-500">
            PDF ou imagem, até 10 MB cada. O financeiro vê o anexo na revisão.
          </p>
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
