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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      anexos_chamado: {
        Row: {
          bucket: string
          criado_em: string
          descricao: string | null
          designacao: string | null
          id: number
          id_chamado: string
          mime_type: string | null
          nome_original: string
          storage_path: string
          tamanho_bytes: number | null
          unidade_escolar: string | null
        }
        Insert: {
          bucket?: string
          criado_em?: string
          descricao?: string | null
          designacao?: string | null
          id?: never
          id_chamado: string
          mime_type?: string | null
          nome_original: string
          storage_path: string
          tamanho_bytes?: number | null
          unidade_escolar?: string | null
        }
        Update: {
          bucket?: string
          criado_em?: string
          descricao?: string | null
          designacao?: string | null
          id?: never
          id_chamado?: string
          mime_type?: string | null
          nome_original?: string
          storage_path?: string
          tamanho_bytes?: number | null
          unidade_escolar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anexos_chamado_designacao_fkey"
            columns: ["designacao"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["designacao"]
          },
          {
            foreignKeyName: "anexos_chamado_designacao_fkey"
            columns: ["designacao"]
            isOneToOne: false
            referencedRelation: "vw_escolas_resumo_climatizacao"
            referencedColumns: ["designacao"]
          },
          {
            foreignKeyName: "anexos_chamado_id_chamado_fkey"
            columns: ["id_chamado"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id_chamado"]
          },
          {
            foreignKeyName: "anexos_chamado_id_chamado_fkey"
            columns: ["id_chamado"]
            isOneToOne: false
            referencedRelation: "vw_chamados_ativos"
            referencedColumns: ["id_chamado"]
          },
          {
            foreignKeyName: "anexos_chamado_id_chamado_fkey"
            columns: ["id_chamado"]
            isOneToOne: false
            referencedRelation: "vw_chamados_sem_anexo"
            referencedColumns: ["id_chamado"]
          },
          {
            foreignKeyName: "anexos_chamado_id_chamado_fkey"
            columns: ["id_chamado"]
            isOneToOne: false
            referencedRelation: "vw_chamados_sem_movimentacao"
            referencedColumns: ["id_chamado"]
          },
        ]
      }
      chamados: {
        Row: {
          btu_existente: string | null
          btu_pretendido: string | null
          comunicacao_cto: string | null
          criado_em: string | null
          data_solicitacao: string | null
          designacao: string | null
          id_chamado: string
          informacao_validada: string | null
          local_demanda: string | null
          modificado_em: string | null
          observacoes: string | null
          prioridade: string | null
          proxima_providencia: string | null
          resultado_aptidao: string | null
          setor_responsavel: string | null
          status_atual: string | null
          tipo_aparelho: string | null
          tipo_demanda: string | null
          ultima_movimentacao: string | null
          unidade_escolar: string | null
        }
        Insert: {
          btu_existente?: string | null
          btu_pretendido?: string | null
          comunicacao_cto?: string | null
          criado_em?: string | null
          data_solicitacao?: string | null
          designacao?: string | null
          id_chamado: string
          informacao_validada?: string | null
          local_demanda?: string | null
          modificado_em?: string | null
          observacoes?: string | null
          prioridade?: string | null
          proxima_providencia?: string | null
          resultado_aptidao?: string | null
          setor_responsavel?: string | null
          status_atual?: string | null
          tipo_aparelho?: string | null
          tipo_demanda?: string | null
          ultima_movimentacao?: string | null
          unidade_escolar?: string | null
        }
        Update: {
          btu_existente?: string | null
          btu_pretendido?: string | null
          comunicacao_cto?: string | null
          criado_em?: string | null
          data_solicitacao?: string | null
          designacao?: string | null
          id_chamado?: string
          informacao_validada?: string | null
          local_demanda?: string | null
          modificado_em?: string | null
          observacoes?: string | null
          prioridade?: string | null
          proxima_providencia?: string | null
          resultado_aptidao?: string | null
          setor_responsavel?: string | null
          status_atual?: string | null
          tipo_aparelho?: string | null
          tipo_demanda?: string | null
          ultima_movimentacao?: string | null
          unidade_escolar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chamados_designacao_fkey"
            columns: ["designacao"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["designacao"]
          },
          {
            foreignKeyName: "chamados_designacao_fkey"
            columns: ["designacao"]
            isOneToOne: false
            referencedRelation: "vw_escolas_resumo_climatizacao"
            referencedColumns: ["designacao"]
          },
        ]
      }
      escolas: {
        Row: {
          acao_sugerida: string | null
          aparelhos_em_sala: number | null
          aparelhos_total: number | null
          bairro: string | null
          confirmado_pela_unidade: string | null
          designacao: string
          endereco: string | null
          necessidade_aparelhos: number | null
          qtd_salas_de_aula: number | null
          salas_sem_aparelho: number | null
          sici: string | null
          unidade_escolar: string | null
          validado_pela_gop: string | null
        }
        Insert: {
          acao_sugerida?: string | null
          aparelhos_em_sala?: number | null
          aparelhos_total?: number | null
          bairro?: string | null
          confirmado_pela_unidade?: string | null
          designacao: string
          endereco?: string | null
          necessidade_aparelhos?: number | null
          qtd_salas_de_aula?: number | null
          salas_sem_aparelho?: number | null
          sici?: string | null
          unidade_escolar?: string | null
          validado_pela_gop?: string | null
        }
        Update: {
          acao_sugerida?: string | null
          aparelhos_em_sala?: number | null
          aparelhos_total?: number | null
          bairro?: string | null
          confirmado_pela_unidade?: string | null
          designacao?: string
          endereco?: string | null
          necessidade_aparelhos?: number | null
          qtd_salas_de_aula?: number | null
          salas_sem_aparelho?: number | null
          sici?: string | null
          unidade_escolar?: string | null
          validado_pela_gop?: string | null
        }
        Relationships: []
      }
      historico: {
        Row: {
          data: string | null
          designacao: string | null
          id_chamado: string | null
          id_evento: string
          marco_relevante: string | null
          observacao: string | null
          responsavel_registro: string | null
          setor: string | null
          unidade_escolar: string | null
        }
        Insert: {
          data?: string | null
          designacao?: string | null
          id_chamado?: string | null
          id_evento: string
          marco_relevante?: string | null
          observacao?: string | null
          responsavel_registro?: string | null
          setor?: string | null
          unidade_escolar?: string | null
        }
        Update: {
          data?: string | null
          designacao?: string | null
          id_chamado?: string | null
          id_evento?: string
          marco_relevante?: string | null
          observacao?: string | null
          responsavel_registro?: string | null
          setor?: string | null
          unidade_escolar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_id_chamado_fkey"
            columns: ["id_chamado"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id_chamado"]
          },
          {
            foreignKeyName: "historico_id_chamado_fkey"
            columns: ["id_chamado"]
            isOneToOne: false
            referencedRelation: "vw_chamados_ativos"
            referencedColumns: ["id_chamado"]
          },
          {
            foreignKeyName: "historico_id_chamado_fkey"
            columns: ["id_chamado"]
            isOneToOne: false
            referencedRelation: "vw_chamados_sem_anexo"
            referencedColumns: ["id_chamado"]
          },
          {
            foreignKeyName: "historico_id_chamado_fkey"
            columns: ["id_chamado"]
            isOneToOne: false
            referencedRelation: "vw_chamados_sem_movimentacao"
            referencedColumns: ["id_chamado"]
          },
        ]
      }
      modelos_email: {
        Row: {
          etapa: string | null
          id: number
          template: string | null
          tipo: string | null
        }
        Insert: {
          etapa?: string | null
          id?: never
          template?: string | null
          tipo?: string | null
        }
        Update: {
          etapa?: string | null
          id?: never
          template?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vw_chamados_ativos: {
        Row: {
          btu_existente: string | null
          btu_pretendido: string | null
          comunicacao_cto: string | null
          criado_em: string | null
          data_solicitacao: string | null
          designacao: string | null
          id_chamado: string | null
          informacao_validada: string | null
          local_demanda: string | null
          modificado_em: string | null
          observacoes: string | null
          prioridade: string | null
          proxima_providencia: string | null
          resultado_aptidao: string | null
          setor_responsavel: string | null
          status_atual: string | null
          tipo_aparelho: string | null
          tipo_demanda: string | null
          ultima_movimentacao: string | null
          unidade_escolar: string | null
        }
        Insert: {
          btu_existente?: string | null
          btu_pretendido?: string | null
          comunicacao_cto?: string | null
          criado_em?: string | null
          data_solicitacao?: string | null
          designacao?: string | null
          id_chamado?: string | null
          informacao_validada?: string | null
          local_demanda?: string | null
          modificado_em?: string | null
          observacoes?: string | null
          prioridade?: string | null
          proxima_providencia?: string | null
          resultado_aptidao?: string | null
          setor_responsavel?: string | null
          status_atual?: string | null
          tipo_aparelho?: string | null
          tipo_demanda?: string | null
          ultima_movimentacao?: string | null
          unidade_escolar?: string | null
        }
        Update: {
          btu_existente?: string | null
          btu_pretendido?: string | null
          comunicacao_cto?: string | null
          criado_em?: string | null
          data_solicitacao?: string | null
          designacao?: string | null
          id_chamado?: string | null
          informacao_validada?: string | null
          local_demanda?: string | null
          modificado_em?: string | null
          observacoes?: string | null
          prioridade?: string | null
          proxima_providencia?: string | null
          resultado_aptidao?: string | null
          setor_responsavel?: string | null
          status_atual?: string | null
          tipo_aparelho?: string | null
          tipo_demanda?: string | null
          ultima_movimentacao?: string | null
          unidade_escolar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chamados_designacao_fkey"
            columns: ["designacao"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["designacao"]
          },
          {
            foreignKeyName: "chamados_designacao_fkey"
            columns: ["designacao"]
            isOneToOne: false
            referencedRelation: "vw_escolas_resumo_climatizacao"
            referencedColumns: ["designacao"]
          },
        ]
      }
      vw_chamados_por_bairro: {
        Row: {
          bairro: string | null
          chamados_ativos: number | null
          total_chamados: number | null
        }
        Relationships: []
      }
      vw_chamados_por_status: {
        Row: {
          status_atual: string | null
          total: number | null
        }
        Relationships: []
      }
      vw_chamados_sem_anexo: {
        Row: {
          id_chamado: string | null
          prioridade: string | null
          status_atual: string | null
          unidade_escolar: string | null
        }
        Relationships: []
      }
      vw_chamados_sem_movimentacao: {
        Row: {
          dias_sem_movimentacao: number | null
          id_chamado: string | null
          modificado_em: string | null
          status_atual: string | null
          unidade_escolar: string | null
        }
        Insert: {
          dias_sem_movimentacao?: never
          id_chamado?: string | null
          modificado_em?: string | null
          status_atual?: string | null
          unidade_escolar?: string | null
        }
        Update: {
          dias_sem_movimentacao?: never
          id_chamado?: string | null
          modificado_em?: string | null
          status_atual?: string | null
          unidade_escolar?: string | null
        }
        Relationships: []
      }
      vw_escolas_resumo_climatizacao: {
        Row: {
          aparelhos_em_sala: number | null
          aparelhos_total: number | null
          bairro: string | null
          densidade_aparelhos_sala: number | null
          designacao: string | null
          necessidade_aparelhos: number | null
          percentual_climatizacao: number | null
          qtd_salas_de_aula: number | null
          salas_sem_aparelho: number | null
          unidade_escolar: string | null
        }
        Insert: {
          aparelhos_em_sala?: number | null
          aparelhos_total?: number | null
          bairro?: string | null
          densidade_aparelhos_sala?: never
          designacao?: string | null
          necessidade_aparelhos?: number | null
          percentual_climatizacao?: never
          qtd_salas_de_aula?: number | null
          salas_sem_aparelho?: number | null
          unidade_escolar?: string | null
        }
        Update: {
          aparelhos_em_sala?: number | null
          aparelhos_total?: number | null
          bairro?: string | null
          densidade_aparelhos_sala?: never
          designacao?: string | null
          necessidade_aparelhos?: number | null
          percentual_climatizacao?: never
          qtd_salas_de_aula?: number | null
          salas_sem_aparelho?: number | null
          unidade_escolar?: string | null
        }
        Relationships: []
      }
      vw_integridade_operacional: {
        Row: {
          detalhe: string | null
          ref_id: string | null
          tipo_inconsistencia: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bytea_to_text: { Args: { data: string }; Returns: string }
      diagnostico_operacional: {
        Args: never
        Returns: {
          anexos_sem_chamado: number
          chamados_sem_escola: number
          historico_sem_chamado: number
          orfaos_totais: number
          prioridades_invalidas: number
          status_invalidos: number
          total_anexos: number
          total_chamados: number
          total_escolas: number
        }[]
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      save_ticket_with_history: {
        Args: { p_events: Json[]; p_ticket: Json }
        Returns: {
          btu_existente: string | null
          btu_pretendido: string | null
          comunicacao_cto: string | null
          criado_em: string | null
          data_solicitacao: string | null
          designacao: string | null
          id_chamado: string
          informacao_validada: string | null
          local_demanda: string | null
          modificado_em: string | null
          observacoes: string | null
          prioridade: string | null
          proxima_providencia: string | null
          resultado_aptidao: string | null
          setor_responsavel: string | null
          status_atual: string | null
          tipo_aparelho: string | null
          tipo_demanda: string | null
          ultima_movimentacao: string | null
          unidade_escolar: string | null
        }
        SetofOptions: {
          from: "*"
          to: "chamados"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      text_to_bytea: { Args: { data: string }; Returns: string }
      unaccent: { Args: { "": string }; Returns: string }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
