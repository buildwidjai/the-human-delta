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
      report_jobs: {
        Row: {
          assessment_id: string | null
          attempt_count: number
          client_name: string | null
          created_at: string
          email_attempt_count: number
          email_encrypted: string | null
          email_status: string
          hashed_email: string | null
          is_reattempt: boolean
          job_id: string
          last_email_error: string | null
          last_llm_error: string | null
          llm_input: Json
          llm_output: Json | null
          locked_at: string | null
          locked_by: string | null
          payment_token: string | null
          payment_transaction_id: string | null
          report_id: string | null
          session_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assessment_id?: string | null
          attempt_count?: number
          client_name?: string | null
          created_at?: string
          email_attempt_count?: number
          email_encrypted?: string | null
          email_status?: string
          hashed_email?: string | null
          is_reattempt?: boolean
          job_id?: string
          last_email_error?: string | null
          last_llm_error?: string | null
          llm_input: Json
          llm_output?: Json | null
          locked_at?: string | null
          locked_by?: string | null
          payment_token?: string | null
          payment_transaction_id?: string | null
          report_id?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string | null
          attempt_count?: number
          client_name?: string | null
          created_at?: string
          email_attempt_count?: number
          email_encrypted?: string | null
          email_status?: string
          hashed_email?: string | null
          is_reattempt?: boolean
          job_id?: string
          last_email_error?: string | null
          last_llm_error?: string | null
          llm_input?: Json
          llm_output?: Json | null
          locked_at?: string | null
          locked_by?: string | null
          payment_token?: string | null
          payment_transaction_id?: string | null
          report_id?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      temr_audit_logs: {
        Row: {
          archetype: string | null
          assembler_end_ms: number | null
          assembler_start_ms: number | null
          audit_id: string
          bias_flags: Json | null
          computed_scores: Json | null
          created_at: string
          demographic_data: Json | null
          demographics: Json | null
          error_code: string | null
          error_message: string | null
          glossary_flags: Json | null
          hashed_email: string | null
          kb_files_selected: Json | null
          kb_total_chars: number | null
          llm_first_token_ms: number | null
          llm_input: Json | null
          llm_input_tokens: number | null
          llm_model: string | null
          llm_output_raw: string | null
          llm_output_tokens: number | null
          llm_parse_error: string | null
          llm_parse_success: boolean | null
          llm_request_sent_ms: number | null
          llm_response_end_ms: number | null
          lowest_pillar: string | null
          narrative_file_size_bytes: number | null
          narrative_storage_path: string | null
          narrative_uploaded_at: string | null
          output_validated: boolean | null
          parent_audit_id: string | null
          pdf_download_url: string | null
          primary_pillar: string | null
          public_report_id: string | null
          raw_responses: Json | null
          report_delivered: boolean | null
          secondary_pillar: string | null
          session_id: string | null
          status: string
          system_prompt_sha256: string | null
          system_prompt_version: string
          total_duration_ms: number | null
          trait_scores: Json | null
          updated_at: string
          user_prompt_full: string | null
          user_prompt_tokens: number | null
          validation_errors: Json | null
        }
        Insert: {
          archetype?: string | null
          assembler_end_ms?: number | null
          assembler_start_ms?: number | null
          audit_id?: string
          bias_flags?: Json | null
          computed_scores?: Json | null
          created_at?: string
          demographic_data?: Json | null
          demographics?: Json | null
          error_code?: string | null
          error_message?: string | null
          glossary_flags?: Json | null
          hashed_email?: string | null
          kb_files_selected?: Json | null
          kb_total_chars?: number | null
          llm_first_token_ms?: number | null
          llm_input?: Json | null
          llm_input_tokens?: number | null
          llm_model?: string | null
          llm_output_raw?: string | null
          llm_output_tokens?: number | null
          llm_parse_error?: string | null
          llm_parse_success?: boolean | null
          llm_request_sent_ms?: number | null
          llm_response_end_ms?: number | null
          lowest_pillar?: string | null
          narrative_file_size_bytes?: number | null
          narrative_storage_path?: string | null
          narrative_uploaded_at?: string | null
          output_validated?: boolean | null
          parent_audit_id?: string | null
          pdf_download_url?: string | null
          primary_pillar?: string | null
          public_report_id?: string | null
          raw_responses?: Json | null
          report_delivered?: boolean | null
          secondary_pillar?: string | null
          session_id?: string | null
          status?: string
          system_prompt_sha256?: string | null
          system_prompt_version: string
          total_duration_ms?: number | null
          trait_scores?: Json | null
          updated_at?: string
          user_prompt_full?: string | null
          user_prompt_tokens?: number | null
          validation_errors?: Json | null
        }
        Update: {
          archetype?: string | null
          assembler_end_ms?: number | null
          assembler_start_ms?: number | null
          audit_id?: string
          bias_flags?: Json | null
          computed_scores?: Json | null
          created_at?: string
          demographic_data?: Json | null
          demographics?: Json | null
          error_code?: string | null
          error_message?: string | null
          glossary_flags?: Json | null
          hashed_email?: string | null
          kb_files_selected?: Json | null
          kb_total_chars?: number | null
          llm_first_token_ms?: number | null
          llm_input?: Json | null
          llm_input_tokens?: number | null
          llm_model?: string | null
          llm_output_raw?: string | null
          llm_output_tokens?: number | null
          llm_parse_error?: string | null
          llm_parse_success?: boolean | null
          llm_request_sent_ms?: number | null
          llm_response_end_ms?: number | null
          lowest_pillar?: string | null
          narrative_file_size_bytes?: number | null
          narrative_storage_path?: string | null
          narrative_uploaded_at?: string | null
          output_validated?: boolean | null
          parent_audit_id?: string | null
          pdf_download_url?: string | null
          primary_pillar?: string | null
          public_report_id?: string | null
          raw_responses?: Json | null
          report_delivered?: boolean | null
          secondary_pillar?: string | null
          session_id?: string | null
          status?: string
          system_prompt_sha256?: string | null
          system_prompt_version?: string
          total_duration_ms?: number | null
          trait_scores?: Json | null
          updated_at?: string
          user_prompt_full?: string | null
          user_prompt_tokens?: number | null
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "temr_audit_logs_parent_audit_id_fkey"
            columns: ["parent_audit_id"]
            isOneToOne: false
            referencedRelation: "temr_audit_logs"
            referencedColumns: ["audit_id"]
          },
        ]
      }
      transaction_audit_logs: {
        Row: {
          archetype_scores: Json | null
          audit_id: string
          created_at: string
          demographics: Json | null
          email_request_id: string | null
          email_sent_at: string | null
          email_sent_success: boolean | null
          error_details: string | null
          final_transaction_status: string | null
          hashed_email: string | null
          is_reattempt: boolean
          llm_duration_ms: number | null
          llm_error_details: string | null
          llm_generation_status: string | null
          llm_input: Json | null
          llm_input_prompt: Json | null
          llm_input_tokens: number | null
          llm_model: string | null
          llm_output: Json | null
          llm_output_tokens: number | null
          llm_request_id: string | null
          llm_transaction_status: string | null
          payment_completed_at: string | null
          payment_error_code: string | null
          payment_error_message: string | null
          payment_request_id: string | null
          payment_success: boolean | null
          payment_transaction_id: string | null
          report_generated_at: string
          report_id: string | null
          retry_count: number
          session_id: string | null
          successful_retry_number: number | null
          test_run: boolean
          total_duration_ms: number | null
          updated_at: string
        }
        Insert: {
          archetype_scores?: Json | null
          audit_id?: string
          created_at?: string
          demographics?: Json | null
          email_request_id?: string | null
          email_sent_at?: string | null
          email_sent_success?: boolean | null
          error_details?: string | null
          final_transaction_status?: string | null
          hashed_email?: string | null
          is_reattempt?: boolean
          llm_duration_ms?: number | null
          llm_error_details?: string | null
          llm_generation_status?: string | null
          llm_input?: Json | null
          llm_input_prompt?: Json | null
          llm_input_tokens?: number | null
          llm_model?: string | null
          llm_output?: Json | null
          llm_output_tokens?: number | null
          llm_request_id?: string | null
          llm_transaction_status?: string | null
          payment_completed_at?: string | null
          payment_error_code?: string | null
          payment_error_message?: string | null
          payment_request_id?: string | null
          payment_success?: boolean | null
          payment_transaction_id?: string | null
          report_generated_at?: string
          report_id?: string | null
          retry_count?: number
          session_id?: string | null
          successful_retry_number?: number | null
          test_run?: boolean
          total_duration_ms?: number | null
          updated_at?: string
        }
        Update: {
          archetype_scores?: Json | null
          audit_id?: string
          created_at?: string
          demographics?: Json | null
          email_request_id?: string | null
          email_sent_at?: string | null
          email_sent_success?: boolean | null
          error_details?: string | null
          final_transaction_status?: string | null
          hashed_email?: string | null
          is_reattempt?: boolean
          llm_duration_ms?: number | null
          llm_error_details?: string | null
          llm_generation_status?: string | null
          llm_input?: Json | null
          llm_input_prompt?: Json | null
          llm_input_tokens?: number | null
          llm_model?: string | null
          llm_output?: Json | null
          llm_output_tokens?: number | null
          llm_request_id?: string | null
          llm_transaction_status?: string | null
          payment_completed_at?: string | null
          payment_error_code?: string | null
          payment_error_message?: string | null
          payment_request_id?: string | null
          payment_success?: boolean | null
          payment_transaction_id?: string | null
          report_generated_at?: string
          report_id?: string | null
          retry_count?: number
          session_id?: string | null
          successful_retry_number?: number | null
          test_run?: boolean
          total_duration_ms?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_next_report_job: {
        Args: { _worker_id: string }
        Returns: {
          assessment_id: string | null
          attempt_count: number
          client_name: string | null
          created_at: string
          email_attempt_count: number
          email_encrypted: string | null
          email_status: string
          hashed_email: string | null
          is_reattempt: boolean
          job_id: string
          last_email_error: string | null
          last_llm_error: string | null
          llm_input: Json
          llm_output: Json | null
          locked_at: string | null
          locked_by: string | null
          payment_token: string | null
          payment_transaction_id: string | null
          report_id: string | null
          session_id: string | null
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "report_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
