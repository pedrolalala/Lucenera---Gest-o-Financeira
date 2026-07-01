import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  parseSinglePdf,
  validatePdfFile,
  type ParsedPdfResult,
} from '@/lib/pdf-import'

type FileStatus = 'pending' | 'processing' | 'completed' | 'error'

interface FileQueueItem {
  id: string
  file: File
  status: FileStatus
  error?: string
  result?: ParsedPdfResult
}

export interface BatchPdfImportProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBatchComplete: (results: ParsedPdfResult[]) => void
}

export function BatchPdfImport({
  open,
  onOpenChange,
  onBatchComplete,
}: BatchPdfImportProps) {
  const [queue, setQueue] = useState<FileQueueItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const updateItem = useCallback(
    (id: string, updates: Partial<FileQueueItem>) => {
      setQueue((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      )
    },
    [],
  )

  const processFiles = useCallback(
    async (items: FileQueueItem[]) => {
      setIsProcessing(true)
      for (const item of items) {
        updateItem(item.id, { status: 'processing' })
        try {
          const vErr = validatePdfFile(item.file)
          if (vErr) throw new Error(vErr)
          const result = await parseSinglePdf(item.file)
          updateItem(item.id, { status: 'completed', result })
        } catch (e: any) {
          updateItem(item.id, {
            status: 'error',
            error: e.message || 'Erro ao processar',
          })
        }
      }
      setIsProcessing(false)
    },
    [updateItem],
  )

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      const newItems: FileQueueItem[] = Array.from(files).map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        status: 'pending' as FileStatus,
      }))
      setQueue((prev) => [...prev, ...newItems])
      await processFiles(newItems)
    },
    [processFiles],
  )

  const completedCount = queue.filter((i) => i.status === 'completed').length
  const errorCount = queue.filter((i) => i.status === 'error').length
  const totalCount = queue.length
  const allDone =
    totalCount > 0 &&
    !isProcessing &&
    completedCount + errorCount === totalCount

  const handleComplete = useCallback(() => {
    const successful = queue
      .filter((i) => i.status === 'completed' && i.result)
      .map((i) => i.result!)
    if (successful.length > 0) onBatchComplete(successful)
    toast.success(
      `${successful.length} arquivo(s) importado(s)${errorCount > 0 ? `, ${errorCount} falha(s).` : '.'}`,
    )
    setQueue([])
    onOpenChange(false)
  }, [queue, errorCount, onBatchComplete, onOpenChange])

  const renderStatus = (status: FileStatus) => {
    if (status === 'pending')
      return <span className="text-xs text-gray-400">Aguardando</span>
    if (status === 'processing')
      return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
    if (status === 'completed')
      return <CheckCircle2 className="w-5 h-5 text-green-500" />
    return <XCircle className="w-5 h-5 text-red-500" />
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isProcessing) {
          if (!v) setQueue([])
          onOpenChange(v)
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar PDFs</DialogTitle>
          <DialogDescription>
            Selecione múltiplos arquivos PDF para extrair dados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => document.getElementById('batch-pdf-input')?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            handleFileSelect(e.dataTransfer.files)
          }}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">
            Clique ou arraste arquivos PDF aqui
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Múltiplos arquivos suportados
          </p>
          <input
            id="batch-pdf-input"
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>

        {queue.length > 0 && (
          <div className="flex-1 overflow-y-auto space-y-2 mt-2">
            {queue.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-white"
              >
                <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.file.name}
                  </p>
                  {item.status === 'error' && (
                    <p className="text-xs text-red-500 truncate">
                      {item.error}
                    </p>
                  )}
                </div>
                <div className="shrink-0">{renderStatus(item.status)}</div>
              </div>
            ))}
          </div>
        )}

        {totalCount > 0 && (
          <div className="pt-2">
            <Progress
              value={((completedCount + errorCount) / totalCount) * 100}
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              {completedCount + errorCount} de {totalCount} processados
              {errorCount > 0 && ` · ${errorCount} falha(s)`}
            </p>
          </div>
        )}

        <div className="flex justify-between gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => !isProcessing && setQueue([])}
            disabled={isProcessing || queue.length === 0}
          >
            Limpar
          </Button>
          <Button
            type="button"
            onClick={handleComplete}
            disabled={isProcessing || completedCount === 0}
          >
            {allDone
              ? `Importar ${completedCount} arquivo(s)`
              : isProcessing
                ? 'Processando...'
                : 'Importar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
