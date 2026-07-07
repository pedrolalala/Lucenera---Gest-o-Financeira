import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
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
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

const clientSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo_pessoa: z.enum(['fisica', 'juridica']).default('fisica'),
  cpf_cnpj: z.string().optional(),
  rg: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2, 'Máximo 2 caracteres').optional(),
  email_financeiro: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  razao_social: z.string().optional(),
})

function formatCpfCnpj(value: string, tipo: 'fisica' | 'juridica') {
  const digits = value.replace(/\D/g, '')
  if (tipo === 'fisica') {
    return digits
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  } else {
    return digits
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }
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

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nome: '',
      tipo_pessoa: 'fisica',
      cpf_cnpj: '',
      rg: '',
      email: '',
      telefone: '',
      celular: '',
      cep: '',
      endereco: '',
      bairro: '',
      cidade: '',
      estado: '',
      email_financeiro: '',
      razao_social: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])

  const watchTipoPessoa = form.watch('tipo_pessoa')

  async function onSubmit(values: z.infer<typeof clientSchema>) {
    try {
      setIsSubmitting(true)

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
          setIsSubmitting(false)
          return
        }
      }

      const payload = {
        tipo: 'cliente' as const,
        ativo: true,
        nao_residente: false,
        nome: values.nome,
        tipo_pessoa: values.tipo_pessoa,
        cpf_cnpj: values.cpf_cnpj || null,
        rg: values.rg || null,
        email: values.email || null,
        telefone: values.telefone || null,
        celular: values.celular || null,
        cep: values.cep || null,
        endereco: values.endereco || null,
        bairro: values.bairro || null,
        cidade: values.cidade || null,
        estado: values.estado?.toUpperCase() || null,
        email_financeiro: values.email_financeiro || null,
        razao_social: values.razao_social || null,
      }

      const { data, error } = await supabase
        .from('contatos')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      toast.success('Cliente cadastrado com sucesso!')
      onSuccess(data)
      onOpenChange(false)
    } catch (error: any) {
      toast.error('Erro ao cadastrar cliente: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Cliente</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para cadastrar um novo cliente.
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
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
                    Informações Principais
                  </h3>

                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
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
                </div>

                <FormField
                  control={form.control}
                  name="tipo_pessoa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Pessoa</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val)
                          form.setValue('cpf_cnpj', '')
                        }}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
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
                          onChange={(e) => {
                            const formatted = formatCpfCnpj(
                              e.target.value,
                              watchTipoPessoa,
                            )
                            field.onChange(formatted)
                          }}
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

                <div className="md:col-span-2 space-y-4 pt-4">
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

                <div className="md:col-span-2 space-y-4 pt-4">
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
                          {...field}
                          maxLength={9}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '')
                            field.onChange(val.replace(/(\d{5})(\d)/, '$1-$2'))
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
                    <FormItem className="md:col-span-2">
                      <FormLabel>Endereço Completo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Rua, Número, Complemento..."
                          {...field}
                        />
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

                <div className="grid grid-cols-2 gap-4">
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
                </div>
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Criar Cliente
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
