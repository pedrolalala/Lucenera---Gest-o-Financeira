import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, addMonths, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  CalendarIcon,
  Loader2,
  Plus,
  ArrowLeft,
  Save,
  Upload,
  Download,
  FileCode,
  PackageSearch,
  ShieldAlert,
  Undo2,
  Package,
  Headset,
  MoreVertical,
  LineChart,
} from 'lucide-react'

import { cn, formatCircuitId, sortItemsByCircuitId } from '@/lib/utils'
import { isValidUUID } from '@/lib/uuid'
import {
  buildClientApprovalLink,
  getStatusLabel,
  getStatusBadgeClass,
  getDisplayValorTotal,
} from '@/lib/budget-status'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  ArchitectSplitPicker,
  type ArquitetoSplit,
} from '@/components/ArchitectSplitPicker'
import { ProjectCreateModal } from '@/components/ProjectCreateModal'
import { ClientCreateModal } from '@/components/ClientCreateModal'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { toast } from 'sonner'
import useBudgetStore, { Budget } from '@/stores/useBudgetStore'
import { useOptions } from '@/hooks/use-options'
import { useAuth } from '@/hooks/use-auth'
import {
  approveBudgetFinancial,
  type ApprovalResult,
} from '@/services/budgetApprovalService'
import { FinancialApprovalDialog } from '@/components/budgets/FinancialApprovalDialog'
import { FinanceResultModal } from '@/components/budgets/FinanceResultModal'
import { supabase } from '@/lib/supabase/client'
import {
  ProductSearchModal,
  type ProductSearchItem,
  type ProductSelectionEntry,
} from '@/components/budgets/ProductSearchModal'
import { ProductCreateModal } from '@/components/budgets/ProductCreateModal'
import { MultiLAddDialog } from '@/components/budgets/MultiLAddDialog'
import {
  DevolucaoItemSearchModal,
  type DevolucaoSelection,
} from '@/components/budgets/DevolucaoItemSearchModal'
import { BatchPdfImport } from '@/components/budgets/BatchPdfImport'
import { ImportConnectXmlModal } from '@/components/budgets/ImportConnectXmlModal'
import {
  BudgetItemCard,
  type ProductMeta,
} from '@/components/budgets/BudgetItemCard'
import { BudgetItemsHeader } from '@/components/budgets/BudgetItemsHeader'
import { GerenciamentoDialog } from '@/components/budgets/GerenciamentoDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ParsedPdfResult } from '@/lib/pdf-import'
import type { ProductCatalogItem } from '@/services/productCatalogService'
import type { ResolvedXmlBudget } from '@/lib/xml-budget-import'
import { buildConnectXmlExport, downloadXmlFile } from '@/lib/xml-budget-export'
import { FORMA_PAGAMENTO_LABELS } from '@/lib/budget-financial-summary'
import logoImg from '@/assets/lucenera-vertical-527dd.png'

// SPEC-152: formas de pagamento que tipicamente não fazem sentido em mais
// de 1 parcela (pagamento à vista, instantâneo). Todas as outras (boleto,
// cartão, cheque, transferência, permuta, carteira) liberam o campo
// "Quantidade de Parcelas" -- antes desta SPEC só boleto/cartão liberavam,
// o que impedia parcelar em permuta/carteira/cheque/transferência.
const FORMAS_PAGAMENTO_PARCELAVEIS = (v: string | null | undefined) =>
  !['pix', 'dinheiro', ''].includes(v || '')

// SPEC-152: parênteses de segurança pra qualquer `form.watch('parcelas')`
// usado em cálculo de render -- durante a edição (Bug 1) o campo pode
// conter transitoriamente string vazia/valor inválido antes do blur/submit
// normalizar via zod preprocess; nunca deixa Array.from({length: NaN}).
function normalizarQtdParcelas(v: unknown): number {
  const n = typeof v === 'number' ? v : parseInt(String(v ?? ''), 10)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(120, Math.max(1, Math.floor(n)))
}

// SPEC-074: subgrupos do campo "Tipo", dependentes do Tipo de Operação
// selecionado (natureza_operacao). Lista fixa, não normalizada em tabela.
const SUBGRUPOS_POR_TIPO: Record<string, string[]> = {
  venda: ['VENDAS'],
  devolucao: ['TROCA DEV', 'CASA COR ENTRADA'],
  outros: [
    'CASA COR SAIDA',
    'REMESSA TRANSP',
    'RETORNO',
    'TRANSFERENCIA',
    'GARANTIA',
    'OUTRAS ENTRADAS',
    'OUTRAS SAIDAS',
    'ACERTO CITEL',
    'INVENTARIO',
    'SAIDA INDUSTRIALIZACAO',
    'BONIFICACAO',
    'USO E CONSUMO',
    'DESCARTE',
    'REMESSA CONSERTO',
    'DEV EM GARANTIA',
    'DEV COMPRA',
  ],
  sac: ['SAC'],
}

// SPEC-077: monta o valor do ArchitectSplitPicker a partir do orçamento
// carregado — usa a divisão nova (orcamento_arquitetos) quando existe;
// cai para o campo singular legado (arquiteto_id/arquiteto.nome) como
// rede de segurança para orçamento antigo que escapou do backfill.
function orcamentoArquitetosParaPicker(budget: Budget): ArquitetoSplit[] {
  if (budget.arquitetos && budget.arquitetos.length > 0) {
    return budget.arquitetos
      .filter((a) => a.arquiteto)
      .map((a) => ({
        arquiteto_id: a.arquiteto!.id,
        nome: a.arquiteto!.nome,
        percentual: Number(a.percentual),
      }))
  }
  if (budget.arquiteto_id && budget.arquiteto?.nome) {
    return [
      {
        arquiteto_id: budget.arquiteto_id,
        nome: budget.arquiteto.nome,
        percentual: 100,
      },
    ]
  }
  return []
}

// Achado 2026-09-14 (teste ao vivo): o RPC replace_orcamento_itens (SPEC-135)
// já não reinicia o ciclo de aprovação do cliente quando os itens salvos são
// idênticos aos já existentes — mas o aviso window.confirm() abaixo disparava
// incondicionalmente em QUALQUER salvamento com status 'Aprovação
// Financeira', mesmo editando só campos de "Pagamento e Totais" (forma de
// pagamento, parcelas, frete, perfil, desconto, sinal, observações) que nunca
// tocam orcamento_itens. Usuário pediu explicitamente: esses campos já foram
// negociados com o cliente antes da aprovação financeira, não devem nem
// avisar sobre reiniciar o ciclo. Esta comparação espelha (aproximadamente,
// só como gate de UX — a fonte de verdade continua sendo o SQL) as mesmas
// colunas que replace_orcamento_itens compara no banco.
type ItemComparavel = {
  produto_id?: string | null
  descricao?: string | null
  custom_id?: string | null
  quantidade: number
  preco_unitario: number
  desconto: number
}

function serializarItemParaComparacao(item: ItemComparavel) {
  return JSON.stringify({
    produto_id: item.produto_id || null,
    descricao: item.descricao?.trim() || null,
    custom_id: item.custom_id?.trim() || null,
    quantidade: Number(item.quantidade) || 0,
    preco_unitario: Number(item.preco_unitario) || 0,
    desconto: Number(item.desconto) || 0,
  })
}

function itensRealmenteMudaram(
  itensOriginais: ItemComparavel[] | undefined,
  itensAtuais: ItemComparavel[],
): boolean {
  const originaisSerializados = (itensOriginais || [])
    .map(serializarItemParaComparacao)
    .sort()
  const atuaisSerializados = itensAtuais
    .map(serializarItemParaComparacao)
    .sort()
  return (
    JSON.stringify(originaisSerializados) !== JSON.stringify(atuaisSerializados)
  )
}

const formSchema = z
  .object({
    // SPEC-071: natureza da operação — venda (padrão, comportamento atual
    // intocado) ou devolução (itens amarrados a uma venda de origem,
    // aprovação gera crédito negativo em vez de cobrança). Só editável na
    // criação — trava depois que o orçamento existe.
    // SPEC-074: ampliado pra incluir "outros" e "sac", que não têm
    // comportamento especial de itens (se comportam como venda).
    natureza_operacao: z
      .enum(['venda', 'devolucao', 'outros', 'sac'])
      .default('venda'),
    // SPEC-074: subgrupo do campo "Tipo", ver SUBGRUPOS_POR_TIPO acima.
    subgrupo: z.string().min(1, 'Selecione o Tipo'),
    empresa_id: z
      .string({ required_error: 'Selecione uma empresa' })
      .min(1, 'Selecione uma empresa'),
    projeto_codigo: z
      .string({ required_error: 'O código do projeto é obrigatório' })
      .trim()
      .min(1, 'O código do projeto é obrigatório'),
    cliente_id: z
      .string({ required_error: 'Selecione um cliente' })
      .min(1, 'Selecione um cliente'),
    // SPEC-077: divisão de lucro entre múltiplos arquitetos — segue opcional
    // (nem todo orçamento tem arquiteto vinculado), mas quando preenchido a
    // soma dos percentuais precisa fechar 100%.
    arquitetos: z
      .array(
        z.object({
          arquiteto_id: z.string(),
          nome: z.string(),
          percentual: z.number(),
        }),
      )
      .default([])
      .refine(
        (arr) =>
          arr.length === 0 ||
          Math.abs(arr.reduce((s, a) => s + (a.percentual || 0), 0) - 100) <
            0.01,
        'A soma dos percentuais dos arquitetos deve ser 100%',
      ),
    vendedor_id: z.string().optional().nullable(),
    status: z.string().default('rascunho'),
    data_emissao: z.date({ required_error: 'Data de emissão é obrigatória' }),
    // SPEC-068: desconto aceita percentual OU valor fechado em R$, conforme
    // desconto_tipo. A validação de "não pode passar de 100" só faz sentido
    // para percentual — em R$ o teto real é o subtotal, checado no submit.
    desconto_global: z.coerce
      .number()
      .min(0, 'O desconto não pode ser negativo')
      .nullish()
      .transform((v) => (v === null || v === undefined ? 0 : v))
      .default(0),
    desconto_tipo: z.enum(['percentual', 'valor']).default('percentual'),
    // SPEC-068: sinal é sempre valor fixo em R$, informativo no documento —
    // não gera parcela financeira nem afeta a aprovação.
    valor_sinal: z.coerce
      .number()
      .min(0, 'O sinal não pode ser negativo')
      .nullish()
      .transform((v) => (v === null || v === undefined ? 0 : v))
      .default(0),
    forma_pagamento: z.string().optional().nullable(),
    // SPEC-152 (Bug 1): antes usava z.coerce.number() puro -- ao apagar o
    // input pra digitar outro valor, o onChange já coagia "" pra NaN/0 a
    // cada tecla e o handler manual (`parseInt(...) || 1`) cravava de volta
    // em 1 antes do usuário conseguir terminar de digitar. z.preprocess
    // permite que o estado do form guarde temporariamente '' (ou qualquer
    // string em edição) sem falhar a validação — só normaliza pra inteiro
    // (>=1, <=120, default 1) no momento em que o zodResolver de fato valida
    // (submit, ou re-validação após o primeiro submit).
    parcelas: z
      .preprocess((v) => {
        if (v === '' || v === null || v === undefined) return 1
        const n = typeof v === 'number' ? v : parseInt(String(v), 10)
        return Number.isNaN(n) ? 1 : n
      }, z.number().int('Deve ser um valor inteiro').min(1).max(120))
      .default(1),
    // SPEC-152 (item 7): valor/forma de pagamento/fornecedor de permuta por
    // parcela -- alimenta `orcamentos.plano_parcelas` no submit. Índice do
    // array corresponde à parcela (0 = parcela 1). `valor` aceita string
    // vazia transitoriamente pela mesma razão do campo `parcelas` acima; a
    // soma é validada ao vivo fora do zod (precisa comparar com valorTotal,
    // que é derivado de outros campos do form, não dá pra expressar num
    // .refine() simples e reativo aqui).
    parcelas_config: z
      .array(
        z.object({
          // z.union com z.string() (não z.literal('')) para que o tipo
          // estático (z.infer) aceite qualquer string em trânsito durante a
          // digitação, não só ''; a normalização pra número de fato só
          // acontece na leitura (Number(...)) em onSubmit/no efeito de
          // sincronismo, nunca aqui.
          valor: z.union([z.coerce.number(), z.string()]).optional(),
          forma_pagamento: z.string().optional(),
          permuta_fornecedor_id: z.string().optional().nullable(),
        }),
      )
      .optional()
      .default([]),
    // Achado 2026-08-14: campo era obrigatório + só aceitava hoje/futuro,
    // mas orçamentos já aprovados (parcelas/boletos já gerados na
    // aprovação) têm data histórica — muitas vezes no passado, ou nula em
    // orçamentos criados antes da SPEC-082. Exigir "hoje ou futuro" pra
    // simplesmente editar um campo não relacionado (ex.: observações)
    // travava a edição de qualquer orçamento aprovado antigo. Validação
    // completa (obrigatório + futuro) continua sendo feita no submit, mas
    // só quando não é edição de orçamento já aprovado — ver handleSubmit.
    data_inicio_pagamento: z.date().optional().nullable(),
    // Vencimento de cada parcela a partir da 2ª (índice 0 = parcela 2, etc.)
    // — null/undefined usa o padrão calculado (1 mês após a parcela
    // anterior, a partir de `data_inicio_pagamento`); a pessoa que negocia
    // com o cliente pode sobrescrever individualmente cada vencimento.
    parcelas_datas: z.array(z.date().nullable()).optional().default([]),
    frete_tipo: z.enum(['com_frete', 'sem_frete'], {
      required_error: 'Selecione o frete',
      invalid_type_error: 'Selecione o frete',
    }),
    frete_valor: z.coerce
      .number()
      .min(0, 'O valor do frete não pode ser negativo')
      .default(0),
    observacoes: z.string().optional().nullable(),
    validade: z.date().optional().nullable(),
    // SPEC-064: rótulo Ribeirão/São Paulo, só visualização.
    perfil: z.string().optional().nullable(),
    itens: z
      .array(
        z.object({
          uid: z.string().optional(),
          custom_id: z.string().optional(),
          produto_id: z.string().optional().default(''),
          descricao: z.string().optional().default(''),
          quantidade: z.coerce
            .number()
            .int('Deve ser um valor inteiro')
            .min(1, 'Quantidade inválida'),
          preco_unitario: z.coerce.number().min(0, 'Preço inválido'),
          desconto: z.coerce
            .number()
            .int('Deve ser um valor inteiro')
            .min(0)
            .default(0),
          sub_ordem: z.number().optional(),
          // SPEC-071: só preenchido em item de devolução — aponta pro
          // projeto_itens da venda de origem que está sendo devolvida.
          projeto_item_origem_id: z.string().optional().nullable(),
        }),
      )
      .min(1, 'Adicione pelo menos um item'),
  })
  .superRefine((data, ctx) => {
    if (data.frete_tipo === 'com_frete' && !(data.frete_valor > 0)) {
      ctx.addIssue({
        path: ['frete_valor'],
        code: z.ZodIssueCode.custom,
        message: 'Informe o valor do frete (maior que zero)',
      })
    }
    data.itens.forEach((item, index) => {
      if (!item.produto_id && !item.descricao?.trim()) {
        ctx.addIssue({
          path: ['itens', index, 'produto_id'],
          code: z.ZodIssueCode.custom,
          message: 'Selecione um produto ou informe uma descrição',
        })
      }
      // SPEC-071: todo item de um orçamento de devolução precisa vir da
      // busca de venda de origem (garante projeto_item_origem_id).
      if (
        data.natureza_operacao === 'devolucao' &&
        !item.projeto_item_origem_id
      ) {
        ctx.addIssue({
          path: ['itens', index, 'produto_id'],
          code: z.ZodIssueCode.custom,
          message:
            'Item de devolução precisa ser adicionado pela busca de venda de origem',
        })
      }
    })
  })

export default function BudgetFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditing = Boolean(id)

  const { addBudget, updateBudget, budgets, fetchBudgets } = useBudgetStore()
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false)
  const [isXmlImportOpen, setIsXmlImportOpen] = useState(false)
  const [pendingXmlImport, setPendingXmlImport] =
    useState<ResolvedXmlBudget | null>(null)
  const [connectOrigin, setConnectOrigin] = useState<{
    cod_orcamento: number
    importado_em: string
  } | null>(null)
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false)
  const [productSearchRowIndex, setProductSearchRowIndex] = useState<
    number | null
  >(null)
  const [isProductCreateOpen, setIsProductCreateOpen] = useState(false)
  const [productCreateTarget, setProductCreateTarget] = useState<{
    index?: number
  } | null>(null)
  // SPEC-071: modal de busca de venda de origem, usado só quando
  // natureza_operacao === 'devolucao'.
  const [isDevolucaoSearchOpen, setIsDevolucaoSearchOpen] = useState(false)
  // SPEC-079: diálogo de múltiplos L's por peça — multiLProduct null =
  // modo "item não cadastrado" (descrição/preço manuais).
  const [isMultiLDialogOpen, setIsMultiLDialogOpen] = useState(false)
  const [multiLProduct, setMultiLProduct] = useState<ProductSearchItem | null>(
    null,
  )
  const {
    empresas,
    clientes,
    setClientes,
    arquitetos,
    vendedores,
    produtos,
    projetos,
    loading: optionsLoading,
    fetchProjetos,
    fetchClientes,
  } = useOptions()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingBudget, setIsLoadingBudget] = useState(isEditing)
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null)
  const [assignedVendedorNome, setAssignedVendedorNome] = useState<
    string | null
  >(null)
  const [projectDetails, setProjectDetails] = useState<{
    // SPEC-105: id real do projeto selecionado, usado pra buscar venda de
    // origem na devolução também por projeto (não só por cliente) — ver
    // DevolucaoItemSearchModal.tsx.
    id?: string
    nome?: string
    responsavel_nome?: string
    arquiteto_nome?: string
    cliente_nome?: string
    responsavel_sistema_nome?: string
    empresa_nome?: string
    isLoading?: boolean
    // SPEC-061: distingue "projeto sem esse vínculo na origem" de um erro
    // de busca — texto genérico "Não encontrado" parecia bug do formulário.
    clienteMissing?: boolean
    empresaMissing?: boolean
    // SPEC-061: true quando o Arquiteto foi pré-selecionado por
    // correspondência única de nome (fallback via "Nome Arquiteto" legado),
    // não por vínculo direto (arquiteto_id).
    arquitetoAutoLinked?: boolean
  } | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [gerenciamentoOpen, setGerenciamentoOpen] = useState(false)
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(
    null,
  )
  const [productMetaMap, setProductMetaMap] = useState<
    Map<string, ProductMeta>
  >(new Map())
  const { role } = useAuth()
  // SPEC-108: só admin edita valor de peça ou adiciona produto NUM
  // ORÇAMENTO JÁ EXISTENTE. Na criação (isEditing = false), continua
  // liberado pra todo mundo — é assim que vendedora monta um orçamento novo.
  const canEditValorProduto = role === 'admin' || !isEditing

  // SPEC-152: fornecedor da permuta (contatos.tipo = 'fornecedor'), usado só
  // quando alguma parcela do plano de pagamento tem forma_pagamento = 'permuta'.
  const [fornecedoresPermuta, setFornecedoresPermuta] = useState<
    { id: string; nome: string }[]
  >([])
  useEffect(() => {
    supabase
      .from('contatos')
      .select('id, nome')
      .eq('tipo', 'fornecedor')
      .order('nome')
      .then(({ data }) => data && setFornecedoresPermuta(data))
  }, [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      natureza_operacao: 'venda',
      // Fix (achado 2026-08-13): 'venda' sempre mapeia pro único subgrupo
      // 'VENDAS' (SUBGRUPOS_POR_TIPO.venda), conhecido de antemão — não dá
      // pra confiar em useEffect pra preencher isso depois do mount, porque
      // handleProjectSelect (assíncrono, múltiplos form.setValue em
      // sequência) tem race condition com o efeito e podia deixar o campo
      // vazio de novo mesmo depois dele já ter sido preenchido uma vez.
      subgrupo: 'VENDAS',
      empresa_id: '',
      projeto_codigo: '',
      cliente_id: '',
      arquitetos: [],
      vendedor_id: 'none',
      status: 'rascunho',
      data_emissao: new Date(),
      desconto_global: 0,
      desconto_tipo: 'percentual',
      valor_sinal: 0,
      forma_pagamento: '',
      parcelas: 1,
      data_inicio_pagamento: undefined,
      parcelas_datas: [],
      parcelas_config: [],
      frete_valor: 0,
      observacoes: '',
      validade: null,
      perfil: '',
      itens: [],
    },
  })

  const { fields, remove, replace } = useFieldArray({
    control: form.control,
    name: 'itens',
  })

  // SPEC-095: validade padrão é a data de emissão + 10 dias — recalcula
  // toda vez que a emissão muda, a menos que o usuário já tenha editado a
  // validade manualmente nesta sessão (o botão "Usar padrão" reseta essa
  // trava e recalcula de novo).
  const validadeEditadaManualmenteRef = useRef(false)
  // Achado 2026-08-20: handleProjectSelect é assíncrono com vários awaits
  // em sequência (busca projeto, cliente, empresa, responsável) — se ele
  // for disparado de novo antes do primeiro terminar (ex.: reabrir/rebuscar
  // o combobox de Código do Projeto sem querer), a chamada mais antiga pode
  // resolver DEPOIS da mais nova e sobrescrever arquiteto/empresa/cliente
  // com o resultado errado, silenciosamente. Mesma classe de bug já
  // documentada no defaultValues de `subgrupo` acima, agora reaparecendo
  // pra `arquitetos`. Guard: só a chamada mais recente pode aplicar seus
  // resultados no form.
  const projectSelectSeqRef = useRef(0)
  // SPEC-152 (item 7): enquanto o usuário não editar manualmente o valor de
  // nenhuma parcela, o efeito abaixo mantém `parcelas_config` sincronizado
  // com a divisão igual (recalcula ao vivo a cada mudança de valorTotal/
  // quantidade/forma de pagamento -- é também o fix do Bug 2: a
  // pré-visualização do plano de pagamento passa a vir 100% de
  // `form.watch`, nunca de um snapshot antigo do orçamento carregado).
  const parcelasConfigTouchedRef = useRef(false)
  const dataEmissaoWatch = form.watch('data_emissao')
  useEffect(() => {
    if (validadeEditadaManualmenteRef.current) return
    if (!dataEmissaoWatch) return
    form.setValue('validade', addDays(dataEmissaoWatch, 10))
  }, [dataEmissaoWatch, form])

  // Pedido do usuário (2026-09-14): campo Vendedor do Orçamento deve listar
  // só estas 5 pessoas, nesta ordem — não é mais um "priorizar no topo",
  // é uma lista fechada. Investigação inicial (14/09) achou que
  // "Marina Pousa Barbara Gregorio" seria erro de importação (achado
  // revertido em 16/09: usuário decidiu manter o nome completo como está
  // no banco, sem renomear) — por isso o filtro usa o nome completo, não
  // "Marina Pousa". Filippo Giorgi (dono da Lucenera) não tinha nenhum
  // cadastro em funcionarios, criado vinculado ao usuário CRM dele
  // (migration 20260914_140).
  const VENDEDORES_PERMITIDOS = [
    'Thairine Cristina da Silva',
    'Thais Gomes Pegrucci Favaron',
    'Marina Pousa Barbara Gregorio',
    'Vinicius Bortolin Costa',
    'Filippo Giorgi',
  ].map((n) => n.toLowerCase())

  // SPEC-083: nome de exibição por produto pro painel de Gerenciamento
  // (admin/gerente) — reaproveita o catálogo já carregado por useOptions().
  const produtoNomesMap = useMemo(() => {
    const map: Record<string, string> = {}
    produtos.forEach((p: any) => {
      map[p.id] = p.originalNome || p.nome
    })
    return map
  }, [produtos])

  const sortedVendedores = vendedores
    .filter((v) => VENDEDORES_PERMITIDOS.includes(v.nome.trim().toLowerCase()))
    .sort(
      (a, b) =>
        VENDEDORES_PERMITIDOS.indexOf(a.nome.trim().toLowerCase()) -
        VENDEDORES_PERMITIDOS.indexOf(b.nome.trim().toLowerCase()),
    )

  const getProductInfo = (
    produtoId: string | null | undefined,
  ): ProductMeta | null => {
    if (!produtoId || !isValidUUID(produtoId)) return null
    const fromMeta = productMetaMap.get(produtoId)
    if (fromMeta) return fromMeta
    const fromList = produtos.find((p) => p.id === produtoId)
    if (fromList) {
      return {
        codigo_produto: (fromList as any).codigo_produto ?? null,
        referencia: fromList.referencia ?? null,
        nome: ((fromList as any).originalNome || fromList.nome) ?? null,
        sku: fromList.sku ?? null,
      }
    }
    return null
  }

  useEffect(() => {
    async function loadBudget() {
      if (!isEditing || !id) return

      try {
        setIsLoadingBudget(true)
        // First check in store
        let budget = budgets.find((b) => b.id === id)

        if (!budget) {
          // fetch from supabase
          const { data, error } = await supabase
            .from('orcamentos')
            .select(
              `
              *,
              itens:orcamento_itens(
                id, produto_id, quantidade, preco_unitario, desconto, custom_id, sub_ordem,
                descricao, projeto_item_origem_id,
                produto:produtos(codigo_produto, referencia, nome, sku)
              )
            `,
            )
            .eq('id', id)
            .single()

          if (error) throw error
          budget = data as any
        }

        if (budget) {
          if (budget.vendedor_id) {
            const { data: vData } = await supabase
              .from('funcionarios')
              .select('nome')
              .eq('id', budget.vendedor_id)
              .single()
            if (vData) setAssignedVendedorNome(vData.nome)
          }

          let projetoCodigo = ''
          if (budget.projeto_id) {
            const { data: pData } = await supabase
              .from('projetos')
              .select('codigo')
              .eq('id', budget.projeto_id)
              .single()
            if (pData) {
              projetoCodigo = pData.codigo
            }
          }

          const parsedParcelas = Array.isArray(budget.prazo_pagamento_dias)
            ? Math.max(1, budget.prazo_pagamento_dias.length)
            : 1

          const metaMap = new Map<string, ProductMeta>()
          budget.itens?.forEach((i: any) => {
            if (i.produto_id && i.produto) {
              metaMap.set(i.produto_id, {
                codigo_produto: i.produto.codigo_produto ?? null,
                referencia: i.produto.referencia ?? null,
                nome: i.produto.nome ?? null,
                sku: i.produto.sku ?? null,
              })
            }
          })
          setProductMetaMap(metaMap)
          setBudgetToEdit(budget)
          // Achado 2026-08-14: orçamentos criados antes da SPEC-074 têm
          // subgrupo vazio no banco (26 de 29 hoje). Em modo de edição o
          // "Tipo de Operação" fica desabilitado (não pode ser alterado
          // após a criação), então o usuário nunca consegue disparar o
          // preenchimento manual — o formulário ficava permanentemente
          // impossível de salvar ("Selecione o Tipo"). Mesmo raciocínio do
          // fix da SPEC-097: só dá pra confiar nisso escrito direto aqui,
          // não em um useEffect que rode depois na ordem certa.
          const naturezaEdit = (budget as any).natureza_operacao || 'venda'
          const opcoesEdit = SUBGRUPOS_POR_TIPO[naturezaEdit] || []
          const subgrupoEdit =
            (budget as any).subgrupo ||
            (opcoesEdit.length === 1 ? opcoesEdit[0] : '')
          form.reset({
            natureza_operacao: naturezaEdit,
            subgrupo: subgrupoEdit,
            empresa_id: budget.empresa_id,
            projeto_codigo: projetoCodigo,
            cliente_id: budget.cliente_id || '',
            arquitetos: orcamentoArquitetosParaPicker(budget),
            vendedor_id: budget.vendedor_id || 'none',
            status: budget.status || 'enviado_cliente',
            desconto_global: budget.desconto_global ?? 0,
            desconto_tipo: (budget as any).desconto_tipo || 'percentual',
            valor_sinal: (budget as any).valor_sinal ?? 0,
            forma_pagamento: budget.forma_pagamento || '',
            parcelas: parsedParcelas,
            data_inicio_pagamento: budget.data_inicio_pagamento
              ? new Date(budget.data_inicio_pagamento)
              : undefined,
            // Reconstrói os vencimentos calendário de cada parcela a partir
            // dos offsets em dias salvos (`prazo_pagamento_dias`) — a
            // diferença entre offsets não depende de quando o orçamento foi
            // originalmente calculado, só da distância entre as parcelas.
            parcelas_datas:
              budget.data_inicio_pagamento &&
              Array.isArray(budget.prazo_pagamento_dias) &&
              budget.prazo_pagamento_dias.length > 1
                ? budget.prazo_pagamento_dias
                    .slice(1)
                    .map((offset: number) =>
                      addDays(
                        new Date(budget.data_inicio_pagamento as string),
                        offset - (budget.prazo_pagamento_dias as number[])[0],
                      ),
                    )
                : [],
            // SPEC-152: plano de parcelas customizado, quando já existir
            // (orçamento salvo depois desta SPEC). Vazio aqui é normal para
            // orçamento antigo -- o efeito de sincronismo abaixo preenche a
            // divisão igual como valor inicial editável.
            parcelas_config: Array.isArray((budget as any).plano_parcelas)
              ? (budget as any).plano_parcelas.map((p: any) => ({
                  valor: Number(p.valor) || 0,
                  forma_pagamento:
                    p.forma_pagamento || budget.forma_pagamento || '',
                  permuta_fornecedor_id: p.permuta_fornecedor_id || null,
                }))
              : [],
            frete_tipo:
              (budget.frete_tipo as 'com_frete' | 'sem_frete' | undefined) ??
              undefined,
            frete_valor: budget.frete_valor ?? 0,
            observacoes: budget.observacoes || '',
            data_emissao: budget.data_emissao
              ? new Date(budget.data_emissao)
              : new Date(),
            validade: budget.validade ? new Date(budget.validade) : null,
            perfil: budget.perfil || '',
            itens: sortItemsByCircuitId(
              budget.itens?.map((i) => ({
                uid: crypto.randomUUID(),
                custom_id: formatCircuitId(i.custom_id || ''),
                produto_id: i.produto_id || '',
                descricao: i.descricao || '',
                quantidade: Math.max(1, Math.floor(Number(i.quantidade) || 1)),
                preco_unitario: i.preco_unitario,
                desconto: i.desconto || 0,
                sub_ordem: i.sub_ordem ?? 0,
                projeto_item_origem_id:
                  (i as any).projeto_item_origem_id ?? null,
              })) || [],
            ),
          })
          // Orçamento salvo depois da SPEC-152 já tem plano_parcelas
          // customizado -- não deixa o efeito de sincronismo abaixo
          // sobrescrever com a divisão igual assim que a página carrega.
          if (
            Array.isArray((budget as any).plano_parcelas) &&
            (budget as any).plano_parcelas.length > 0
          ) {
            parcelasConfigTouchedRef.current = true
          }
        }
      } catch {
        toast.error('Erro ao carregar orçamento')
        navigate('/budgets')
      } finally {
        setIsLoadingBudget(false)
      }
    }

    loadBudget()
  }, [id, isEditing, budgets, form, navigate])

  const naturezaOperacao = form.watch('natureza_operacao') || 'venda'

  // Fix (achado 2026-08-13, teste ao vivo): quando SUBGRUPOS_POR_TIPO tem
  // só 1 opção pro tipo atual, o campo "Tipo" renderiza um Input
  // desabilitado mostrando essa opção (ex.: "VENDAS"), mas nunca chama
  // field.onChange — subgrupo ficava vazio no formulário até o usuário
  // clicar manualmente no botão de Tipo de Operação (o que nunca
  // acontece pra "Venda", já selecionado por padrão). Resultado: criar
  // um orçamento novo falhava a validação "Selecione o Tipo" sem nenhum
  // aviso visível até rolar a tela pro topo depois de já ter clicado em
  // "Criar Orçamento".
  useEffect(() => {
    if (isEditing) return
    const opcoes = SUBGRUPOS_POR_TIPO[naturezaOperacao] || []
    if (opcoes.length === 1 && form.getValues('subgrupo') !== opcoes[0]) {
      form.setValue('subgrupo', opcoes[0], { shouldValidate: true })
    }
  }, [naturezaOperacao, isEditing, form])
  const empresaIdAtual = form.watch('empresa_id')
  const empresaSelecionadaPerfil = empresas.find(
    (e) => e.id === empresaIdAtual,
  ) as
    | {
        id: string
        nome: string
        razao_social?: string | null
        logradouro?: string | null
        numero?: string | null
        bairro?: string | null
        cidade?: string | null
        estado?: string | null
      }
    | undefined
  const clienteIdAtual = form.watch('cliente_id')
  const watchItens = form.watch('itens')
  const descontoGlobalPerc = form.watch('desconto_global') || 0
  const descontoTipo = form.watch('desconto_tipo') || 'percentual'
  const valorSinal = form.watch('valor_sinal') || 0
  const freteTipo = form.watch('frete_tipo')
  const freteValor = form.watch('frete_valor') || 0

  // SPEC-110: quando o cliente selecionado tem um sinal padrão cadastrado
  // (contatos.valor_sinal_padrao), pré-preenche o campo Sinal — só na
  // CRIAÇÃO de orçamento novo e só se o campo ainda estiver zerado (não
  // sobrescreve um valor já digitado nem mexe em orçamento existente sendo
  // editado). Continua 100% editável depois.
  useEffect(() => {
    if (isEditing) return
    if (!clienteIdAtual) return
    if (form.getValues('valor_sinal')) return
    let cancelled = false
    supabase
      .from('contatos')
      .select('valor_sinal_padrao')
      .eq('id', clienteIdAtual)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        const padrao = (data as any)?.valor_sinal_padrao
        if (padrao && !form.getValues('valor_sinal')) {
          form.setValue('valor_sinal', Number(padrao), {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [clienteIdAtual, isEditing])

  const valorSubtotal = watchItens.reduce((acc, item) => {
    const q = Number(item.quantidade) || 0
    const p = Number(item.preco_unitario) || 0
    const d = Math.round(Number(item.desconto) || 0) // %
    return acc + q * p * (1 - d / 100)
  }, 0)

  // SPEC-078 (Bug 4): ordem do cálculo é subtotal -> sinal -> desconto (+
  // frete). O sinal é sempre valor fixo em R$; o desconto pode ser fixo ou
  // percentual (desconto_tipo) — quando percentual, incide sobre o valor
  // JÁ COM o sinal descontado (valorAposSinal), não sobre o subtotal puro.
  // valor_total (o que é salvo e usado pela RPC de aprovação pra gerar as
  // parcelas) passa a nascer aqui já com o sinal deduzido — não existe mais
  // um "saldo restante após o sinal" separado, valorTotal já é esse saldo.
  const valorAposSinal = Math.max(0, valorSubtotal - valorSinal)
  // SPEC-068: desconto_global guarda o número digitado (10 para "10%" OU
  // 150 para "R$150,00"); desconto_tipo define como interpretá-lo. O valor
  // em R$ nunca passa do valor após o sinal (evita desconto negativo/absurdo).
  const descontoValorReais =
    descontoTipo === 'valor'
      ? Math.min(Math.max(descontoGlobalPerc, 0), valorAposSinal)
      : valorAposSinal * (Math.min(descontoGlobalPerc, 100) / 100)
  const descontoPercentualEquivalente =
    valorAposSinal > 0 ? (descontoValorReais / valorAposSinal) * 100 : 0
  const valorComDesconto = valorAposSinal - descontoValorReais
  const valorTotal =
    valorComDesconto + (freteTipo === 'com_frete' ? freteValor : 0)

  // SPEC-152 (itens 6 e 7): quantidade de parcelas "parcelável" pra fins de
  // plano de pagamento -- qualquer forma de pagamento exceto pix/dinheiro
  // (antes só boleto/cartao liberavam mais de 1 parcela, impedindo permuta/
  // carteira/cheque/transferência parcelados).
  const formaPagamentoWatch = form.watch('forma_pagamento')
  const totalParcelasAtual = FORMAS_PAGAMENTO_PARCELAVEIS(formaPagamentoWatch)
    ? normalizarQtdParcelas(form.watch('parcelas'))
    : 1
  const parcelasConfigWatch = form.watch('parcelas_config') || []

  // Mantém `parcelas_config` (valor/forma de pagamento/fornecedor de
  // permuta por parcela) sincronizado com a quantidade de parcelas e com o
  // valor total -- ao vivo, via form.watch, nunca a partir de um snapshot
  // antigo do orçamento (Bug 2). Enquanto o usuário não editar manualmente
  // nenhum valor (parcelasConfigTouchedRef ainda false), recalcula a
  // divisão igual a cada mudança; depois de editado manualmente, só
  // redimensiona o array quando a quantidade de parcelas muda, preservando
  // os valores já digitados.
  useEffect(() => {
    const atual = form.getValues('parcelas_config') || []
    const tocado = parcelasConfigTouchedRef.current
    if (!tocado && atual.length === totalParcelasAtual) {
      // ainda checa se algum valor ficou desatualizado (valorTotal mudou)
      const somaAtual =
        Math.round(
          atual.reduce(
            (acc: number, p: any) => acc + (Number(p?.valor) || 0),
            0,
          ) * 100,
        ) / 100
      if (Math.abs(somaAtual - Math.round(valorTotal * 100) / 100) < 0.01)
        return
    } else if (tocado && atual.length === totalParcelasAtual) {
      return
    }
    const valorBase =
      totalParcelasAtual > 0
        ? Math.round((valorTotal / totalParcelasAtual) * 100) / 100
        : 0
    let acumulado = 0
    const next = Array.from({ length: totalParcelasAtual }, (_, i) => {
      const existente = tocado ? atual[i] : undefined
      if (existente) return existente
      const isUltima = i === totalParcelasAtual - 1
      const valor = isUltima
        ? Math.round((valorTotal - acumulado) * 100) / 100
        : valorBase
      if (!isUltima) acumulado += valor
      return {
        valor,
        forma_pagamento:
          atual[i]?.forma_pagamento || formaPagamentoWatch || 'boleto',
        permuta_fornecedor_id: atual[i]?.permuta_fornecedor_id || null,
      }
    })
    form.setValue('parcelas_config', next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalParcelasAtual, valorTotal, formaPagamentoWatch])

  const customIdsKey = watchItens.map((i) => i.custom_id || '').join('|')

  useEffect(() => {
    const items = form.getValues('itens')
    if (!items || items.length <= 1) return
    const sorted = sortItemsByCircuitId(items)
    const currentKey = items.map((i) => i.custom_id || '').join('|')
    const sortedKey = sorted.map((i) => i.custom_id || '').join('|')
    if (currentKey !== sortedKey) {
      replace(sorted, { shouldFocus: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customIdsKey])

  const handleProjectSelect = async (codigo: string) => {
    const mySeq = ++projectSelectSeqRef.current

    if (!codigo) {
      setProjectDetails(null)
      return
    }

    setProjectDetails({ isLoading: true })

    try {
      const { data: projeto, error } = await supabase
        .from('projetos')
        .select(
          '*, projeto_arquitetos(percentual, arquiteto:arquiteto_id(id, nome)), arquiteto:arquiteto_id(id, nome)',
        )
        .eq('codigo', codigo)
        .single()

      if (error || !projeto) {
        if (mySeq === projectSelectSeqRef.current) setProjectDetails(null)
        return
      }
      if (mySeq !== projectSelectSeqRef.current) return

      // SPEC-061: "Não encontrado" (busca falhou) é diferente de "projeto
      // nunca teve esse vínculo na origem" — só o segundo caso é normal e
      // não deveria parecer um bug do formulário.
      let clienteNome = projeto.cliente_id
        ? 'Não encontrado'
        : 'Projeto sem cliente vinculado na origem — selecione manualmente'
      let empresaNome = projeto.empresa_id
        ? 'Não encontrado'
        : 'Projeto sem empresa vinculada na origem — selecione manualmente'
      let responsavelSisNome = 'Não encontrado'

      if (projeto.cliente_id) {
        const { data: cli } = await supabase
          .from('contatos')
          .select('nome, razao_social')
          .eq('id', projeto.cliente_id)
          .single()
        // SPEC-068: "nome" aqui é o Nome Completo/Fantasia; combina com a
        // Razão Social quando ela existe e é diferente, com fallback para
        // PF/registros sem fantasia (nunca mostra código de projeto).
        if (cli) {
          const razaoSocial = cli.razao_social?.trim()
          clienteNome =
            razaoSocial && razaoSocial !== cli.nome
              ? `${razaoSocial} - ${cli.nome}`
              : cli.nome
        }
      }

      if (projeto.empresa_id) {
        const { data: emp } = await supabase
          .from('empresas')
          .select('nome')
          .eq('id', projeto.empresa_id)
          .single()
        if (emp) empresaNome = emp.nome
      }

      // SPEC-077: responsavel_id (usuarios) e' campo legado, sempre NULL
      // desde que o Responsavel do projeto passou a vir de
      // responsavel_funcionario_id (funcionarios) — corrigido apos achar
      // que este painel sempre mostrava "Nao encontrado", mesmo com
      // responsavel corretamente vinculado (o Vendedor do orcamento ja
      // usava o campo certo, so este texto informativo ficou desatualizado).
      if (projeto.responsavel_funcionario_id) {
        const { data: func } = await supabase
          .from('funcionarios')
          .select('nome')
          .eq('id', projeto.responsavel_funcionario_id)
          .single()
        if (func) responsavelSisNome = func.nome
      }

      // Ponto de não-retorno: a partir daqui o resultado é aplicado no
      // form (empresa/cliente/arquiteto/vendedor). Se uma chamada mais
      // nova de handleProjectSelect já começou nesse meio-tempo, esta aqui
      // está obsoleta -- abandona sem tocar em nada, pra não sobrescrever
      // o que a chamada nova já aplicou ou vai aplicar.
      if (mySeq !== projectSelectSeqRef.current) return

      setProjectDetails({
        id: projeto.id,
        nome: projeto.nome,
        responsavel_nome: projeto.responsavel_nome || 'Não preenchido',
        arquiteto_nome: projeto['Nome Arquiteto'] || 'Não preenchido',
        cliente_nome: clienteNome,
        responsavel_sistema_nome: responsavelSisNome,
        empresa_nome: empresaNome,
        isLoading: false,
        clienteMissing: !projeto.cliente_id,
        empresaMissing: !projeto.empresa_id,
      })

      if (projeto.empresa_id) {
        form.setValue('empresa_id', projeto.empresa_id, {
          shouldValidate: true,
          shouldDirty: true,
        })
      }

      if (projeto.cliente_id) {
        form.setValue('cliente_id', projeto.cliente_id, {
          shouldValidate: true,
          shouldDirty: true,
        })
      }

      // SPEC-077: projeto com divisão de arquitetos já cadastrada (tabela
      // projeto_arquitetos) — pré-popula o picker inteiro, percentuais
      // inclusos.
      if (projeto.projeto_arquitetos && projeto.projeto_arquitetos.length > 0) {
        const splits: ArquitetoSplit[] = (projeto.projeto_arquitetos as any[])
          .filter((pa) => pa.arquiteto)
          .map((pa) => ({
            arquiteto_id: pa.arquiteto.id,
            nome: pa.arquiteto.nome,
            percentual: Number(pa.percentual),
          }))
        form.setValue('arquitetos', splits, {
          shouldValidate: true,
          shouldDirty: true,
        })
        // Achado 2026-08-24: o quadro-resumo "Arquiteto" lia só o texto
        // legado `projeto['Nome Arquiteto']` (quase sempre vazio em
        // projetos criados pelo CRM depois da SPEC-077) — o campo real do
        // formulário já vinha certo, só o resumo mostrava "Não preenchido"
        // por engano. Sincroniza o resumo com o que foi de fato preenchido.
        if (splits.length > 0) {
          setProjectDetails((prev) =>
            prev
              ? {
                  ...prev,
                  arquiteto_nome: splits.map((s) => s.nome).join(', '),
                }
              : prev,
          )
        }
      } else if (projeto.arquiteto) {
        // Achado 2026-08-20: projetos criados pelo modal "Novo Projeto"
        // deste próprio app (ProjectCreateModal.tsx) só gravavam o
        // arquiteto_id singular (legado), nunca uma linha em
        // projeto_arquitetos — o projeto ficava sem arquiteto autopreenchido
        // aqui mesmo com o vínculo salvo. ProjectCreateModal já foi corrigido
        // pra gravar em projeto_arquitetos também; este fallback cobre os
        // projetos que ficaram com esse gap (e qualquer outra origem futura
        // que só grave o campo singular).
        form.setValue(
          'arquitetos',
          [
            {
              arquiteto_id: (projeto.arquiteto as any).id,
              nome: (projeto.arquiteto as any).nome,
              percentual: 100,
            },
          ],
          {
            shouldValidate: true,
            shouldDirty: true,
          },
        )
        setProjectDetails((prev) =>
          prev
            ? {
                ...prev,
                arquitetoAutoLinked: true,
                arquiteto_nome: (projeto.arquiteto as any).nome,
              }
            : prev,
        )
      } else if (projeto['Nome Arquiteto']) {
        // SPEC-061: fallback de autopreenchimento por nome — quando o
        // projeto só tem o texto legado "Nome Arquiteto" (sem vínculo em
        // projeto_arquitetos), busca em contatos por correspondência única
        // (exata, case-insensitive) e pré-seleciona com 100%. Ambíguo ou
        // zero resultados: não inventa vínculo, campo fica vazio para
        // seleção manual.
        const nomeArquiteto = String(projeto['Nome Arquiteto']).trim()
        if (nomeArquiteto) {
          const { data: arqMatches } = await supabase
            .from('contatos')
            .select('id, nome')
            .eq('tipo', 'arquiteto')
            .ilike('nome', nomeArquiteto)
          if (mySeq !== projectSelectSeqRef.current) return
          if (arqMatches && arqMatches.length === 1) {
            form.setValue(
              'arquitetos',
              [
                {
                  arquiteto_id: arqMatches[0].id,
                  nome: arqMatches[0].nome,
                  percentual: 100,
                },
              ],
              {
                shouldValidate: true,
                shouldDirty: true,
              },
            )
            setProjectDetails((prev) =>
              prev
                ? {
                    ...prev,
                    arquitetoAutoLinked: true,
                    arquiteto_nome: arqMatches[0].nome,
                  }
                : prev,
            )
          }
        }
      }

      // Vendedor = Responsável do Projeto (`responsavel_funcionario_id`,
      // SPEC-077) — não é o Arquiteto nem o Responsável da Obra
      // (`responsavel_obra_id`, campo diferente), são conceitos
      // independentes. Fallback pra correspondência única de nome
      // (`responsavel_nome`, texto legado) quando o projeto é antigo e não
      // tem o vínculo direto; se nada resolver, cai pro usuário logado.
      // Sempre reresolve (inclusive limpando pra "none") a cada seleção de
      // projeto — autopreenchimento só ocorre ao criar um orçamento novo,
      // nunca sobrescreve uma escolha manual já feita ao editar um
      // orçamento existente.
      if (!isEditing) {
        let targetVendedorId: string | null =
          projeto.responsavel_funcionario_id || null

        if (!targetVendedorId && projeto.responsavel_nome?.trim()) {
          // `responsavel_nome` legado costuma ser só o primeiro nome (ex.:
          // "Marina"), enquanto `funcionarios.nome` é o nome completo — por
          // isso o match precisa ser parcial (%...%), não exato.
          const { data: nomeMatches } = await supabase
            .from('funcionarios')
            .select('id')
            .ilike('nome', `%${projeto.responsavel_nome.trim()}%`)
          if (nomeMatches && nomeMatches.length === 1) {
            targetVendedorId = nomeMatches[0].id
          }
        }

        if (!targetVendedorId) {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            const { data: func } = await supabase
              .from('funcionarios')
              .select('id')
              .eq('usuario_id', user.id)
              .maybeSingle()
            if (func) targetVendedorId = func.id
          }
        }

        if (mySeq !== projectSelectSeqRef.current) return
        form.setValue('vendedor_id', targetVendedorId || 'none', {
          shouldValidate: true,
          shouldDirty: true,
        })

        if (
          targetVendedorId &&
          !sortedVendedores.some((v) => v.id === targetVendedorId)
        ) {
          const { data: vData } = await supabase
            .from('funcionarios')
            .select('nome')
            .eq('id', targetVendedorId)
            .maybeSingle()
          if (vData?.nome) setAssignedVendedorNome(vData.nome)
        }
      }

      form.setValue('data_emissao', new Date(), {
        shouldValidate: true,
        shouldDirty: true,
      })
    } catch (err) {
      console.error('Erro ao buscar dados do projeto:', err)
      setProjectDetails(null)
    }
  }

  // Handoff a partir de outro sistema (ex.: CRM "Gerar Orçamento"): permite
  // pré-selecionar o projeto por id via query string em vez de forçar o
  // usuário a digitar o código de novo.
  useEffect(() => {
    if (isEditing) return
    const projetoId = searchParams.get('projeto_id')
    if (!projetoId) return

    async function preencherProjetoPorId() {
      const { data, error } = await supabase
        .from('projetos')
        .select('codigo')
        .eq('id', projetoId)
        .single()

      if (error || !data?.codigo) return

      form.setValue('projeto_codigo', data.codigo, {
        shouldValidate: true,
        shouldDirty: true,
      })
      await handleProjectSelect(data.codigo)
    }

    preencherProjetoPorId()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, searchParams])

  // Achado 2026-08-20: quando a validação do zod barra o submit (campo
  // obrigatório vazio, ex. Data de Início do Pagamento ou Frete), o
  // react-hook-form só marca o campo em vermelho -- sem nenhum toast,
  // nenhuma requisição disparada. Usuário não tem como saber que nada foi
  // salvo. O submit genérico (Criar/Salvar) não tinha esse tratamento.
  function onInvalid(errors: any) {
    const primeiraChave = Object.keys(errors)[0]
    const mensagem = primeiraChave ? errors[primeiraChave]?.message : null
    toast.error('Corrija os campos destacados antes de salvar.', {
      description: typeof mensagem === 'string' ? mensagem : undefined,
    })
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      const invalidItems = values.itens.filter(
        (i) => i.produto_id && !isValidUUID(i.produto_id),
      )
      if (invalidItems.length > 0) {
        toast.error(
          `${invalidItems.length} item(ns) com produto_id inválido. Serão tratados como item avulso.`,
        )
      }

      const { data: projeto, error: projError } = await supabase
        .from('projetos')
        .select('id, arquivado')
        .eq('codigo', values.projeto_codigo)
        .single()

      if (projError || !projeto) {
        form.setError('projeto_codigo', {
          message: 'Código de projeto não encontrado na base de dados',
        })
        setIsSubmitting(false)
        return
      }

      if (
        projeto.arquivado &&
        (!isEditing || budgetToEdit?.projeto_id !== projeto.id)
      ) {
        form.setError('projeto_codigo', {
          message: 'Código de projeto não encontrado na base de dados',
        })
        setIsSubmitting(false)
        return
      }

      // Achado 2026-08-14: orçamento já aprovado tem parcelas/boletos
      // gerados de verdade na aprovação (tabelas projeto_parcelas/boletos)
      // — os campos abaixo em `orcamentos` ficam só como registro
      // histórico depois disso, não recalculam nada. Editar um campo não
      // relacionado a pagamento (ex.: observações) não deveria exigir
      // preencher/validar uma data de início "hoje ou futura" que não
      // existe mais pra um negócio fechado há semanas.
      const editandoAprovado =
        isEditing && budgetToEdit?.status === 'Orçamento Aprovado'

      if (!editandoAprovado && !values.data_inicio_pagamento) {
        form.setError('data_inicio_pagamento', {
          message: 'Data de início do pagamento é obrigatória',
        })
        setIsSubmitting(false)
        return
      }
      if (!editandoAprovado && values.data_inicio_pagamento) {
        const checarData = new Date(values.data_inicio_pagamento)
        checarData.setHours(0, 0, 0, 0)
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        if (checarData < hoje) {
          form.setError('data_inicio_pagamento', {
            message: 'A data de início deve ser hoje ou uma data futura',
          })
          setIsSubmitting(false)
          return
        }
      }

      // Parcela 1 vence em `data_inicio_pagamento`. As seguintes, por
      // padrão, vencem 1 mês após a parcela anterior — mas quem negocia com
      // o cliente pode sobrescrever o vencimento de qualquer parcela
      // individualmente (`values.parcelas_datas`). O backend (RPC de
      // aprovação) só entende offsets em dias a partir da data de
      // aprovação, então convertemos cada vencimento calendário num offset
      // relativo a hoje — a diferença entre offsets preserva o espaçamento
      // calendário escolhido, independente de quando a aprovação de fato
      // ocorrer.
      let prazoDias: number | undefined
      let prazoPagamentoDias: number[] | undefined
      let dataInicioPagamentoStr: string | undefined
      // SPEC-152 (item 7): `orcamentos.plano_parcelas` -- array com
      // {numero, dias_offset, valor, forma_pagamento, permuta_fornecedor_id}
      // por parcela, gradualmente substituindo prazo_pagamento_dias como
      // fonte de valor (aprovar_orcamento_financeiro passa a usar isto
      // quando presente em vez de dividir valor_total igualmente).
      let planoParcelas:
        | Array<{
            numero: number
            dias_offset: number
            valor: number
            forma_pagamento: string
            permuta_fornecedor_id: string | null
          }>
        | undefined
      if (!editandoAprovado) {
        const totalParcelas = FORMAS_PAGAMENTO_PARCELAVEIS(
          values.forma_pagamento,
        )
          ? normalizarQtdParcelas(values.parcelas)
          : 1
        const dataInicioDate = new Date(values.data_inicio_pagamento as Date)
        dataInicioDate.setHours(0, 0, 0, 0)
        const hojeBase = new Date()
        hojeBase.setHours(0, 0, 0, 0)
        prazoDias = Math.max(
          0,
          Math.round(
            (dataInicioDate.getTime() - hojeBase.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
        const parcelaDatas = Array.from({ length: totalParcelas }, (_, i) => {
          if (i === 0) return dataInicioDate
          const override = values.parcelas_datas?.[i - 1]
          if (override) {
            const d = new Date(override)
            d.setHours(0, 0, 0, 0)
            return d
          }
          return addMonths(dataInicioDate, i)
        })
        prazoPagamentoDias = parcelaDatas.map((d) =>
          Math.round(
            (d.getTime() - hojeBase.getTime()) / (1000 * 60 * 60 * 24),
          ),
        )
        dataInicioPagamentoStr = format(dataInicioDate, 'yyyy-MM-dd')

        // Regra dura (decisão do usuário, 2026-09-17): soma das parcelas
        // deve bater EXATAMENTE com o valor a pagar -- bloqueia salvar se
        // não bater, nunca arredonda silenciosamente. `valorTotal` é o
        // mesmo valor reativo (form.watch) usado no card "Resumo" e gravado
        // em `payload.valor_total` logo abaixo.
        const config = values.parcelas_config || []
        const valoresParcelas = Array.from(
          { length: totalParcelas },
          (_, i) => {
            const raw = config[i]?.valor
            const n = raw === '' || raw === undefined ? NaN : Number(raw)
            return Number.isFinite(n) ? n : 0
          },
        )
        const somaParcelas =
          Math.round(valoresParcelas.reduce((acc, v) => acc + v, 0) * 100) / 100
        const valorTotalArredondado = Math.round(valorTotal * 100) / 100
        if (Math.abs(somaParcelas - valorTotalArredondado) > 0.01) {
          toast.error(
            `A soma das parcelas (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(somaParcelas)}) precisa ser igual ao valor a pagar (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotalArredondado)}).`,
          )
          setIsSubmitting(false)
          return
        }

        planoParcelas = valoresParcelas.map((valor, i) => {
          const formaLinha =
            config[i]?.forma_pagamento || values.forma_pagamento || 'boleto'
          if (formaLinha === 'permuta' && !config[i]?.permuta_fornecedor_id) {
            throw Object.assign(
              new Error(
                `Selecione o fornecedor da permuta na parcela ${i + 1}.`,
              ),
              { code: 'PARCELA_PERMUTA_SEM_FORNECEDOR' },
            )
          }
          return {
            numero: i + 1,
            dias_offset: prazoPagamentoDias![i],
            valor,
            forma_pagamento: formaLinha,
            permuta_fornecedor_id:
              formaLinha === 'permuta'
                ? config[i]?.permuta_fornecedor_id || null
                : null,
          }
        })
      }

      const hasUnregisteredItems = values.itens.some(
        (i) => !i.produto_id || !isValidUUID(i.produto_id),
      )

      const payload = {
        // SPEC-071: só editável na criação — trava depois que o orçamento
        // existe (o campo fica desabilitado na UI quando isEditing).
        natureza_operacao: values.natureza_operacao,
        subgrupo: values.subgrupo,
        empresa_id: values.empresa_id,
        projeto_id: projeto.id,
        cliente_id: values.cliente_id,
        vendedor_id: values.vendedor_id === 'none' ? null : values.vendedor_id,
        status: isEditing ? values.status : 'rascunho',
        desconto_global: values.desconto_global ?? 0,
        desconto_tipo: values.desconto_tipo || 'percentual',
        valor_sinal: values.valor_sinal ?? 0,
        forma_pagamento: values.forma_pagamento || null,
        // Achado 2026-08-14: ao editar orçamento já aprovado, não
        // recalcula/sobrescreve os campos de prazo de pagamento — eles só
        // registram o histórico da negociação original, e as
        // parcelas/boletos reais já existem em tabelas próprias.
        ...(editandoAprovado
          ? {}
          : {
              prazo_inicio_cobranca_dias: prazoDias,
              data_inicio_pagamento: dataInicioPagamentoStr,
              prazo_pagamento_dias: prazoPagamentoDias,
              condicoes_pagamento: (prazoPagamentoDias ?? []).join('/'),
              plano_parcelas: planoParcelas ?? null,
            }),
        frete_tipo: values.frete_tipo,
        frete_valor: values.frete_tipo === 'sem_frete' ? 0 : values.frete_valor,
        observacoes: values.observacoes,
        data_emissao: values.data_emissao.toISOString(),
        validade: values.validade
          ? format(values.validade, 'yyyy-MM-dd')
          : null,
        // SPEC-064: rótulo Ribeirão/São Paulo, só visualização — não
        // influencia cálculo, aprovação nem nenhum outro fluxo.
        perfil: values.perfil || null,
        valor_total: valorTotal,
        requer_revisao_financeira: hasUnregisteredItems,
        // SPEC-050: só grava a origem Connect quando este orçamento veio de
        // um import de XML aplicado nesta sessão de edição.
        ...(connectOrigin
          ? {
              origem_connect_cod_orcamento: connectOrigin.cod_orcamento,
              origem_connect_importado_em: connectOrigin.importado_em,
            }
          : {}),
      }

      const arquitetosPayload = values.arquitetos.map((a) => ({
        arquiteto_id: a.arquiteto_id,
        percentual: a.percentual,
      }))

      // SPEC-111: orçamento em 'Aprovação Financeira' tem um trigger no banco
      // (handle_orcamento_item_change_reset) que reinicia o ciclo de
      // aprovação do cliente quando os itens salvos mudam de verdade. SPEC-135
      // corrigiu o falso-positivo no banco (replace_orcamento_itens vira no-op
      // quando os itens são idênticos aos já salvos). Achado 2026-09-14: o
      // aviso abaixo continuava disparando incondicionalmente mesmo assim —
      // corrigido para só avisar quando os itens realmente mudam (mesma
      // comparação, em espírito, do banco). Editar só "Pagamento e Totais"
      // (forma de pagamento, parcelas, frete, perfil, desconto, sinal,
      // observações) não passa mais por aqui. 'Orçamento Aprovado' não
      // precisa desse aviso porque editandoAprovado já pula os itens
      // inteiramente (skipItens=true), então o trigger nunca dispara por
      // aqui nesse status.
      const itensMudaram =
        isEditing &&
        budgetToEdit?.status === 'Aprovação Financeira' &&
        itensRealmenteMudaram(budgetToEdit.itens, values.itens)

      if (
        itensMudaram &&
        !window.confirm(
          'Esta alteração vai reiniciar o ciclo de aprovação — o orçamento volta para "Enviado ao Cliente" e o cliente precisará aprovar novamente. Confirmar?',
        )
      ) {
        setIsSubmitting(false)
        return
      }

      if (isEditing && budgetToEdit) {
        await updateBudget(
          budgetToEdit.id,
          payload,
          values.itens,
          arquitetosPayload,
          editandoAprovado,
        )
        toast.success(
          itensMudaram
            ? 'Orçamento atualizado — ciclo de aprovação do cliente reiniciado.'
            : 'Orçamento atualizado com sucesso',
        )
      } else {
        const newBudgetId = await addBudget(
          payload,
          values.itens,
          arquitetosPayload,
        )
        try {
          const { data: newBudget } = await supabase
            .from('orcamentos')
            .select('token_aprovacao_cliente, status')
            .eq('id', newBudgetId)
            .single()
          if (
            newBudget?.status === 'enviado_cliente' &&
            newBudget?.token_aprovacao_cliente
          ) {
            const link = buildClientApprovalLink(
              newBudgetId,
              newBudget.token_aprovacao_cliente,
            )
            await navigator.clipboard.writeText(link)
            toast.success(
              'Orçamento criado e enviado para aprovação do cliente! Link copiado.',
              {
                description: link,
                duration: 8000,
              },
            )
          } else {
            // SPEC-051: a criação sempre nasce em rascunho agora — a
            // promoção automática para enviado_cliente foi removida do
            // banco. O envio ao cliente passa a ser sempre uma ação
            // separada, feita na aba "Rascunho".
            toast.info('Orçamento salvo como rascunho.', {
              description:
                'Vá até a aba "Rascunho" e use o botão "Enviar para o Cliente" quando estiver pronto para avançar o fluxo de aprovação.',
              duration: 6000,
            })
          }
        } catch {
          toast.success('Orçamento criado com sucesso!')
        }
      }

      // Update store budgets list so table is updated without hard refresh
      await fetchBudgets()
      navigate('/budgets')
    } catch (error: any) {
      console.error(error)
      toast.error(
        error.message ||
          'Falha ao salvar orçamento. Verifique os dados e tente novamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateProductMeta = (products: ProductSearchItem[]) => {
    setProductMetaMap((prev) => {
      const next = new Map(prev)
      products.forEach((product) => {
        if (product.source === 'produtos' && isValidUUID(product.id)) {
          next.set(product.id, {
            codigo_produto: product.codigo_produto ?? null,
            referencia: product.referencia ?? null,
            nome: product.nome ?? null,
            sku: product.sku ?? null,
          })
        }
      })
      return next
    })
  }

  const productCatalogToSearchItem = (
    product: ProductCatalogItem,
  ): ProductSearchItem => ({
    id: product.id,
    nome: product.nome,
    sku: product.sku || null,
    referencia: product.referencia || null,
    codigo_produto: product.codigo_produto ?? null,
    preco_venda: product.preco_venda ?? null,
    valor_venda: product.valor_venda ?? product.preco_venda ?? null,
    estoque_total: 0,
    estoque_disponivel: 0,
    marca_nome: null,
    categoria_nome: null,
    source: 'produtos',
  })

  // SPEC-079: próximo L disponível, sugerido como valor inicial ao abrir
  // o diálogo de múltiplos L's — mesmo cálculo já usado em
  // applyProductSelection.
  const getProximoL = () => {
    const currentItems = form.getValues('itens') || []
    const maxL = currentItems.reduce((max, item) => {
      const match = (item.custom_id || '').match(/L(\d+)/i)
      return Math.max(max, match ? parseInt(match[1], 10) : 0)
    }, 0)
    return formatCircuitId(`L${maxL + 1}`)
  }

  const handleMultiLConfirm = (payload: {
    descricao: string
    preco_unitario: number
    entries: { custom_id: string; quantidade: number }[]
  }) => {
    const currentItems = form.getValues('itens') || []
    const isManual = !multiLProduct
    const produtoIdValido =
      multiLProduct &&
      multiLProduct.source === 'produtos' &&
      isValidUUID(multiLProduct.id)

    const newItems = payload.entries.map((entry) => ({
      uid: crypto.randomUUID(),
      custom_id: formatCircuitId(entry.custom_id),
      produto_id: produtoIdValido
        ? (multiLProduct as ProductSearchItem).id
        : '',
      descricao: isManual
        ? payload.descricao
        : produtoIdValido
          ? ''
          : (multiLProduct as ProductSearchItem).nome,
      quantidade: entry.quantidade,
      preco_unitario: isManual
        ? payload.preco_unitario
        : multiLProduct!.preco_venda || multiLProduct!.valor_venda || 0,
      desconto: 0,
    }))

    if (multiLProduct) updateProductMeta([multiLProduct])
    replace(sortItemsByCircuitId([...currentItems, ...newItems]), {
      shouldFocus: false,
    })
    toast.success(
      newItems.length === 1
        ? '1 L adicionado com sucesso'
        : `${newItems.length} L's adicionados com sucesso`,
    )
    setMultiLProduct(null)
  }

  const applyProductSelection = (
    products: ProductSearchItem[],
    targetIndex: number | null = productSearchRowIndex,
  ) => {
    if (products.length === 0) {
      setIsProductSearchOpen(false)
      setProductSearchRowIndex(null)
      return
    }

    updateProductMeta(products)
    const currentItems = form.getValues('itens') || []

    const maxL = currentItems.reduce((max, item) => {
      const match = (item.custom_id || '').match(/L(\d+)/i)
      return Math.max(max, match ? parseInt(match[1], 10) : 0)
    }, 0)

    const buildNewItem = (p: ProductSearchItem, seq: number) => ({
      uid: crypto.randomUUID(),
      custom_id: formatCircuitId(`L${seq}`),
      produto_id: p.source === 'produtos' && isValidUUID(p.id) ? p.id : '',
      descricao: p.source === 'produtos' && isValidUUID(p.id) ? '' : p.nome,
      quantidade: 1,
      preco_unitario: p.preco_venda || p.valor_venda || 0,
      desconto: 0,
    })

    if (
      targetIndex !== null &&
      targetIndex >= 0 &&
      targetIndex < currentItems.length
    ) {
      const updatedItems = [...currentItems]
      const existingCustomId = updatedItems[targetIndex].custom_id || ''

      updatedItems[targetIndex] = {
        ...updatedItems[targetIndex],
        ...buildNewItem(products[0], targetIndex + 1),
        custom_id: existingCustomId || formatCircuitId(`L${targetIndex + 1}`),
      }

      if (products.length > 1) {
        const remaining = products
          .slice(1)
          .map((p, idx) => buildNewItem(p, maxL + idx + 1))
        updatedItems.push(...remaining)
      }

      replace(updatedItems, { shouldFocus: false })
    } else {
      const newItems = products.map((p, idx) => buildNewItem(p, maxL + idx + 1))
      const combinedItems = [...currentItems, ...newItems]
      replace(combinedItems, { shouldFocus: false })
    }

    toast.success(
      products.length === 1
        ? '1 produto adicionado com sucesso'
        : `${products.length} produtos adicionados com sucesso`,
    )
    setIsProductSearchOpen(false)
    setProductSearchRowIndex(null)
  }

  // SPEC-080: o modal "Buscar Produtos" já coleta os L's de cada peça
  // selecionada (painel inline, ver ProductSearchModal.tsx) — não precisa
  // mais de um diálogo separado depois de fechar a busca.
  const handleProductSearchConfirm = (selections: ProductSelectionEntry[]) => {
    // Trocar o produto de UMA linha existente (ícone de busca na linha)
    // continua sendo 1:1 direto — mantém o L/quantidade que já estavam
    // naquela linha, só troca o produto.
    if (productSearchRowIndex !== null) {
      applyProductSelection(selections.map((s) => s.product))
      return
    }

    if (selections.length === 0) {
      setIsProductSearchOpen(false)
      return
    }

    updateProductMeta(selections.map((s) => s.product))
    const currentItems = form.getValues('itens') || []
    const newItems = selections.flatMap(({ product, entries }) => {
      const isProduto = product.source === 'produtos' && isValidUUID(product.id)
      return entries.map((entry) => ({
        uid: crypto.randomUUID(),
        custom_id: formatCircuitId(entry.custom_id),
        produto_id: isProduto ? product.id : '',
        descricao: isProduto ? '' : product.nome,
        quantidade: entry.quantidade,
        preco_unitario: product.preco_venda || product.valor_venda || 0,
        desconto: 0,
      }))
    })

    replace(sortItemsByCircuitId([...currentItems, ...newItems]), {
      shouldFocus: false,
    })
    toast.success(
      newItems.length === 1
        ? '1 L adicionado com sucesso'
        : `${newItems.length} L's adicionados com sucesso (${selections.length} peça(s))`,
    )
    setIsProductSearchOpen(false)
  }

  // SPEC-071: mesma lógica de applyProductSelection, mas a origem é uma
  // venda já aprovada (projeto_itens) em vez do catálogo de produtos — cada
  // linha carrega projeto_item_origem_id, obrigatório pelo superRefine do
  // schema quando natureza_operacao === 'devolucao'.
  const applyDevolucaoSelection = (selecoes: DevolucaoSelection[]) => {
    if (selecoes.length === 0) {
      setIsDevolucaoSearchOpen(false)
      return
    }

    updateProductMeta(
      selecoes
        .filter((s) => s.venda.produto_id && isValidUUID(s.venda.produto_id))
        .map((s) => ({
          id: s.venda.produto_id as string,
          nome: s.venda.produto || '',
          sku: null,
          referencia: null,
          codigo_produto: s.venda.produto_codigo,
          preco_venda: s.venda.preco_unitario,
          valor_venda: s.venda.preco_unitario,
          estoque_total: 0,
          estoque_disponivel: 0,
          marca_nome: null,
          categoria_nome: null,
          source: 'produtos',
        })),
    )

    const currentItems = form.getValues('itens') || []
    const maxL = currentItems.reduce((max, item) => {
      const match = (item.custom_id || '').match(/L(\d+)/i)
      return Math.max(max, match ? parseInt(match[1], 10) : 0)
    }, 0)

    const newItems = selecoes.map((s, idx) => ({
      uid: crypto.randomUUID(),
      custom_id: formatCircuitId(`L${maxL + idx + 1}`),
      produto_id:
        s.venda.produto_id && isValidUUID(s.venda.produto_id)
          ? s.venda.produto_id
          : '',
      descricao: s.venda.produto || '',
      quantidade: s.quantidade,
      preco_unitario: s.venda.preco_unitario,
      desconto: s.venda.desconto,
      projeto_item_origem_id: s.venda.projeto_item_id,
    }))

    replace([...currentItems, ...newItems], { shouldFocus: false })

    toast.success(
      newItems.length === 1
        ? '1 item de devolução adicionado com sucesso'
        : `${newItems.length} itens de devolução adicionados com sucesso`,
    )
    setIsDevolucaoSearchOpen(false)
  }

  const handleProductCreateConfirm = (product: ProductCatalogItem) => {
    const searchItem = productCatalogToSearchItem(product)
    applyProductSelection(
      [searchItem],
      productCreateTarget?.index ?? productSearchRowIndex,
    )
    setIsProductCreateOpen(false)
    setProductCreateTarget(null)
  }

  const handleBatchComplete = (results: ParsedPdfResult[]) => {
    if (results.length === 0) return

    let empresaId = form.getValues('empresa_id')
    const empresaNome = results.find((r) => r.empresa_nome)?.empresa_nome
    if (empresaNome) {
      const found = empresas.find(
        (emp) =>
          emp.nome.toLowerCase().includes(empresaNome.toLowerCase()) ||
          empresaNome.toLowerCase().includes(emp.nome.toLowerCase()),
      )
      if (found) empresaId = found.id
    }

    let clienteId = form.getValues('cliente_id')
    const clienteNome = results.find((r) => r.cliente_nome)?.cliente_nome
    if (clienteNome) {
      const found = clientes.find((c) =>
        c.nome.toLowerCase().includes(clienteNome.toLowerCase()),
      )
      if (found) clienteId = found.id
    }

    let arquitetosSplit = form.getValues('arquitetos')
    const arquitetoNome = results.find((r) => r.arquiteto_nome)?.arquiteto_nome
    if (arquitetoNome) {
      const found = arquitetos.find((a) =>
        a.nome.toLowerCase().includes(arquitetoNome.toLowerCase()),
      )
      if (found) {
        arquitetosSplit = [
          { arquiteto_id: found.id, nome: found.nome, percentual: 100 },
        ]
      }
    }

    let vendedorId = form.getValues('vendedor_id')
    const vendedorNome = results.find((r) => r.vendedor_nome)?.vendedor_nome
    if (vendedorNome) {
      const found = sortedVendedores.find((v) =>
        v.nome.toLowerCase().includes(vendedorNome.toLowerCase()),
      )
      if (found) vendedorId = found.id
    }

    // SPEC-107: cheque/transferência já existiam no ENUM do banco mas nunca
    // tinham sido liberados aqui nem na tela — cheque/transferência
    // importados de XML caíam no fallback 'pix' (linha removida abaixo).
    // permuta é novo (pedido explícito na reunião 14/08).
    const validFormas = [
      'pix',
      'cartao',
      'boleto',
      'dinheiro',
      'cheque',
      'transferencia',
      'permuta',
    ]
    const formaPgtoRaw =
      results.find((r) => r.forma_pagamento)?.forma_pagamento?.toLowerCase() ||
      ''
    let formaPgto = formaPgtoRaw
    if (!validFormas.includes(formaPgto)) formaPgto = ''

    let parsedParcelas = 1
    const condicoes = results.find(
      (r) => r.condicoes_pagamento,
    )?.condicoes_pagamento
    if (condicoes) {
      const num = parseInt(condicoes.replace(/\D/g, ''))
      if (!isNaN(num) && num > 0) parsedParcelas = num
    }

    form.reset({
      ...form.getValues(),
      empresa_id: empresaId,
      cliente_id: clienteId,
      arquitetos: arquitetosSplit,
      vendedor_id: vendedorId || 'none',
      status: results.find((r) => r.status)?.status || 'enviado_cliente',
      desconto_global:
        results.find((r) => r.desconto_global)?.desconto_global || 0,
      forma_pagamento: formaPgto,
      parcelas: parsedParcelas,
      observacoes: results.find((r) => r.observacoes)?.observacoes || '',
    })

    const allParsedItems = results.flatMap((r) => r.itens || [])

    if (allParsedItems.length > 0) {
      const newItens = allParsedItems.map((i) => {
        let produtoId = ''
        if (i.custom_id || i.descricao) {
          const found = produtos.find(
            (p) =>
              (i.custom_id &&
                (p.sku === i.custom_id || p.referencia === i.custom_id)) ||
              (i.descricao &&
                (p.originalNome || p.nome)
                  .toLowerCase()
                  .includes(i.descricao.toLowerCase())),
          )
          if (found && isValidUUID(found.id)) produtoId = found.id
        }

        let displayCustomId = i.custom_id || ''
        if (!produtoId && i.descricao && !displayCustomId) {
          displayCustomId = i.descricao
        }

        return {
          uid: crypto.randomUUID(),
          custom_id: formatCircuitId(displayCustomId),
          produto_id: produtoId,
          descricao: produtoId ? '' : i.descricao || displayCustomId,
          quantidade: i.quantidade || 1,
          preco_unitario: i.preco_unitario || 0,
          desconto: i.desconto || 0,
        }
      })

      const existingItems = form.getValues('itens') || []
      replace(sortItemsByCircuitId([...existingItems, ...newItens]))
    }

    toast.success(
      `${results.length} arquivo(s) processado(s) com sucesso. Revise os dados preenchidos.`,
    )
  }

  // SPEC-050: aplica o resultado já resolvido do import de XML Connect ao
  // formulário. `clienteIdOverride` é usado quando o cliente não foi
  // encontrado no XML e acabou de ser cadastrado via ClientCreateModal
  // (fluxo de retomada, P-2).
  const applyResolvedXmlImport = (
    resolved: ResolvedXmlBudget,
    clienteIdOverride?: string,
  ) => {
    const clienteId = clienteIdOverride || resolved.cliente_id
    if (!clienteId) {
      toast.error(
        'Cliente ainda não resolvido. Cadastre o cliente antes de aplicar o import.',
      )
      return
    }
    if (!resolved.empresa_id) {
      toast.error(
        'Empresa não resolvida. Cadastre a empresa antes de aplicar o import.',
      )
      return
    }

    const currentValues = form.getValues()
    form.reset({
      ...currentValues,
      empresa_id: resolved.empresa_id,
      cliente_id: clienteId,
      data_emissao: resolved.raw.data_emissao || currentValues.data_emissao,
    })

    const newItens = resolved.itens.map((item) => ({
      uid: crypto.randomUUID(),
      custom_id: item.custom_id,
      produto_id: item.produto_id || '',
      // Diferente do import de PDF: aqui a descrição do XML é sempre
      // preservada, mesmo quando o produto foi casado.
      descricao: item.desc_produto,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      desconto: item.desconto,
    }))
    const existingItems = form.getValues('itens') || []
    replace(sortItemsByCircuitId([...existingItems, ...newItens]))

    if (resolved.raw.cod_orcamento != null) {
      setConnectOrigin({
        cod_orcamento: resolved.raw.cod_orcamento,
        importado_em: new Date().toISOString(),
      })
    }

    toast.success(
      `XML importado: ${resolved.itensCasados} item(ns) casado(s), ${resolved.itensAvulsos} avulso(s). Revise os dados antes de salvar.`,
    )
  }

  const handleXmlImportApply = (resolved: ResolvedXmlBudget) => {
    applyResolvedXmlImport(resolved)
  }

  const handleXmlImportNeedsClient = (resolved: ResolvedXmlBudget) => {
    setPendingXmlImport(resolved)
    setIsClientModalOpen(true)
    toast.info(
      'Cliente do XML não encontrado. Cadastre o cliente para retomar o import.',
    )
  }

  const handleExportXml = () => {
    if (!budgetToEdit) return

    const values = form.getValues()
    const empresaSelecionada = empresas.find((e) => e.id === values.empresa_id)
    const clienteSelecionado = clientes.find((c) => c.id === values.cliente_id)

    const xml = buildConnectXmlExport(
      {
        numero: budgetToEdit.numero,
        empresaCodigo:
          (empresaSelecionada as any)?.codigo != null
            ? Number((empresaSelecionada as any).codigo)
            : null,
        empresaCnpj: (empresaSelecionada as any)?.cnpj || null,
        clienteCodigoLegado:
          (clienteSelecionado as any)?.codigo_legado != null
            ? Number((clienteSelecionado as any).codigo_legado)
            : null,
        dataEmissao: values.data_emissao,
      },
      values.itens.map((item) => ({
        custom_id: item.custom_id,
        produto_id: item.produto_id,
        descricao: item.descricao,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        desconto: item.desconto,
      })),
      (produtoId) => {
        const info = getProductInfo(produtoId)
        if (!info) return null
        return {
          codigo_produto: info.codigo_produto,
          referencia: info.referencia,
          nome: info.nome,
        }
      },
    )

    const filename = `orcamento_${budgetToEdit.numero || budgetToEdit.id}.xml`
    downloadXmlFile(xml, filename)
    toast.success('XML exportado com sucesso.')
  }

  // Achado 2026-09-14 (teste ao vivo): abrir o diálogo de Aprovação
  // Financeira usa `budgetToEdit.itens`, que só é carregado uma vez quando a
  // página abre — se um item sem produto cadastrado foi adicionado nesta
  // mesma sessão de edição, o aviso/bloqueio do diálogo (que depende desse
  // array) podia não pegar o item novo. Busca os itens direto do banco antes
  // de abrir, pra garantir que o aviso reflita o estado real salvo.
  const handleAbrirAprovacaoFinanceira = async () => {
    if (!budgetToEdit) return
    try {
      const { data, error } = await supabase
        .from('orcamento_itens')
        .select(
          'id, produto_id, quantidade, preco_unitario, desconto, custom_id, sub_ordem, descricao, projeto_item_origem_id, produto:produtos(codigo_produto, referencia, nome, sku)',
        )
        .eq('orcamento_id', budgetToEdit.id)
      if (!error && data) {
        setBudgetToEdit((prev) =>
          prev ? { ...prev, itens: data as any } : prev,
        )
      }
    } catch {
      // Não bloqueia a abertura do diálogo por falha na atualização — só
      // usa os itens já carregados como fallback.
    }
    setShowApprovalDialog(true)
  }

  const handleFinancialApproval = async () => {
    if (!budgetToEdit) return
    try {
      const result = await approveBudgetFinancial(budgetToEdit.id)
      setApprovalResult(result)
      setBudgetToEdit({
        ...budgetToEdit,
        status: result.status || 'Orçamento Aprovado',
        requer_revisao_financeira: false,
      })
      form.setValue('status', result.status || 'Orçamento Aprovado', {
        shouldDirty: false,
      })
      toast.success('Orçamento aprovado financeiramente!', {
        description: `Itens: ${result.projeto_itens_criados}, Parcelas: ${result.parcelas_criadas}, Boletos: ${result.boletos_criados}`,
      })
    } catch (error: any) {
      toast.error('Falha na aprovação financeira', {
        description: error?.message,
      })
      throw error
    }
  }

  if (isLoadingBudget || optionsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Carregando dados do orçamento...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 w-full max-w-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link to="/budgets">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Orçamento' : 'Novo Orçamento'}
            </h1>
            <p className="text-gray-500">
              {isEditing
                ? `Editando orçamento #${budgetToEdit?.numero || budgetToEdit?.id.split('-')[0].toUpperCase()}`
                : 'Preencha os detalhes para criar um novo orçamento'}
              {/* SPEC-136 (pendência fechada 2026-09-14, a pedido do
                  usuário): número da venda, quando já aprovado. */}
              {isEditing && budgetToEdit?.numero_venda && (
                <span className="text-gray-400">
                  {' '}
                  — Venda: {budgetToEdit.numero_venda}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isEditing &&
            budgetToEdit?.status === 'Aprovação Financeira' &&
            (role === 'admin' || role === 'gerente') && (
              <Button
                variant="default"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleAbrirAprovacaoFinanceira}
              >
                <ShieldAlert className="w-4 h-4 mr-2" />
                Aprovar Financeiro
              </Button>
            )}
          {isEditing && budgetToEdit && (
            <Button type="button" variant="outline" onClick={handleExportXml}>
              <Download className="w-4 h-4 mr-2" />
              Exportar XML
            </Button>
          )}
          {(role === 'admin' || role === 'gerente') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setGerenciamentoOpen(true)}>
                  <LineChart className="w-4 h-4 mr-2" />
                  Gerenciamento
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" asChild>
            <Link to="/budgets">Cancelar</Link>
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit, onInvalid)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? 'Salvar Alterações' : 'Criar Orçamento'}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>
                Detalhes do cliente e dados comerciais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SPEC-071: só editável na criação — trava depois que o
                  orçamento existe, para não mudar de natureza no meio do
                  pipeline de aprovação. SPEC-074: adicionados "Outros" e
                  "SAC" (mesmo comportamento de "Venda" na aprovação
                  financeira, ver payload/RPC) + campo "Tipo" com subgrupos
                  dependentes do tipo selecionado. */}
              <div className="flex flex-col gap-3 pb-4 border-b">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Tipo de Operação
                  </span>
                  <div className="inline-flex rounded-md border p-0.5 bg-muted/40">
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        naturezaOperacao === 'venda' ? 'default' : 'ghost'
                      }
                      disabled={isEditing}
                      className="rounded-sm"
                      onClick={() => {
                        form.setValue('natureza_operacao', 'venda', {
                          shouldDirty: true,
                        })
                        const opcoes = SUBGRUPOS_POR_TIPO.venda
                        form.setValue(
                          'subgrupo',
                          opcoes.length === 1 ? opcoes[0] : '',
                          { shouldValidate: true },
                        )
                      }}
                    >
                      Venda
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        naturezaOperacao === 'devolucao' ? 'default' : 'ghost'
                      }
                      disabled={isEditing}
                      className="rounded-sm"
                      onClick={() => {
                        form.setValue('natureza_operacao', 'devolucao', {
                          shouldDirty: true,
                        })
                        const opcoes = SUBGRUPOS_POR_TIPO.devolucao
                        form.setValue(
                          'subgrupo',
                          opcoes.length === 1 ? opcoes[0] : '',
                          { shouldValidate: true },
                        )
                      }}
                    >
                      <Undo2 className="w-3.5 h-3.5 mr-1.5" /> Devolução
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        naturezaOperacao === 'outros' ? 'default' : 'ghost'
                      }
                      disabled={isEditing}
                      className="rounded-sm"
                      onClick={() => {
                        form.setValue('natureza_operacao', 'outros', {
                          shouldDirty: true,
                        })
                        const opcoes = SUBGRUPOS_POR_TIPO.outros
                        form.setValue(
                          'subgrupo',
                          opcoes.length === 1 ? opcoes[0] : '',
                          { shouldValidate: true },
                        )
                      }}
                    >
                      <Package className="w-3.5 h-3.5 mr-1.5" /> Outros
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={naturezaOperacao === 'sac' ? 'default' : 'ghost'}
                      disabled={isEditing}
                      className="rounded-sm"
                      onClick={() => {
                        form.setValue('natureza_operacao', 'sac', {
                          shouldDirty: true,
                        })
                        const opcoes = SUBGRUPOS_POR_TIPO.sac
                        form.setValue(
                          'subgrupo',
                          opcoes.length === 1 ? opcoes[0] : '',
                          { shouldValidate: true },
                        )
                      }}
                    >
                      <Headset className="w-3.5 h-3.5 mr-1.5" /> SAC
                    </Button>
                  </div>
                  {isEditing ? (
                    <span className="text-xs text-muted-foreground">
                      Não pode ser alterado após a criação do orçamento.
                    </span>
                  ) : naturezaOperacao === 'devolucao' ? (
                    <span className="text-xs text-muted-foreground">
                      Itens desta devolução precisam ser lançados a partir da
                      busca de venda de origem, não do catálogo de produtos.
                    </span>
                  ) : null}
                </div>

                <FormField
                  control={form.control}
                  name="subgrupo"
                  render={({ field }) => {
                    const opcoes = SUBGRUPOS_POR_TIPO[naturezaOperacao] || []
                    return (
                      <FormItem className="max-w-sm">
                        <FormLabel>Tipo</FormLabel>
                        {opcoes.length === 1 ? (
                          <FormControl>
                            <Input value={opcoes[0]} disabled readOnly />
                          </FormControl>
                        ) : (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                            disabled={isEditing}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {opcoes.map((o) => (
                                <SelectItem key={o} value={o}>
                                  {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="empresa_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Empresa <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {empresas.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SPEC-146: Perfil (Ribeirão/São Paulo) movido de "Pagamento
                    e Totais" pra cá, ao lado de Empresa — pedido do usuário
                    pra ficar visível logo no topo do orçamento. */}
                <FormField
                  control={form.control}
                  name="perfil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Não informado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ribeirao">Ribeirão</SelectItem>
                          <SelectItem value="sao_paulo">São Paulo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* SPEC-078 (Bug 3): perfil da empresa selecionada, sempre
                  visível assim que uma empresa é escolhida — não depende de
                  haver itens no orçamento. */}
              {empresaSelecionadaPerfil && (
                <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
                  <img
                    src={logoImg}
                    alt={empresaSelecionadaPerfil.nome}
                    className="h-12 w-auto object-contain shrink-0"
                  />
                  <div className="text-sm">
                    <p className="font-semibold text-gray-900">
                      {empresaSelecionadaPerfil.nome}
                    </p>
                    {empresaSelecionadaPerfil.razao_social && (
                      <p className="text-muted-foreground">
                        {empresaSelecionadaPerfil.razao_social}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      {[
                        empresaSelecionadaPerfil.logradouro,
                        empresaSelecionadaPerfil.numero,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                      {empresaSelecionadaPerfil.bairro
                        ? ` - ${empresaSelecionadaPerfil.bairro}`
                        : ''}
                      {empresaSelecionadaPerfil.cidade
                        ? `, ${empresaSelecionadaPerfil.cidade}/${empresaSelecionadaPerfil.estado || ''}`
                        : ''}
                    </p>
                    <p className="text-muted-foreground">(16) 3442 - 3545</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="projeto_codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        Código do Projeto{' '}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1">
                            <SearchableSelect
                              options={projetos
                                .filter(
                                  (p) =>
                                    !p.arquivado ||
                                    (isEditing &&
                                      budgetToEdit?.projeto_id === p.id),
                                )
                                .map((p) => ({
                                  value: p.codigo,
                                  label: `${p.codigo} - ${p.nome || 'Sem nome'}`,
                                  searchTerms: [p.codigo, p.nome].filter(
                                    Boolean,
                                  ) as string[],
                                }))}
                              value={field.value}
                              onChange={(val) => {
                                field.onChange(val)
                                handleProjectSelect(val)
                              }}
                              placeholder="Selecione um projeto..."
                              searchPlaceholder="Buscar código do projeto..."
                              emptyText="Nenhum projeto encontrado."
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setIsProjectModalOpen(true)}
                            title="Criar Novo Projeto"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {projectDetails && (
                  <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm space-y-2 mb-4 animate-in fade-in zoom-in-95">
                    {projectDetails.isLoading ? (
                      <div className="flex items-center gap-2 text-slate-500 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Carregando
                        detalhes do projeto...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                        <div>
                          <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">
                            Nome do Projeto
                          </p>
                          <p className="font-medium text-slate-900">
                            {projectDetails.nome || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">
                            Empresa
                          </p>
                          <p
                            className={
                              projectDetails.empresaMissing
                                ? 'font-medium text-amber-700'
                                : 'font-medium text-slate-900'
                            }
                          >
                            {projectDetails.empresa_nome}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">
                            Cliente
                          </p>
                          <p
                            className={
                              projectDetails.clienteMissing
                                ? 'font-medium text-amber-700'
                                : 'font-medium text-slate-900'
                            }
                          >
                            {projectDetails.cliente_nome}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">
                            Arquiteto
                          </p>
                          <p className="font-medium text-slate-900">
                            {projectDetails.arquiteto_nome}
                          </p>
                          {projectDetails.arquitetoAutoLinked && (
                            <p className="text-[10px] text-emerald-700 mt-0.5">
                              Vinculado automaticamente pelo nome do projeto —
                              confira antes de salvar.
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">
                            Responsável do Projeto
                          </p>
                          <p className="font-medium text-slate-900">
                            {projectDetails.responsavel_nome}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-[10px] font-bold uppercase mb-0.5">
                            Responsável (Sistema)
                          </p>
                          <p className="font-medium text-slate-900">
                            {projectDetails.responsavel_sistema_nome}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <div>
                    <span
                      className={`inline-flex items-center h-7 px-3 rounded-full border text-xs font-medium ${getStatusBadgeClass(
                        isEditing ? form.watch('status') : 'rascunho',
                      )}`}
                    >
                      {isEditing
                        ? getStatusLabel(form.watch('status'))
                        : 'Rascunho'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    O status é definido automaticamente pelas ações do fluxo
                    (enviar, aprovar, recusar) e não pode ser editado
                    diretamente.
                  </p>
                </FormItem>

                <FormField
                  control={form.control}
                  name="cliente_id"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>
                        Cliente <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex gap-2 items-center">
                          <div className="flex-1">
                            <SearchableSelect
                              options={clientes.map((c) => {
                                // SPEC-068: combina Razão Social + Nome
                                // Completo/Fantasia; nunca mostra código de
                                // projeto ou outro identificador interno.
                                const razaoSocial = (
                                  c as any
                                ).razao_social?.trim()
                                const label =
                                  razaoSocial && razaoSocial !== c.nome
                                    ? `${razaoSocial} - ${c.nome}`
                                    : c.nome
                                return {
                                  value: c.id,
                                  label,
                                  searchTerms: [
                                    (c as any).razao_social,
                                    c.nome,
                                    c.nome_empresa,
                                  ].filter(Boolean) as string[],
                                }
                              })}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Selecione um cliente..."
                              searchPlaceholder="Buscar cliente..."
                              emptyText="Nenhum cliente encontrado."
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setIsClientModalOpen(true)}
                            title="Criar Novo Cliente"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arquitetos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arquiteto / Profissional</FormLabel>
                      <FormControl>
                        <ArchitectSplitPicker
                          value={field.value}
                          onChange={field.onChange}
                          options={arquitetos}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendedor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendedor</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={[
                            { value: 'none', label: 'Nenhum' },
                            ...sortedVendedores.map((v) => ({
                              value: v.id,
                              label: v.nome,
                            })),
                            ...(field.value &&
                            field.value !== 'none' &&
                            !sortedVendedores.some(
                              (v) => v.id === field.value,
                            ) &&
                            assignedVendedorNome
                              ? [
                                  {
                                    value: field.value,
                                    label: assignedVendedorNome,
                                  },
                                ]
                              : []),
                          ]}
                          value={field.value || 'none'}
                          onChange={field.onChange}
                          placeholder="Nenhum"
                          searchPlaceholder="Buscar vendedor..."
                          emptyText="Nenhum vendedor encontrado."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_emissao"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Emissão</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: ptBR })
                              ) : (
                                <span>Selecione</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validade"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center justify-between gap-2">
                        <span>Validade</span>
                        {/* SPEC-095: padrão é emissão + 10 dias; permanece
                            editável manualmente por cima do valor calculado. */}
                        <button
                          type="button"
                          className="text-xs font-normal text-primary hover:underline"
                          onClick={() => {
                            validadeEditadaManualmenteRef.current = false
                            const emissao = form.getValues('data_emissao')
                            if (emissao) field.onChange(addDays(emissao, 10))
                          }}
                        >
                          Usar padrão (10 dias)
                        </button>
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: ptBR })
                              ) : (
                                <span>Selecione</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={(d) => {
                              validadeEditadaManualmenteRef.current = true
                              field.onChange(d)
                            }}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Itens do Orçamento</CardTitle>
                <CardDescription>
                  Produtos e quantidades que compõem o orçamento.
                </CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                {naturezaOperacao === 'devolucao' ? (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setIsDevolucaoSearchOpen(true)}
                  >
                    <Undo2 className="w-4 h-4 mr-2" /> Buscar Venda de Origem
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      disabled={!canEditValorProduto}
                      title={
                        canEditValorProduto
                          ? undefined
                          : 'Só administrador pode adicionar produto a um orçamento já existente'
                      }
                      onClick={() => {
                        setProductSearchRowIndex(null)
                        setIsProductSearchOpen(true)
                      }}
                    >
                      <PackageSearch className="w-4 h-4 mr-2" /> Buscar Produtos
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!canEditValorProduto}
                      title={
                        canEditValorProduto
                          ? undefined
                          : 'Só administrador pode adicionar produto a um orçamento já existente'
                      }
                      onClick={() => {
                        setMultiLProduct(null)
                        setIsMultiLDialogOpen(true)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Adicionar Item não
                      Cadastrado
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {fields.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed rounded-lg bg-gray-50/50">
                  <p className="text-gray-500 mb-2 font-medium">
                    Nenhum item adicionado
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Adicione produtos para compor este orçamento.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {naturezaOperacao === 'devolucao' ? (
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => setIsDevolucaoSearchOpen(true)}
                      >
                        <Undo2 className="w-4 h-4 mr-2" /> Buscar Venda de
                        Origem
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="default"
                          disabled={!canEditValorProduto}
                          title={
                            canEditValorProduto
                              ? undefined
                              : 'Só administrador pode adicionar produto a um orçamento já existente'
                          }
                          onClick={() => {
                            setProductSearchRowIndex(null)
                            setIsProductSearchOpen(true)
                          }}
                        >
                          <PackageSearch className="w-4 h-4 mr-2" /> Buscar
                          Produtos
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={!canEditValorProduto}
                          title={
                            canEditValorProduto
                              ? undefined
                              : 'Só administrador pode adicionar produto a um orçamento já existente'
                          }
                          onClick={() => {
                            setMultiLProduct(null)
                            setIsMultiLDialogOpen(true)
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Adicionar Item não
                          Cadastrado
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {fields.length > 0 && <BudgetItemsHeader />}

              <div className="space-y-4">
                {fields.map((field, index) => {
                  return (
                    <BudgetItemCard
                      key={field.uid || field.id || `item-${index}`}
                      index={index}
                      fieldId={field.uid || field.id || `item-${index}`}
                      onRemove={remove}
                      onSearchProduct={(idx) => {
                        setProductSearchRowIndex(idx)
                        setIsProductSearchOpen(true)
                      }}
                      onCreateProduct={(idx) => {
                        setProductCreateTarget({ index: idx })
                        setIsProductCreateOpen(true)
                      }}
                      getProductInfo={getProductInfo}
                      canEditValorProduto={canEditValorProduto}
                    />
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagamento e Totais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="forma_pagamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forma de Pagamento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value || undefined}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a forma de pagamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="pix">Pix</SelectItem>
                            <SelectItem value="cartao">Cartão</SelectItem>
                            <SelectItem value="boleto">Boleto</SelectItem>
                            {/* SPEC-107: cheque/transferência já existiam no
                                banco, nunca tinham sido liberados aqui;
                                permuta é novo. */}
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="transferencia">
                              Transferência
                            </SelectItem>
                            <SelectItem value="permuta">Permuta</SelectItem>
                            {/* SPEC-152: parcela recebida sem gerar boleto
                                (aparece em relatórios de saldo em aberto). */}
                            <SelectItem value="carteira">Carteira</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {FORMAS_PAGAMENTO_PARCELAVEIS(
                    form.watch('forma_pagamento'),
                  ) && (
                    <FormField
                      control={form.control}
                      name="parcelas"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-top-2">
                          <FormLabel>Quantidade de Parcelas</FormLabel>
                          <FormControl>
                            {/* SPEC-152 (Bug 1): não normaliza pra número a
                                cada tecla -- deixa o valor "em edição" (que
                                pode ser '' momentaneamente) passar direto
                                pro form; o zod (z.preprocess) normaliza no
                                submit/revalidação, e onBlur também corrige
                                pra sempre deixar um inteiro >=1 visível. */}
                            <Input
                              type="number"
                              min="1"
                              max="120"
                              step="1"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              onBlur={() => {
                                field.onChange(
                                  normalizarQtdParcelas(field.value),
                                )
                                field.onBlur()
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="data_inicio_pagamento"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          Data de Início do Pagamento{' '}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground',
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP', { locale: ptBR })
                                ) : (
                                  <span>Selecione a data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                              locale={ptBR}
                            />
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs text-muted-foreground">
                          Vencimento da 1ª parcela. Confirme com o
                          e-mail/negociação do cliente, como no fluxo do
                          Connect.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(() => {
                    const totalParcelas = totalParcelasAtual
                    const dataInicio = form.watch('data_inicio_pagamento') as
                      | Date
                      | undefined
                    if (!dataInicio || totalParcelas < 2) return null
                    const overrides = form.watch('parcelas_datas') || []
                    return (
                      <div className="md:col-span-2 space-y-3 rounded-lg border p-4 animate-in fade-in slide-in-from-top-2">
                        <p className="text-sm font-medium">
                          Vencimentos das demais parcelas
                        </p>
                        <p className="text-xs text-muted-foreground -mt-2">
                          Por padrão, cada parcela vence 1 mês após a anterior.
                          Edite individualmente se a negociação com o cliente
                          definiu datas diferentes.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {Array.from(
                            { length: totalParcelas - 1 },
                            (_, idx) => idx,
                          ).map((idx) => {
                            const override = overrides[idx]
                            const valor = override
                              ? new Date(override)
                              : addMonths(dataInicio, idx + 1)
                            const isOverride = !!override
                            return (
                              <div key={idx} className="space-y-1">
                                <label className="text-xs text-muted-foreground">
                                  Parcela {idx + 2}
                                </label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      className={cn(
                                        'w-full pl-3 text-left font-normal',
                                        !isOverride && 'text-muted-foreground',
                                      )}
                                    >
                                      {format(valor, 'dd/MM/yyyy', {
                                        locale: ptBR,
                                      })}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
                                    <Calendar
                                      mode="single"
                                      selected={valor}
                                      onSelect={(date) => {
                                        const next = [...overrides]
                                        next[idx] = date ?? null
                                        form.setValue('parcelas_datas', next, {
                                          shouldValidate: true,
                                          shouldDirty: true,
                                        })
                                      }}
                                      disabled={(date) => date < dataInicio}
                                      initialFocus
                                      locale={ptBR}
                                    />
                                  </PopoverContent>
                                </Popover>
                                {isOverride && (
                                  <button
                                    type="button"
                                    className="text-xs text-primary underline"
                                    onClick={() => {
                                      const next = [...overrides]
                                      next[idx] = null
                                      form.setValue('parcelas_datas', next, {
                                        shouldValidate: true,
                                        shouldDirty: true,
                                      })
                                    }}
                                  >
                                    Usar padrão (1 mês)
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}

                  {/* SPEC-152 (item 7): valor/forma de pagamento/fornecedor
                      de permuta por parcela -- alimenta orcamentos.plano_parcelas.
                      Soma precisa bater exatamente com o valor a pagar (regra
                      dura, decisão do usuário 2026-09-17). */}
                  {(() => {
                    const dataInicio = form.watch('data_inicio_pagamento') as
                      | Date
                      | undefined
                    if (!dataInicio) return null
                    const overrides = form.watch('parcelas_datas') || []
                    const datas = Array.from(
                      { length: totalParcelasAtual },
                      (_, i) => {
                        if (i === 0) return dataInicio
                        const override = overrides[i - 1]
                        return override
                          ? new Date(override)
                          : addMonths(dataInicio, i)
                      },
                    )
                    const somaParcelas =
                      Math.round(
                        parcelasConfigWatch.reduce((acc: number, p: any) => {
                          const raw = p?.valor
                          const n =
                            raw === '' || raw === undefined ? NaN : Number(raw)
                          return acc + (Number.isFinite(n) ? n : 0)
                        }, 0) * 100,
                      ) / 100
                    const valorTotalArred = Math.round(valorTotal * 100) / 100
                    const bateSoma =
                      Math.abs(somaParcelas - valorTotalArred) < 0.01
                    // SPEC-155 (Bug 2): mesma checagem do onSubmit (linha
                    // ~1467), só pra decidir se mostra o aviso consolidado
                    // abaixo -- a validação que de fato bloqueia salvar
                    // continua sendo a do onSubmit.
                    const faltaFornecedorPermuta = datas.some((_, i) => {
                      const linha = parcelasConfigWatch[i] || {}
                      const forma =
                        linha.forma_pagamento ||
                        form.watch('forma_pagamento') ||
                        'boleto'
                      return forma === 'permuta' && !linha.permuta_fornecedor_id
                    })
                    const formatCurrency = (v: number) =>
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(v)
                    return (
                      <div className="md:col-span-2 space-y-3 rounded-lg border p-4 animate-in fade-in slide-in-from-top-2">
                        <p className="text-sm font-medium">Plano de Parcelas</p>
                        <p className="text-xs text-muted-foreground -mt-2">
                          Valor, forma de pagamento e (se for permuta)
                          fornecedor de cada parcela. A soma precisa bater
                          exatamente com o valor a pagar.
                        </p>
                        <div className="space-y-2">
                          {datas.map((data, idx) => {
                            const linha = parcelasConfigWatch[idx] || {}
                            const formaLinha =
                              linha.forma_pagamento ||
                              form.watch('forma_pagamento') ||
                              'boleto'
                            return (
                              <div
                                key={idx}
                                className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center rounded-md border p-2"
                              >
                                <div className="text-xs text-muted-foreground min-w-[110px]">
                                  <span className="font-medium text-foreground">
                                    Parcela {idx + 1}
                                  </span>
                                  <br />
                                  {format(data, 'dd/MM/yyyy', { locale: ptBR })}
                                </div>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="Valor"
                                  value={linha.valor ?? ''}
                                  onChange={(e) => {
                                    parcelasConfigTouchedRef.current = true
                                    const next = [...parcelasConfigWatch]
                                    next[idx] = {
                                      ...(next[idx] || {}),
                                      valor: e.target.value,
                                    }
                                    form.setValue('parcelas_config', next, {
                                      shouldDirty: true,
                                    })
                                  }}
                                />
                                <Select
                                  value={formaLinha}
                                  onValueChange={(v) => {
                                    parcelasConfigTouchedRef.current = true
                                    const next = [...parcelasConfigWatch]
                                    next[idx] = {
                                      ...(next[idx] || {}),
                                      forma_pagamento: v,
                                      permuta_fornecedor_id:
                                        v === 'permuta'
                                          ? next[idx]?.permuta_fornecedor_id
                                          : null,
                                    }
                                    form.setValue('parcelas_config', next, {
                                      shouldDirty: true,
                                    })
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Forma de pagamento" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(FORMA_PAGAMENTO_LABELS).map(
                                      ([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                          {label}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                                {formaLinha === 'permuta' ? (
                                  <div className="space-y-1">
                                    <Select
                                      value={linha.permuta_fornecedor_id || ''}
                                      onValueChange={(v) => {
                                        parcelasConfigTouchedRef.current = true
                                        const next = [...parcelasConfigWatch]
                                        next[idx] = {
                                          ...(next[idx] || {}),
                                          permuta_fornecedor_id: v,
                                        }
                                        form.setValue('parcelas_config', next, {
                                          shouldDirty: true,
                                        })
                                      }}
                                    >
                                      {/* SPEC-155 (Bug 2): a validação de
                                          fornecedor obrigatório pra permuta já
                                          existia no submit e no backend, mas
                                          o campo não indicava isso
                                          visualmente — usuário só descobria
                                          na aprovação financeira, já tarde
                                          pra corrigir sem sair da tela.
                                          Borda vermelha + aviso inline
                                          assim que "Permuta" é selecionado
                                          sem fornecedor. */}
                                      <SelectTrigger
                                        className={cn(
                                          !linha.permuta_fornecedor_id &&
                                            'border-red-500 focus:ring-red-500',
                                        )}
                                      >
                                        <SelectValue placeholder="Fornecedor da permuta *" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {fornecedoresPermuta.map((f) => (
                                          <SelectItem key={f.id} value={f.id}>
                                            {f.nome}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {!linha.permuta_fornecedor_id && (
                                      <p className="text-xs text-red-600">
                                        Obrigatório para permuta — sem isso o
                                        orçamento não pode ser aprovado.
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div />
                                )}
                              </div>
                            )
                          })}
                        </div>
                        <div
                          className={cn(
                            'text-sm font-medium rounded-md px-3 py-2',
                            bateSoma
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700',
                          )}
                        >
                          Soma das parcelas: {formatCurrency(somaParcelas)} /{' '}
                          {formatCurrency(valorTotalArred)}
                          {!bateSoma &&
                            ' — precisa bater exatamente para salvar.'}
                        </div>
                        {faltaFornecedorPermuta && (
                          <div className="text-sm font-medium rounded-md px-3 py-2 bg-red-50 text-red-700">
                            Selecione o fornecedor em toda parcela marcada
                            como Permuta — precisa disso para salvar e para
                            aprovar financeiramente.
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  <FormField
                    control={form.control}
                    name="frete_tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frete</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            field.onChange(val)
                            if (val === 'sem_frete') {
                              form.setValue('frete_valor', 0)
                            }
                          }}
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o frete" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="sem_frete">Sem Frete</SelectItem>
                            <SelectItem value="com_frete">Com Frete</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Confirme se a condição negociada é "Com Frete" ou "Sem
                          Frete", como no fluxo do Connect, para evitar
                          divergência na nota fiscal.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('frete_tipo') === 'com_frete' && (
                    <FormField
                      control={form.control}
                      name="frete_valor"
                      render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-top-2">
                          <FormLabel>Valor do Frete</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormItem>
                    <FormLabel>Desconto Global</FormLabel>
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="desconto_tipo"
                        render={({ field }) => (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || 'percentual'}
                          >
                            <FormControl>
                              <SelectTrigger className="w-28 shrink-0">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentual">%</SelectItem>
                              <SelectItem value="valor">R$</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="desconto_global"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={
                                    descontoTipo === 'percentual'
                                      ? 100
                                      : undefined
                                  }
                                  placeholder="0"
                                  className="pr-8"
                                  {...field}
                                  value={field.value === 0 ? '' : field.value}
                                  onChange={(e) =>
                                    field.onChange(Number(e.target.value) || 0)
                                  }
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                  {descontoTipo === 'percentual' ? '%' : 'R$'}
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {descontoTipo === 'percentual'
                        ? `Equivale a ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(descontoValorReais)}.`
                        : `Equivale a ${descontoPercentualEquivalente.toFixed(2)}%.`}{' '}
                      Aplicado sobre o subtotal já descontado o sinal.
                    </p>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="valor_sinal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sinal (R$)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0"
                              className="pr-8"
                              {...field}
                              value={field.value === 0 ? '' : field.value}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value) || 0)
                              }
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                              R$
                            </span>
                          </div>
                        </FormControl>
                        <p className="text-xs text-gray-500 mt-1">
                          Valor fixo. Deduzido do subtotal antes do desconto —
                          reduz o Valor Total e, consequentemente, as parcelas
                          geradas na aprovação financeira.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Notas ou observações adicionais..."
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-6 flex flex-col justify-end h-full border">
                  {/* SPEC-110: ordem exibida segue a mesma ordem dos campos
                      editáveis ao lado (Desconto Global, depois Sinal) —
                      antes o resumo mostrava Sinal antes de Desconto
                      (SPEC-078, seguindo a ordem do CÁLCULO), inconsistente
                      com a ordem dos campos e apontado como confuso pelo
                      usuário. O cálculo em si (sinal deduzido antes do
                      desconto) não muda, só a ordem de exibição das linhas. */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Subtotal dos itens</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(
                          getDisplayValorTotal(valorSubtotal, naturezaOperacao),
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>
                        Desconto global (
                        {descontoTipo === 'percentual'
                          ? `${descontoGlobalPerc}%`
                          : `${descontoPercentualEquivalente.toFixed(2)}%`}
                        )
                      </span>
                      <span className="font-medium text-red-600">
                        -
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(descontoValorReais)}
                      </span>
                    </div>
                    {valorSinal > 0 && (
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Sinal</span>
                        <span className="font-medium text-amber-700">
                          -
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(valorSinal)}
                        </span>
                      </div>
                    )}
                    {freteTipo === 'com_frete' && freteValor > 0 && (
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Frete</span>
                        <span className="font-medium text-blue-600">
                          +
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(freteValor)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-gray-900 font-semibold">
                        Valor Total
                      </span>
                      <span className="text-3xl font-bold text-primary">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(
                          getDisplayValorTotal(valorTotal, naturezaOperacao),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <ProjectCreateModal
            open={isProjectModalOpen}
            onOpenChange={setIsProjectModalOpen}
            onSuccess={async (newProj: any) => {
              if (fetchProjetos) await fetchProjetos()
              form.setValue('projeto_codigo', newProj.codigo, {
                shouldValidate: true,
              })
              handleProjectSelect(newProj.codigo)
            }}
            clientes={clientes}
            arquitetos={arquitetos}
            onClienteCriado={(newClient: any) => {
              // SPEC-152: cliente criado de dentro de "Criar Projeto" --
              // mesmo tratamento do ClientCreateModal de nível superior
              // (SPEC-078 Bug 2): injeta local + reconcilia com o servidor.
              setClientes((prev: any[]) => [
                newClient,
                ...prev.filter((c) => c.id !== newClient.id),
              ])
              if (fetchClientes) fetchClientes()
            }}
          />

          <ClientCreateModal
            open={isClientModalOpen}
            onOpenChange={setIsClientModalOpen}
            onSuccess={async (newClient: any) => {
              // SPEC-078 (Bug 2): injeta o cliente novo direto no state
              // local, sem depender do round-trip de fetchClientes() pra
              // aparecer no combobox — elimina qualquer corrida entre a
              // criação e o refetch. fetchClientes() ainda roda em paralelo
              // pra reconciliar com o servidor (codigo_legado etc.).
              setClientes((prev: any[]) => [
                newClient,
                ...prev.filter((c) => c.id !== newClient.id),
              ])
              form.setValue('cliente_id', newClient.id, {
                shouldValidate: true,
              })
              if (fetchClientes) fetchClientes()
              // SPEC-050 (P-2): retoma o import de XML pendente com o
              // cliente recém-cadastrado.
              if (pendingXmlImport) {
                applyResolvedXmlImport(pendingXmlImport, newClient.id)
                setPendingXmlImport(null)
              }
            }}
          />

          <ProductSearchModal
            open={isProductSearchOpen}
            onOpenChange={(v) => {
              setIsProductSearchOpen(v)
              if (!v) setProductSearchRowIndex(null)
            }}
            onConfirm={handleProductSearchConfirm}
            onProductCreated={(product) => updateProductMeta([product])}
          />

          <MultiLAddDialog
            open={isMultiLDialogOpen}
            onOpenChange={(v) => {
              setIsMultiLDialogOpen(v)
              if (!v) setMultiLProduct(null)
            }}
            produtoNome={multiLProduct?.nome}
            produtoPreco={
              multiLProduct?.preco_venda || multiLProduct?.valor_venda || 0
            }
            proximoL={getProximoL()}
            onConfirm={handleMultiLConfirm}
          />

          <DevolucaoItemSearchModal
            open={isDevolucaoSearchOpen}
            onOpenChange={setIsDevolucaoSearchOpen}
            clienteId={clienteIdAtual}
            // SPEC-105: em criação vem de handleProjectSelect
            // (projectDetails.id); em edição, o projeto já veio carregado
            // com o orçamento (budgetToEdit.projeto_id) e handleProjectSelect
            // nunca dispara sozinho.
            projetoId={projectDetails?.id || budgetToEdit?.projeto_id}
            onConfirm={applyDevolucaoSelection}
          />

          <ProductCreateModal
            open={isProductCreateOpen}
            onOpenChange={(v) => {
              setIsProductCreateOpen(v)
              if (!v) setProductCreateTarget(null)
            }}
            initialName={
              productCreateTarget?.index != null
                ? form.getValues(
                    `itens.${productCreateTarget.index}.descricao`,
                  ) ||
                  form.getValues(
                    `itens.${productCreateTarget.index}.custom_id`,
                  ) ||
                  ''
                : ''
            }
            onSuccess={handleProductCreateConfirm}
          />

          <BatchPdfImport
            open={isBatchImportOpen}
            onOpenChange={setIsBatchImportOpen}
            onBatchComplete={handleBatchComplete}
          />

          <ImportConnectXmlModal
            open={isXmlImportOpen}
            onOpenChange={setIsXmlImportOpen}
            empresas={empresas}
            clientes={clientes}
            produtos={produtos}
            onApply={handleXmlImportApply}
            onClienteNaoEncontrado={handleXmlImportNeedsClient}
          />

          <div className="flex justify-end gap-2 mt-6 flex-wrap">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsXmlImportOpen(true)}
              className="w-full sm:w-auto"
            >
              <FileCode className="w-4 h-4 mr-2" />
              Importar XML (Connect)
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsBatchImportOpen(true)}
              className="w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar PDFs
            </Button>
          </div>
        </form>
      </Form>

      {budgetToEdit && (
        <FinancialApprovalDialog
          budget={budgetToEdit}
          open={showApprovalDialog}
          onOpenChange={setShowApprovalDialog}
          onConfirm={handleFinancialApproval}
        />
      )}

      {budgetToEdit && (
        <FinanceResultModal
          budget={budgetToEdit}
          result={approvalResult}
          open={!!approvalResult}
          onOpenChange={(open) => {
            if (!open) setApprovalResult(null)
          }}
        />
      )}

      <GerenciamentoDialog
        open={gerenciamentoOpen}
        onOpenChange={setGerenciamentoOpen}
        itens={form.watch('itens')}
        produtoNomes={produtoNomesMap}
        descontoAtual={form.watch('desconto_global') || 0}
        descontoTipo={form.watch('desconto_tipo') || 'percentual'}
        onAplicarDesconto={(pct) => {
          form.setValue('desconto_tipo', 'percentual', { shouldDirty: true })
          form.setValue('desconto_global', pct, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }}
      />
    </div>
  )
}
