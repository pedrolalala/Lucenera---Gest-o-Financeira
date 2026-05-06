// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.4'
  }
  public: {
    Tables: {
      avaliacoes: {
        Row: {
          avaliador_id: string | null
          comentarios: string | null
          created_at: string
          funcionario_id: string
          id: string
          nota: number | null
          periodo: string
        }
        Insert: {
          avaliador_id?: string | null
          comentarios?: string | null
          created_at?: string
          funcionario_id: string
          id?: string
          nota?: number | null
          periodo: string
        }
        Update: {
          avaliador_id?: string | null
          comentarios?: string | null
          created_at?: string
          funcionario_id?: string
          id?: string
          nota?: number | null
          periodo?: string
        }
        Relationships: [
          {
            foreignKeyName: 'avaliacoes_avaliador_id_fkey'
            columns: ['avaliador_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'avaliacoes_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'funcionarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'avaliacoes_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'vw_calculo_vt_mensal'
            referencedColumns: ['funcionario_id']
          },
          {
            foreignKeyName: 'avaliacoes_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'vw_historico_faltas'
            referencedColumns: ['funcionario_id']
          },
        ]
      }
      candidatos: {
        Row: {
          cargo_pretendido: string | null
          created_at: string
          curriculo_url: string | null
          departamento_id: string | null
          email: string | null
          id: string
          nome: string
          observacoes: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cargo_pretendido?: string | null
          created_at?: string
          curriculo_url?: string | null
          departamento_id?: string | null
          email?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cargo_pretendido?: string | null
          created_at?: string
          curriculo_url?: string | null
          departamento_id?: string | null
          email?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'candidatos_departamento_id_fkey'
            columns: ['departamento_id']
            isOneToOne: false
            referencedRelation: 'departamentos'
            referencedColumns: ['id']
          },
        ]
      }
      categorias_financeiras: {
        Row: {
          ativo: boolean
          created_at: string
          grupo: string
          icone: string | null
          id: string
          nome: string
          tipo: Database['public']['Enums']['transacao_tipo']
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          grupo: string
          icone?: string | null
          id?: string
          nome: string
          tipo: Database['public']['Enums']['transacao_tipo']
        }
        Update: {
          ativo?: boolean
          created_at?: string
          grupo?: string
          icone?: string | null
          id?: string
          nome?: string
          tipo?: Database['public']['Enums']['transacao_tipo']
        }
        Relationships: []
      }
      conta_pagar: {
        Row: {
          cod_duplicata: number | null
          cod_empresa: number | null
          cod_pessoa: number | null
          cod_venda: number | null
          created_at: string | null
          data_baixa: string | null
          data_emissao: string | null
          data_pagamento: string | null
          data_ultimo_pagamento: string | null
          data_vencimento: string | null
          desc_apropriacao: string | null
          id: string
          lancamento: number | null
          layout_boleto: number | null
          nome_empresa: string | null
          nome_pessoa: string
          nosso_numero: number | null
          num_nota: string | null
          numero_parcela: number | null
          observacao: string | null
          pago: number | null
          projeto_id: string | null
          status_pagamento:
            | Database['public']['Enums']['status_pagamento']
            | null
          tipo_operacao: Database['public']['Enums']['tipo_operacao'] | null
          tipo_pagamento: string | null
          total_parcelas: number | null
          updated_at: string | null
          valor_desconto: number | null
          valor_duplicata: number
          valor_frete: number | null
          valor_ipi: number | null
          valor_juros: number | null
          valor_pago: number | null
          valor_parcela: number
          valor_st: number | null
          venda_id: string | null
        }
        Insert: {
          cod_duplicata?: number | null
          cod_empresa?: number | null
          cod_pessoa?: number | null
          cod_venda?: number | null
          created_at?: string | null
          data_baixa?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          data_ultimo_pagamento?: string | null
          data_vencimento?: string | null
          desc_apropriacao?: string | null
          id?: string
          lancamento?: number | null
          layout_boleto?: number | null
          nome_empresa?: string | null
          nome_pessoa: string
          nosso_numero?: number | null
          num_nota?: string | null
          numero_parcela?: number | null
          observacao?: string | null
          pago?: number | null
          projeto_id?: string | null
          status_pagamento?:
            | Database['public']['Enums']['status_pagamento']
            | null
          tipo_operacao?: Database['public']['Enums']['tipo_operacao'] | null
          tipo_pagamento?: string | null
          total_parcelas?: number | null
          updated_at?: string | null
          valor_desconto?: number | null
          valor_duplicata?: number
          valor_frete?: number | null
          valor_ipi?: number | null
          valor_juros?: number | null
          valor_pago?: number | null
          valor_parcela?: number
          valor_st?: number | null
          venda_id?: string | null
        }
        Update: {
          cod_duplicata?: number | null
          cod_empresa?: number | null
          cod_pessoa?: number | null
          cod_venda?: number | null
          created_at?: string | null
          data_baixa?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          data_ultimo_pagamento?: string | null
          data_vencimento?: string | null
          desc_apropriacao?: string | null
          id?: string
          lancamento?: number | null
          layout_boleto?: number | null
          nome_empresa?: string | null
          nome_pessoa?: string
          nosso_numero?: number | null
          num_nota?: string | null
          numero_parcela?: number | null
          observacao?: string | null
          pago?: number | null
          projeto_id?: string | null
          status_pagamento?:
            | Database['public']['Enums']['status_pagamento']
            | null
          tipo_operacao?: Database['public']['Enums']['tipo_operacao'] | null
          tipo_pagamento?: string | null
          total_parcelas?: number | null
          updated_at?: string | null
          valor_desconto?: number | null
          valor_duplicata?: number
          valor_frete?: number | null
          valor_ipi?: number | null
          valor_juros?: number | null
          valor_pago?: number | null
          valor_parcela?: number
          valor_st?: number | null
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'conta_pagar_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conta_pagar_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_financeiro_projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conta_pagar_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_pipeline'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conta_pagar_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_resumo'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conta_pagar_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_separacoes_agenda'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'conta_pagar_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'conta_pagar_venda_id_fkey'
            columns: ['venda_id']
            isOneToOne: false
            referencedRelation: 'vendas'
            referencedColumns: ['id']
          },
        ]
      }
      conta_receber: {
        Row: {
          cod_duplicata: number | null
          cod_empresa: number | null
          cod_pessoa: number | null
          cod_venda: number | null
          created_at: string | null
          data_baixa: string | null
          data_emissao: string | null
          data_pagamento: string | null
          data_ultimo_pagamento: string | null
          data_vencimento: string | null
          desc_apropriacao: string | null
          id: string
          lancamento: number | null
          layout_boleto: number | null
          nome_empresa: string | null
          nome_funcionario: string | null
          nome_pessoa: string
          nosso_numero: number | null
          num_nota: string | null
          numero_parcela: number | null
          observacao: string | null
          pago: number | null
          projeto_id: string | null
          status_pagamento:
            | Database['public']['Enums']['status_pagamento']
            | null
          tipo_operacao: Database['public']['Enums']['tipo_operacao'] | null
          tipo_pagamento: string | null
          total_parcelas: number | null
          updated_at: string | null
          valor_desconto: number | null
          valor_duplicata: number
          valor_frete: number | null
          valor_ipi: number | null
          valor_juros: number | null
          valor_pago: number | null
          valor_parcela: number
          valor_st: number | null
          venda_id: string | null
        }
        Insert: {
          cod_duplicata?: number | null
          cod_empresa?: number | null
          cod_pessoa?: number | null
          cod_venda?: number | null
          created_at?: string | null
          data_baixa?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          data_ultimo_pagamento?: string | null
          data_vencimento?: string | null
          desc_apropriacao?: string | null
          id?: string
          lancamento?: number | null
          layout_boleto?: number | null
          nome_empresa?: string | null
          nome_funcionario?: string | null
          nome_pessoa: string
          nosso_numero?: number | null
          num_nota?: string | null
          numero_parcela?: number | null
          observacao?: string | null
          pago?: number | null
          projeto_id?: string | null
          status_pagamento?:
            | Database['public']['Enums']['status_pagamento']
            | null
          tipo_operacao?: Database['public']['Enums']['tipo_operacao'] | null
          tipo_pagamento?: string | null
          total_parcelas?: number | null
          updated_at?: string | null
          valor_desconto?: number | null
          valor_duplicata?: number
          valor_frete?: number | null
          valor_ipi?: number | null
          valor_juros?: number | null
          valor_pago?: number | null
          valor_parcela?: number
          valor_st?: number | null
          venda_id?: string | null
        }
        Update: {
          cod_duplicata?: number | null
          cod_empresa?: number | null
          cod_pessoa?: number | null
          cod_venda?: number | null
          created_at?: string | null
          data_baixa?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          data_ultimo_pagamento?: string | null
          data_vencimento?: string | null
          desc_apropriacao?: string | null
          id?: string
          lancamento?: number | null
          layout_boleto?: number | null
          nome_empresa?: string | null
          nome_funcionario?: string | null
          nome_pessoa?: string
          nosso_numero?: number | null
          num_nota?: string | null
          numero_parcela?: number | null
          observacao?: string | null
          pago?: number | null
          projeto_id?: string | null
          status_pagamento?:
            | Database['public']['Enums']['status_pagamento']
            | null
          tipo_operacao?: Database['public']['Enums']['tipo_operacao'] | null
          tipo_pagamento?: string | null
          total_parcelas?: number | null
          updated_at?: string | null
          valor_desconto?: number | null
          valor_duplicata?: number
          valor_frete?: number | null
          valor_ipi?: number | null
          valor_juros?: number | null
          valor_pago?: number | null
          valor_parcela?: number
          valor_st?: number | null
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'conta_receber_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conta_receber_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_financeiro_projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conta_receber_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_pipeline'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conta_receber_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_resumo'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'conta_receber_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_separacoes_agenda'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'conta_receber_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'conta_receber_venda_id_fkey'
            columns: ['venda_id']
            isOneToOne: false
            referencedRelation: 'vendas'
            referencedColumns: ['id']
          },
        ]
      }
      contas_bancarias: {
        Row: {
          agencia: string | null
          banco: string | null
          conta: string | null
          created_at: string
          id: string
          nome: string
          saldo: number
          status: string
          tipo: Database['public']['Enums']['conta_tipo']
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          conta?: string | null
          created_at?: string
          id?: string
          nome: string
          saldo?: number
          status?: string
          tipo: Database['public']['Enums']['conta_tipo']
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          conta?: string | null
          created_at?: string
          id?: string
          nome?: string
          saldo?: number
          status?: string
          tipo?: Database['public']['Enums']['conta_tipo']
          updated_at?: string
        }
        Relationships: []
      }
      contatos: {
        Row: {
          ativo: boolean | null
          bairro: string | null
          bairro_comercial: string | null
          celular: string | null
          cep: string | null
          cep_comercial: string | null
          cidade: string | null
          cidade_comercial: string | null
          codigo_legado: number | null
          cpf_cnpj: string | null
          created_at: string | null
          created_by: string | null
          data_nascimento: string | null
          email: string | null
          email_financeiro: string | null
          endereco: string | null
          endereco_comercial: string | null
          especialidade: string | null
          estado: string | null
          estado_comercial: string | null
          id: string
          nome: string
          nome_empresa: string | null
          observacoes: string | null
          rg: string | null
          telefone: string | null
          tipo: Database['public']['Enums']['contato_tipo']
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          bairro?: string | null
          bairro_comercial?: string | null
          celular?: string | null
          cep?: string | null
          cep_comercial?: string | null
          cidade?: string | null
          cidade_comercial?: string | null
          codigo_legado?: number | null
          cpf_cnpj?: string | null
          created_at?: string | null
          created_by?: string | null
          data_nascimento?: string | null
          email?: string | null
          email_financeiro?: string | null
          endereco?: string | null
          endereco_comercial?: string | null
          especialidade?: string | null
          estado?: string | null
          estado_comercial?: string | null
          id?: string
          nome: string
          nome_empresa?: string | null
          observacoes?: string | null
          rg?: string | null
          telefone?: string | null
          tipo: Database['public']['Enums']['contato_tipo']
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          bairro?: string | null
          bairro_comercial?: string | null
          celular?: string | null
          cep?: string | null
          cep_comercial?: string | null
          cidade?: string | null
          cidade_comercial?: string | null
          codigo_legado?: number | null
          cpf_cnpj?: string | null
          created_at?: string | null
          created_by?: string | null
          data_nascimento?: string | null
          email?: string | null
          email_financeiro?: string | null
          endereco?: string | null
          endereco_comercial?: string | null
          especialidade?: string | null
          estado?: string | null
          estado_comercial?: string | null
          id?: string
          nome?: string
          nome_empresa?: string | null
          observacoes?: string | null
          rg?: string | null
          telefone?: string | null
          tipo?: Database['public']['Enums']['contato_tipo']
          updated_at?: string | null
        }
        Relationships: []
      }
      controle_falta: {
        Row: {
          created_at: string
          data: string
          funcionario_id: string
          hora_entrada: string | null
          hora_saida: string | null
          id: string
          justificativa: string | null
          status: string | null
          total_horas: number | null
        }
        Insert: {
          created_at?: string
          data: string
          funcionario_id: string
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          justificativa?: string | null
          status?: string | null
          total_horas?: number | null
        }
        Update: {
          created_at?: string
          data?: string
          funcionario_id?: string
          hora_entrada?: string | null
          hora_saida?: string | null
          id?: string
          justificativa?: string | null
          status?: string | null
          total_horas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'controle_ponto_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'funcionarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'controle_ponto_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'vw_calculo_vt_mensal'
            referencedColumns: ['funcionario_id']
          },
          {
            foreignKeyName: 'controle_ponto_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'vw_historico_faltas'
            referencedColumns: ['funcionario_id']
          },
        ]
      }
      custos_recorrentes: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          conta_id: string | null
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string
          dia_vencimento: number | null
          frequencia: Database['public']['Enums']['frequencia_tipo']
          id: string
          updated_at: string
          valor: number
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          conta_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao: string
          dia_vencimento?: number | null
          frequencia?: Database['public']['Enums']['frequencia_tipo']
          id?: string
          updated_at?: string
          valor: number
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          conta_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string
          dia_vencimento?: number | null
          frequencia?: Database['public']['Enums']['frequencia_tipo']
          id?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: 'custos_recorrentes_categoria_id_fkey'
            columns: ['categoria_id']
            isOneToOne: false
            referencedRelation: 'categorias_financeiras'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'custos_recorrentes_conta_id_fkey'
            columns: ['conta_id']
            isOneToOne: false
            referencedRelation: 'contas_bancarias'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'custos_recorrentes_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      custos_recorrentes_lancamentos: {
        Row: {
          competencia: string
          created_at: string
          custo_id: string
          data_pagamento: string | null
          data_vencimento: string
          desconto: number
          id: string
          juros: number
          multa: number
          status: Database['public']['Enums']['lancamento_status']
          transacao_id: string | null
          valor_original: number
          valor_pago: number | null
        }
        Insert: {
          competencia: string
          created_at?: string
          custo_id: string
          data_pagamento?: string | null
          data_vencimento: string
          desconto?: number
          id?: string
          juros?: number
          multa?: number
          status?: Database['public']['Enums']['lancamento_status']
          transacao_id?: string | null
          valor_original: number
          valor_pago?: number | null
        }
        Update: {
          competencia?: string
          created_at?: string
          custo_id?: string
          data_pagamento?: string | null
          data_vencimento?: string
          desconto?: number
          id?: string
          juros?: number
          multa?: number
          status?: Database['public']['Enums']['lancamento_status']
          transacao_id?: string | null
          valor_original?: number
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'custos_recorrentes_lancamentos_custo_id_fkey'
            columns: ['custo_id']
            isOneToOne: false
            referencedRelation: 'custos_recorrentes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'custos_recorrentes_lancamentos_transacao_id_fkey'
            columns: ['transacao_id']
            isOneToOne: false
            referencedRelation: 'transacoes'
            referencedColumns: ['id']
          },
        ]
      }
      departamentos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      entregas: {
        Row: {
          avaliacao: number | null
          comprovante_url: string | null
          contato_destino: string | null
          created_at: string
          data_entrega: string | null
          data_prevista: string | null
          delivery_type: string
          endereco_entrega: string | null
          entregador_id: string | null
          id: string
          observacoes: string | null
          projeto_id: string | null
          scheduled_time: string | null
          separacao_id: string | null
          status: Database['public']['Enums']['entrega_status']
          updated_at: string
        }
        Insert: {
          avaliacao?: number | null
          comprovante_url?: string | null
          contato_destino?: string | null
          created_at?: string
          data_entrega?: string | null
          data_prevista?: string | null
          delivery_type?: string
          endereco_entrega?: string | null
          entregador_id?: string | null
          id?: string
          observacoes?: string | null
          projeto_id?: string | null
          scheduled_time?: string | null
          separacao_id?: string | null
          status?: Database['public']['Enums']['entrega_status']
          updated_at?: string
        }
        Update: {
          avaliacao?: number | null
          comprovante_url?: string | null
          contato_destino?: string | null
          created_at?: string
          data_entrega?: string | null
          data_prevista?: string | null
          delivery_type?: string
          endereco_entrega?: string | null
          entregador_id?: string | null
          id?: string
          observacoes?: string | null
          projeto_id?: string | null
          scheduled_time?: string | null
          separacao_id?: string | null
          status?: Database['public']['Enums']['entrega_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'entregas_entregador_id_fkey'
            columns: ['entregador_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'entregas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'entregas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_financeiro_projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'entregas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_pipeline'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'entregas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_resumo'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'entregas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_separacoes_agenda'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'entregas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'entregas_separacao_id_fkey'
            columns: ['separacao_id']
            isOneToOne: false
            referencedRelation: 'separacoes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'entregas_separacao_id_fkey'
            columns: ['separacao_id']
            isOneToOne: false
            referencedRelation: 'vw_separacoes_agenda'
            referencedColumns: ['separacao_id']
          },
          {
            foreignKeyName: 'entregas_separacao_id_fkey'
            columns: ['separacao_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_loja'
            referencedColumns: ['separacao_id']
          },
          {
            foreignKeyName: 'entregas_separacao_id_fkey'
            columns: ['separacao_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['separacao_id']
          },
        ]
      }
      estoque_itens: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          id: string
          local: Database['public']['Enums']['estoque_local']
          produto_id: string
          quantidade: number
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          id?: string
          local?: Database['public']['Enums']['estoque_local']
          produto_id: string
          quantidade?: number
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          id?: string
          local?: Database['public']['Enums']['estoque_local']
          produto_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: 'estoque_itens_atualizado_por_fkey'
            columns: ['atualizado_por']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'estoque_itens_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'produtos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'estoque_itens_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'vw_estoque_liquido'
            referencedColumns: ['produto_id']
          },
          {
            foreignKeyName: 'estoque_itens_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_loja'
            referencedColumns: ['produto_id']
          },
          {
            foreignKeyName: 'estoque_itens_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['produto_id']
          },
        ]
      }
      ferias: {
        Row: {
          aprovado_por: string | null
          created_at: string
          data_fim: string
          data_inicio: string
          dias: number
          funcionario_id: string
          id: string
          observacoes: string | null
          periodo_aquisitivo_id: string
          status: string
        }
        Insert: {
          aprovado_por?: string | null
          created_at?: string
          data_fim: string
          data_inicio: string
          dias?: number
          funcionario_id: string
          id?: string
          observacoes?: string | null
          periodo_aquisitivo_id: string
          status?: string
        }
        Update: {
          aprovado_por?: string | null
          created_at?: string
          data_fim?: string
          data_inicio?: string
          dias?: number
          funcionario_id?: string
          id?: string
          observacoes?: string | null
          periodo_aquisitivo_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ferias_aprovado_por_fkey'
            columns: ['aprovado_por']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ferias_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'funcionarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ferias_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'vw_calculo_vt_mensal'
            referencedColumns: ['funcionario_id']
          },
          {
            foreignKeyName: 'ferias_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'vw_historico_faltas'
            referencedColumns: ['funcionario_id']
          },
          {
            foreignKeyName: 'ferias_periodo_aquisitivo_id_fkey'
            columns: ['periodo_aquisitivo_id']
            isOneToOne: false
            referencedRelation: 'periodos_aquisitivos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'ferias_periodo_aquisitivo_id_fkey'
            columns: ['periodo_aquisitivo_id']
            isOneToOne: false
            referencedRelation: 'vw_historico_faltas'
            referencedColumns: ['periodo_id']
          },
        ]
      }
      folha_pagamento: {
        Row: {
          adicionais: number
          ano: number
          comissao: number
          data_geracao: string
          descontos: number
          dias_abonados: number | null
          dias_falta: number | null
          dias_trabalhados: number | null
          funcionario_id: string
          id: string
          mes: number
          salario_base: number
          salario_liquido: number
          valor_vr_vt: number | null
        }
        Insert: {
          adicionais?: number
          ano: number
          comissao?: number
          data_geracao?: string
          descontos?: number
          dias_abonados?: number | null
          dias_falta?: number | null
          dias_trabalhados?: number | null
          funcionario_id: string
          id?: string
          mes: number
          salario_base: number
          salario_liquido: number
          valor_vr_vt?: number | null
        }
        Update: {
          adicionais?: number
          ano?: number
          comissao?: number
          data_geracao?: string
          descontos?: number
          dias_abonados?: number | null
          dias_falta?: number | null
          dias_trabalhados?: number | null
          funcionario_id?: string
          id?: string
          mes?: number
          salario_base?: number
          salario_liquido?: number
          valor_vr_vt?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'folha_pagamento_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'funcionarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'folha_pagamento_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'vw_calculo_vt_mensal'
            referencedColumns: ['funcionario_id']
          },
          {
            foreignKeyName: 'folha_pagamento_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'vw_historico_faltas'
            referencedColumns: ['funcionario_id']
          },
        ]
      }
      funcionarios: {
        Row: {
          cargo: string | null
          comissao_padrao: number | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          data_aniversario: string | null
          data_demissao: string | null
          data_elegibilidade_ferias: string | null
          departamento_id: string | null
          email: string
          empresa: string | null
          endereco_completo: string | null
          id: string
          nome: string
          rg: string | null
          salario_base: number | null
          salario_liquido: number | null
          salario_por_fora: number | null
          status: string
          telefone: string | null
          tipo_contratacao: string | null
          updated_at: string
          usuario_id: string | null
          valor_vr: number | null
          valor_vt: number | null
          valor_vt_dia: number | null
        }
        Insert: {
          cargo?: string | null
          comissao_padrao?: number | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_aniversario?: string | null
          data_demissao?: string | null
          data_elegibilidade_ferias?: string | null
          departamento_id?: string | null
          email: string
          empresa?: string | null
          endereco_completo?: string | null
          id?: string
          nome: string
          rg?: string | null
          salario_base?: number | null
          salario_liquido?: number | null
          salario_por_fora?: number | null
          status?: string
          telefone?: string | null
          tipo_contratacao?: string | null
          updated_at?: string
          usuario_id?: string | null
          valor_vr?: number | null
          valor_vt?: number | null
          valor_vt_dia?: number | null
        }
        Update: {
          cargo?: string | null
          comissao_padrao?: number | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          data_aniversario?: string | null
          data_demissao?: string | null
          data_elegibilidade_ferias?: string | null
          departamento_id?: string | null
          email?: string
          empresa?: string | null
          endereco_completo?: string | null
          id?: string
          nome?: string
          rg?: string | null
          salario_base?: number | null
          salario_liquido?: number | null
          salario_por_fora?: number | null
          status?: string
          telefone?: string | null
          tipo_contratacao?: string | null
          updated_at?: string
          usuario_id?: string | null
          valor_vr?: number | null
          valor_vt?: number | null
          valor_vt_dia?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'funcionarios_departamento_id_fkey'
            columns: ['departamento_id']
            isOneToOne: false
            referencedRelation: 'departamentos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'funcionarios_usuario_id_fkey'
            columns: ['usuario_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      marcas: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      pedido_compra: {
        Row: {
          cod_fornecedor: number
          codigo_pedido: number
          created_at: string | null
          data_emissao: string
          data_vencimento: string | null
          id: string
          nome_fornecedor: string
          numero_parcela: number | null
          status: string | null
          updated_at: string | null
          valor_duplicata: number | null
          valor_nota: number
        }
        Insert: {
          cod_fornecedor: number
          codigo_pedido: number
          created_at?: string | null
          data_emissao: string
          data_vencimento?: string | null
          id?: string
          nome_fornecedor: string
          numero_parcela?: number | null
          status?: string | null
          updated_at?: string | null
          valor_duplicata?: number | null
          valor_nota?: number
        }
        Update: {
          cod_fornecedor?: number
          codigo_pedido?: number
          created_at?: string | null
          data_emissao?: string
          data_vencimento?: string | null
          id?: string
          nome_fornecedor?: string
          numero_parcela?: number | null
          status?: string | null
          updated_at?: string | null
          valor_duplicata?: number | null
          valor_nota?: number
        }
        Relationships: []
      }
      periodos_aquisitivos: {
        Row: {
          created_at: string | null
          data_fim: string
          data_inicio: string
          data_limite_gozo: string
          funcionario_id: string
          id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim: string
          data_inicio: string
          data_limite_gozo: string
          funcionario_id: string
          id?: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          data_limite_gozo?: string
          funcionario_id?: string
          id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'periodos_aquisitivos_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'funcionarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'periodos_aquisitivos_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'vw_calculo_vt_mensal'
            referencedColumns: ['funcionario_id']
          },
          {
            foreignKeyName: 'periodos_aquisitivos_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'vw_historico_faltas'
            referencedColumns: ['funcionario_id']
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria: string | null
          cod_categoria: number | null
          cod_marca: number | null
          codigo_produto: number | null
          created_at: string
          custo_total: number | null
          estoque_disponivel: number | null
          estoque_showroom: number | null
          estoque_total: number | null
          id: string
          marca_id: string | null
          nome: string
          nome_categoria: string | null
          nome_marca: string | null
          percentual_lucro: number | null
          preco_custo: number | null
          preco_venda: number | null
          referencia: string | null
          sku: string | null
          unidade: string | null
          updated_at: string
          valor_venda: number | null
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          cod_categoria?: number | null
          cod_marca?: number | null
          codigo_produto?: number | null
          created_at?: string
          custo_total?: number | null
          estoque_disponivel?: number | null
          estoque_showroom?: number | null
          estoque_total?: number | null
          id?: string
          marca_id?: string | null
          nome: string
          nome_categoria?: string | null
          nome_marca?: string | null
          percentual_lucro?: number | null
          preco_custo?: number | null
          preco_venda?: number | null
          referencia?: string | null
          sku?: string | null
          unidade?: string | null
          updated_at?: string
          valor_venda?: number | null
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          cod_categoria?: number | null
          cod_marca?: number | null
          codigo_produto?: number | null
          created_at?: string
          custo_total?: number | null
          estoque_disponivel?: number | null
          estoque_showroom?: number | null
          estoque_total?: number | null
          id?: string
          marca_id?: string | null
          nome?: string
          nome_categoria?: string | null
          nome_marca?: string | null
          percentual_lucro?: number | null
          preco_custo?: number | null
          preco_venda?: number | null
          referencia?: string | null
          sku?: string | null
          unidade?: string | null
          updated_at?: string
          valor_venda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'produtos_marca_id_fkey'
            columns: ['marca_id']
            isOneToOne: false
            referencedRelation: 'marcas'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      projeto_itens: {
        Row: {
          created_at: string
          desconto: number
          descricao: string
          id: string
          preco_unitario: number
          produto_id: string | null
          projeto_id: string
          quantidade: number
          subtotal: number | null
          updated_at: string
          validado: boolean
        }
        Insert: {
          created_at?: string
          desconto?: number
          descricao: string
          id?: string
          preco_unitario: number
          produto_id?: string | null
          projeto_id: string
          quantidade: number
          subtotal?: number | null
          updated_at?: string
          validado?: boolean
        }
        Update: {
          created_at?: string
          desconto?: number
          descricao?: string
          id?: string
          preco_unitario?: number
          produto_id?: string | null
          projeto_id?: string
          quantidade?: number
          subtotal?: number | null
          updated_at?: string
          validado?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'projeto_itens_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'produtos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_itens_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'vw_estoque_liquido'
            referencedColumns: ['produto_id']
          },
          {
            foreignKeyName: 'projeto_itens_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_loja'
            referencedColumns: ['produto_id']
          },
          {
            foreignKeyName: 'projeto_itens_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['produto_id']
          },
          {
            foreignKeyName: 'projeto_itens_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_itens_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_financeiro_projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_itens_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_pipeline'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_itens_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_resumo'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_itens_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_separacoes_agenda'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'projeto_itens_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['projeto_id']
          },
        ]
      }
      projeto_parcelas: {
        Row: {
          comprovante_url: string | null
          created_at: string | null
          data_fechamento: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          desconto: number
          descricao: string | null
          forma_pagamento: Database['public']['Enums']['pagamento_forma'] | null
          id: string
          juros: number
          multa: number
          numero_parcela: number
          observacoes: string | null
          projeto_id: string
          status: Database['public']['Enums']['parcela_status']
          transacao_id: string | null
          valor: number
          valor_pago: number | null
          venda_id: string | null
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string | null
          data_fechamento?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          desconto?: number
          descricao?: string | null
          forma_pagamento?:
            | Database['public']['Enums']['pagamento_forma']
            | null
          id?: string
          juros?: number
          multa?: number
          numero_parcela: number
          observacoes?: string | null
          projeto_id: string
          status?: Database['public']['Enums']['parcela_status']
          transacao_id?: string | null
          valor: number
          valor_pago?: number | null
          venda_id?: string | null
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string | null
          data_fechamento?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          desconto?: number
          descricao?: string | null
          forma_pagamento?:
            | Database['public']['Enums']['pagamento_forma']
            | null
          id?: string
          juros?: number
          multa?: number
          numero_parcela?: number
          observacoes?: string | null
          projeto_id?: string
          status?: Database['public']['Enums']['parcela_status']
          transacao_id?: string | null
          valor?: number
          valor_pago?: number | null
          venda_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'projeto_parcelas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_parcelas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_financeiro_projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_parcelas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_pipeline'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_parcelas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_resumo'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_parcelas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_separacoes_agenda'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'projeto_parcelas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'projeto_parcelas_transacao_id_fkey'
            columns: ['transacao_id']
            isOneToOne: false
            referencedRelation: 'transacoes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_parcelas_venda_id_fkey'
            columns: ['venda_id']
            isOneToOne: false
            referencedRelation: 'vendas'
            referencedColumns: ['id']
          },
        ]
      }
      projeto_parcelas_backup_migration: {
        Row: {
          comprovante_url: string | null
          created_at: string | null
          data_fechamento: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          desconto: number | null
          descricao: string | null
          forma_pagamento: Database['public']['Enums']['pagamento_forma'] | null
          id: string | null
          juros: number | null
          multa: number | null
          numero_parcela: number | null
          observacoes: string | null
          projeto_id: string | null
          status: Database['public']['Enums']['parcela_status'] | null
          transacao_id: string | null
          valor: number | null
          valor_pago: number | null
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string | null
          data_fechamento?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          desconto?: number | null
          descricao?: string | null
          forma_pagamento?:
            | Database['public']['Enums']['pagamento_forma']
            | null
          id?: string | null
          juros?: number | null
          multa?: number | null
          numero_parcela?: number | null
          observacoes?: string | null
          projeto_id?: string | null
          status?: Database['public']['Enums']['parcela_status'] | null
          transacao_id?: string | null
          valor?: number | null
          valor_pago?: number | null
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string | null
          data_fechamento?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          desconto?: number | null
          descricao?: string | null
          forma_pagamento?:
            | Database['public']['Enums']['pagamento_forma']
            | null
          id?: string | null
          juros?: number | null
          multa?: number | null
          numero_parcela?: number | null
          observacoes?: string | null
          projeto_id?: string | null
          status?: Database['public']['Enums']['parcela_status'] | null
          transacao_id?: string | null
          valor?: number | null
          valor_pago?: number | null
        }
        Relationships: []
      }
      projeto_produtos: {
        Row: {
          created_at: string | null
          id: string
          produto_id: string | null
          projeto_id: string | null
          quantidade: number
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          produto_id?: string | null
          projeto_id?: string | null
          quantidade?: number
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          produto_id?: string | null
          projeto_id?: string | null
          quantidade?: number
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'projeto_produtos_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'produtos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_produtos_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'vw_estoque_liquido'
            referencedColumns: ['produto_id']
          },
          {
            foreignKeyName: 'projeto_produtos_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_loja'
            referencedColumns: ['produto_id']
          },
          {
            foreignKeyName: 'projeto_produtos_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['produto_id']
          },
          {
            foreignKeyName: 'projeto_produtos_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_produtos_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_financeiro_projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_produtos_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_pipeline'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_produtos_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_resumo'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_produtos_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_separacoes_agenda'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'projeto_produtos_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['projeto_id']
          },
        ]
      }
      projeto_sinal: {
        Row: {
          comprovante_url: string | null
          created_at: string
          data_pagamento: string | null
          forma_pagamento: Database['public']['Enums']['pagamento_forma'] | null
          id: string
          observacoes: string | null
          projeto_id: string
          status: Database['public']['Enums']['sinal_status']
          transacao_id: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          forma_pagamento?:
            | Database['public']['Enums']['pagamento_forma']
            | null
          id?: string
          observacoes?: string | null
          projeto_id: string
          status?: Database['public']['Enums']['sinal_status']
          transacao_id?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          forma_pagamento?:
            | Database['public']['Enums']['pagamento_forma']
            | null
          id?: string
          observacoes?: string | null
          projeto_id?: string
          status?: Database['public']['Enums']['sinal_status']
          transacao_id?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: 'projeto_sinal_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: true
            referencedRelation: 'projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_sinal_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: true
            referencedRelation: 'vw_financeiro_projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_sinal_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: true
            referencedRelation: 'vw_projetos_pipeline'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_sinal_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: true
            referencedRelation: 'vw_projetos_resumo'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projeto_sinal_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: true
            referencedRelation: 'vw_separacoes_agenda'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'projeto_sinal_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: true
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'projeto_sinal_transacao_id_fkey'
            columns: ['transacao_id']
            isOneToOne: false
            referencedRelation: 'transacoes'
            referencedColumns: ['id']
          },
        ]
      }
      projetos: {
        Row: {
          area_do_projeto: Json | null
          arquiteto_id: string | null
          arquivado: boolean | null
          cidade: string | null
          client_id: string | null
          cliente_id: string | null
          codigo: string
          created_at: string | null
          created_by: string | null
          data_entrada: string | null
          estado: string | null
          historico: Json
          id: string
          nivel_estrategico: Database['public']['Enums']['projeto_nivel'] | null
          nome: string
          responsavel_id: string | null
          responsavel_nome: string | null
          responsavel_obra_id: string | null
          status: Database['public']['Enums']['projeto_status'] | null
          updated_at: string
        }
        Insert: {
          area_do_projeto?: Json | null
          arquiteto_id?: string | null
          arquivado?: boolean | null
          cidade?: string | null
          client_id?: string | null
          cliente_id?: string | null
          codigo: string
          created_at?: string | null
          created_by?: string | null
          data_entrada?: string | null
          estado?: string | null
          historico?: Json
          id?: string
          nivel_estrategico?:
            | Database['public']['Enums']['projeto_nivel']
            | null
          nome: string
          responsavel_id?: string | null
          responsavel_nome?: string | null
          responsavel_obra_id?: string | null
          status?: Database['public']['Enums']['projeto_status'] | null
          updated_at?: string
        }
        Update: {
          area_do_projeto?: Json | null
          arquiteto_id?: string | null
          arquivado?: boolean | null
          cidade?: string | null
          client_id?: string | null
          cliente_id?: string | null
          codigo?: string
          created_at?: string | null
          created_by?: string | null
          data_entrada?: string | null
          estado?: string | null
          historico?: Json
          id?: string
          nivel_estrategico?:
            | Database['public']['Enums']['projeto_nivel']
            | null
          nome?: string
          responsavel_id?: string | null
          responsavel_nome?: string | null
          responsavel_obra_id?: string | null
          status?: Database['public']['Enums']['projeto_status'] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'projetos_arquiteto_id_fkey'
            columns: ['arquiteto_id']
            isOneToOne: false
            referencedRelation: 'contatos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projetos_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'contatos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projetos_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'contatos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projetos_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projetos_responsavel_id_fkey'
            columns: ['responsavel_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'projetos_responsavel_obra_id_fkey'
            columns: ['responsavel_obra_id']
            isOneToOne: false
            referencedRelation: 'contatos'
            referencedColumns: ['id']
          },
        ]
      }
      projetos_fechados: {
        Row: {
          cod: string | null
          created_at: string | null
          data_fechamento: string | null
          id: string
          valor_fechado: number | null
        }
        Insert: {
          cod?: string | null
          created_at?: string | null
          data_fechamento?: string | null
          id?: string
          valor_fechado?: number | null
        }
        Update: {
          cod?: string | null
          created_at?: string | null
          data_fechamento?: string | null
          id?: string
          valor_fechado?: number | null
        }
        Relationships: []
      }
      separacao_arquivos: {
        Row: {
          created_at: string
          id: string
          nome: string
          separacao_id: string
          tamanho_kb: number | null
          tipo_mime: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          separacao_id: string
          tamanho_kb?: number | null
          tipo_mime?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          separacao_id?: string
          tamanho_kb?: number | null
          tipo_mime?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: 'separacao_arquivos_separacao_id_fkey'
            columns: ['separacao_id']
            isOneToOne: false
            referencedRelation: 'separacoes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'separacao_arquivos_separacao_id_fkey'
            columns: ['separacao_id']
            isOneToOne: false
            referencedRelation: 'vw_separacoes_agenda'
            referencedColumns: ['separacao_id']
          },
          {
            foreignKeyName: 'separacao_arquivos_separacao_id_fkey'
            columns: ['separacao_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_loja'
            referencedColumns: ['separacao_id']
          },
          {
            foreignKeyName: 'separacao_arquivos_separacao_id_fkey'
            columns: ['separacao_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['separacao_id']
          },
        ]
      }
      separacao_itens: {
        Row: {
          created_at: string
          descricao: string
          id: string
          observacoes: string | null
          produto_id: string | null
          quantidade: number
          separacao_id: string
          separado: boolean
          unidade: string | null
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          observacoes?: string | null
          produto_id?: string | null
          quantidade?: number
          separacao_id: string
          separado?: boolean
          unidade?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          produto_id?: string | null
          quantidade?: number
          separacao_id?: string
          separado?: boolean
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'separacao_itens_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'produtos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'separacao_itens_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'vw_estoque_liquido'
            referencedColumns: ['produto_id']
          },
          {
            foreignKeyName: 'separacao_itens_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_loja'
            referencedColumns: ['produto_id']
          },
          {
            foreignKeyName: 'separacao_itens_produto_id_fkey'
            columns: ['produto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['produto_id']
          },
          {
            foreignKeyName: 'separacao_itens_separacao_id_fkey'
            columns: ['separacao_id']
            isOneToOne: false
            referencedRelation: 'separacoes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'separacao_itens_separacao_id_fkey'
            columns: ['separacao_id']
            isOneToOne: false
            referencedRelation: 'vw_separacoes_agenda'
            referencedColumns: ['separacao_id']
          },
          {
            foreignKeyName: 'separacao_itens_separacao_id_fkey'
            columns: ['separacao_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_loja'
            referencedColumns: ['separacao_id']
          },
          {
            foreignKeyName: 'separacao_itens_separacao_id_fkey'
            columns: ['separacao_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['separacao_id']
          },
        ]
      }
      separacoes: {
        Row: {
          cliente: string | null
          cliente_id: string | null
          codigo_obra: string | null
          created_at: string
          data_entrega: string | null
          data_entrega_original: string | null
          delivery_type: string | null
          endereco_entrega: string | null
          id: string
          observacoes: string | null
          projeto_id: string | null
          reagendamentos: number
          responsavel_id: string | null
          scheduled_time: string | null
          status: Database['public']['Enums']['separacao_status']
          updated_at: string
        }
        Insert: {
          cliente?: string | null
          cliente_id?: string | null
          codigo_obra?: string | null
          created_at?: string
          data_entrega?: string | null
          data_entrega_original?: string | null
          delivery_type?: string | null
          endereco_entrega?: string | null
          id?: string
          observacoes?: string | null
          projeto_id?: string | null
          reagendamentos?: number
          responsavel_id?: string | null
          scheduled_time?: string | null
          status?: Database['public']['Enums']['separacao_status']
          updated_at?: string
        }
        Update: {
          cliente?: string | null
          cliente_id?: string | null
          codigo_obra?: string | null
          created_at?: string
          data_entrega?: string | null
          data_entrega_original?: string | null
          delivery_type?: string | null
          endereco_entrega?: string | null
          id?: string
          observacoes?: string | null
          projeto_id?: string | null
          reagendamentos?: number
          responsavel_id?: string | null
          scheduled_time?: string | null
          status?: Database['public']['Enums']['separacao_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'separacoes_cliente_id_fkey'
            columns: ['cliente_id']
            isOneToOne: false
            referencedRelation: 'contatos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'separacoes_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'separacoes_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_financeiro_projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'separacoes_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_pipeline'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'separacoes_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_resumo'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'separacoes_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_separacoes_agenda'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'separacoes_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'separacoes_responsavel_id_fkey'
            columns: ['responsavel_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      solicitacoes_compra: {
        Row: {
          aprovador_id: string | null
          categoria_id: string | null
          comprovante_url: string | null
          created_at: string
          data_aprovacao: string | null
          data_compra: string | null
          descricao: string
          id: string
          justificativa: string | null
          observacoes: string | null
          projeto_id: string | null
          solicitante_id: string
          status: Database['public']['Enums']['solicitacao_status']
          transacao_id: string | null
          updated_at: string
          valor_aprovado: number | null
          valor_estimado: number
        }
        Insert: {
          aprovador_id?: string | null
          categoria_id?: string | null
          comprovante_url?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_compra?: string | null
          descricao: string
          id?: string
          justificativa?: string | null
          observacoes?: string | null
          projeto_id?: string | null
          solicitante_id: string
          status?: Database['public']['Enums']['solicitacao_status']
          transacao_id?: string | null
          updated_at?: string
          valor_aprovado?: number | null
          valor_estimado: number
        }
        Update: {
          aprovador_id?: string | null
          categoria_id?: string | null
          comprovante_url?: string | null
          created_at?: string
          data_aprovacao?: string | null
          data_compra?: string | null
          descricao?: string
          id?: string
          justificativa?: string | null
          observacoes?: string | null
          projeto_id?: string | null
          solicitante_id?: string
          status?: Database['public']['Enums']['solicitacao_status']
          transacao_id?: string | null
          updated_at?: string
          valor_aprovado?: number | null
          valor_estimado?: number
        }
        Relationships: [
          {
            foreignKeyName: 'solicitacoes_compra_aprovador_id_fkey'
            columns: ['aprovador_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'solicitacoes_compra_categoria_id_fkey'
            columns: ['categoria_id']
            isOneToOne: false
            referencedRelation: 'categorias_financeiras'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'solicitacoes_compra_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'solicitacoes_compra_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_financeiro_projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'solicitacoes_compra_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_pipeline'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'solicitacoes_compra_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_resumo'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'solicitacoes_compra_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_separacoes_agenda'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'solicitacoes_compra_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'solicitacoes_compra_solicitante_id_fkey'
            columns: ['solicitante_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'solicitacoes_compra_transacao_id_fkey'
            columns: ['transacao_id']
            isOneToOne: false
            referencedRelation: 'transacoes'
            referencedColumns: ['id']
          },
        ]
      }
      staging_conta_pagar: {
        Row: {
          bairro: string | null
          celular: string | null
          cep: string | null
          cidade: string | null
          cod_duplicata: number | null
          cod_empresa: number | null
          cod_pessoa: number | null
          cod_venda: number | null
          complemento: string | null
          cpf_cnpj: string | null
          data_baixa: string | null
          desc_apropriacao: string | null
          dt_emissao: string | null
          dt_pagamento: string | null
          dt_ultimo_pgto: string | null
          dt_vencimento: string | null
          email: string | null
          email_financeiro: string | null
          estado: string | null
          fantasia: string | null
          importado_em: string | null
          lancamento: number | null
          layout_boleto: number | null
          linha_excel: number | null
          logradouro: string | null
          nm_empresa: string | null
          nm_funcionario: string | null
          nm_pessoa: string | null
          nosso_numero: number | null
          num_nota: string | null
          num_parc: number | null
          numero: string | null
          observacao: string | null
          pago: number | null
          processado: boolean | null
          razaosocial: string | null
          rgie: string | null
          telefone: string | null
          tipo_operacao: string | null
          tipo_pagamento: string | null
          total_parc: number | null
          vl_desconto: number | null
          vl_duplicata: number | null
          vl_frete: number | null
          vl_ipi: number | null
          vl_juros: number | null
          vl_pago: number | null
          vl_parcela: number | null
          vl_st: number | null
        }
        Insert: {
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cod_duplicata?: number | null
          cod_empresa?: number | null
          cod_pessoa?: number | null
          cod_venda?: number | null
          complemento?: string | null
          cpf_cnpj?: string | null
          data_baixa?: string | null
          desc_apropriacao?: string | null
          dt_emissao?: string | null
          dt_pagamento?: string | null
          dt_ultimo_pgto?: string | null
          dt_vencimento?: string | null
          email?: string | null
          email_financeiro?: string | null
          estado?: string | null
          fantasia?: string | null
          importado_em?: string | null
          lancamento?: number | null
          layout_boleto?: number | null
          linha_excel?: number | null
          logradouro?: string | null
          nm_empresa?: string | null
          nm_funcionario?: string | null
          nm_pessoa?: string | null
          nosso_numero?: number | null
          num_nota?: string | null
          num_parc?: number | null
          numero?: string | null
          observacao?: string | null
          pago?: number | null
          processado?: boolean | null
          razaosocial?: string | null
          rgie?: string | null
          telefone?: string | null
          tipo_operacao?: string | null
          tipo_pagamento?: string | null
          total_parc?: number | null
          vl_desconto?: number | null
          vl_duplicata?: number | null
          vl_frete?: number | null
          vl_ipi?: number | null
          vl_juros?: number | null
          vl_pago?: number | null
          vl_parcela?: number | null
          vl_st?: number | null
        }
        Update: {
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cod_duplicata?: number | null
          cod_empresa?: number | null
          cod_pessoa?: number | null
          cod_venda?: number | null
          complemento?: string | null
          cpf_cnpj?: string | null
          data_baixa?: string | null
          desc_apropriacao?: string | null
          dt_emissao?: string | null
          dt_pagamento?: string | null
          dt_ultimo_pgto?: string | null
          dt_vencimento?: string | null
          email?: string | null
          email_financeiro?: string | null
          estado?: string | null
          fantasia?: string | null
          importado_em?: string | null
          lancamento?: number | null
          layout_boleto?: number | null
          linha_excel?: number | null
          logradouro?: string | null
          nm_empresa?: string | null
          nm_funcionario?: string | null
          nm_pessoa?: string | null
          nosso_numero?: number | null
          num_nota?: string | null
          num_parc?: number | null
          numero?: string | null
          observacao?: string | null
          pago?: number | null
          processado?: boolean | null
          razaosocial?: string | null
          rgie?: string | null
          telefone?: string | null
          tipo_operacao?: string | null
          tipo_pagamento?: string | null
          total_parc?: number | null
          vl_desconto?: number | null
          vl_duplicata?: number | null
          vl_frete?: number | null
          vl_ipi?: number | null
          vl_juros?: number | null
          vl_pago?: number | null
          vl_parcela?: number | null
          vl_st?: number | null
        }
        Relationships: []
      }
      staging_conta_receber: {
        Row: {
          bairro: string | null
          celular: string | null
          cep: string | null
          cidade: string | null
          cod_duplicata: number | null
          cod_empresa: number | null
          cod_pessoa: number | null
          cod_venda: number | null
          complemento: string | null
          cpf_cnpj: string | null
          data_baixa: string | null
          desc_apropriacao: string | null
          dt_emissao: string | null
          dt_pagamento: string | null
          dt_ultimo_pgto: string | null
          dt_vencimento: string | null
          email: string | null
          email_financeiro: string | null
          estado: string | null
          fantasia: string | null
          importado_em: string | null
          lancamento: number | null
          layout_boleto: number | null
          linha_excel: number | null
          logradouro: string | null
          nm_empresa: string | null
          nm_funcionario: string | null
          nm_pessoa: string | null
          nosso_numero: number | null
          num_nota: string | null
          num_parc: number | null
          numero: string | null
          observacao: string | null
          pago: number | null
          processado: boolean | null
          razaosocial: string | null
          rgie: string | null
          telefone: string | null
          tipo_operacao: string | null
          tipo_pagamento: string | null
          total_parc: number | null
          vl_desconto: number | null
          vl_duplicata: number | null
          vl_frete: number | null
          vl_ipi: number | null
          vl_juros: number | null
          vl_pago: number | null
          vl_parcela: number | null
          vl_st: number | null
        }
        Insert: {
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cod_duplicata?: number | null
          cod_empresa?: number | null
          cod_pessoa?: number | null
          cod_venda?: number | null
          complemento?: string | null
          cpf_cnpj?: string | null
          data_baixa?: string | null
          desc_apropriacao?: string | null
          dt_emissao?: string | null
          dt_pagamento?: string | null
          dt_ultimo_pgto?: string | null
          dt_vencimento?: string | null
          email?: string | null
          email_financeiro?: string | null
          estado?: string | null
          fantasia?: string | null
          importado_em?: string | null
          lancamento?: number | null
          layout_boleto?: number | null
          linha_excel?: number | null
          logradouro?: string | null
          nm_empresa?: string | null
          nm_funcionario?: string | null
          nm_pessoa?: string | null
          nosso_numero?: number | null
          num_nota?: string | null
          num_parc?: number | null
          numero?: string | null
          observacao?: string | null
          pago?: number | null
          processado?: boolean | null
          razaosocial?: string | null
          rgie?: string | null
          telefone?: string | null
          tipo_operacao?: string | null
          tipo_pagamento?: string | null
          total_parc?: number | null
          vl_desconto?: number | null
          vl_duplicata?: number | null
          vl_frete?: number | null
          vl_ipi?: number | null
          vl_juros?: number | null
          vl_pago?: number | null
          vl_parcela?: number | null
          vl_st?: number | null
        }
        Update: {
          bairro?: string | null
          celular?: string | null
          cep?: string | null
          cidade?: string | null
          cod_duplicata?: number | null
          cod_empresa?: number | null
          cod_pessoa?: number | null
          cod_venda?: number | null
          complemento?: string | null
          cpf_cnpj?: string | null
          data_baixa?: string | null
          desc_apropriacao?: string | null
          dt_emissao?: string | null
          dt_pagamento?: string | null
          dt_ultimo_pgto?: string | null
          dt_vencimento?: string | null
          email?: string | null
          email_financeiro?: string | null
          estado?: string | null
          fantasia?: string | null
          importado_em?: string | null
          lancamento?: number | null
          layout_boleto?: number | null
          linha_excel?: number | null
          logradouro?: string | null
          nm_empresa?: string | null
          nm_funcionario?: string | null
          nm_pessoa?: string | null
          nosso_numero?: number | null
          num_nota?: string | null
          num_parc?: number | null
          numero?: string | null
          observacao?: string | null
          pago?: number | null
          processado?: boolean | null
          razaosocial?: string | null
          rgie?: string | null
          telefone?: string | null
          tipo_operacao?: string | null
          tipo_pagamento?: string | null
          total_parc?: number | null
          vl_desconto?: number | null
          vl_duplicata?: number | null
          vl_frete?: number | null
          vl_ipi?: number | null
          vl_juros?: number | null
          vl_pago?: number | null
          vl_parcela?: number | null
          vl_st?: number | null
        }
        Relationships: []
      }
      staging_import_bruto: {
        Row: {
          ARQUITETO: string | null
          'CAUSA PAGAMENTO': string | null
          CLIENTE: string | null
          COD: string | null
          DATA: string | null
          'DATA FECHAMENTO': string | null
          'FORMA PAGAMENTO': string | null
          'LINHA ORIGINAL': string | null
          'PARCELA/COLUNA3': string | null
          PROJETISTA: string | null
          'VALOR FECHADO': string | null
        }
        Insert: {
          ARQUITETO?: string | null
          'CAUSA PAGAMENTO'?: string | null
          CLIENTE?: string | null
          COD?: string | null
          DATA?: string | null
          'DATA FECHAMENTO'?: string | null
          'FORMA PAGAMENTO'?: string | null
          'LINHA ORIGINAL'?: string | null
          'PARCELA/COLUNA3'?: string | null
          PROJETISTA?: string | null
          'VALOR FECHADO'?: string | null
        }
        Update: {
          ARQUITETO?: string | null
          'CAUSA PAGAMENTO'?: string | null
          CLIENTE?: string | null
          COD?: string | null
          DATA?: string | null
          'DATA FECHAMENTO'?: string | null
          'FORMA PAGAMENTO'?: string | null
          'LINHA ORIGINAL'?: string | null
          'PARCELA/COLUNA3'?: string | null
          PROJETISTA?: string | null
          'VALOR FECHADO'?: string | null
        }
        Relationships: []
      }
      staging_pedido_compra: {
        Row: {
          cod_fornecedor: number | null
          codigo_pedido: number | null
          dt_vencimento: string | null
          emissao_pedido: string | null
          importado_em: string | null
          linha_excel: number | null
          nm_fornecedor: string | null
          num_parc: number | null
          processado: boolean | null
          vl_duplicata: number | null
          vl_nota: number | null
        }
        Insert: {
          cod_fornecedor?: number | null
          codigo_pedido?: number | null
          dt_vencimento?: string | null
          emissao_pedido?: string | null
          importado_em?: string | null
          linha_excel?: number | null
          nm_fornecedor?: string | null
          num_parc?: number | null
          processado?: boolean | null
          vl_duplicata?: number | null
          vl_nota?: number | null
        }
        Update: {
          cod_fornecedor?: number | null
          codigo_pedido?: number | null
          dt_vencimento?: string | null
          emissao_pedido?: string | null
          importado_em?: string | null
          linha_excel?: number | null
          nm_fornecedor?: string | null
          num_parc?: number | null
          processado?: boolean | null
          vl_duplicata?: number | null
          vl_nota?: number | null
        }
        Relationships: []
      }
      staging_produtos: {
        Row: {
          codcategoria: number | null
          codmarca: number | null
          codproduto: number | null
          custototal: string | null
          desccategoria: string | null
          descmarca: string | null
          descproduto: string | null
          disponivel: number | null
          estoquetotal: number | null
          importado_em: string | null
          linha_excel: number | null
          lucro: number | null
          processado: boolean | null
          referencia: string | null
          showroom: number | null
          unidade: string | null
          valorvenda: number | null
        }
        Insert: {
          codcategoria?: number | null
          codmarca?: number | null
          codproduto?: number | null
          custototal?: string | null
          desccategoria?: string | null
          descmarca?: string | null
          descproduto?: string | null
          disponivel?: number | null
          estoquetotal?: number | null
          importado_em?: string | null
          linha_excel?: number | null
          lucro?: number | null
          processado?: boolean | null
          referencia?: string | null
          showroom?: number | null
          unidade?: string | null
          valorvenda?: number | null
        }
        Update: {
          codcategoria?: number | null
          codmarca?: number | null
          codproduto?: number | null
          custototal?: string | null
          desccategoria?: string | null
          descmarca?: string | null
          descproduto?: string | null
          disponivel?: number | null
          estoquetotal?: number | null
          importado_em?: string | null
          linha_excel?: number | null
          lucro?: number | null
          processado?: boolean | null
          referencia?: string | null
          showroom?: number | null
          unidade?: string | null
          valorvenda?: number | null
        }
        Relationships: []
      }
      sync_history: {
        Row: {
          created_at: string | null
          executado_por: string | null
          id: number
          mensagem: string | null
          origem: string | null
          registros_atualizados: number
          registros_erro: number
          registros_inseridos: number
          status: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          executado_por?: string | null
          id?: never
          mensagem?: string | null
          origem?: string | null
          registros_atualizados?: number
          registros_erro?: number
          registros_inseridos?: number
          status?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          executado_por?: string | null
          id?: never
          mensagem?: string | null
          origem?: string | null
          registros_atualizados?: number
          registros_erro?: number
          registros_inseridos?: number
          status?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'sync_history_executado_por_fkey'
            columns: ['executado_por']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      transacoes: {
        Row: {
          categoria_id: string | null
          comprovante_url: string | null
          conta_id: string
          created_at: string
          created_by: string | null
          data_transacao: string
          descricao: string
          id: string
          parcela_id: string | null
          projeto_id: string | null
          tipo: Database['public']['Enums']['transacao_tipo']
          valor: number
        }
        Insert: {
          categoria_id?: string | null
          comprovante_url?: string | null
          conta_id: string
          created_at?: string
          created_by?: string | null
          data_transacao: string
          descricao: string
          id?: string
          parcela_id?: string | null
          projeto_id?: string | null
          tipo: Database['public']['Enums']['transacao_tipo']
          valor: number
        }
        Update: {
          categoria_id?: string | null
          comprovante_url?: string | null
          conta_id?: string
          created_at?: string
          created_by?: string | null
          data_transacao?: string
          descricao?: string
          id?: string
          parcela_id?: string | null
          projeto_id?: string | null
          tipo?: Database['public']['Enums']['transacao_tipo']
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: 'transacoes_categoria_id_fkey'
            columns: ['categoria_id']
            isOneToOne: false
            referencedRelation: 'categorias_financeiras'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transacoes_conta_id_fkey'
            columns: ['conta_id']
            isOneToOne: false
            referencedRelation: 'contas_bancarias'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transacoes_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transacoes_parcela_id_fkey'
            columns: ['parcela_id']
            isOneToOne: false
            referencedRelation: 'projeto_parcelas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transacoes_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transacoes_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_financeiro_projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transacoes_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_pipeline'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transacoes_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_resumo'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'transacoes_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_separacoes_agenda'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'transacoes_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['projeto_id']
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string
          id: string
          notes: string | null
          payment_method: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date: string
          description: string
          id?: string
          notes?: string | null
          payment_method: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          notes?: string | null
          payment_method?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          nome: string
          role: Database['public']['Enums']['usuario_role'] | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          nome: string
          role?: Database['public']['Enums']['usuario_role'] | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nome?: string
          role?: Database['public']['Enums']['usuario_role'] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vendas: {
        Row: {
          cod_cliente: number | null
          cod_venda: number | null
          created_at: string | null
          data_emissao: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          desc_apropriacao: string | null
          id: string
          nome_cliente: string
          num_nota: string | null
          observacao: string | null
          parcelas_pagas: number | null
          projeto_id: string | null
          status_pagamento:
            | Database['public']['Enums']['status_pagamento']
            | null
          tipo_pagamento: string | null
          total_parcelas: number | null
          updated_at: string | null
          valor_pago: number | null
          valor_pendente: number | null
          valor_total: number
        }
        Insert: {
          cod_cliente?: number | null
          cod_venda?: number | null
          created_at?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          desc_apropriacao?: string | null
          id?: string
          nome_cliente: string
          num_nota?: string | null
          observacao?: string | null
          parcelas_pagas?: number | null
          projeto_id?: string | null
          status_pagamento?:
            | Database['public']['Enums']['status_pagamento']
            | null
          tipo_pagamento?: string | null
          total_parcelas?: number | null
          updated_at?: string | null
          valor_pago?: number | null
          valor_pendente?: number | null
          valor_total?: number
        }
        Update: {
          cod_cliente?: number | null
          cod_venda?: number | null
          created_at?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          desc_apropriacao?: string | null
          id?: string
          nome_cliente?: string
          num_nota?: string | null
          observacao?: string | null
          parcelas_pagas?: number | null
          projeto_id?: string | null
          status_pagamento?:
            | Database['public']['Enums']['status_pagamento']
            | null
          tipo_pagamento?: string | null
          total_parcelas?: number | null
          updated_at?: string | null
          valor_pago?: number | null
          valor_pendente?: number | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: 'vendas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vendas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_financeiro_projetos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vendas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_pipeline'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vendas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_projetos_resumo'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vendas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_separacoes_agenda'
            referencedColumns: ['projeto_id']
          },
          {
            foreignKeyName: 'vendas_projeto_id_fkey'
            columns: ['projeto_id']
            isOneToOne: false
            referencedRelation: 'vw_vendas_por_projeto'
            referencedColumns: ['projeto_id']
          },
        ]
      }
      vendas_marca: {
        Row: {
          ano: number
          created_at: string
          id: string
          marca_id: string
          mes: number
          valor_custo: number
          valor_venda: number
        }
        Insert: {
          ano: number
          created_at?: string
          id?: string
          marca_id: string
          mes: number
          valor_custo?: number
          valor_venda?: number
        }
        Update: {
          ano?: number
          created_at?: string
          id?: string
          marca_id?: string
          mes?: number
          valor_custo?: number
          valor_venda?: number
        }
        Relationships: [
          {
            foreignKeyName: 'vendas_marca_marca_id_fkey'
            columns: ['marca_id']
            isOneToOne: false
            referencedRelation: 'marcas'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      vw_calculo_vt_mensal: {
        Row: {
          empresa: string | null
          funcionario_id: string | null
          funcionario_nome: string | null
          total_faltas_integrais: number | null
          total_meio_periodo: number | null
          valor_vt_dia: number | null
        }
        Insert: {
          empresa?: string | null
          funcionario_id?: string | null
          funcionario_nome?: string | null
          total_faltas_integrais?: never
          total_meio_periodo?: never
          valor_vt_dia?: number | null
        }
        Update: {
          empresa?: string | null
          funcionario_id?: string | null
          funcionario_nome?: string | null
          total_faltas_integrais?: never
          total_meio_periodo?: never
          valor_vt_dia?: number | null
        }
        Relationships: []
      }
      vw_conta_pagar_aberto: {
        Row: {
          data_vencimento: string | null
          fornecedor: string | null
          id: string | null
          saldo: number | null
          situacao: string | null
          valor_pago: number | null
          valor_parcela: number | null
        }
        Insert: {
          data_vencimento?: string | null
          fornecedor?: string | null
          id?: string | null
          saldo?: never
          situacao?: never
          valor_pago?: number | null
          valor_parcela?: number | null
        }
        Update: {
          data_vencimento?: string | null
          fornecedor?: string | null
          id?: string | null
          saldo?: never
          situacao?: never
          valor_pago?: number | null
          valor_parcela?: number | null
        }
        Relationships: []
      }
      vw_conta_receber_aberto: {
        Row: {
          cliente: string | null
          data_vencimento: string | null
          id: string | null
          saldo: number | null
          situacao: string | null
          valor_pago: number | null
          valor_parcela: number | null
        }
        Insert: {
          cliente?: string | null
          data_vencimento?: string | null
          id?: string | null
          saldo?: never
          situacao?: never
          valor_pago?: number | null
          valor_parcela?: number | null
        }
        Update: {
          cliente?: string | null
          data_vencimento?: string | null
          id?: string | null
          saldo?: never
          situacao?: never
          valor_pago?: number | null
          valor_parcela?: number | null
        }
        Relationships: []
      }
      vw_controle_ferias_clt: {
        Row: {
          direito_total_acumulado: number | null
          funcionario_id: string | null
          funcionario_nome: string | null
          saldo_disponivel: number | null
          total_gozado: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'periodos_aquisitivos_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'funcionarios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'periodos_aquisitivos_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'vw_calculo_vt_mensal'
            referencedColumns: ['funcionario_id']
          },
          {
            foreignKeyName: 'periodos_aquisitivos_funcionario_id_fkey'
            columns: ['funcionario_id']
            isOneToOne: false
            referencedRelation: 'vw_historico_faltas'
            referencedColumns: ['funcionario_id']
          },
        ]
      }
      vw_custos_pendentes_mes: {
        Row: {
          categoria: string | null
          conta: string | null
          data_vencimento: string | null
          descricao: string | null
          status: Database['public']['Enums']['lancamento_status'] | null
          valor_original: number | null
        }
        Relationships: []
      }
      vw_dashboard_crm_fechamento: {
        Row: {
          mes: string | null
          projetos_comerciais: number | null
          projetos_corporativos: number | null
          projetos_paisagismo: number | null
          projetos_residenciais: number | null
          total_clientes: number | null
          total_projetos: number | null
          valor_total: number | null
        }
        Relationships: []
      }
      vw_estoque_liquido: {
        Row: {
          alerta_estoque: string | null
          categoria: string | null
          marca: string | null
          preco_custo: number | null
          preco_venda: number | null
          produto: string | null
          produto_id: string | null
          qtd_disponivel: number | null
          qtd_em_transito: number | null
          qtd_fisico: number | null
          qtd_reservado: number | null
          qtd_showroom: number | null
          sku: string | null
          valor_estoque_total: number | null
          valor_reservado_total: number | null
        }
        Relationships: []
      }
      vw_estoque_por_marca: {
        Row: {
          marca: string | null
          qtd_estoque: number | null
          qtd_showroom: number | null
          skus_total: number | null
          valor_disponivel_venda: number | null
        }
        Relationships: []
      }
      vw_estoque_produtos: {
        Row: {
          categoria: string | null
          codigo_produto: number | null
          descricao: string | null
          estoque_disponivel: number | null
          estoque_showroom: number | null
          estoque_total: number | null
          marca: string | null
          referencia: string | null
          status_estoque: string | null
          valor_venda: number | null
        }
        Insert: {
          categoria?: string | null
          codigo_produto?: number | null
          descricao?: string | null
          estoque_disponivel?: number | null
          estoque_showroom?: number | null
          estoque_total?: number | null
          marca?: string | null
          referencia?: string | null
          status_estoque?: never
          valor_venda?: number | null
        }
        Update: {
          categoria?: string | null
          codigo_produto?: number | null
          descricao?: string | null
          estoque_disponivel?: number | null
          estoque_showroom?: number | null
          estoque_total?: number | null
          marca?: string | null
          referencia?: string | null
          status_estoque?: never
          valor_venda?: number | null
        }
        Relationships: []
      }
      vw_financeiro_projetos: {
        Row: {
          client_id: string | null
          cliente_nome: string | null
          codigo: string | null
          id: string | null
          nome: string | null
          parcelas_pagas: number | null
          parcelas_pendentes: number | null
          status: Database['public']['Enums']['projeto_status'] | null
          total_parcelas: number | null
          valor_pendente: number | null
          valor_recebido: number | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'projetos_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'contatos'
            referencedColumns: ['id']
          },
        ]
      }
      vw_fluxo_caixa_projetado: {
        Row: {
          a_receber: number | null
          atrasado: number | null
          mes: string | null
          qtd_atrasado: number | null
          qtd_pendente: number | null
          recebido: number | null
        }
        Relationships: []
      }
      vw_historico_faltas: {
        Row: {
          data_falta: string | null
          data_fim: string | null
          data_inicio: string | null
          funcionario_id: string | null
          funcionario_nome: string | null
          justificativa: string | null
          periodo_id: string | null
          status: string | null
        }
        Relationships: []
      }
      vw_projetos_pipeline: {
        Row: {
          client_id: string | null
          cliente_nome: string | null
          codigo: string | null
          data_entrada: string | null
          id: string | null
          nome: string | null
          status: Database['public']['Enums']['projeto_status'] | null
          tipo_projeto: string | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'projetos_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'contatos'
            referencedColumns: ['id']
          },
        ]
      }
      vw_projetos_por_status: {
        Row: {
          status: Database['public']['Enums']['projeto_status'] | null
          total_clientes: number | null
          total_projetos: number | null
          valor_total: number | null
        }
        Relationships: []
      }
      vw_projetos_resumo: {
        Row: {
          codigo: string | null
          id: string | null
          status: Database['public']['Enums']['projeto_status'] | null
          total_vendas: number | null
          valor_pago: number | null
          valor_pendente: number | null
          valor_total_vendas: number | null
        }
        Relationships: []
      }
      vw_rh_resumo: {
        Row: {
          ativos: number | null
          departamento: string | null
          folha_total: number | null
          salario_medio: number | null
          total_funcionarios: number | null
        }
        Relationships: []
      }
      vw_separacoes_agenda: {
        Row: {
          cliente: string | null
          cliente_nome: string | null
          codigo_obra: string | null
          created_at: string | null
          data_entrega: string | null
          data_entrega_original: string | null
          delivery_type: string | null
          dias_ate_entrega: number | null
          endereco_entrega: string | null
          entrega_id: string | null
          entrega_status: Database['public']['Enums']['entrega_status'] | null
          entregador_id: string | null
          entregador_nome: string | null
          itens_separados: number | null
          observacoes: string | null
          projeto_codigo: string | null
          projeto_id: string | null
          projeto_nome: string | null
          projeto_status: Database['public']['Enums']['projeto_status'] | null
          reagendamentos: number | null
          scheduled_time: string | null
          separacao_id: string | null
          separacao_status:
            | Database['public']['Enums']['separacao_status']
            | null
          total_itens: number | null
          updated_at: string | null
          urgencia: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'entregas_entregador_id_fkey'
            columns: ['entregador_id']
            isOneToOne: false
            referencedRelation: 'usuarios'
            referencedColumns: ['id']
          },
        ]
      }
      vw_staging_resumo: {
        Row: {
          pendentes: number | null
          primeira_importacao: string | null
          processados: number | null
          tabela: string | null
          total: number | null
          ultima_importacao: string | null
        }
        Relationships: []
      }
      vw_vendas_loja: {
        Row: {
          categoria: string | null
          cliente: string | null
          data_venda: string | null
          marca: string | null
          margem_total: number | null
          observacoes: string | null
          preco_custo: number | null
          preco_venda: number | null
          produto: string | null
          produto_id: string | null
          quantidade: number | null
          separacao_id: string | null
          sku: string | null
        }
        Relationships: []
      }
      vw_vendas_por_projeto: {
        Row: {
          categoria: string | null
          cliente: string | null
          data_separacao: string | null
          marca: string | null
          margem_total: number | null
          preco_custo: number | null
          preco_venda: number | null
          produto: string | null
          produto_id: string | null
          projeto_cidade: string | null
          projeto_codigo: string | null
          projeto_estado: string | null
          projeto_id: string | null
          projeto_nome: string | null
          projeto_status: Database['public']['Enums']['projeto_status'] | null
          quantidade: number | null
          separacao_id: string | null
          sku: string | null
        }
        Relationships: []
      }
      vw_vendas_produtos: {
        Row: {
          categoria: string | null
          cliente: string | null
          data_venda: string | null
          marca: string | null
          margem_total: number | null
          origem: string | null
          preco_custo: number | null
          preco_venda: number | null
          produto: string | null
          produto_id: string | null
          projeto_codigo: string | null
          projeto_nome: string | null
          quantidade: number | null
          sku: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_update_user_password: {
        Args: { p_new_password: string; p_user_id: string }
        Returns: undefined
      }
      admin_update_user_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: undefined
      }
      admin_update_user_status: {
        Args: { p_ativo: boolean; p_user_id: string }
        Returns: undefined
      }
      criar_usuario: {
        Args: {
          p_email: string
          p_nome: string
          p_password: string
          p_role?: Database['public']['Enums']['usuario_role']
        }
        Returns: string
      }
      get_dashboard_crm_by_closing: {
        Args: { data_final: string; data_inicial: string }
        Returns: {
          area_do_projeto: Json | null
          arquiteto_id: string | null
          arquivado: boolean | null
          cidade: string | null
          client_id: string | null
          cliente_id: string | null
          codigo: string
          created_at: string | null
          created_by: string | null
          data_entrada: string | null
          estado: string | null
          historico: Json
          id: string
          nivel_estrategico: Database['public']['Enums']['projeto_nivel'] | null
          nome: string
          responsavel_id: string | null
          responsavel_nome: string | null
          responsavel_obra_id: string | null
          status: Database['public']['Enums']['projeto_status'] | null
          updated_at: string
        }[]
        SetofOptions: {
          from: '*'
          to: 'projetos'
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_dashboard_kpi: { Args: { p_date_now: string }; Returns: Json }
      get_dashboard_stats: { Args: never; Returns: Json }
      get_faltas_injustificadas: {
        Args: { p_fim: string; p_funcionario_id: string; p_inicio: string }
        Returns: number
      }
      get_latest_transaction_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      limpar_staging_processados: { Args: never; Returns: number }
      stats_datacenter: { Args: never; Returns: Json }
    }
    Enums: {
      conta_tipo: 'Corrente' | 'Poupança' | 'CDB' | 'Investimento' | 'Caixa'
      contato_tipo:
        | 'cliente'
        | 'arquiteto'
        | 'engenheiro'
        | 'eletricista'
        | 'fornecedor'
        | 'outro'
      entrega_status: 'Pendente' | 'Em rota' | 'Entregue' | 'Cancelado'
      estoque_local: 'Estoque' | 'Showroom' | 'Em trânsito' | 'Reservado'
      frequencia_tipo: 'mensal' | 'trimestral' | 'semestral' | 'anual'
      lancamento_status: 'pendente' | 'pago' | 'cancelado'
      pagamento_forma: 'pix' | 'cartao' | 'boleto' | 'transferencia' | 'cheque'
      parcela_status: 'pendente' | 'paga' | 'atrasada' | 'cancelada'
      projeto_nivel: '1' | '2' | '3' | '4'
      projeto_status:
        | 'Estudo Inicial'
        | 'Proposta Sinal'
        | 'Elaboração Orçamento'
        | 'Informações necessárias'
        | 'Projeto executivo'
        | 'Entrega materiais'
        | 'Ajustes finais'
        | 'Finalizado'
        | 'Arquivado'
        | 'Não Fechou'
        | 'Venda Docusign'
        | 'Obra Finalizada'
        | 'Contrato de Projeto'
        | 'Ajustes Finais'
        | 'Emissão Projeto Executivo'
      separacao_status:
        | 'Rascunho'
        | 'Pendente'
        | 'Em separação'
        | 'Pronto'
        | 'Enviado'
        | 'Cancelado'
      sinal_status: 'pendente' | 'recebido' | 'creditado' | 'receita_servico'
      solicitacao_status:
        | 'pendente'
        | 'aprovada'
        | 'rejeitada'
        | 'comprada'
        | 'cancelada'
      status_pagamento:
        | 'Pendente'
        | 'Parcialmente Pago'
        | 'Pago'
        | 'Atrasado'
        | 'Cancelado'
      tipo_operacao: 'CR' | 'CP'
      tipo_projeto:
        | 'Residential'
        | 'Corporativo'
        | 'Exposição Comercial'
        | 'Paisagismo'
      transacao_tipo: 'receita' | 'despesa' | 'transferencia'
      usuario_role: 'admin' | 'gerente' | 'operador' | 'funcionario' | 'viewer'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      conta_tipo: ['Corrente', 'Poupança', 'CDB', 'Investimento', 'Caixa'],
      contato_tipo: [
        'cliente',
        'arquiteto',
        'engenheiro',
        'eletricista',
        'fornecedor',
        'outro',
      ],
      entrega_status: ['Pendente', 'Em rota', 'Entregue', 'Cancelado'],
      estoque_local: ['Estoque', 'Showroom', 'Em trânsito', 'Reservado'],
      frequencia_tipo: ['mensal', 'trimestral', 'semestral', 'anual'],
      lancamento_status: ['pendente', 'pago', 'cancelado'],
      pagamento_forma: ['pix', 'cartao', 'boleto', 'transferencia', 'cheque'],
      parcela_status: ['pendente', 'paga', 'atrasada', 'cancelada'],
      projeto_nivel: ['1', '2', '3', '4'],
      projeto_status: [
        'Estudo Inicial',
        'Proposta Sinal',
        'Elaboração Orçamento',
        'Informações necessárias',
        'Projeto executivo',
        'Entrega materiais',
        'Ajustes finais',
        'Finalizado',
        'Arquivado',
        'Não Fechou',
        'Venda Docusign',
        'Obra Finalizada',
        'Contrato de Projeto',
        'Ajustes Finais',
        'Emissão Projeto Executivo',
      ],
      separacao_status: [
        'Rascunho',
        'Pendente',
        'Em separação',
        'Pronto',
        'Enviado',
        'Cancelado',
      ],
      sinal_status: ['pendente', 'recebido', 'creditado', 'receita_servico'],
      solicitacao_status: [
        'pendente',
        'aprovada',
        'rejeitada',
        'comprada',
        'cancelada',
      ],
      status_pagamento: [
        'Pendente',
        'Parcialmente Pago',
        'Pago',
        'Atrasado',
        'Cancelado',
      ],
      tipo_operacao: ['CR', 'CP'],
      tipo_projeto: [
        'Residential',
        'Corporativo',
        'Exposição Comercial',
        'Paisagismo',
      ],
      transacao_tipo: ['receita', 'despesa', 'transferencia'],
      usuario_role: ['admin', 'gerente', 'operador', 'funcionario', 'viewer'],
    },
  },
} as const

// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: avaliacoes
//   id: uuid (not null, default: gen_random_uuid())
//   funcionario_id: uuid (not null)
//   avaliador_id: uuid (nullable)
//   periodo: text (not null)
//   nota: numeric (nullable)
//   comentarios: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: candidatos
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   email: text (nullable)
//   telefone: character varying (nullable)
//   cargo_pretendido: text (nullable)
//   departamento_id: uuid (nullable)
//   status: text (not null, default: 'Em análise'::text)
//   curriculo_url: text (nullable)
//   observacoes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: categorias_financeiras
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   tipo: transacao_tipo (not null)
//   grupo: text (not null)
//   icone: text (nullable)
//   ativo: boolean (not null, default: true)
//   created_at: timestamp with time zone (not null, default: now())
// Table: conta_pagar
//   id: uuid (not null, default: gen_random_uuid())
//   cod_duplicata: integer (nullable)
//   cod_venda: integer (nullable)
//   num_nota: text (nullable)
//   projeto_id: uuid (nullable)
//   venda_id: uuid (nullable)
//   cod_pessoa: integer (nullable)
//   nome_pessoa: text (not null)
//   cod_empresa: integer (nullable)
//   nome_empresa: text (nullable)
//   valor_duplicata: numeric (not null, default: 0)
//   valor_parcela: numeric (not null, default: 0)
//   valor_desconto: numeric (nullable, default: 0)
//   valor_juros: numeric (nullable, default: 0)
//   valor_pago: numeric (nullable, default: 0)
//   valor_frete: numeric (nullable, default: 0)
//   valor_ipi: numeric (nullable, default: 0)
//   valor_st: numeric (nullable, default: 0)
//   numero_parcela: integer (nullable)
//   total_parcelas: integer (nullable)
//   data_emissao: date (nullable)
//   data_vencimento: date (nullable)
//   data_pagamento: timestamp without time zone (nullable)
//   data_baixa: timestamp without time zone (nullable)
//   data_ultimo_pagamento: timestamp without time zone (nullable)
//   pago: integer (nullable, default: 0)
//   status_pagamento: status_pagamento (nullable, default: 'Pendente'::status_pagamento)
//   tipo_operacao: tipo_operacao (nullable, default: 'CP'::tipo_operacao)
//   tipo_pagamento: text (nullable)
//   desc_apropriacao: text (nullable)
//   lancamento: integer (nullable, default: 0)
//   layout_boleto: numeric (nullable)
//   nosso_numero: integer (nullable)
//   observacao: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: conta_receber
//   id: uuid (not null, default: gen_random_uuid())
//   cod_duplicata: integer (nullable)
//   cod_venda: integer (nullable)
//   num_nota: text (nullable)
//   projeto_id: uuid (nullable)
//   venda_id: uuid (nullable)
//   cod_pessoa: integer (nullable)
//   nome_pessoa: text (not null)
//   cod_empresa: integer (nullable)
//   nome_empresa: text (nullable)
//   valor_duplicata: numeric (not null, default: 0)
//   valor_parcela: numeric (not null, default: 0)
//   valor_desconto: numeric (nullable, default: 0)
//   valor_juros: numeric (nullable, default: 0)
//   valor_pago: numeric (nullable, default: 0)
//   valor_frete: numeric (nullable, default: 0)
//   valor_ipi: numeric (nullable, default: 0)
//   valor_st: numeric (nullable, default: 0)
//   numero_parcela: integer (nullable)
//   total_parcelas: integer (nullable)
//   data_emissao: date (nullable)
//   data_vencimento: date (nullable)
//   data_pagamento: timestamp without time zone (nullable)
//   data_baixa: timestamp without time zone (nullable)
//   data_ultimo_pagamento: timestamp without time zone (nullable)
//   pago: integer (nullable, default: 0)
//   status_pagamento: status_pagamento (nullable, default: 'Pendente'::status_pagamento)
//   tipo_operacao: tipo_operacao (nullable, default: 'CR'::tipo_operacao)
//   tipo_pagamento: text (nullable)
//   desc_apropriacao: text (nullable)
//   nome_funcionario: text (nullable)
//   lancamento: integer (nullable, default: 0)
//   layout_boleto: numeric (nullable)
//   nosso_numero: integer (nullable)
//   observacao: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: contas_bancarias
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   tipo: conta_tipo (not null)
//   saldo: numeric (not null, default: 0)
//   banco: text (nullable)
//   agencia: character varying (nullable)
//   conta: character varying (nullable)
//   status: text (not null, default: 'Ativa'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: contatos
//   id: uuid (not null, default: gen_random_uuid())
//   codigo_legado: bigint (nullable)
//   tipo: contato_tipo (not null)
//   nome: text (not null)
//   nome_empresa: text (nullable)
//   cpf_cnpj: character varying (nullable)
//   rg: character varying (nullable)
//   email: character varying (nullable)
//   email_financeiro: character varying (nullable)
//   telefone: character varying (nullable)
//   celular: character varying (nullable)
//   endereco: text (nullable)
//   bairro: character varying (nullable)
//   cep: character varying (nullable)
//   cidade: character varying (nullable)
//   estado: character varying (nullable)
//   data_nascimento: date (nullable)
//   observacoes: text (nullable)
//   ativo: boolean (nullable, default: true)
//   created_at: timestamp with time zone (nullable, default: now())
//   created_by: uuid (nullable)
//   endereco_comercial: text (nullable)
//   bairro_comercial: character varying (nullable)
//   cep_comercial: character varying (nullable)
//   cidade_comercial: character varying (nullable)
//   estado_comercial: character varying (nullable)
//   especialidade: text (nullable)
//   updated_at: timestamp with time zone (nullable)
// Table: controle_falta
//   id: uuid (not null, default: gen_random_uuid())
//   funcionario_id: uuid (not null)
//   data: date (not null)
//   hora_entrada: time without time zone (nullable)
//   hora_saida: time without time zone (nullable)
//   total_horas: numeric (nullable)
//   status: text (nullable)
//   justificativa: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: custos_recorrentes
//   id: uuid (not null, default: gen_random_uuid())
//   categoria_id: uuid (nullable)
//   conta_id: uuid (nullable)
//   descricao: text (not null)
//   valor: numeric (not null)
//   dia_vencimento: integer (nullable)
//   frequencia: frequencia_tipo (not null, default: 'mensal'::frequencia_tipo)
//   data_inicio: date (not null)
//   data_fim: date (nullable)
//   ativo: boolean (not null, default: true)
//   created_by: uuid (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: custos_recorrentes_lancamentos
//   id: uuid (not null, default: gen_random_uuid())
//   custo_id: uuid (not null)
//   competencia: date (not null)
//   data_vencimento: date (not null)
//   data_pagamento: date (nullable)
//   valor_original: numeric (not null)
//   valor_pago: numeric (nullable)
//   juros: numeric (not null, default: 0)
//   multa: numeric (not null, default: 0)
//   desconto: numeric (not null, default: 0)
//   status: lancamento_status (not null, default: 'pendente'::lancamento_status)
//   transacao_id: uuid (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: departamentos
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   descricao: text (nullable)
//   ativo: boolean (not null, default: true)
//   created_at: timestamp with time zone (not null, default: now())
// Table: entregas
//   id: uuid (not null, default: gen_random_uuid())
//   separacao_id: uuid (nullable)
//   projeto_id: uuid (nullable)
//   entregador_id: uuid (nullable)
//   endereco_entrega: text (nullable)
//   contato_destino: text (nullable)
//   delivery_type: text (not null, default: 'flexible'::text)
//   scheduled_time: time without time zone (nullable)
//   data_prevista: date (nullable)
//   data_entrega: date (nullable)
//   status: entrega_status (not null, default: 'Pendente'::entrega_status)
//   comprovante_url: text (nullable)
//   avaliacao: integer (nullable)
//   observacoes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: estoque_itens
//   id: uuid (not null, default: gen_random_uuid())
//   produto_id: uuid (not null)
//   local: estoque_local (not null, default: 'Estoque'::estoque_local)
//   quantidade: numeric (not null, default: 0)
//   atualizado_por: uuid (nullable)
//   atualizado_em: timestamp with time zone (not null, default: now())
// Table: ferias
//   id: uuid (not null, default: gen_random_uuid())
//   funcionario_id: uuid (not null)
//   data_inicio: date (not null)
//   data_fim: date (not null)
//   dias: integer (not null)
//   status: text (not null, default: 'Pendente'::text)
//   aprovado_por: uuid (nullable)
//   observacoes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   periodo_aquisitivo_id: uuid (not null)
// Table: folha_pagamento
//   id: uuid (not null, default: gen_random_uuid())
//   funcionario_id: uuid (not null)
//   mes: integer (not null)
//   ano: integer (not null)
//   salario_base: numeric (not null)
//   descontos: numeric (not null, default: 0)
//   adicionais: numeric (not null, default: 0)
//   salario_liquido: numeric (not null)
//   data_geracao: timestamp with time zone (not null, default: now())
//   comissao: numeric (not null, default: 0)
//   dias_trabalhados: integer (nullable, default: 0)
//   dias_abonados: integer (nullable, default: 0)
//   dias_falta: integer (nullable, default: 0)
//   valor_vr_vt: numeric (nullable, default: 0)
// Table: funcionarios
//   id: uuid (not null, default: gen_random_uuid())
//   usuario_id: uuid (nullable)
//   departamento_id: uuid (nullable)
//   nome: text (not null)
//   email: text (not null)
//   telefone: character varying (nullable)
//   cpf: character varying (nullable)
//   rg: character varying (nullable)
//   cargo: text (nullable)
//   salario_base: numeric (nullable)
//   data_admissao: date (nullable)
//   data_demissao: date (nullable)
//   status: text (not null, default: 'Ativo'::text)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   comissao_padrao: numeric (nullable, default: 0)
//   empresa: text (nullable)
//   valor_vr: numeric (nullable, default: 0)
//   valor_vt: numeric (nullable, default: 0)
//   data_aniversario: date (nullable)
//   salario_liquido: numeric (nullable, default: 0)
//   endereco_completo: text (nullable)
//   salario_por_fora: numeric (nullable, default: 0)
//   tipo_contratacao: text (nullable)
//   data_elegibilidade_ferias: date (nullable)
//   valor_vt_dia: numeric (nullable, default: 0.00)
// Table: marcas
//   id: uuid (not null, default: gen_random_uuid())
//   nome: text (not null)
//   ativo: boolean (not null, default: true)
//   created_at: timestamp with time zone (not null, default: now())
// Table: pedido_compra
//   id: uuid (not null, default: gen_random_uuid())
//   codigo_pedido: integer (not null)
//   cod_fornecedor: integer (not null)
//   nome_fornecedor: text (not null)
//   valor_nota: numeric (not null, default: 0)
//   valor_duplicata: numeric (nullable, default: 0)
//   numero_parcela: integer (nullable)
//   data_emissao: date (not null)
//   data_vencimento: date (nullable)
//   status: text (nullable, default: 'Pendente'::text)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: periodos_aquisitivos
//   id: uuid (not null, default: gen_random_uuid())
//   funcionario_id: uuid (not null)
//   data_inicio: date (not null)
//   data_fim: date (not null)
//   data_limite_gozo: date (not null)
//   status: text (nullable, default: 'Ativo'::text)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: produtos
//   id: uuid (not null, default: gen_random_uuid())
//   marca_id: uuid (nullable)
//   nome: text (not null)
//   sku: text (nullable)
//   categoria: text (nullable)
//   preco_custo: numeric (nullable)
//   preco_venda: numeric (nullable)
//   ativo: boolean (not null, default: true)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   codigo_produto: integer (nullable)
//   referencia: text (nullable)
//   cod_marca: integer (nullable)
//   nome_marca: text (nullable)
//   cod_categoria: integer (nullable)
//   nome_categoria: text (nullable)
//   estoque_total: numeric (nullable, default: 0)
//   estoque_showroom: integer (nullable, default: 0)
//   estoque_disponivel: numeric (nullable, default: 0)
//   unidade: text (nullable, default: 'UN'::text)
//   custo_total: numeric (nullable, default: 0)
//   percentual_lucro: numeric (nullable, default: 0)
//   valor_venda: numeric (nullable, default: 0)
// Table: profiles
//   id: uuid (not null)
//   full_name: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
//   role: text (not null, default: 'visitante'::text)
// Table: projeto_itens
//   id: uuid (not null, default: gen_random_uuid())
//   projeto_id: uuid (not null)
//   produto_id: uuid (nullable)
//   descricao: text (not null)
//   quantidade: numeric (not null)
//   preco_unitario: numeric (not null)
//   desconto: numeric (not null, default: 0)
//   subtotal: numeric (nullable)
//   validado: boolean (not null, default: false)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: projeto_parcelas
//   id: uuid (not null, default: gen_random_uuid())
//   projeto_id: uuid (not null)
//   numero_parcela: integer (not null)
//   valor: numeric (not null)
//   data_fechamento: date (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   status: parcela_status (not null, default: 'pendente'::parcela_status)
//   data_vencimento: date (nullable)
//   data_pagamento: date (nullable)
//   valor_pago: numeric (nullable)
//   juros: numeric (not null, default: 0)
//   multa: numeric (not null, default: 0)
//   desconto: numeric (not null, default: 0)
//   forma_pagamento: pagamento_forma (nullable)
//   comprovante_url: text (nullable)
//   observacoes: text (nullable)
//   transacao_id: uuid (nullable)
//   descricao: text (nullable)
//   venda_id: uuid (nullable)
// Table: projeto_parcelas_backup_migration
//   id: uuid (nullable)
//   projeto_id: uuid (nullable)
//   numero_parcela: integer (nullable)
//   valor: numeric (nullable)
//   data_fechamento: date (nullable)
//   created_at: timestamp with time zone (nullable)
//   status: parcela_status (nullable)
//   data_vencimento: date (nullable)
//   data_pagamento: date (nullable)
//   valor_pago: numeric (nullable)
//   juros: numeric (nullable)
//   multa: numeric (nullable)
//   desconto: numeric (nullable)
//   forma_pagamento: pagamento_forma (nullable)
//   comprovante_url: text (nullable)
//   observacoes: text (nullable)
//   transacao_id: uuid (nullable)
//   descricao: text (nullable)
// Table: projeto_produtos
//   id: uuid (not null, default: gen_random_uuid())
//   projeto_id: uuid (nullable)
//   produto_id: uuid (nullable)
//   quantidade: numeric (not null, default: 1)
//   valor_unitario: numeric (nullable)
//   valor_total: numeric (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: projeto_sinal
//   id: uuid (not null, default: gen_random_uuid())
//   projeto_id: uuid (not null)
//   valor: numeric (not null)
//   data_pagamento: date (nullable)
//   forma_pagamento: pagamento_forma (nullable)
//   status: sinal_status (not null, default: 'pendente'::sinal_status)
//   transacao_id: uuid (nullable)
//   comprovante_url: text (nullable)
//   observacoes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: projetos
//   id: uuid (not null, default: gen_random_uuid())
//   codigo: character varying (not null)
//   nome: text (not null)
//   nivel_estrategico: projeto_nivel (nullable)
//   status: projeto_status (nullable, default: 'Estudo Inicial'::projeto_status)
//   cidade: character varying (nullable)
//   estado: character varying (nullable)
//   data_entrada: date (nullable)
//   arquivado: boolean (nullable, default: false)
//   cliente_id: uuid (nullable)
//   arquiteto_id: uuid (nullable)
//   responsavel_id: uuid (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   historico: jsonb (not null, default: '[]'::jsonb)
//   responsavel_nome: text (nullable)
//   created_by: uuid (nullable)
//   responsavel_obra_id: uuid (nullable)
//   updated_at: timestamp with time zone (not null, default: now())
//   client_id: uuid (nullable)
//   area_do_projeto: jsonb (nullable)
// Table: projetos_fechados
//   id: uuid (not null, default: gen_random_uuid())
//   cod: text (nullable)
//   valor_fechado: numeric (nullable)
//   data_fechamento: date (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: separacao_arquivos
//   id: uuid (not null, default: gen_random_uuid())
//   separacao_id: uuid (not null)
//   nome: text (not null)
//   url: text (not null)
//   tipo_mime: text (nullable)
//   tamanho_kb: integer (nullable)
//   created_at: timestamp with time zone (not null, default: now())
// Table: separacao_itens
//   id: uuid (not null, default: gen_random_uuid())
//   separacao_id: uuid (not null)
//   descricao: text (not null)
//   quantidade: numeric (not null, default: 1)
//   unidade: character varying (nullable)
//   observacoes: text (nullable)
//   separado: boolean (not null, default: false)
//   created_at: timestamp with time zone (not null, default: now())
//   produto_id: uuid (nullable)
// Table: separacoes
//   id: uuid (not null, default: gen_random_uuid())
//   projeto_id: uuid (nullable)
//   responsavel_id: uuid (nullable)
//   status: separacao_status (not null, default: 'Pendente'::separacao_status)
//   observacoes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
//   endereco_entrega: text (nullable)
//   delivery_type: text (nullable, default: 'flexible'::text)
//   scheduled_time: time without time zone (nullable)
//   data_entrega: date (nullable)
//   cliente: text (nullable)
//   codigo_obra: text (nullable)
//   data_entrega_original: date (nullable)
//   reagendamentos: integer (not null, default: 0)
//   cliente_id: uuid (nullable)
// Table: solicitacoes_compra
//   id: uuid (not null, default: gen_random_uuid())
//   solicitante_id: uuid (not null)
//   aprovador_id: uuid (nullable)
//   categoria_id: uuid (nullable)
//   projeto_id: uuid (nullable)
//   descricao: text (not null)
//   justificativa: text (nullable)
//   valor_estimado: numeric (not null)
//   valor_aprovado: numeric (nullable)
//   status: solicitacao_status (not null, default: 'pendente'::solicitacao_status)
//   data_aprovacao: date (nullable)
//   data_compra: date (nullable)
//   comprovante_url: text (nullable)
//   transacao_id: uuid (nullable)
//   observacoes: text (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   updated_at: timestamp with time zone (not null, default: now())
// Table: staging_conta_pagar
//   tipo_operacao: text (nullable)
//   cod_empresa: integer (nullable)
//   nm_empresa: text (nullable)
//   cod_duplicata: integer (nullable)
//   cod_venda: numeric (nullable)
//   num_nota: text (nullable)
//   cod_pessoa: integer (nullable)
//   nm_pessoa: text (nullable)
//   nm_funcionario: text (nullable)
//   razaosocial: text (nullable)
//   fantasia: text (nullable)
//   cpf_cnpj: text (nullable)
//   rgie: text (nullable)
//   logradouro: text (nullable)
//   numero: text (nullable)
//   complemento: text (nullable)
//   bairro: text (nullable)
//   cidade: text (nullable)
//   estado: text (nullable)
//   cep: text (nullable)
//   telefone: text (nullable)
//   celular: text (nullable)
//   email: text (nullable)
//   email_financeiro: text (nullable)
//   desc_apropriacao: text (nullable)
//   tipo_pagamento: text (nullable)
//   dt_emissao: text (nullable)
//   dt_vencimento: text (nullable)
//   dt_pagamento: text (nullable)
//   data_baixa: text (nullable)
//   dt_ultimo_pgto: text (nullable)
//   vl_duplicata: numeric (nullable)
//   vl_parcela: numeric (nullable)
//   vl_desconto: numeric (nullable)
//   vl_juros: numeric (nullable)
//   vl_pago: numeric (nullable)
//   pago: integer (nullable)
//   vl_frete: numeric (nullable)
//   vl_ipi: numeric (nullable)
//   vl_st: numeric (nullable)
//   num_parc: integer (nullable)
//   total_parc: integer (nullable)
//   lancamento: integer (nullable)
//   layout_boleto: numeric (nullable)
//   nosso_numero: integer (nullable)
//   observacao: text (nullable)
//   importado_em: timestamp with time zone (nullable, default: now())
//   processado: boolean (nullable, default: false)
//   linha_excel: integer (nullable)
// Table: staging_conta_receber
//   tipo_operacao: text (nullable)
//   cod_empresa: integer (nullable)
//   nm_empresa: text (nullable)
//   cod_duplicata: integer (nullable)
//   cod_venda: numeric (nullable)
//   num_nota: text (nullable)
//   cod_pessoa: integer (nullable)
//   nm_pessoa: text (nullable)
//   nm_funcionario: text (nullable)
//   razaosocial: text (nullable)
//   fantasia: text (nullable)
//   cpf_cnpj: text (nullable)
//   rgie: text (nullable)
//   logradouro: text (nullable)
//   numero: text (nullable)
//   complemento: text (nullable)
//   bairro: text (nullable)
//   cidade: text (nullable)
//   estado: text (nullable)
//   cep: text (nullable)
//   telefone: text (nullable)
//   celular: text (nullable)
//   email: text (nullable)
//   email_financeiro: text (nullable)
//   desc_apropriacao: text (nullable)
//   tipo_pagamento: text (nullable)
//   dt_emissao: text (nullable)
//   dt_vencimento: text (nullable)
//   dt_pagamento: text (nullable)
//   data_baixa: text (nullable)
//   dt_ultimo_pgto: text (nullable)
//   vl_duplicata: numeric (nullable)
//   vl_parcela: numeric (nullable)
//   vl_desconto: numeric (nullable)
//   vl_juros: numeric (nullable)
//   vl_pago: numeric (nullable)
//   pago: integer (nullable)
//   vl_frete: numeric (nullable)
//   vl_ipi: numeric (nullable)
//   vl_st: numeric (nullable)
//   num_parc: integer (nullable)
//   total_parc: integer (nullable)
//   lancamento: integer (nullable)
//   layout_boleto: numeric (nullable)
//   nosso_numero: integer (nullable)
//   observacao: text (nullable)
//   importado_em: timestamp with time zone (nullable, default: now())
//   processado: boolean (nullable, default: false)
//   linha_excel: integer (nullable)
// Table: staging_import_bruto
//   COD: text (nullable)
//   CLIENTE: text (nullable)
//   PARCELA/COLUNA3: text (nullable)
//   DATA: text (nullable)
//   PROJETISTA: text (nullable)
//   VALOR FECHADO: text (nullable)
//   CAUSA PAGAMENTO: text (nullable)
//   FORMA PAGAMENTO: text (nullable)
//   DATA FECHAMENTO: text (nullable)
//   ARQUITETO: text (nullable)
//   LINHA ORIGINAL: text (nullable)
// Table: staging_pedido_compra
//   codigo_pedido: integer (nullable)
//   cod_fornecedor: integer (nullable)
//   nm_fornecedor: text (nullable)
//   emissao_pedido: text (nullable)
//   vl_nota: numeric (nullable)
//   num_parc: numeric (nullable)
//   dt_vencimento: text (nullable)
//   vl_duplicata: numeric (nullable)
//   importado_em: timestamp with time zone (nullable, default: now())
//   processado: boolean (nullable, default: false)
//   linha_excel: integer (nullable)
// Table: staging_produtos
//   codproduto: integer (nullable)
//   referencia: text (nullable)
//   descproduto: text (nullable)
//   codmarca: numeric (nullable)
//   descmarca: text (nullable)
//   codcategoria: integer (nullable)
//   desccategoria: text (nullable)
//   estoquetotal: numeric (nullable)
//   showroom: integer (nullable)
//   disponivel: numeric (nullable)
//   unidade: text (nullable)
//   custototal: text (nullable)
//   lucro: numeric (nullable)
//   valorvenda: numeric (nullable)
//   importado_em: timestamp with time zone (nullable, default: now())
//   processado: boolean (nullable, default: false)
//   linha_excel: integer (nullable)
// Table: sync_history
//   id: bigint (not null)
//   status: text (nullable)
//   mensagem: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   registros_atualizados: integer (not null, default: 0)
//   registros_inseridos: integer (not null, default: 0)
//   registros_erro: integer (not null, default: 0)
//   executado_por: uuid (nullable)
//   origem: text (nullable)
//   tipo: text (nullable)
// Table: transacoes
//   id: uuid (not null, default: gen_random_uuid())
//   conta_id: uuid (not null)
//   projeto_id: uuid (nullable)
//   parcela_id: uuid (nullable)
//   tipo: transacao_tipo (not null)
//   descricao: text (not null)
//   valor: numeric (not null)
//   data_transacao: date (not null)
//   comprovante_url: text (nullable)
//   created_by: uuid (nullable)
//   created_at: timestamp with time zone (not null, default: now())
//   categoria_id: uuid (nullable)
// Table: transactions
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   date: date (not null)
//   description: text (not null)
//   category: text (not null)
//   type: text (not null)
//   amount: numeric (not null)
//   payment_method: text (not null)
//   notes: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: usuarios
//   id: uuid (not null)
//   email: text (not null)
//   nome: text (not null)
//   role: usuario_role (nullable)
//   ativo: boolean (nullable, default: true)
//   created_at: timestamp with time zone (nullable, default: now())
//   avatar_url: text (nullable)
//   updated_at: timestamp with time zone (nullable)
// Table: vendas
//   id: uuid (not null, default: gen_random_uuid())
//   cod_venda: integer (nullable)
//   num_nota: text (nullable)
//   projeto_id: uuid (nullable)
//   cod_cliente: integer (nullable)
//   nome_cliente: text (not null)
//   valor_total: numeric (not null, default: 0)
//   valor_pago: numeric (nullable, default: 0)
//   valor_pendente: numeric (nullable, default: 0)
//   total_parcelas: integer (nullable, default: 1)
//   parcelas_pagas: integer (nullable, default: 0)
//   data_emissao: date (nullable)
//   data_vencimento: date (nullable)
//   data_pagamento: timestamp without time zone (nullable)
//   status_pagamento: status_pagamento (nullable, default: 'Pendente'::status_pagamento)
//   tipo_pagamento: text (nullable)
//   desc_apropriacao: text (nullable)
//   observacao: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: vendas_marca
//   id: uuid (not null, default: gen_random_uuid())
//   marca_id: uuid (not null)
//   mes: integer (not null)
//   ano: integer (not null)
//   valor_custo: numeric (not null, default: 0)
//   valor_venda: numeric (not null, default: 0)
//   created_at: timestamp with time zone (not null, default: now())
// Table: vw_calculo_vt_mensal
//   funcionario_id: uuid (nullable)
//   funcionario_nome: text (nullable)
//   empresa: text (nullable)
//   valor_vt_dia: numeric (nullable)
//   total_faltas_integrais: bigint (nullable)
//   total_meio_periodo: bigint (nullable)
// Table: vw_conta_pagar_aberto
//   id: uuid (nullable)
//   fornecedor: text (nullable)
//   valor_parcela: numeric (nullable)
//   valor_pago: numeric (nullable)
//   saldo: numeric (nullable)
//   data_vencimento: date (nullable)
//   situacao: text (nullable)
// Table: vw_conta_receber_aberto
//   id: uuid (nullable)
//   cliente: text (nullable)
//   valor_parcela: numeric (nullable)
//   valor_pago: numeric (nullable)
//   saldo: numeric (nullable)
//   data_vencimento: date (nullable)
//   situacao: text (nullable)
// Table: vw_controle_ferias_clt
//   funcionario_id: uuid (nullable)
//   funcionario_nome: text (nullable)
//   direito_total_acumulado: bigint (nullable)
//   total_gozado: bigint (nullable)
//   saldo_disponivel: bigint (nullable)
// Table: vw_custos_pendentes_mes
//   descricao: text (nullable)
//   categoria: text (nullable)
//   data_vencimento: date (nullable)
//   valor_original: numeric (nullable)
//   status: lancamento_status (nullable)
//   conta: text (nullable)
// Table: vw_dashboard_crm_fechamento
//   mes: timestamp with time zone (nullable)
//   total_projetos: bigint (nullable)
//   total_clientes: bigint (nullable)
//   valor_total: numeric (nullable)
//   projetos_residenciais: bigint (nullable)
//   projetos_corporativos: bigint (nullable)
//   projetos_comerciais: bigint (nullable)
//   projetos_paisagismo: bigint (nullable)
// Table: vw_estoque_liquido
//   produto_id: uuid (nullable)
//   produto: text (nullable)
//   sku: text (nullable)
//   marca: text (nullable)
//   categoria: text (nullable)
//   preco_custo: numeric (nullable)
//   preco_venda: numeric (nullable)
//   qtd_fisico: numeric (nullable)
//   qtd_reservado: numeric (nullable)
//   qtd_showroom: numeric (nullable)
//   qtd_em_transito: numeric (nullable)
//   qtd_disponivel: numeric (nullable)
//   alerta_estoque: text (nullable)
//   valor_estoque_total: numeric (nullable)
//   valor_reservado_total: numeric (nullable)
// Table: vw_estoque_por_marca
//   marca: text (nullable)
//   skus_total: bigint (nullable)
//   qtd_estoque: numeric (nullable)
//   qtd_showroom: numeric (nullable)
//   valor_disponivel_venda: numeric (nullable)
// Table: vw_estoque_produtos
//   codigo_produto: integer (nullable)
//   referencia: text (nullable)
//   descricao: text (nullable)
//   marca: text (nullable)
//   categoria: text (nullable)
//   estoque_total: numeric (nullable)
//   estoque_showroom: integer (nullable)
//   estoque_disponivel: numeric (nullable)
//   valor_venda: numeric (nullable)
//   status_estoque: text (nullable)
// Table: vw_financeiro_projetos
//   id: uuid (nullable)
//   codigo: character varying (nullable)
//   nome: text (nullable)
//   status: projeto_status (nullable)
//   client_id: uuid (nullable)
//   cliente_nome: text (nullable)
//   valor_total: numeric (nullable)
//   valor_recebido: numeric (nullable)
//   valor_pendente: numeric (nullable)
//   total_parcelas: bigint (nullable)
//   parcelas_pagas: bigint (nullable)
//   parcelas_pendentes: bigint (nullable)
// Table: vw_fluxo_caixa_projetado
//   mes: timestamp with time zone (nullable)
//   a_receber: numeric (nullable)
//   recebido: numeric (nullable)
//   atrasado: numeric (nullable)
//   qtd_pendente: bigint (nullable)
//   qtd_atrasado: bigint (nullable)
// Table: vw_historico_faltas
//   funcionario_id: uuid (nullable)
//   funcionario_nome: text (nullable)
//   data_falta: date (nullable)
//   status: text (nullable)
//   justificativa: text (nullable)
//   periodo_id: uuid (nullable)
//   data_inicio: date (nullable)
//   data_fim: date (nullable)
// Table: vw_projetos_pipeline
//   id: uuid (nullable)
//   codigo: character varying (nullable)
//   nome: text (nullable)
//   status: projeto_status (nullable)
//   data_entrada: date (nullable)
//   tipo_projeto: text (nullable)
//   client_id: uuid (nullable)
//   cliente_nome: text (nullable)
//   valor_total: numeric (nullable)
// Table: vw_projetos_por_status
//   status: projeto_status (nullable)
//   total_projetos: bigint (nullable)
//   total_clientes: bigint (nullable)
//   valor_total: numeric (nullable)
// Table: vw_projetos_resumo
//   id: uuid (nullable)
//   codigo: character varying (nullable)
//   status: projeto_status (nullable)
//   total_vendas: bigint (nullable)
//   valor_total_vendas: numeric (nullable)
//   valor_pago: numeric (nullable)
//   valor_pendente: numeric (nullable)
// Table: vw_rh_resumo
//   departamento: text (nullable)
//   total_funcionarios: bigint (nullable)
//   ativos: bigint (nullable)
//   salario_medio: numeric (nullable)
//   folha_total: numeric (nullable)
// Table: vw_separacoes_agenda
//   separacao_id: uuid (nullable)
//   separacao_status: separacao_status (nullable)
//   data_entrega: date (nullable)
//   data_entrega_original: date (nullable)
//   reagendamentos: integer (nullable)
//   codigo_obra: text (nullable)
//   cliente: text (nullable)
//   endereco_entrega: text (nullable)
//   delivery_type: text (nullable)
//   scheduled_time: time without time zone (nullable)
//   observacoes: text (nullable)
//   projeto_id: uuid (nullable)
//   projeto_codigo: character varying (nullable)
//   projeto_nome: text (nullable)
//   projeto_status: projeto_status (nullable)
//   cliente_nome: text (nullable)
//   entrega_id: uuid (nullable)
//   entrega_status: entrega_status (nullable)
//   entregador_id: uuid (nullable)
//   entregador_nome: text (nullable)
//   total_itens: bigint (nullable)
//   itens_separados: bigint (nullable)
//   dias_ate_entrega: integer (nullable)
//   urgencia: text (nullable)
//   created_at: timestamp with time zone (nullable)
//   updated_at: timestamp with time zone (nullable)
// Table: vw_staging_resumo
//   tabela: text (nullable)
//   total: bigint (nullable)
//   processados: bigint (nullable)
//   pendentes: bigint (nullable)
//   primeira_importacao: timestamp with time zone (nullable)
//   ultima_importacao: timestamp with time zone (nullable)
// Table: vw_vendas_loja
//   produto_id: uuid (nullable)
//   produto: text (nullable)
//   sku: text (nullable)
//   marca: text (nullable)
//   categoria: text (nullable)
//   quantidade: numeric (nullable)
//   preco_custo: numeric (nullable)
//   preco_venda: numeric (nullable)
//   margem_total: numeric (nullable)
//   separacao_id: uuid (nullable)
//   data_venda: timestamp with time zone (nullable)
//   cliente: text (nullable)
//   observacoes: text (nullable)
// Table: vw_vendas_por_projeto
//   produto_id: uuid (nullable)
//   produto: text (nullable)
//   sku: text (nullable)
//   marca: text (nullable)
//   categoria: text (nullable)
//   quantidade: numeric (nullable)
//   preco_custo: numeric (nullable)
//   preco_venda: numeric (nullable)
//   margem_total: numeric (nullable)
//   separacao_id: uuid (nullable)
//   data_separacao: timestamp with time zone (nullable)
//   projeto_id: uuid (nullable)
//   projeto_codigo: character varying (nullable)
//   projeto_nome: text (nullable)
//   projeto_status: projeto_status (nullable)
//   cliente: text (nullable)
//   projeto_cidade: character varying (nullable)
//   projeto_estado: character varying (nullable)
// Table: vw_vendas_produtos
//   origem: text (nullable)
//   produto_id: uuid (nullable)
//   produto: text (nullable)
//   sku: text (nullable)
//   marca: text (nullable)
//   categoria: text (nullable)
//   quantidade: numeric (nullable)
//   preco_custo: numeric (nullable)
//   preco_venda: numeric (nullable)
//   margem_total: numeric (nullable)
//   data_venda: timestamp with time zone (nullable)
//   projeto_codigo: character varying (nullable)
//   projeto_nome: text (nullable)
//   cliente: text (nullable)

// --- CONSTRAINTS ---
// Table: avaliacoes
//   FOREIGN KEY avaliacoes_avaliador_id_fkey: FOREIGN KEY (avaliador_id) REFERENCES usuarios(id) ON DELETE SET NULL
//   FOREIGN KEY avaliacoes_funcionario_id_fkey: FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE
//   CHECK avaliacoes_nota_check: CHECK (((nota >= (0)::numeric) AND (nota <= (10)::numeric)))
//   PRIMARY KEY avaliacoes_pkey: PRIMARY KEY (id)
// Table: candidatos
//   FOREIGN KEY candidatos_departamento_id_fkey: FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE SET NULL
//   PRIMARY KEY candidatos_pkey: PRIMARY KEY (id)
//   CHECK candidatos_status_check: CHECK ((status = ANY (ARRAY['Em análise'::text, 'Entrevista agendada'::text, 'Aprovado'::text, 'Reprovado'::text, 'Desistiu'::text])))
// Table: categorias_financeiras
//   CHECK categorias_financeiras_grupo_check: CHECK ((grupo = ANY (ARRAY['fixo'::text, 'variavel'::text, 'investimento'::text, 'transferencia'::text])))
//   UNIQUE categorias_financeiras_nome_key: UNIQUE (nome)
//   PRIMARY KEY categorias_financeiras_pkey: PRIMARY KEY (id)
// Table: conta_pagar
//   PRIMARY KEY conta_pagar_pkey: PRIMARY KEY (id)
//   FOREIGN KEY conta_pagar_projeto_id_fkey: FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE SET NULL
//   FOREIGN KEY conta_pagar_venda_id_fkey: FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE SET NULL
// Table: conta_receber
//   PRIMARY KEY conta_receber_pkey: PRIMARY KEY (id)
//   FOREIGN KEY conta_receber_projeto_id_fkey: FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE SET NULL
//   FOREIGN KEY conta_receber_venda_id_fkey: FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE SET NULL
// Table: contas_bancarias
//   PRIMARY KEY contas_bancarias_pkey: PRIMARY KEY (id)
//   CHECK contas_bancarias_status_check: CHECK ((status = ANY (ARRAY['Ativa'::text, 'Encerrada'::text])))
// Table: contatos
//   FOREIGN KEY contatos_created_by_fkey: FOREIGN KEY (created_by) REFERENCES auth.users(id)
//   PRIMARY KEY contatos_pkey: PRIMARY KEY (id)
//   UNIQUE uq_contatos_codigo_legado_tipo: UNIQUE (codigo_legado, tipo)
//   UNIQUE uq_contatos_cpf_cnpj: UNIQUE (cpf_cnpj)
// Table: controle_falta
//   UNIQUE controle_ponto_funcionario_id_data_key: UNIQUE (funcionario_id, data)
//   FOREIGN KEY controle_ponto_funcionario_id_fkey: FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE
//   PRIMARY KEY controle_ponto_pkey: PRIMARY KEY (id)
//   CHECK controle_ponto_status_check: CHECK ((status = ANY (ARRAY['presente'::text, 'ausente'::text, 'atraso'::text, 'meio_periodo'::text, 'atestado'::text, 'licenca_maternidade'::text, 'falta_injustificada'::text, 'licenca_paternidade'::text, 'licenca_obito'::text, 'licenca_casamento'::text, 'licenca_militar'::text, 'licenca_medica'::text])))
// Table: custos_recorrentes
//   FOREIGN KEY custos_recorrentes_categoria_id_fkey: FOREIGN KEY (categoria_id) REFERENCES categorias_financeiras(id) ON DELETE SET NULL
//   FOREIGN KEY custos_recorrentes_conta_id_fkey: FOREIGN KEY (conta_id) REFERENCES contas_bancarias(id) ON DELETE SET NULL
//   FOREIGN KEY custos_recorrentes_created_by_fkey: FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
//   CHECK custos_recorrentes_dia_vencimento_check: CHECK (((dia_vencimento >= 1) AND (dia_vencimento <= 31)))
//   PRIMARY KEY custos_recorrentes_pkey: PRIMARY KEY (id)
//   CHECK custos_recorrentes_valor_check: CHECK ((valor > (0)::numeric))
// Table: custos_recorrentes_lancamentos
//   UNIQUE custos_recorrentes_lancamentos_custo_id_competencia_key: UNIQUE (custo_id, competencia)
//   FOREIGN KEY custos_recorrentes_lancamentos_custo_id_fkey: FOREIGN KEY (custo_id) REFERENCES custos_recorrentes(id) ON DELETE CASCADE
//   CHECK custos_recorrentes_lancamentos_desconto_check: CHECK ((desconto >= (0)::numeric))
//   CHECK custos_recorrentes_lancamentos_juros_check: CHECK ((juros >= (0)::numeric))
//   CHECK custos_recorrentes_lancamentos_multa_check: CHECK ((multa >= (0)::numeric))
//   PRIMARY KEY custos_recorrentes_lancamentos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY custos_recorrentes_lancamentos_transacao_id_fkey: FOREIGN KEY (transacao_id) REFERENCES transacoes(id) ON DELETE SET NULL
//   CHECK custos_recorrentes_lancamentos_valor_pago_check: CHECK ((valor_pago >= (0)::numeric))
// Table: departamentos
//   UNIQUE departamentos_nome_key: UNIQUE (nome)
//   PRIMARY KEY departamentos_pkey: PRIMARY KEY (id)
// Table: entregas
//   CHECK entregas_avaliacao_check: CHECK (((avaliacao >= 1) AND (avaliacao <= 5)))
//   CHECK entregas_delivery_type_check: CHECK ((delivery_type = ANY (ARRAY['scheduled'::text, 'flexible'::text])))
//   FOREIGN KEY entregas_entregador_id_fkey: FOREIGN KEY (entregador_id) REFERENCES usuarios(id) ON DELETE SET NULL
//   PRIMARY KEY entregas_pkey: PRIMARY KEY (id)
//   FOREIGN KEY entregas_projeto_id_fkey: FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE SET NULL
//   FOREIGN KEY entregas_separacao_id_fkey: FOREIGN KEY (separacao_id) REFERENCES separacoes(id) ON DELETE SET NULL
// Table: estoque_itens
//   FOREIGN KEY estoque_itens_atualizado_por_fkey: FOREIGN KEY (atualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL
//   PRIMARY KEY estoque_itens_pkey: PRIMARY KEY (id)
//   FOREIGN KEY estoque_itens_produto_id_fkey: FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
//   UNIQUE estoque_itens_produto_id_local_key: UNIQUE (produto_id, local)
// Table: ferias
//   FOREIGN KEY ferias_aprovado_por_fkey: FOREIGN KEY (aprovado_por) REFERENCES usuarios(id) ON DELETE SET NULL
//   FOREIGN KEY ferias_funcionario_id_fkey: FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE
//   FOREIGN KEY ferias_periodo_aquisitivo_id_fkey: FOREIGN KEY (periodo_aquisitivo_id) REFERENCES periodos_aquisitivos(id) ON DELETE SET NULL
//   PRIMARY KEY ferias_pkey: PRIMARY KEY (id)
//   CHECK ferias_status_check: CHECK ((status = ANY (ARRAY['Pendente'::text, 'Aprovado'::text, 'Rejeitado'::text, 'Cancelado'::text])))
// Table: folha_pagamento
//   FOREIGN KEY folha_pagamento_funcionario_id_fkey: FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE
//   UNIQUE folha_pagamento_funcionario_id_mes_ano_key: UNIQUE (funcionario_id, mes, ano)
//   CHECK folha_pagamento_mes_check: CHECK (((mes >= 1) AND (mes <= 12)))
//   PRIMARY KEY folha_pagamento_pkey: PRIMARY KEY (id)
// Table: funcionarios
//   FOREIGN KEY funcionarios_departamento_id_fkey: FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE SET NULL
//   UNIQUE funcionarios_email_key: UNIQUE (email)
//   PRIMARY KEY funcionarios_pkey: PRIMARY KEY (id)
//   CHECK funcionarios_status_check: CHECK ((status = ANY (ARRAY['Ativo'::text, 'Inativo'::text, 'Afastado'::text, 'Ferias'::text])))
//   CHECK funcionarios_tipo_contratacao_check: CHECK ((tipo_contratacao = ANY (ARRAY['CLT'::text, 'PJ'::text])))
//   FOREIGN KEY funcionarios_usuario_id_fkey: FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
// Table: marcas
//   UNIQUE marcas_nome_key: UNIQUE (nome)
//   PRIMARY KEY marcas_pkey: PRIMARY KEY (id)
// Table: pedido_compra
//   UNIQUE pedido_compra_codigo_pedido_key: UNIQUE (codigo_pedido)
//   PRIMARY KEY pedido_compra_pkey: PRIMARY KEY (id)
// Table: periodos_aquisitivos
//   FOREIGN KEY periodos_aquisitivos_funcionario_id_fkey: FOREIGN KEY (funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE
//   PRIMARY KEY periodos_aquisitivos_pkey: PRIMARY KEY (id)
//   CHECK periodos_aquisitivos_status_check: CHECK ((status = ANY (ARRAY['Ativo'::text, 'Concluído'::text, 'Vencido'::text])))
// Table: produtos
//   UNIQUE produtos_codigo_produto_key: UNIQUE (codigo_produto)
//   FOREIGN KEY produtos_marca_id_fkey: FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE SET NULL
//   PRIMARY KEY produtos_pkey: PRIMARY KEY (id)
//   UNIQUE produtos_sku_key: UNIQUE (sku)
// Table: profiles
//   FOREIGN KEY profiles_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id)
//   PRIMARY KEY profiles_pkey: PRIMARY KEY (id)
//   CHECK profiles_role_check: CHECK ((role = ANY (ARRAY['admin'::text, 'colaborador'::text, 'visitante'::text])))
// Table: projeto_itens
//   CHECK projeto_itens_desconto_check: CHECK (((desconto >= (0)::numeric) AND (desconto <= (100)::numeric)))
//   PRIMARY KEY projeto_itens_pkey: PRIMARY KEY (id)
//   CHECK projeto_itens_preco_unitario_check: CHECK ((preco_unitario >= (0)::numeric))
//   FOREIGN KEY projeto_itens_produto_id_fkey: FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL
//   FOREIGN KEY projeto_itens_projeto_id_fkey: FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
//   CHECK projeto_itens_quantidade_check: CHECK ((quantidade > (0)::numeric))
// Table: projeto_parcelas
//   CHECK chk_parcela_valor_positivo: CHECK ((valor > (0)::numeric))
//   CHECK projeto_parcelas_desconto_check: CHECK ((desconto >= (0)::numeric))
//   CHECK projeto_parcelas_juros_check: CHECK ((juros >= (0)::numeric))
//   CHECK projeto_parcelas_multa_check: CHECK ((multa >= (0)::numeric))
//   PRIMARY KEY projeto_parcelas_pkey: PRIMARY KEY (id)
//   FOREIGN KEY projeto_parcelas_projeto_id_fkey: FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
//   UNIQUE projeto_parcelas_projeto_id_numero_parcela_key: UNIQUE (projeto_id, numero_parcela)
//   FOREIGN KEY projeto_parcelas_transacao_id_fkey: FOREIGN KEY (transacao_id) REFERENCES transacoes(id) ON DELETE SET NULL
//   CHECK projeto_parcelas_valor_check: CHECK ((valor > (0)::numeric))
//   CHECK projeto_parcelas_valor_pago_check: CHECK ((valor_pago >= (0)::numeric))
//   FOREIGN KEY projeto_parcelas_venda_id_fkey: FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE
// Table: projeto_produtos
//   PRIMARY KEY projeto_produtos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY projeto_produtos_produto_id_fkey: FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
//   FOREIGN KEY projeto_produtos_projeto_id_fkey: FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
//   UNIQUE projeto_produtos_projeto_id_produto_id_key: UNIQUE (projeto_id, produto_id)
// Table: projeto_sinal
//   PRIMARY KEY projeto_sinal_pkey: PRIMARY KEY (id)
//   FOREIGN KEY projeto_sinal_projeto_id_fkey: FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
//   UNIQUE projeto_sinal_projeto_id_key: UNIQUE (projeto_id)
//   FOREIGN KEY projeto_sinal_transacao_id_fkey: FOREIGN KEY (transacao_id) REFERENCES transacoes(id) ON DELETE SET NULL
//   CHECK projeto_sinal_valor_check: CHECK ((valor > (0)::numeric))
// Table: projetos
//   CHECK check_area_projeto_estrutura: CHECK (((area_do_projeto IS NULL) OR (jsonb_typeof(area_do_projeto) = 'object'::text)))
//   CHECK check_tipo_projeto_valido: CHECK (((area_do_projeto IS NULL) OR ((area_do_projeto ->> 'tipo'::text) IS NULL) OR ((area_do_projeto ->> 'tipo'::text) = ANY (ARRAY['Residential'::text, 'Corporativo'::text, 'Exposição Comercial'::text, 'Paisagismo'::text]))))
//   CHECK chk_historico_is_array: CHECK ((jsonb_typeof(historico) = 'array'::text))
//   FOREIGN KEY projetos_arquiteto_id_fkey: FOREIGN KEY (arquiteto_id) REFERENCES contatos(id)
//   FOREIGN KEY projetos_client_id_fkey: FOREIGN KEY (client_id) REFERENCES contatos(id) ON DELETE SET NULL
//   FOREIGN KEY projetos_cliente_id_fkey: FOREIGN KEY (cliente_id) REFERENCES contatos(id)
//   UNIQUE projetos_codigo_key: UNIQUE (codigo)
//   FOREIGN KEY projetos_created_by_fkey: FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
//   PRIMARY KEY projetos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY projetos_responsavel_id_fkey: FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
//   FOREIGN KEY projetos_responsavel_obra_id_fkey: FOREIGN KEY (responsavel_obra_id) REFERENCES contatos(id) ON DELETE SET NULL
// Table: projetos_fechados
//   PRIMARY KEY projetos_fechados_pkey: PRIMARY KEY (id)
// Table: separacao_arquivos
//   PRIMARY KEY separacao_arquivos_pkey: PRIMARY KEY (id)
//   FOREIGN KEY separacao_arquivos_separacao_id_fkey: FOREIGN KEY (separacao_id) REFERENCES separacoes(id) ON DELETE CASCADE
// Table: separacao_itens
//   PRIMARY KEY separacao_itens_pkey: PRIMARY KEY (id)
//   FOREIGN KEY separacao_itens_produto_id_fkey: FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL
//   FOREIGN KEY separacao_itens_separacao_id_fkey: FOREIGN KEY (separacao_id) REFERENCES separacoes(id) ON DELETE CASCADE
// Table: separacoes
//   FOREIGN KEY separacoes_cliente_id_fkey: FOREIGN KEY (cliente_id) REFERENCES contatos(id) ON DELETE SET NULL
//   CHECK separacoes_delivery_type_check: CHECK ((delivery_type = ANY (ARRAY['scheduled'::text, 'flexible'::text])))
//   PRIMARY KEY separacoes_pkey: PRIMARY KEY (id)
//   FOREIGN KEY separacoes_projeto_id_fkey: FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE SET NULL
//   FOREIGN KEY separacoes_responsavel_id_fkey: FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE SET NULL
// Table: solicitacoes_compra
//   FOREIGN KEY solicitacoes_compra_aprovador_id_fkey: FOREIGN KEY (aprovador_id) REFERENCES usuarios(id) ON DELETE SET NULL
//   FOREIGN KEY solicitacoes_compra_categoria_id_fkey: FOREIGN KEY (categoria_id) REFERENCES categorias_financeiras(id) ON DELETE SET NULL
//   PRIMARY KEY solicitacoes_compra_pkey: PRIMARY KEY (id)
//   FOREIGN KEY solicitacoes_compra_projeto_id_fkey: FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE SET NULL
//   FOREIGN KEY solicitacoes_compra_solicitante_id_fkey: FOREIGN KEY (solicitante_id) REFERENCES usuarios(id) ON DELETE RESTRICT
//   FOREIGN KEY solicitacoes_compra_transacao_id_fkey: FOREIGN KEY (transacao_id) REFERENCES transacoes(id) ON DELETE SET NULL
//   CHECK solicitacoes_compra_valor_aprovado_check: CHECK ((valor_aprovado >= (0)::numeric))
//   CHECK solicitacoes_compra_valor_estimado_check: CHECK ((valor_estimado > (0)::numeric))
// Table: sync_history
//   FOREIGN KEY sync_history_executado_por_fkey: FOREIGN KEY (executado_por) REFERENCES usuarios(id) ON DELETE SET NULL
//   PRIMARY KEY sync_history_pkey: PRIMARY KEY (id)
// Table: transacoes
//   FOREIGN KEY transacoes_categoria_id_fkey: FOREIGN KEY (categoria_id) REFERENCES categorias_financeiras(id) ON DELETE SET NULL
//   FOREIGN KEY transacoes_conta_id_fkey: FOREIGN KEY (conta_id) REFERENCES contas_bancarias(id) ON DELETE RESTRICT
//   FOREIGN KEY transacoes_created_by_fkey: FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
//   FOREIGN KEY transacoes_parcela_id_fkey: FOREIGN KEY (parcela_id) REFERENCES projeto_parcelas(id) ON DELETE SET NULL
//   PRIMARY KEY transacoes_pkey: PRIMARY KEY (id)
//   FOREIGN KEY transacoes_projeto_id_fkey: FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE SET NULL
// Table: transactions
//   PRIMARY KEY transactions_pkey: PRIMARY KEY (id)
//   FOREIGN KEY transactions_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id)
// Table: usuarios
//   UNIQUE usuarios_email_key: UNIQUE (email)
//   FOREIGN KEY usuarios_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY usuarios_pkey: PRIMARY KEY (id)
// Table: vendas
//   UNIQUE vendas_cod_venda_key: UNIQUE (cod_venda)
//   PRIMARY KEY vendas_pkey: PRIMARY KEY (id)
//   FOREIGN KEY vendas_projeto_id_fkey: FOREIGN KEY (projeto_id) REFERENCES projetos(id) ON DELETE CASCADE
// Table: vendas_marca
//   CHECK chk_vendas_custo_positivo: CHECK ((valor_custo >= (0)::numeric))
//   CHECK chk_vendas_venda_positivo: CHECK ((valor_venda >= (0)::numeric))
//   FOREIGN KEY vendas_marca_marca_id_fkey: FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE CASCADE
//   UNIQUE vendas_marca_marca_id_mes_ano_key: UNIQUE (marca_id, mes, ano)
//   CHECK vendas_marca_mes_check: CHECK (((mes >= 1) AND (mes <= 12)))
//   PRIMARY KEY vendas_marca_pkey: PRIMARY KEY (id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: avaliacoes
//   Policy "aval_admin" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
// Table: candidatos
//   Policy "candidatos_admin" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
// Table: categorias_financeiras
//   Policy "catfin_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "catfin_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "catfin_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "catfin_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
// Table: conta_pagar
//   Policy "Permitir leitura para autenticados" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Permitir tudo para service_role" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'service_role'::text)
// Table: conta_receber
//   Policy "Permitir leitura para autenticados" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Permitir tudo para service_role" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'service_role'::text)
// Table: contas_bancarias
//   Policy "contas_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = 'admin'::usuario_role))))
//   Policy "contas_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = 'admin'::usuario_role))))
//   Policy "contas_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "contas_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = 'admin'::usuario_role))))
// Table: contatos
//   Policy "authenticated_all_contatos" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "contatos_delete_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "contatos_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "contatos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "contatos_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
// Table: controle_falta
//   Policy "ponto_delete_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "ponto_insert_admin" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "ponto_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role]))))) OR (funcionario_id IN ( SELECT funcionarios.id    FROM funcionarios   WHERE (funcionarios.usuario_id = ( SELECT auth.uid() AS uid)))))
//   Policy "ponto_update_admin" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
// Table: custos_recorrentes
//   Policy "custos_rec_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "custos_rec_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "custos_rec_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "custos_rec_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
// Table: custos_recorrentes_lancamentos
//   Policy "lanc_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "lanc_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "lanc_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "lanc_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
// Table: departamentos
//   Policy "dept_delete_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "dept_insert_admin" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "dept_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "dept_update_admin" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
// Table: entregas
//   Policy "entregas_delete_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "entregas_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "entregas_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "entregas_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
// Table: estoque_itens
//   Policy "estoque_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "estoque_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "estoque_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "estoque_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
// Table: ferias
//   Policy "ferias_delete_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "ferias_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: ((funcionario_id IN ( SELECT funcionarios.id    FROM funcionarios   WHERE (funcionarios.usuario_id = ( SELECT auth.uid() AS uid)))) OR (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role]))))))
//   Policy "ferias_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role]))))) OR (funcionario_id IN ( SELECT funcionarios.id    FROM funcionarios   WHERE (funcionarios.usuario_id = ( SELECT auth.uid() AS uid)))))
//   Policy "ferias_update_admin" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
// Table: folha_pagamento
//   Policy "folha_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "folha_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "folha_own" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role]))))) OR (funcionario_id IN ( SELECT funcionarios.id    FROM funcionarios   WHERE (funcionarios.usuario_id = ( SELECT auth.uid() AS uid)))))
//   Policy "folha_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
// Table: funcionarios
//   Policy "func_delete_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "func_insert_admin" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "func_select_admin" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role]))))) OR (usuario_id = ( SELECT auth.uid() AS uid)))
//   Policy "func_update_admin" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
// Table: marcas
//   Policy "marcas_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "marcas_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "marcas_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "marcas_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
// Table: pedido_compra
//   Policy "Permitir leitura para autenticados" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Permitir tudo para service_role" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'service_role'::text)
// Table: produtos
//   Policy "Permitir leitura para autenticados" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Permitir tudo para service_role" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'service_role'::text)
//   Policy "prod_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "prod_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "prod_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "prod_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
// Table: profiles
//   Policy "Admins can update all profiles" (UPDATE, PERMISSIVE) roles={public}
//     USING: is_admin()
//   Policy "Admins can view all profiles" (SELECT, PERMISSIVE) roles={public}
//     USING: is_admin()
//   Policy "Users can insert their own profile" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (auth.uid() = id)
//   Policy "Users can update own profile" (UPDATE, PERMISSIVE) roles={public}
//     USING: (auth.uid() = id)
//   Policy "Users can update their own profile" (UPDATE, PERMISSIVE) roles={public}
//     USING: (auth.uid() = id)
//   Policy "Users can view own profile" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.uid() = id)
//   Policy "Users can view their own profile" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.uid() = id)
// Table: projeto_itens
//   Policy "pi_delete_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "pi_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "pi_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "pi_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
// Table: projeto_parcelas
//   Policy "Permitir leitura para autenticados" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Permitir tudo para service_role" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'service_role'::text)
//   Policy "authenticated_all_projeto_parcelas" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "parcelas_delete_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "parcelas_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "parcelas_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "parcelas_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
// Table: projeto_produtos
//   Policy "Permitir leitura para autenticados" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Permitir tudo para service_role" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'service_role'::text)
// Table: projeto_sinal
//   Policy "sinal_delete_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "sinal_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "sinal_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "sinal_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
// Table: projetos
//   Policy "Permitir leitura para autenticados" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Permitir tudo para service_role" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'service_role'::text)
//   Policy "authenticated_all_projetos" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "projetos_delete_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "projetos_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "projetos_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "projetos_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
// Table: projetos_fechados
//   Policy "projetos_fechados_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "projetos_fechados_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "projetos_fechados_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "projetos_fechados_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: separacao_arquivos
//   Policy "sep_arq_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "sep_arq_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "sep_arq_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "sep_arq_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
// Table: separacao_itens
//   Policy "sep_itens_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "sep_itens_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "sep_itens_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "sep_itens_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
// Table: separacoes
//   Policy "separacoes_delete_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "separacoes_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "separacoes_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "separacoes_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
// Table: solicitacoes_compra
//   Policy "solicit_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = 'admin'::usuario_role))))
//   Policy "solicit_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (solicitante_id = ( SELECT auth.uid() AS uid))
//   Policy "solicit_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((solicitante_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role]))))))
//   Policy "solicit_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((solicitante_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role]))))))
// Table: sync_history
//   Policy "sync_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "sync_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
// Table: transacoes
//   Policy "trans_delete_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = 'admin'::usuario_role))))
//   Policy "trans_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "trans_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "trans_update_admin" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = 'admin'::usuario_role))))
// Table: transactions
//   Policy "Admins and users can insert transactions" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (is_admin() OR (auth.uid() = user_id))
//   Policy "Admins can delete all transactions" (DELETE, PERMISSIVE) roles={public}
//     USING: is_admin()
//   Policy "Admins can update all transactions" (UPDATE, PERMISSIVE) roles={public}
//     USING: is_admin()
//   Policy "Admins can view all transactions" (SELECT, PERMISSIVE) roles={public}
//     USING: is_admin()
//   Policy "Collaborators can view latest transaction" (SELECT, PERMISSIVE) roles={public}
//     USING: ((get_user_role() = 'colaborador'::text) AND (id = get_latest_transaction_id()))
//   Policy "Standard users can view own transactions" (SELECT, PERMISSIVE) roles={public}
//     USING: ((COALESCE(get_user_role(), 'visitante'::text) <> ALL (ARRAY['admin'::text, 'colaborador'::text])) AND (user_id = auth.uid()))
//   Policy "Users can delete own transactions" (DELETE, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//   Policy "Users can delete their own transactions" (DELETE, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//   Policy "Users can update own transactions" (UPDATE, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//   Policy "Users can update their own transactions" (UPDATE, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
// Table: usuarios
//   Policy "usuarios_delete_admin" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = 'admin'::usuario_role))))
//   Policy "usuarios_insert_admin" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = 'admin'::usuario_role))))
//   Policy "usuarios_select_own" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "usuarios_update_own" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: ((id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = 'admin'::usuario_role)))))
// Table: vendas
//   Policy "Permitir leitura para autenticados" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
//   Policy "Permitir tudo para service_role" (ALL, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'service_role'::text)
// Table: vendas_marca
//   Policy "vendas_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "vendas_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))
//   Policy "vendas_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role, 'operador'::usuario_role])))))
//   Policy "vendas_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM usuarios u   WHERE ((u.id = ( SELECT auth.uid() AS uid)) AND (u.role = ANY (ARRAY['admin'::usuario_role, 'gerente'::usuario_role])))))

// --- WARNING: TABLES WITH RLS ENABLED BUT NO POLICIES ---
// These tables have Row Level Security enabled but NO policies defined.
// This means ALL queries (SELECT, INSERT, UPDATE, DELETE) will return ZERO rows
// for non-superuser roles (including the anon and authenticated roles used by the app).
// You MUST create RLS policies for these tables to allow data access.
//   - projeto_parcelas_backup_migration

// --- DATABASE FUNCTIONS ---
// FUNCTION admin_update_user_password(uuid, text)
//   CREATE OR REPLACE FUNCTION public.admin_update_user_password(p_user_id uuid, p_new_password text)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public', 'extensions'
//   AS $function$
//   DECLARE
//     v_caller_role public.usuario_role;
//   BEGIN
//     SELECT role INTO v_caller_role FROM public.usuarios WHERE id = auth.uid();
//
//     IF v_caller_role != 'admin' THEN
//       RAISE EXCEPTION 'Apenas administradores podem alterar senhas.';
//     END IF;
//
//     UPDATE auth.users
//     SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf'::text)),
//         updated_at = NOW()
//     WHERE id = p_user_id;
//   END;
//   $function$
//
// FUNCTION admin_update_user_role(uuid, text)
//   CREATE OR REPLACE FUNCTION public.admin_update_user_role(p_user_id uuid, p_role text)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   DECLARE
//     v_caller_role public.usuario_role;
//   BEGIN
//     SELECT role INTO v_caller_role FROM public.usuarios WHERE id = auth.uid();
//
//     IF v_caller_role != 'admin' THEN
//       RAISE EXCEPTION 'Apenas administradores podem alterar perfis.';
//     END IF;
//
//     UPDATE public.usuarios
//     SET role = p_role::public.usuario_role,
//         updated_at = NOW()
//     WHERE id = p_user_id;
//   END;
//   $function$
//
// FUNCTION admin_update_user_status(uuid, boolean)
//   CREATE OR REPLACE FUNCTION public.admin_update_user_status(p_user_id uuid, p_ativo boolean)
//    RETURNS void
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   DECLARE
//     v_caller_role public.usuario_role;
//   BEGIN
//     SELECT role INTO v_caller_role FROM public.usuarios WHERE id = auth.uid();
//
//     IF v_caller_role != 'admin' THEN
//       RAISE EXCEPTION 'Apenas administradores podem alterar status.';
//     END IF;
//
//     UPDATE public.usuarios
//     SET ativo = p_ativo,
//         updated_at = NOW()
//     WHERE id = p_user_id;
//   END;
//   $function$
//
// FUNCTION criar_usuario(text, text, text, usuario_role)
//   CREATE OR REPLACE FUNCTION public.criar_usuario(p_email text, p_password text, p_nome text, p_role usuario_role DEFAULT 'viewer'::usuario_role)
//    RETURNS uuid
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public', 'extensions'
//   AS $function$
//   DECLARE
//     v_caller_role public.usuario_role;
//     v_new_id      UUID;
//   BEGIN
//     SELECT role INTO v_caller_role FROM public.usuarios WHERE id = auth.uid();
//     IF v_caller_role != 'admin' THEN
//       RAISE EXCEPTION 'Apenas administradores podem criar usuários.';
//     END IF;
//     IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
//       RAISE EXCEPTION 'E-mail % já cadastrado.', p_email;
//     END IF;
//
//     v_new_id := gen_random_uuid();
//     INSERT INTO auth.users (
//       id, instance_id, email, encrypted_password, email_confirmed_at,
//       created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
//       is_super_admin, role, aud,
//       confirmation_token, recovery_token, email_change_token_new,
//       email_change, email_change_token_current, phone, phone_change, phone_change_token, reauthentication_token
//     ) VALUES (
//       v_new_id, '00000000-0000-0000-0000-000000000000', p_email,
//       extensions.crypt(p_password, extensions.gen_salt('bf'::text)), NOW(), NOW(), NOW(),
//       '{"provider":"email","providers":["email"]}',
//       json_build_object('nome', p_nome),
//       false, 'authenticated', 'authenticated',
//       '', '', '', '', '', NULL, '', '', ''
//     );
//
//     INSERT INTO public.usuarios (id, email, nome, role)
//     VALUES (v_new_id, p_email, p_nome, p_role)
//     ON CONFLICT (id) DO UPDATE SET nome = p_nome, role = p_role;
//
//     RETURN v_new_id;
//   END;
//   $function$
//
// FUNCTION get_dashboard_crm_by_closing(date, date)
//   CREATE OR REPLACE FUNCTION public.get_dashboard_crm_by_closing(data_inicial date, data_final date)
//    RETURNS SETOF projetos
//    LANGUAGE sql
//    STABLE
//   AS $function$
//   SELECT * FROM public.projetos p
//   WHERE EXISTS (
//     SELECT 1 FROM public.projeto_parcelas pp
//     WHERE pp.projeto_id = p.id
//       AND pp.data_fechamento BETWEEN data_inicial AND data_final
//   );
//   $function$
//
// FUNCTION get_dashboard_kpi(date)
//   CREATE OR REPLACE FUNCTION public.get_dashboard_kpi(p_date_now date)
//    RETURNS json
//    LANGUAGE plpgsql
//   AS $function$
//   DECLARE
//     v_total_balance NUMERIC;
//     v_month_income NUMERIC;
//     v_month_expense NUMERIC;
//     v_last_month_income NUMERIC;
//     v_last_month_expense NUMERIC;
//     v_start_month DATE;
//     v_end_month DATE;
//     v_start_last_month DATE;
//     v_end_last_month DATE;
//   BEGIN
//     v_start_month := date_trunc('month', p_date_now);
//     v_end_month := (date_trunc('month', p_date_now) + interval '1 month' - interval '1 day')::date;
//     v_start_last_month := date_trunc('month', p_date_now - interval '1 month');
//     v_end_last_month := (date_trunc('month', p_date_now) - interval '1 day')::date;
//
//     -- Calculate Total Balance (All time based on visibility)
//     SELECT COALESCE(SUM(CASE WHEN type = 'Receita' THEN amount ELSE -amount END), 0)
//     INTO v_total_balance
//     FROM public.transactions;
//
//     -- Calculate Month Income
//     SELECT COALESCE(SUM(amount), 0)
//     INTO v_month_income
//     FROM public.transactions
//     WHERE type = 'Receita' AND date >= v_start_month AND date <= v_end_month;
//
//     -- Calculate Month Expense
//     SELECT COALESCE(SUM(amount), 0)
//     INTO v_month_expense
//     FROM public.transactions
//     WHERE type = 'Despesa' AND date >= v_start_month AND date <= v_end_month;
//
//     -- Calculate Last Month Income
//     SELECT COALESCE(SUM(amount), 0)
//     INTO v_last_month_income
//     FROM public.transactions
//     WHERE type = 'Receita' AND date >= v_start_last_month AND date <= v_end_last_month;
//
//     -- Calculate Last Month Expense
//     SELECT COALESCE(SUM(amount), 0)
//     INTO v_last_month_expense
//     FROM public.transactions
//     WHERE type = 'Despesa' AND date >= v_start_last_month AND date <= v_end_last_month;
//
//     RETURN json_build_object(
//       'totalBalance', v_total_balance,
//       'monthIncome', v_month_income,
//       'monthExpense', v_month_expense,
//       'lastMonthIncome', v_last_month_income,
//       'lastMonthExpense', v_last_month_expense
//     );
//   END;
//   $function$
//
// FUNCTION get_dashboard_stats()
//   CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   DECLARE
//     v_active_projects integer;
//     v_completed_this_month integer;
//     v_total_value numeric;
//     v_clients_count integer;
//     v_architects_count integer;
//     v_engineers_count integer;
//   BEGIN
//     -- Active projects count
//     SELECT COUNT(*) INTO v_active_projects
//     FROM public.projetos
//     WHERE status::text NOT IN ('Finalizado', 'Arquivado', 'Não fechou')
//        OR status IS NULL;
//
//     -- Completed this month count
//     SELECT COUNT(*) INTO v_completed_this_month
//     FROM public.projetos
//     WHERE status::text = 'Finalizado'
//       AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
//       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
//
//     -- Total Value: Sum of parcelas or valor_total
//     SELECT COALESCE(SUM(
//       CASE
//         WHEN p_parcelas.total_parcelas > 0 THEN p_parcelas.total_parcelas
//         ELSE COALESCE(p.valor_total, 0)
//       END
//     ), 0) INTO v_total_value
//     FROM public.projetos p
//     LEFT JOIN (
//       SELECT projeto_id, SUM(valor) as total_parcelas
//       FROM public.projeto_parcelas
//       GROUP BY projeto_id
//     ) p_parcelas ON p.id = p_parcelas.projeto_id;
//
//     -- Contatos counts
//     SELECT COUNT(*) INTO v_clients_count FROM public.contatos WHERE tipo = 'cliente';
//     SELECT COUNT(*) INTO v_architects_count FROM public.contatos WHERE tipo = 'arquiteto';
//     SELECT COUNT(*) INTO v_engineers_count FROM public.contatos WHERE tipo = 'engenheiro';
//
//     RETURN json_build_object(
//       'activeProjects', COALESCE(v_active_projects, 0),
//       'completedThisMonth', COALESCE(v_completed_this_month, 0),
//       'totalValue', COALESCE(v_total_value, 0),
//       'clientsCount', COALESCE(v_clients_count, 0),
//       'architectsCount', COALESCE(v_architects_count, 0),
//       'engineersCount', COALESCE(v_engineers_count, 0)
//     );
//   END;
//   $function$
//
// FUNCTION get_faltas_injustificadas(uuid, date, date)
//   CREATE OR REPLACE FUNCTION public.get_faltas_injustificadas(p_funcionario_id uuid, p_inicio date, p_fim date)
//    RETURNS integer
//    LANGUAGE plpgsql
//    STABLE
//   AS $function$
//   BEGIN
//       RETURN (
//           SELECT count(*)::integer
//           FROM public.controle_falta
//           WHERE funcionario_id = p_funcionario_id
//             AND data BETWEEN p_inicio AND p_fim
//             AND status = 'ausente'
//             AND (justificativa IS NULL OR justificativa = '')
//       );
//   END;
//   $function$
//
// FUNCTION get_latest_transaction_id()
//   CREATE OR REPLACE FUNCTION public.get_latest_transaction_id()
//    RETURNS uuid
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     -- Deterministic sort order matching the service layer
//     RETURN (SELECT id FROM public.transactions ORDER BY created_at DESC, id DESC LIMIT 1);
//   END;
//   $function$
//
// FUNCTION get_user_role()
//   CREATE OR REPLACE FUNCTION public.get_user_role()
//    RETURNS text
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
//   END;
//   $function$
//
// FUNCTION handle_new_auth_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     INSERT INTO public.usuarios (id, email, nome, role)
//     VALUES (
//       NEW.id,
//       NEW.email,
//       COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
//       'viewer'
//     )
//     ON CONFLICT (id) DO NOTHING;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     INSERT INTO public.profiles (id, full_name, role)
//     VALUES (
//       new.id,
//       new.raw_user_meta_data->>'full_name',
//       'visitante'
//     )
//     ON CONFLICT (id) DO NOTHING;
//     RETURN new;
//   END;
//   $function$
//
// FUNCTION is_admin()
//   CREATE OR REPLACE FUNCTION public.is_admin()
//    RETURNS boolean
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   BEGIN
//     RETURN EXISTS (
//       SELECT 1 FROM public.profiles
//       WHERE id = auth.uid() AND role = 'admin'
//     );
//   END;
//   $function$
//
// FUNCTION limpar_staging_processados()
//   CREATE OR REPLACE FUNCTION public.limpar_staging_processados()
//    RETURNS integer
//    LANGUAGE plpgsql
//   AS $function$
//   DECLARE
//       total_deletado INTEGER := 0;
//   BEGIN
//       -- Deleta registros processados há mais de 30 dias
//       DELETE FROM staging_conta_pagar
//       WHERE processado = TRUE
//       AND importado_em < NOW() - INTERVAL '30 days';
//
//       GET DIAGNOSTICS total_deletado = ROW_COUNT;
//
//       DELETE FROM staging_conta_receber
//       WHERE processado = TRUE
//       AND importado_em < NOW() - INTERVAL '30 days';
//
//       DELETE FROM staging_produtos
//       WHERE processado = TRUE
//       AND importado_em < NOW() - INTERVAL '30 days';
//
//       DELETE FROM staging_pedido_compra
//       WHERE processado = TRUE
//       AND importado_em < NOW() - INTERVAL '30 days';
//
//       RETURN total_deletado;
//   END;
//   $function$
//
// FUNCTION propagate_contato_nome()
//   CREATE OR REPLACE FUNCTION public.propagate_contato_nome()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     IF OLD.nome IS NOT DISTINCT FROM NEW.nome THEN
//       RETURN NEW;
//     END IF;
//
//     UPDATE public.separacoes
//     SET cliente    = NEW.nome,
//         updated_at = NOW()
//     WHERE cliente_id = NEW.id;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION propagate_projeto_codigo()
//   CREATE OR REPLACE FUNCTION public.propagate_projeto_codigo()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     IF OLD.codigo IS NOT DISTINCT FROM NEW.codigo THEN
//       RETURN NEW;
//     END IF;
//
//     UPDATE separacoes
//     SET codigo_obra = NEW.codigo,
//         updated_at  = NOW()
//     WHERE projeto_id = NEW.id;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION propagate_usuario_nome()
//   CREATE OR REPLACE FUNCTION public.propagate_usuario_nome()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     IF OLD.nome IS NOT DISTINCT FROM NEW.nome THEN
//       RETURN NEW;
//     END IF;
//
//     UPDATE public.projetos
//     SET responsavel_nome = NEW.nome,
//         updated_at       = NOW()
//     WHERE responsavel_id = NEW.id;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION set_updated_at()
//   CREATE OR REPLACE FUNCTION public.set_updated_at()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     NEW.updated_at = NOW();
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION stats_datacenter()
//   CREATE OR REPLACE FUNCTION public.stats_datacenter()
//    RETURNS json
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     RETURN json_build_object(
//       'projetos',    (SELECT COUNT(*) FROM projetos WHERE arquivado = false),
//       'contatos',    (SELECT COUNT(*) FROM contatos WHERE ativo = true),
//       'funcionarios',(SELECT COUNT(*) FROM funcionarios WHERE status = 'Ativo'),
//       'separacoes',  (SELECT COUNT(*) FROM separacoes WHERE status NOT IN ('Cancelado','Enviado')),
//       'marcas',      (SELECT COUNT(*) FROM marcas WHERE ativo = true),
//       'ultima_sync', (SELECT MAX(created_at) FROM sync_history WHERE status = 'sucesso')
//     );
//   END;
//   $function$
//
// FUNCTION sync_projeto_valor_total()
//   CREATE OR REPLACE FUNCTION public.sync_projeto_valor_total()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     UPDATE projetos
//     SET valor_total = (
//       SELECT COALESCE(SUM(subtotal), 0)
//       FROM projeto_itens
//       WHERE projeto_id = NEW.projeto_id
//     )
//     WHERE id = NEW.projeto_id;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION sync_responsavel_nome()
//   CREATE OR REPLACE FUNCTION public.sync_responsavel_nome()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     IF NEW.responsavel_id IS NOT NULL THEN
//       SELECT nome INTO NEW.responsavel_nome
//       FROM public.usuarios WHERE id = NEW.responsavel_id;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION sync_separacao_cliente()
//   CREATE OR REPLACE FUNCTION public.sync_separacao_cliente()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     IF NEW.cliente_id IS NOT NULL THEN
//       SELECT nome INTO NEW.cliente
//       FROM contatos
//       WHERE id = NEW.cliente_id;
//     END IF;
//     -- Se cliente_id for NULL, mantém o texto livre existente (separação avulsa)
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION sync_separacao_codigo_obra()
//   CREATE OR REPLACE FUNCTION public.sync_separacao_codigo_obra()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     IF NEW.projeto_id IS NOT NULL THEN
//       SELECT codigo INTO NEW.codigo_obra
//       FROM projetos
//       WHERE id = NEW.projeto_id;
//     END IF;
//     -- Se projeto_id for NULL, mantém o codigo_obra manual (separação avulsa)
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION track_reagendamento()
//   CREATE OR REPLACE FUNCTION public.track_reagendamento()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     -- Salvar data original na primeira vez
//     IF OLD.data_entrega IS NULL AND NEW.data_entrega IS NOT NULL THEN
//       NEW.data_entrega_original = NEW.data_entrega;
//     END IF;
//     -- Contar reagendamentos quando data muda após estar definida
//     IF OLD.data_entrega IS NOT NULL
//        AND NEW.data_entrega IS NOT NULL
//        AND OLD.data_entrega <> NEW.data_entrega THEN
//       NEW.reagendamentos = OLD.reagendamentos + 1;
//     END IF;
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION trigger_fechar_projeto()
//   CREATE OR REPLACE FUNCTION public.trigger_fechar_projeto()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   DECLARE
//     v_sinal RECORD;
//   BEGIN
//     IF NEW.status = 'Entrega materiais'::public.projeto_status AND OLD.status <> 'Entrega materiais'::public.projeto_status THEN
//
//       -- 3a. Baixar estoque físico (local='Estoque') por produto
//       UPDATE estoque_itens ei
//       SET quantidade    = GREATEST(0, ei.quantidade - pi.quantidade),
//           atualizado_em = NOW()
//       FROM projeto_itens pi
//       WHERE pi.projeto_id = NEW.id
//         AND pi.produto_id = ei.produto_id
//         AND ei.local = 'Estoque'::public.estoque_local;
//
//       -- 3b. Zerar a reserva desse projeto
//       UPDATE estoque_itens ei
//       SET quantidade    = GREATEST(0, ei.quantidade - pi.quantidade),
//           atualizado_em = NOW()
//       FROM projeto_itens pi
//       WHERE pi.projeto_id = NEW.id
//         AND pi.produto_id = ei.produto_id
//         AND ei.local = 'Reservado'::public.estoque_local;
//
//       -- 3c. Marcar sinal como 'creditado' (cliente comprou)
//       UPDATE projeto_sinal
//       SET status     = 'creditado'::public.sinal_status,
//           updated_at = NOW()
//       WHERE projeto_id = NEW.id
//         AND status = 'recebido'::public.sinal_status;
//
//       -- 3d. Criar separação automaticamente com os itens validados
//       --     (só cria se ainda não existe separação para esse projeto)
//       IF NOT EXISTS (
//         SELECT 1 FROM separacoes
//         WHERE projeto_id = NEW.id
//           AND status NOT IN ('Cancelado'::public.separacao_status)
//       ) THEN
//         WITH nova_sep AS (
//           INSERT INTO separacoes (
//             projeto_id, responsavel_id, status,
//             codigo_obra, cliente, observacoes
//           )
//           SELECT
//             NEW.id,
//             NEW.created_by,
//             'Pendente'::public.separacao_status,
//             NEW.codigo,
//             (SELECT nome FROM contatos WHERE id = NEW.cliente_id),
//             'Separação gerada automaticamente no fechamento do projeto'
//           RETURNING id
//         )
//         INSERT INTO separacao_itens (separacao_id, produto_id, descricao, quantidade, unidade)
//         SELECT
//           nova_sep.id,
//           pi.produto_id,
//           pi.descricao,
//           pi.quantidade,
//           NULL
//         FROM projeto_itens pi, nova_sep
//         WHERE pi.projeto_id = NEW.id
//           AND pi.validado = true;
//
//       END IF;
//
//     END IF;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION trigger_proteger_fechamento()
//   CREATE OR REPLACE FUNCTION public.trigger_proteger_fechamento()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SET search_path TO 'public'
//   AS $function$
//   DECLARE
//     itens_nao_validados INTEGER;
//     status_fechamento public.projeto_status[] := ARRAY[
//       'Projeto executivo'::public.projeto_status,
//       'Entrega materiais'::public.projeto_status,
//       'Ajustes finais'::public.projeto_status,
//       'Finalizado'::public.projeto_status
//     ];
//   BEGIN
//     -- Só verifica quando está indo para um status de execução/fechamento
//     IF NEW.status = ANY(status_fechamento)
//        AND (OLD.status IS NULL OR OLD.status <> NEW.status) THEN
//
//       SELECT COUNT(*) INTO itens_nao_validados
//       FROM projeto_itens
//       WHERE projeto_id = NEW.id
//         AND validado = false;
//
//       IF itens_nao_validados > 0 THEN
//         RAISE EXCEPTION
//           'Não é possível avançar o projeto para "%". Existem % item(ns) não validado(s). Valide todos os itens antes de fechar.',
//           NEW.status, itens_nao_validados;
//       END IF;
//
//       -- Também verifica se existe pelo menos 1 item no projeto
//       IF NOT EXISTS (SELECT 1 FROM projeto_itens WHERE projeto_id = NEW.id) THEN
//         RAISE EXCEPTION
//           'Não é possível fechar o projeto sem nenhum item cadastrado.';
//       END IF;
//
//     END IF;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION trigger_proteger_parcelas()
//   CREATE OR REPLACE FUNCTION public.trigger_proteger_parcelas()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SET search_path TO 'public'
//   AS $function$
//   DECLARE
//     v_status public.projeto_status;
//   BEGIN
//     SELECT status INTO v_status FROM projetos WHERE id = NEW.projeto_id;
//
//     IF v_status NOT IN ('Ajustes finais'::public.projeto_status, 'Finalizado'::public.projeto_status) THEN
//       RAISE EXCEPTION
//         'Parcelas só podem ser criadas após o projeto estar em "Ajustes finais" ou "Finalizado". Status atual: %',
//         v_status;
//     END IF;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION trigger_reserva_estoque()
//   CREATE OR REPLACE FUNCTION public.trigger_reserva_estoque()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     -- Só age quando status MUDA para 'Proposta Sinal'
//     IF NEW.status = 'Proposta Sinal'::public.projeto_status AND OLD.status <> 'Proposta Sinal'::public.projeto_status THEN
//
//       -- Inserir ou somar na reserva de estoque para cada item do projeto
//       INSERT INTO estoque_itens (produto_id, local, quantidade, atualizado_por, atualizado_em)
//       SELECT
//         pi.produto_id,
//         'Reservado'::public.estoque_local,
//         pi.quantidade,
//         NEW.created_by,
//         NOW()
//       FROM projeto_itens pi
//       WHERE pi.projeto_id = NEW.id
//         AND pi.produto_id IS NOT NULL
//       ON CONFLICT (produto_id, local)
//       DO UPDATE SET
//         quantidade    = estoque_itens.quantidade + EXCLUDED.quantidade,
//         atualizado_em = NOW();
//
//     END IF;
//
//     -- Ao SAIR de 'Proposta Sinal' para trás (ex: cancelamento),
//     -- liberar a reserva
//     IF OLD.status = 'Proposta Sinal'::public.projeto_status
//        AND NEW.status NOT IN ('Proposta Sinal'::public.projeto_status,'Elaboração Orçamento'::public.projeto_status,
//                                'Informações necessárias'::public.projeto_status,'Projeto executivo'::public.projeto_status,
//                                'Entrega materiais'::public.projeto_status,'Ajustes finais'::public.projeto_status,'Finalizado'::public.projeto_status) THEN
//
//       UPDATE estoque_itens ei
//       SET quantidade = GREATEST(0, ei.quantidade - pi.quantidade),
//           atualizado_em = NOW()
//       FROM projeto_itens pi
//       WHERE pi.projeto_id = NEW.id
//         AND pi.produto_id = ei.produto_id
//         AND ei.local = 'Reservado'::public.estoque_local;
//
//     END IF;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION trigger_separacao_pronta()
//   CREATE OR REPLACE FUNCTION public.trigger_separacao_pronta()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   BEGIN
//     IF NEW.status = 'Pronto'::public.separacao_status AND OLD.status <> 'Pronto'::public.separacao_status THEN
//
//       -- Proteção: data_entrega obrigatória para gerar entrega
//       IF NEW.data_entrega IS NULL THEN
//         RAISE EXCEPTION
//           'Defina a data de entrega antes de marcar a separação como Pronto.';
//       END IF;
//
//       -- Criar entrega se ainda não existir para essa separação
//       IF NOT EXISTS (
//         SELECT 1 FROM entregas
//         WHERE separacao_id = NEW.id
//           AND status <> 'Cancelado'::public.entrega_status
//       ) THEN
//         INSERT INTO entregas (
//           separacao_id,
//           projeto_id,
//           entregador_id,
//           endereco_entrega,
//           contato_destino,
//           data_prevista,
//           status
//         ) VALUES (
//           NEW.id,
//           NEW.projeto_id,
//           NEW.responsavel_id,
//           NEW.endereco_entrega,
//           NEW.cliente,
//           NEW.data_entrega,
//           'Pendente'::public.entrega_status
//         );
//       ELSE
//         -- Se entrega já existe, só atualiza a data_prevista
//         UPDATE entregas
//         SET data_prevista = NEW.data_entrega,
//             updated_at    = NOW()
//         WHERE separacao_id = NEW.id
//           AND status = 'Pendente'::public.entrega_status;
//       END IF;
//
//     END IF;
//
//     -- Quando data_entrega muda em separação já Pronta,
//     -- propagar para entrega pendente correspondente
//     IF NEW.status = 'Pronto'::public.separacao_status
//        AND OLD.data_entrega IS DISTINCT FROM NEW.data_entrega
//        AND NEW.data_entrega IS NOT NULL THEN
//
//       UPDATE entregas
//       SET data_prevista = NEW.data_entrega,
//           updated_at    = NOW()
//       WHERE separacao_id = NEW.id
//         AND status = 'Pendente'::public.entrega_status;
//
//     END IF;
//
//     RETURN NEW;
//   END;
//   $function$
//
// FUNCTION update_updated_at_column()
//   CREATE OR REPLACE FUNCTION public.update_updated_at_column()
//    RETURNS trigger
//    LANGUAGE plpgsql
//   AS $function$
//   BEGIN
//       NEW.updated_at = NOW();
//       RETURN NEW;
//   END;
//   $function$
//

// --- TRIGGERS ---
// Table: candidatos
//   candidatos_updated_at: CREATE TRIGGER candidatos_updated_at BEFORE UPDATE ON public.candidatos FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: conta_pagar
//   update_conta_pagar_updated_at: CREATE TRIGGER update_conta_pagar_updated_at BEFORE UPDATE ON public.conta_pagar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
// Table: conta_receber
//   update_conta_receber_updated_at: CREATE TRIGGER update_conta_receber_updated_at BEFORE UPDATE ON public.conta_receber FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
// Table: contas_bancarias
//   contas_updated_at: CREATE TRIGGER contas_updated_at BEFORE UPDATE ON public.contas_bancarias FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: contatos
//   contatos_updated_at: CREATE TRIGGER contatos_updated_at BEFORE UPDATE ON public.contatos FOR EACH ROW EXECUTE FUNCTION set_updated_at()
//   trg_propagate_contato_nome: CREATE TRIGGER trg_propagate_contato_nome AFTER UPDATE OF nome ON public.contatos FOR EACH ROW EXECUTE FUNCTION propagate_contato_nome()
// Table: custos_recorrentes
//   custos_rec_updated_at: CREATE TRIGGER custos_rec_updated_at BEFORE UPDATE ON public.custos_recorrentes FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: entregas
//   entregas_updated_at: CREATE TRIGGER entregas_updated_at BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: funcionarios
//   funcionarios_updated_at: CREATE TRIGGER funcionarios_updated_at BEFORE UPDATE ON public.funcionarios FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: produtos
//   produtos_updated_at: CREATE TRIGGER produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION set_updated_at()
//   update_produtos_updated_at: CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
// Table: projeto_itens
//   projeto_itens_updated_at: CREATE TRIGGER projeto_itens_updated_at BEFORE UPDATE ON public.projeto_itens FOR EACH ROW EXECUTE FUNCTION set_updated_at()
//   trg_sync_valor_total: CREATE TRIGGER trg_sync_valor_total AFTER INSERT OR DELETE OR UPDATE ON public.projeto_itens FOR EACH ROW EXECUTE FUNCTION sync_projeto_valor_total()
// Table: projeto_parcelas
//   trg_proteger_parcelas: CREATE TRIGGER trg_proteger_parcelas BEFORE INSERT ON public.projeto_parcelas FOR EACH ROW EXECUTE FUNCTION trigger_proteger_parcelas()
//   update_parcelas_updated_at: CREATE TRIGGER update_parcelas_updated_at BEFORE UPDATE ON public.projeto_parcelas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
// Table: projeto_sinal
//   projeto_sinal_updated_at: CREATE TRIGGER projeto_sinal_updated_at BEFORE UPDATE ON public.projeto_sinal FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: projetos
//   projetos_updated_at: CREATE TRIGGER projetos_updated_at BEFORE UPDATE ON public.projetos FOR EACH ROW EXECUTE FUNCTION set_updated_at()
//   trg_fechar_projeto: CREATE TRIGGER trg_fechar_projeto AFTER UPDATE OF status ON public.projetos FOR EACH ROW EXECUTE FUNCTION trigger_fechar_projeto()
//   trg_propagate_projeto_codigo: CREATE TRIGGER trg_propagate_projeto_codigo AFTER UPDATE OF codigo ON public.projetos FOR EACH ROW EXECUTE FUNCTION propagate_projeto_codigo()
//   trg_proteger_fechamento: CREATE TRIGGER trg_proteger_fechamento BEFORE UPDATE OF status ON public.projetos FOR EACH ROW EXECUTE FUNCTION trigger_proteger_fechamento()
//   trg_reserva_estoque: CREATE TRIGGER trg_reserva_estoque AFTER UPDATE OF status ON public.projetos FOR EACH ROW EXECUTE FUNCTION trigger_reserva_estoque()
//   trg_sync_responsavel_nome: CREATE TRIGGER trg_sync_responsavel_nome BEFORE INSERT OR UPDATE OF responsavel_id ON public.projetos FOR EACH ROW EXECUTE FUNCTION sync_responsavel_nome()
//   update_projetos_updated_at: CREATE TRIGGER update_projetos_updated_at BEFORE UPDATE ON public.projetos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
// Table: separacoes
//   separacoes_updated_at: CREATE TRIGGER separacoes_updated_at BEFORE UPDATE ON public.separacoes FOR EACH ROW EXECUTE FUNCTION set_updated_at()
//   trg_separacao_pronta: CREATE TRIGGER trg_separacao_pronta AFTER UPDATE OF status, data_entrega ON public.separacoes FOR EACH ROW EXECUTE FUNCTION trigger_separacao_pronta()
//   trg_sync_sep_cliente: CREATE TRIGGER trg_sync_sep_cliente BEFORE INSERT OR UPDATE OF cliente_id ON public.separacoes FOR EACH ROW EXECUTE FUNCTION sync_separacao_cliente()
//   trg_sync_sep_codigo_obra: CREATE TRIGGER trg_sync_sep_codigo_obra BEFORE INSERT OR UPDATE OF projeto_id ON public.separacoes FOR EACH ROW EXECUTE FUNCTION sync_separacao_codigo_obra()
//   trg_track_reagendamento: CREATE TRIGGER trg_track_reagendamento BEFORE UPDATE OF data_entrega ON public.separacoes FOR EACH ROW EXECUTE FUNCTION track_reagendamento()
// Table: solicitacoes_compra
//   solicit_updated_at: CREATE TRIGGER solicit_updated_at BEFORE UPDATE ON public.solicitacoes_compra FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: usuarios
//   trg_propagate_usuario_nome: CREATE TRIGGER trg_propagate_usuario_nome AFTER UPDATE OF nome ON public.usuarios FOR EACH ROW EXECUTE FUNCTION propagate_usuario_nome()
//   usuarios_updated_at: CREATE TRIGGER usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION set_updated_at()
// Table: vendas
//   update_vendas_updated_at: CREATE TRIGGER update_vendas_updated_at BEFORE UPDATE ON public.vendas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()

// --- INDEXES ---
// Table: avaliacoes
//   CREATE INDEX idx_aval_avaliador ON public.avaliacoes USING btree (avaliador_id)
//   CREATE INDEX idx_aval_funcionario ON public.avaliacoes USING btree (funcionario_id)
// Table: candidatos
//   CREATE INDEX idx_cand_departamento ON public.candidatos USING btree (departamento_id)
// Table: categorias_financeiras
//   CREATE UNIQUE INDEX categorias_financeiras_nome_key ON public.categorias_financeiras USING btree (nome)
// Table: conta_pagar
//   CREATE INDEX idx_conta_pagar_cod_duplicata ON public.conta_pagar USING btree (cod_duplicata)
//   CREATE INDEX idx_conta_pagar_cod_venda ON public.conta_pagar USING btree (cod_venda)
//   CREATE INDEX idx_conta_pagar_pessoa ON public.conta_pagar USING btree (cod_pessoa)
//   CREATE INDEX idx_conta_pagar_projeto ON public.conta_pagar USING btree (projeto_id)
//   CREATE INDEX idx_conta_pagar_status ON public.conta_pagar USING btree (status_pagamento)
//   CREATE INDEX idx_conta_pagar_vencimento ON public.conta_pagar USING btree (data_vencimento)
// Table: conta_receber
//   CREATE INDEX idx_conta_receber_cod_duplicata ON public.conta_receber USING btree (cod_duplicata)
//   CREATE INDEX idx_conta_receber_cod_venda ON public.conta_receber USING btree (cod_venda)
//   CREATE INDEX idx_conta_receber_pessoa ON public.conta_receber USING btree (cod_pessoa)
//   CREATE INDEX idx_conta_receber_projeto ON public.conta_receber USING btree (projeto_id)
//   CREATE INDEX idx_conta_receber_status ON public.conta_receber USING btree (status_pagamento)
//   CREATE INDEX idx_conta_receber_vencimento ON public.conta_receber USING btree (data_vencimento)
// Table: contatos
//   CREATE INDEX idx_contatos_cidade_estado ON public.contatos USING btree (cidade, estado)
//   CREATE INDEX idx_contatos_codigo_legado ON public.contatos USING btree (codigo_legado, tipo)
//   CREATE INDEX idx_contatos_cpf_cnpj ON public.contatos USING btree (cpf_cnpj)
//   CREATE INDEX idx_contatos_created_by ON public.contatos USING btree (created_by)
//   CREATE INDEX idx_contatos_email ON public.contatos USING btree (email)
//   CREATE INDEX idx_contatos_nome ON public.contatos USING gin (to_tsvector('portuguese'::regconfig, nome))
//   CREATE INDEX idx_contatos_nome_trgm ON public.contatos USING gin (nome gin_trgm_ops)
//   CREATE INDEX idx_contatos_tipo ON public.contatos USING btree (tipo)
//   CREATE UNIQUE INDEX uq_contatos_codigo_legado_tipo ON public.contatos USING btree (codigo_legado, tipo)
//   CREATE UNIQUE INDEX uq_contatos_cpf_cnpj ON public.contatos USING btree (cpf_cnpj)
// Table: controle_falta
//   CREATE UNIQUE INDEX controle_ponto_funcionario_id_data_key ON public.controle_falta USING btree (funcionario_id, data)
//   CREATE INDEX idx_ponto_data ON public.controle_falta USING btree (data DESC)
//   CREATE INDEX idx_ponto_funcionario ON public.controle_falta USING btree (funcionario_id)
// Table: custos_recorrentes
//   CREATE INDEX idx_custos_rec_categoria ON public.custos_recorrentes USING btree (categoria_id)
//   CREATE INDEX idx_custos_rec_conta ON public.custos_recorrentes USING btree (conta_id)
//   CREATE INDEX idx_custos_rec_created_by ON public.custos_recorrentes USING btree (created_by)
// Table: custos_recorrentes_lancamentos
//   CREATE UNIQUE INDEX custos_recorrentes_lancamentos_custo_id_competencia_key ON public.custos_recorrentes_lancamentos USING btree (custo_id, competencia)
//   CREATE INDEX idx_lanc_competencia ON public.custos_recorrentes_lancamentos USING btree (competencia DESC)
//   CREATE INDEX idx_lanc_custo ON public.custos_recorrentes_lancamentos USING btree (custo_id)
//   CREATE INDEX idx_lanc_status ON public.custos_recorrentes_lancamentos USING btree (status)
//   CREATE INDEX idx_lanc_transacao ON public.custos_recorrentes_lancamentos USING btree (transacao_id)
//   CREATE INDEX idx_lanc_vencimento ON public.custos_recorrentes_lancamentos USING btree (data_vencimento)
// Table: departamentos
//   CREATE UNIQUE INDEX departamentos_nome_key ON public.departamentos USING btree (nome)
// Table: entregas
//   CREATE INDEX idx_entregas_data ON public.entregas USING btree (data_prevista)
//   CREATE INDEX idx_entregas_entregador ON public.entregas USING btree (entregador_id)
//   CREATE INDEX idx_entregas_projeto ON public.entregas USING btree (projeto_id)
//   CREATE INDEX idx_entregas_separacao ON public.entregas USING btree (separacao_id)
//   CREATE INDEX idx_entregas_status ON public.entregas USING btree (status)
// Table: estoque_itens
//   CREATE UNIQUE INDEX estoque_itens_produto_id_local_key ON public.estoque_itens USING btree (produto_id, local)
//   CREATE INDEX idx_estoque_atualizado_por ON public.estoque_itens USING btree (atualizado_por)
//   CREATE INDEX idx_estoque_local ON public.estoque_itens USING btree (local)
//   CREATE INDEX idx_estoque_produto ON public.estoque_itens USING btree (produto_id)
// Table: ferias
//   CREATE INDEX idx_ferias_aprovado_por ON public.ferias USING btree (aprovado_por)
//   CREATE INDEX idx_ferias_funcionario ON public.ferias USING btree (funcionario_id)
//   CREATE INDEX idx_ferias_status ON public.ferias USING btree (status)
// Table: folha_pagamento
//   CREATE UNIQUE INDEX folha_pagamento_funcionario_id_mes_ano_key ON public.folha_pagamento USING btree (funcionario_id, mes, ano)
//   CREATE INDEX idx_folha_funcionario ON public.folha_pagamento USING btree (funcionario_id)
//   CREATE INDEX idx_folha_mes_ano ON public.folha_pagamento USING btree (ano DESC, mes DESC)
// Table: funcionarios
//   CREATE UNIQUE INDEX funcionarios_email_key ON public.funcionarios USING btree (email)
//   CREATE INDEX idx_func_departamento ON public.funcionarios USING btree (departamento_id)
//   CREATE INDEX idx_func_status ON public.funcionarios USING btree (status)
//   CREATE INDEX idx_func_usuario ON public.funcionarios USING btree (usuario_id)
// Table: marcas
//   CREATE UNIQUE INDEX marcas_nome_key ON public.marcas USING btree (nome)
// Table: pedido_compra
//   CREATE INDEX idx_pedido_compra_codigo ON public.pedido_compra USING btree (codigo_pedido)
//   CREATE INDEX idx_pedido_compra_data ON public.pedido_compra USING btree (data_emissao)
//   CREATE INDEX idx_pedido_compra_fornecedor ON public.pedido_compra USING btree (cod_fornecedor)
//   CREATE UNIQUE INDEX pedido_compra_codigo_pedido_key ON public.pedido_compra USING btree (codigo_pedido)
// Table: produtos
//   CREATE INDEX idx_prod_categoria ON public.produtos USING btree (categoria)
//   CREATE INDEX idx_prod_marca ON public.produtos USING btree (marca_id)
//   CREATE INDEX idx_prod_sku ON public.produtos USING btree (sku)
//   CREATE INDEX idx_produtos_ativo ON public.produtos USING btree (ativo)
//   CREATE INDEX idx_produtos_categoria ON public.produtos USING btree (cod_categoria)
//   CREATE INDEX idx_produtos_codigo ON public.produtos USING btree (codigo_produto)
//   CREATE INDEX idx_produtos_marca ON public.produtos USING btree (cod_marca)
//   CREATE INDEX idx_produtos_referencia ON public.produtos USING btree (referencia)
//   CREATE UNIQUE INDEX produtos_codigo_produto_key ON public.produtos USING btree (codigo_produto)
//   CREATE UNIQUE INDEX produtos_sku_key ON public.produtos USING btree (sku)
// Table: projeto_itens
//   CREATE INDEX idx_pi_produto ON public.projeto_itens USING btree (produto_id)
//   CREATE INDEX idx_pi_projeto ON public.projeto_itens USING btree (projeto_id)
//   CREATE INDEX idx_pi_validado ON public.projeto_itens USING btree (projeto_id, validado)
// Table: projeto_parcelas
//   CREATE INDEX idx_parcelas_projeto ON public.projeto_parcelas USING btree (projeto_id)
//   CREATE INDEX idx_parcelas_status ON public.projeto_parcelas USING btree (status)
//   CREATE INDEX idx_parcelas_transacao ON public.projeto_parcelas USING btree (transacao_id)
//   CREATE INDEX idx_parcelas_vencimento ON public.projeto_parcelas USING btree (data_vencimento)
//   CREATE INDEX idx_parcelas_venda ON public.projeto_parcelas USING btree (venda_id)
//   CREATE UNIQUE INDEX projeto_parcelas_projeto_id_numero_parcela_key ON public.projeto_parcelas USING btree (projeto_id, numero_parcela)
// Table: projeto_produtos
//   CREATE INDEX idx_projeto_produtos_produto ON public.projeto_produtos USING btree (produto_id)
//   CREATE INDEX idx_projeto_produtos_projeto ON public.projeto_produtos USING btree (projeto_id)
//   CREATE UNIQUE INDEX projeto_produtos_projeto_id_produto_id_key ON public.projeto_produtos USING btree (projeto_id, produto_id)
// Table: projeto_sinal
//   CREATE INDEX idx_sinal_projeto ON public.projeto_sinal USING btree (projeto_id)
//   CREATE INDEX idx_sinal_status ON public.projeto_sinal USING btree (status)
//   CREATE INDEX idx_sinal_transacao ON public.projeto_sinal USING btree (transacao_id)
//   CREATE UNIQUE INDEX projeto_sinal_projeto_id_key ON public.projeto_sinal USING btree (projeto_id)
// Table: projetos
//   CREATE INDEX idx_projetos_area_do_projeto_gin ON public.projetos USING gin (area_do_projeto)
//   CREATE INDEX idx_projetos_arquiteto ON public.projetos USING btree (arquiteto_id)
//   CREATE INDEX idx_projetos_arquivado ON public.projetos USING btree (arquivado)
//   CREATE INDEX idx_projetos_client_id ON public.projetos USING btree (client_id)
//   CREATE INDEX idx_projetos_cliente_id ON public.projetos USING btree (cliente_id)
//   CREATE INDEX idx_projetos_codigo ON public.projetos USING btree (codigo)
//   CREATE INDEX idx_projetos_created_by ON public.projetos USING btree (created_by)
//   CREATE INDEX idx_projetos_data_entrada ON public.projetos USING btree (data_entrada)
//   CREATE INDEX idx_projetos_nivel ON public.projetos USING btree (nivel_estrategico)
//   CREATE INDEX idx_projetos_nome ON public.projetos USING gin (to_tsvector('portuguese'::regconfig, nome))
//   CREATE INDEX idx_projetos_resp_obra ON public.projetos USING btree (responsavel_obra_id)
//   CREATE INDEX idx_projetos_responsavel ON public.projetos USING btree (responsavel_id)
//   CREATE INDEX idx_projetos_status ON public.projetos USING btree (status)
//   CREATE INDEX idx_projetos_tipo_projeto ON public.projetos USING btree (((area_do_projeto ->> 'tipo'::text)))
//   CREATE UNIQUE INDEX projetos_codigo_key ON public.projetos USING btree (codigo)
// Table: separacao_arquivos
//   CREATE INDEX idx_sep_arq_separacao ON public.separacao_arquivos USING btree (separacao_id)
// Table: separacao_itens
//   CREATE INDEX idx_sep_itens_produto ON public.separacao_itens USING btree (produto_id)
//   CREATE INDEX idx_sep_itens_separacao ON public.separacao_itens USING btree (separacao_id)
// Table: separacoes
//   CREATE INDEX idx_sep_cliente_id ON public.separacoes USING btree (cliente_id)
//   CREATE INDEX idx_sep_data_entrega ON public.separacoes USING btree (data_entrega)
//   CREATE INDEX idx_sep_projeto ON public.separacoes USING btree (projeto_id)
//   CREATE INDEX idx_sep_responsavel ON public.separacoes USING btree (responsavel_id)
//   CREATE INDEX idx_sep_status ON public.separacoes USING btree (status)
// Table: solicitacoes_compra
//   CREATE INDEX idx_solicit_aprovador ON public.solicitacoes_compra USING btree (aprovador_id)
//   CREATE INDEX idx_solicit_categoria ON public.solicitacoes_compra USING btree (categoria_id)
//   CREATE INDEX idx_solicit_projeto ON public.solicitacoes_compra USING btree (projeto_id)
//   CREATE INDEX idx_solicit_solicitante ON public.solicitacoes_compra USING btree (solicitante_id)
//   CREATE INDEX idx_solicit_status ON public.solicitacoes_compra USING btree (status)
//   CREATE INDEX idx_solicit_transacao ON public.solicitacoes_compra USING btree (transacao_id)
// Table: staging_conta_pagar
//   CREATE INDEX idx_staging_cp_cod_venda ON public.staging_conta_pagar USING btree (cod_venda)
//   CREATE INDEX idx_staging_cp_processado ON public.staging_conta_pagar USING btree (processado)
// Table: staging_conta_receber
//   CREATE INDEX idx_staging_cr_cod_venda ON public.staging_conta_receber USING btree (cod_venda)
//   CREATE INDEX idx_staging_cr_processado ON public.staging_conta_receber USING btree (processado)
// Table: staging_pedido_compra
//   CREATE INDEX idx_staging_pc_codigo ON public.staging_pedido_compra USING btree (codigo_pedido)
//   CREATE INDEX idx_staging_pc_processado ON public.staging_pedido_compra USING btree (processado)
// Table: staging_produtos
//   CREATE INDEX idx_staging_prod_codigo ON public.staging_produtos USING btree (codproduto)
//   CREATE INDEX idx_staging_prod_processado ON public.staging_produtos USING btree (processado)
// Table: sync_history
//   CREATE INDEX idx_sync_executado_por ON public.sync_history USING btree (executado_por)
//   CREATE INDEX idx_sync_history_data ON public.sync_history USING btree (created_at DESC)
// Table: transacoes
//   CREATE INDEX idx_trans_categoria_id ON public.transacoes USING btree (categoria_id)
//   CREATE INDEX idx_trans_conta ON public.transacoes USING btree (conta_id)
//   CREATE INDEX idx_trans_created_by ON public.transacoes USING btree (created_by)
//   CREATE INDEX idx_trans_data ON public.transacoes USING btree (data_transacao DESC)
//   CREATE INDEX idx_trans_parcela ON public.transacoes USING btree (parcela_id)
//   CREATE INDEX idx_trans_projeto ON public.transacoes USING btree (projeto_id)
//   CREATE INDEX idx_trans_tipo ON public.transacoes USING btree (tipo)
// Table: transactions
//   CREATE INDEX transactions_created_at_idx ON public.transactions USING btree (created_at DESC)
// Table: usuarios
//   CREATE INDEX idx_usuarios_email ON public.usuarios USING btree (email)
//   CREATE INDEX idx_usuarios_role ON public.usuarios USING btree (role)
//   CREATE UNIQUE INDEX usuarios_email_key ON public.usuarios USING btree (email)
// Table: vendas
//   CREATE INDEX idx_vendas_cod_venda ON public.vendas USING btree (cod_venda)
//   CREATE INDEX idx_vendas_data_emissao ON public.vendas USING btree (data_emissao)
//   CREATE INDEX idx_vendas_projeto_id ON public.vendas USING btree (projeto_id)
//   CREATE INDEX idx_vendas_status ON public.vendas USING btree (status_pagamento)
//   CREATE UNIQUE INDEX vendas_cod_venda_key ON public.vendas USING btree (cod_venda)
// Table: vendas_marca
//   CREATE UNIQUE INDEX vendas_marca_marca_id_mes_ano_key ON public.vendas_marca USING btree (marca_id, mes, ano)
