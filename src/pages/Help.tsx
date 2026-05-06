import { Link } from 'react-router-dom'
import {
  LifeBuoy,
  LayoutDashboard,
  Calculator,
  Wallet,
  Filter,
  MessageCircle,
  ArrowLeft,
  Mail,
  ShieldCheck,
  FileText,
  BarChart3,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const Help = () => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-primary" />
            Central de Ajuda
          </h1>
          <p className="text-gray-500">
            Aprenda a usar o Finova e tire suas dúvidas.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
          <TabsTrigger value="dashboard" className="py-2">
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="transactions" className="py-2">
            <Wallet className="w-4 h-4 mr-2" />
            Transações
          </TabsTrigger>
          <TabsTrigger value="filters" className="py-2">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </TabsTrigger>
          <TabsTrigger value="faq" className="py-2">
            <MessageCircle className="w-4 h-4 mr-2" />
            FAQ
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4 mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-500" />
                  Indicadores Financeiros (KPIs)
                </CardTitle>
                <CardDescription>
                  Entenda os números principais do seu painel.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Saldo Total</h4>
                  <p className="text-sm text-gray-600">
                    É a soma de todas as suas receitas menos todas as suas
                    despesas registradas. Representa o quanto você tem
                    acumulado.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    Receita e Despesa Mensal
                  </h4>
                  <p className="text-sm text-gray-600">
                    O total ganho e gasto no mês atual. Comparado com o mês
                    anterior para mostrar tendências.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Eficiência</h4>
                  <p className="text-sm text-gray-600">
                    Calculada como a porcentagem da receita que sobra após as
                    despesas.
                    <br />
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                      ((Receita - Despesa) / Receita) * 100
                    </code>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  Gráficos e Visualizações
                </CardTitle>
                <CardDescription>
                  Como interpretar as visualizações de dados.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    Desempenho Financeiro
                  </h4>
                  <p className="text-sm text-gray-600">
                    O gráfico de barras mostra a comparação diária entre
                    receitas (azul) e despesas (cinza) no mês atual.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">
                    Distribuição de Gastos
                  </h4>
                  <p className="text-sm text-gray-600">
                    Visualize quais categorias consomem mais do seu orçamento e
                    quais formas de pagamento são mais utilizadas.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Transações</CardTitle>
              <CardDescription>
                Passo a passo para manter seus registros atualizados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                      1
                    </span>
                    Criar Transação
                  </h3>
                  <p className="text-sm text-gray-600">
                    Na página de Transações, clique no botão{' '}
                    <strong>"Nova Transação"</strong>. Preencha os campos
                    obrigatórios:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 ml-2 space-y-1">
                    <li>
                      <strong>Descrição:</strong> Nome para identificar a
                      transação.
                    </li>
                    <li>
                      <strong>Valor:</strong> O montante financeiro.
                    </li>
                    <li>
                      <strong>Tipo:</strong> Receita (entrada) ou Despesa
                      (saída).
                    </li>
                    <li>
                      <strong>Categoria:</strong> Classificação do gasto/ganho.
                    </li>
                    <li>
                      <strong>Forma de Pagamento:</strong> Método utilizado.
                    </li>
                    <li>
                      <strong>Data:</strong> Quando ocorreu a transação.
                    </li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                      2
                    </span>
                    Editar e Excluir
                  </h3>
                  <p className="text-sm text-gray-600">
                    Na tabela de transações, você encontrará botões de ação à
                    direita de cada linha:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 ml-2 space-y-1">
                    <li>
                      Use o ícone de <strong>Lápis</strong> para abrir o
                      formulário de edição.
                    </li>
                    <li>
                      Use o ícone de <strong>Lixeira</strong> para remover
                      permanentemente um registro.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="font-semibold text-sm mb-2">
                  Categorias e Formas de Pagamento
                </h4>
                <p className="text-sm text-gray-600">
                  Categorizar corretamente suas transações é essencial para que
                  os gráficos do Dashboard funcionem. Oferecemos diversas formas
                  de pagamento como PIX, Cartão de Crédito/Débito e
                  Transferência para melhor controle do fluxo de caixa.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filters Tab */}
        <TabsContent value="filters" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Filtros e Busca</CardTitle>
              <CardDescription>
                Como encontrar transações específicas rapidamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Barra de Busca</h4>
                  <p className="text-sm text-gray-600">
                    Digite qualquer parte da descrição da transação no campo de
                    busca para filtrar a lista em tempo real.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Filtros Avançados</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2">
                      <span className="font-medium text-gray-900">
                        Por Data:
                      </span>
                      Selecione um intervalo de datas para ver transações de um
                      período específico.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium text-gray-900">
                        Por Tipo:
                      </span>
                      Alterne entre visualizar apenas Receitas, Despesas ou
                      Ambos.
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium text-gray-900">
                        Por Categoria:
                      </span>
                      Isole gastos de uma categoria específica (ex: Taxas, TI).
                    </li>
                    <li className="flex gap-2">
                      <span className="font-medium text-gray-900">
                        Forma de Pagamento:
                      </span>
                      Veja quanto gastou especificamente no Cartão ou PIX, por
                      exemplo.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Perguntas Frequentes (FAQ)</CardTitle>
              <CardDescription>
                Respostas para as dúvidas mais comuns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    Meus dados financeiros estão seguros?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex gap-3 items-start">
                      <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        Sim. Utilizamos autenticação segura e proteção no banco
                        de dados. Isso significa que suas transações são
                        privadas e visíveis <strong>apenas para você</strong>{' '}
                        quando está logado.
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    Como os saldos são calculados?
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex gap-3 items-start">
                      <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        Todos os cálculos são feitos em tempo real baseados
                        diretamente na tabela de transações do banco de dados.
                        Nenhuma estimativa é usada; o que você vê reflete
                        exatamente o que foi cadastrado.
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    Posso exportar meus dados?
                  </AccordionTrigger>
                  <AccordionContent>
                    Atualmente a função de exportação direta (CSV/PDF) está em
                    desenvolvimento. Você pode visualizar todo o histórico na
                    tabela de transações.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>
                    Como reportar um problema (bug)?
                  </AccordionTrigger>
                  <AccordionContent>
                    Se encontrar algum erro ou tiver dificuldades técnicas, por
                    favor utilize a seção de Suporte Técnico abaixo para entrar
                    em contato com nossa equipe.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Technical Support Section */}
          <Card className="bg-blue-50 border-blue-100">
            <CardHeader>
              <CardTitle className="text-blue-900">Suporte Técnico</CardTitle>
              <CardDescription className="text-blue-700">
                Precisa de mais ajuda? Entre em contato.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-full shadow-sm">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Email de Suporte
                  </p>
                  <a
                    href="mailto:suporte@finova.com"
                    className="text-blue-600 hover:underline font-bold"
                  >
                    suporte@finova.com
                  </a>
                  <p className="text-xs text-blue-700 mt-1">
                    Tempo médio de resposta: 24 horas úteis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Help
