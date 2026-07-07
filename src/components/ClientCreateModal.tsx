import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, ShieldAlert } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

const TIPOS = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'arquiteto', label: 'Arquiteto' },
  { value: 'engenheiro', label: 'Engenheiro' },
  { value: 'eletricista', label: 'Eletricista' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'outro', label: 'Outro' },
]

const schema = z.object({
  tipo: z
    .enum([
      'cliente',
      'arquiteto',
      'engenheiro',
      'eletricista',
      'fornecedor',
      'outro',
    ])
    .default('cliente'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo_pessoa: z.enum(['fisica', 'juridica']).default('fisica'),
  cpf_cnpj: z.string().optional(),
  rg: z.string().optional(),
  nome_empresa: z.string().optional(),
  razao_social: z.string().optional(),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  regime_apuracao: z.string().optional(),
  limite_credito: z.coerce.number().min(0).optional(),
  nao_residente: z.boolean().default(false),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  email_financeiro: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  data_nascimento: z.string().optional(),
  especialidade: z.string().optional(),
  observacoes: z.string().optional(),
  vendedor_id: z.string().optional(),
  vendedor_padrao_id: z.string().optional(),
})

function formatCpfCnpj(value: string, tipo: 'fisica' | 'juridica') {
  const d = value.replace(/\D/g, '')
  if (tipo === 'fisica')
    return d
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  return d
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

export function ClientCreateModal({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (client: any) => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [vendedores, setVendedores] = useState<any[]>([])
  const { user, role } = useAuth()

  const AUTHORIZED_ROLES = ['admin', 'gerente', 'operador']
  const isWriteAllowed = AUTHORIZED_ROLES.includes(role || '')

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'cliente',
      nome: '',
      tipo_pessoa: 'fisica',
      cpf_cnpj: '',
      rg: '',
      nome_empresa: '',
      razao_social: '',
      inscricao_estadual: '',
      inscricao_municipal: '',
      regime_apuracao: '',
      limite_credito: undefined,
      nao_residente: false,
      email: '',
      email_financeiro: '',
      telefone: '',
      celular: '',
      cep: '',
      endereco: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      data_nascimento: '',
      especialidade: '',
      observacoes: '',
      vendedor_id: '',
      vendedor_padrao_id: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
      supabase
        .from('usuarios')
        .select('id, nome')
        .then(({ data }) => {
          if (data) setVendedores(data)
        })
    }
  }, [open, form])

  const watchTipoPessoa = form.watch('tipo_pessoa')

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      setIsSubmitting(true)

      if (!isWriteAllowed) {
        toast.error('Você não tem permissão para cadastrar contatos.', {
          description:
            'Apenas administradores, gerentes ou operadores podem cadastrar contatos.',
        })
        setIsSubmitting(false)
        return
      }

      const { data: userData, error: userErr } = await supabase
        .from('usuarios')
        .select('role')
        .eq('id', user?.id || '')
        .single()

      if (userErr || !userData) {
        toast.error('Não foi possível verificar suas permissões.', {
          description: userErr?.message || 'Tente novamente.',
        })
        setIsSubmitting(false)
        return
      }

      if (!AUTHORIZED_ROLES.includes(userData.role)) {
        toast.error('Usuário sem permissão de escrita', {
          description:
            'Seu perfil atual não permite cadastrar contatos. Contate um administrador.',
        })
        setIsSubmitting(false)
        return
      }

      if (values.cpf_cnpj) {
        const { data: existing } = await supabase
          .from('contatos')
          .select('id')
          .eq('cpf_cnpj', values.cpf_cnpj)
          .maybeSingle()
        if (existing) {
          form.setError('cpf_cnpj', {
            message: 'Este CPF/CNPJ já está cadastrado',
          })
          toast.error('Este CPF/CNPJ já está cadastrado no sistema')
          setIsSubmitting(false)
          return
        }
      }

      const tipoValue = values.tipo || 'cliente'

      const payload = {
        tipo: tipoValue,
        ativo: true,
        nao_residente: values.nao_residente,
        nome: values.nome,
        tipo_pessoa: values.tipo_pessoa,
        cpf_cnpj: values.cpf_cnpj || null,
        rg: values.rg || null,
        nome_empresa: values.nome_empresa || null,
        email: values.email || null,
        email_financeiro: values.email_financeiro || null,
        telefone: values.telefone || null,
        celular: values.celular || null,
        cep: values.cep || null,
        endereco: values.endereco || null,
        numero: values.numero || null,
        bairro: values.bairro || null,
        cidade: values.cidade || null,
        estado: values.estado?.toUpperCase() || null,
        razao_social: values.razao_social || null,
        inscricao_estadual: values.inscricao_estadual || null,
        inscricao_municipal: values.inscricao_municipal || null,
        limite_credito: values.limite_credito || null,
        regime_apuracao: values.regime_apuracao || null,
        data_nascimento: values.data_nascimento || null,
        especialidade: values.especialidade || null,
        observacoes: values.observacoes || null,
        vendedor_id: values.vendedor_id || null,
        vendedor_padrao_id: values.vendedor_padrao_id || null,
        created_by: user?.id || null,
      }

      const { data, error } = await supabase
        .from('contatos')
        .insert(payload)
        .select()
        .single()

      if (error !== null) {
        if (
          error.code === '23505' ||
          error.message.includes('uq_contatos_cpf_cnpj') ||
          error.message.includes('codigo_legado')
        ) {
          form.setError('cpf_cnpj', {
            message: 'Este CPF/CNPJ ou Código já está cadastrado.',
          })
          toast.error('Este CPF/CNPJ ou Código já está cadastrado.', {
            description: `[${error.code}] ${error.message}`,
          })
        } else if (
          error.code === '42501' ||
          error.message.toLowerCase().includes('permission') ||
          error.message.toLowerCase().includes('policy')
        ) {
          toast.error('Permissão negada pelo banco de dados.', {
            description: `[${error.code}] ${error.message}`,
          })
        } else {
          toast.error('Erro ao cadastrar contato', {
            description: `[${error.code || 'ERR'}] ${error.message}`,
          })
        }
        setIsSubmitting(false)
        return
      }

      if (data && !error && data.id) {
        toast.success('Contato cadastrado com sucesso!')
        onSuccess(data)
        onOpenChange(false)
      } else {
        toast.error('Falha ao cadastrar contato.', {
          description:
            error?.message ||
            'Nenhum registro foi retornado pelo servidor. Verifique os dados e tente novamente.',
        })
      }
    } catch (error: any) {
      toast.error('Erro ao cadastrar contato', {
        description: error?.message || 'Erro inesperado.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Cliente / Contato</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para cadastrar um novo contato.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.stopPropagation()
              form.handleSubmit(onSubmit)(e)
            }}
            className="space-y-4"
          >
            <ScrollArea className="h-[60vh] px-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
                    Informações Principais
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>
                        Nome Completo / Fantasia{' '}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Contato</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIPOS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tipo_pessoa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Pessoa</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v)
                          form.setValue('cpf_cnpj', '')
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fisica">Pessoa Física</SelectItem>
                          <SelectItem value="juridica">
                            Pessoa Jurídica
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cpf_cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchTipoPessoa === 'fisica' ? 'CPF' : 'CNPJ'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            watchTipoPessoa === 'fisica'
                              ? '000.000.000-00'
                              : '00.000.000/0000-00'
                          }
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              formatCpfCnpj(e.target.value, watchTipoPessoa),
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG / Inscrição Estadual</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nome_empresa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="razao_social"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razão Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
                    Dados Fiscais / Financeiros
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="inscricao_estadual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inscrição Estadual</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="inscricao_municipal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inscrição Municipal</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="regime_apuracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regime de Apuração</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="limite_credito"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limite de Crédito</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nao_residente"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 pt-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Não Residente</FormLabel>
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
                    Contato
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email_financeiro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail Financeiro</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone Fixo</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="celular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
                    Endereço
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00000-000"
                          maxLength={9}
                          {...field}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '')
                            field.onChange(v.replace(/(\d{5})(\d)/, '$1-$2'))
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, Av..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="SP"
                          maxLength={2}
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
                    Dados Adicionais
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="data_nascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="especialidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vendedores.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vendedor_padrao_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendedor Padrão</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vendedores.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notas adicionais..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            {!isWriteAllowed && (
              <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Você não tem permissão para cadastrar contatos.</span>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isWriteAllowed}
                title={
                  !isWriteAllowed
                    ? 'Você não tem permissão para cadastrar contatos.'
                    : undefined
                }
              >
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Criar Contato
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
