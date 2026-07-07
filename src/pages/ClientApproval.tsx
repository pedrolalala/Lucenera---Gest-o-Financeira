import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  buscarOrcamentoParaAprovacao,
  aprovarOrcamentoClientePublico,
  recusarOrcamentoClientePublico,
  type ClientApprovalBudget,
} from '@/services/clientApprovalService'

type ViewState =
  | 'loading'
  | 'ready'
  | 'approving'
  | 'rejecting'
  | 'approved'
  | 'rejected'
  | 'error'

export default function ClientApproval() {
  const [searchParams] = useSearchParams()
  const orcamentoId = searchParams.get('orcamento_id')
  const token = searchParams.get('token')

  const [viewState, setViewState] = useState<ViewState>('loading')
  const [budget, setBudget] = useState<ClientApprovalBudget | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [motivo, setMotivo] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  useEffect(() => {
    if (!orcamentoId || !token) {
      setErrorMessage('Link inválido. Parâmetros ausentes.')
      setViewState('error')
      return
    }
    let mounted = true
    buscarOrcamentoParaAprovacao(orcamentoId, token)
      .then((data) => {
        if (!mounted) return
        setBudget(data)
        if (
          data.status === 'Orçamento Aprovado' ||
          data.status === 'Aprovação Financeira'
        ) {
          setViewState('approved')
        } else if (data.status === 'recusado_cliente') {
          setViewState('rejected')
        } else {
          setViewState('ready')
        }
      })
      .catch((err: any) => {
        if (!mounted) return
        setErrorMessage(err?.message || 'Erro ao carregar orçamento.')
        setViewState('error')
      })
    return () => {
      mounted = false
    }
  }, [orcamentoId, token])

  const handleApprove = async () => {
    if (!orcamentoId || !token) return
    setViewState('approving')
    try {
      await aprovarOrcamentoClientePublico(orcamentoId, token)
      setViewState('approved')
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao aprovar orçamento.')
      setViewState('error')
    }
  }

  const handleReject = async () => {
    if (!orcamentoId || !token) return
    setViewState('rejecting')
    try {
      await recusarOrcamentoClientePublico(orcamentoId, token, motivo)
      setViewState('rejected')
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro ao recusar orçamento.')
      setViewState('error')
    }
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(v || 0)

  if (viewState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (viewState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Link Inválido
            </h2>
            <p className="text-gray-500">{errorMessage}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (viewState === 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Orçamento Aprovado!
            </h2>
            <p className="text-gray-500">
              Obrigado pela confirmação. Sua proposta foi aprovada e enviada
              para processamento financeiro.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (viewState === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Orçamento Recusado
            </h2>
            <p className="text-gray-500">
              Sua recusa foi registrada. Um de nossos representantes entrará em
              contato em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-lg w-full shadow-lg">
        <CardHeader className="text-center border-b pb-6">
          <div className="flex justify-center mb-3">
            <FileText className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Aprovação de Orçamento</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Confirme os detalhes abaixo para aprovar ou recusar
          </p>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Número</p>
              <p className="font-bold text-gray-900">{budget?.numero || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Emissão</p>
              <p className="font-bold text-gray-900">
                {budget?.data_emissao &&
                !isNaN(new Date(budget.data_emissao).getTime())
                  ? format(new Date(budget.data_emissao), 'dd/MM/yyyy')
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Cliente</p>
              <p className="font-bold text-gray-900">
                {budget?.cliente_nome || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Valor Total</p>
              <p className="font-bold text-blue-600 text-lg">
                {fmt(budget?.valor_total || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Cond. Pagamento
              </p>
              <p className="font-medium text-gray-900">
                {budget?.condicoes_pagamento || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Forma Pagamento
              </p>
              <p className="font-medium text-gray-900">
                {budget?.forma_pagamento || '-'}
              </p>
            </div>
          </div>

          {showRejectForm && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Motivo da recusa:
              </label>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Informe o motivo da recusa..."
                rows={3}
              />
            </div>
          )}

          {!showRejectForm ? (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleApprove}
                disabled={viewState === 'approving'}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {viewState === 'approving' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />{' '}
                    Aprovando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" /> Aprovar Orçamento
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowRejectForm(true)}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" /> Recusar
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleReject}
                disabled={viewState === 'rejecting' || !motivo.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {viewState === 'rejecting' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />{' '}
                    Enviando...
                  </>
                ) : (
                  <>Confirmar Recusa</>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowRejectForm(false)
                  setMotivo('')
                }}
                variant="outline"
                className="flex-1"
              >
                Voltar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
