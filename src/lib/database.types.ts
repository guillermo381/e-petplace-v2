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
      admin_users: {
        Row: {
          activo: boolean | null
          created_at: string | null
          email: string
          id: string
          nombre: string | null
          rol: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          email: string
          id: string
          nombre?: string | null
          rol?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string | null
          rol?: string | null
        }
        Relationships: []
      }
      analytics_aggregated: {
        Row: {
          active_users: number | null
          alerts_count: number | null
          avg_daily_steps: number | null
          avg_heart_rate: number | null
          avg_order_value: number | null
          calculated_at: string
          country_code: string
          dimension_type: string
          dimension_value: string
          id: string
          orders_count: number | null
          orders_revenue: number | null
          report_date: string
          services_count: number | null
          total_pets: number | null
          vaccines_count: number | null
        }
        Insert: {
          active_users?: number | null
          alerts_count?: number | null
          avg_daily_steps?: number | null
          avg_heart_rate?: number | null
          avg_order_value?: number | null
          calculated_at?: string
          country_code: string
          dimension_type: string
          dimension_value: string
          id?: string
          orders_count?: number | null
          orders_revenue?: number | null
          report_date: string
          services_count?: number | null
          total_pets?: number | null
          vaccines_count?: number | null
        }
        Update: {
          active_users?: number | null
          alerts_count?: number | null
          avg_daily_steps?: number | null
          avg_heart_rate?: number | null
          avg_order_value?: number | null
          calculated_at?: string
          country_code?: string
          dimension_type?: string
          dimension_value?: string
          id?: string
          orders_count?: number | null
          orders_revenue?: number | null
          report_date?: string
          services_count?: number | null
          total_pets?: number | null
          vaccines_count?: number | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          anonymous_id: string | null
          app_version: string | null
          country_code: string
          event_name: string
          event_properties: Json | null
          id: string
          ingested_at: string
          occurred_at: string
          platform: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          app_version?: string | null
          country_code?: string
          event_name: string
          event_properties?: Json | null
          id?: string
          ingested_at?: string
          occurred_at?: string
          platform?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          app_version?: string | null
          country_code?: string
          event_name?: string
          event_properties?: Json | null
          id?: string
          ingested_at?: string
          occurred_at?: string
          platform?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      citas: {
        Row: {
          archivos_resultado: Json | null
          calificacion: number | null
          calificacion_comentario: string | null
          calificacion_en: string | null
          clinica: string | null
          country_code: string
          created_at: string | null
          diagnostico: string | null
          estado: string | null
          estado_reserva: string | null
          expira_en: string | null
          fecha: string | null
          guest_email: string | null
          hora: string | null
          id: string
          mascota_id: string | null
          motivo: string | null
          precio: number | null
          prestador_id: string | null
          proxima_cita_recomendada: string | null
          resultado_completado_en: string | null
          resultado_servicio: string | null
          tipo_servicio: string | null
          tratamiento: string | null
          user_id: string | null
          veterinario_nombre: string | null
        }
        Insert: {
          archivos_resultado?: Json | null
          calificacion?: number | null
          calificacion_comentario?: string | null
          calificacion_en?: string | null
          clinica?: string | null
          country_code?: string
          created_at?: string | null
          diagnostico?: string | null
          estado?: string | null
          estado_reserva?: string | null
          expira_en?: string | null
          fecha?: string | null
          guest_email?: string | null
          hora?: string | null
          id?: string
          mascota_id?: string | null
          motivo?: string | null
          precio?: number | null
          prestador_id?: string | null
          proxima_cita_recomendada?: string | null
          resultado_completado_en?: string | null
          resultado_servicio?: string | null
          tipo_servicio?: string | null
          tratamiento?: string | null
          user_id?: string | null
          veterinario_nombre?: string | null
        }
        Update: {
          archivos_resultado?: Json | null
          calificacion?: number | null
          calificacion_comentario?: string | null
          calificacion_en?: string | null
          clinica?: string | null
          country_code?: string
          created_at?: string | null
          diagnostico?: string | null
          estado?: string | null
          estado_reserva?: string | null
          expira_en?: string | null
          fecha?: string | null
          guest_email?: string | null
          hora?: string | null
          id?: string
          mascota_id?: string | null
          motivo?: string | null
          precio?: number | null
          prestador_id?: string | null
          proxima_cita_recomendada?: string | null
          resultado_completado_en?: string | null
          resultado_servicio?: string | null
          tipo_servicio?: string | null
          tratamiento?: string | null
          user_id?: string | null
          veterinario_nombre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "citas_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      consentimientos: {
        Row: {
          aceptado: boolean | null
          created_at: string | null
          id: string
          ip_hash: string | null
          metadata: Json | null
          tipo: string | null
          user_id: string | null
          version: string | null
        }
        Insert: {
          aceptado?: boolean | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          tipo?: string | null
          user_id?: string | null
          version?: string | null
        }
        Update: {
          aceptado?: boolean | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          tipo?: string | null
          user_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      country_config: {
        Row: {
          beta_only: boolean | null
          country_code: string
          country_name: string
          country_name_en: string
          created_at: string
          currency_code: string
          currency_decimals: number
          currency_symbol: string
          date_format: string
          default_language: string
          flag_emoji: string | null
          free_shipping_threshold: number | null
          id: string
          invoice_system: string | null
          is_active: boolean
          iva_pct: number
          launch_date: string | null
          payment_gateway: string
          payment_gateway_config: Json | null
          phone_prefix: string
          privacy_url: string | null
          requires_ruc: boolean | null
          services_enabled: Json
          shipping_providers: Json | null
          terms_url: string | null
          updated_at: string
        }
        Insert: {
          beta_only?: boolean | null
          country_code: string
          country_name: string
          country_name_en: string
          created_at?: string
          currency_code?: string
          currency_decimals?: number
          currency_symbol?: string
          date_format?: string
          default_language?: string
          flag_emoji?: string | null
          free_shipping_threshold?: number | null
          id?: string
          invoice_system?: string | null
          is_active?: boolean
          iva_pct?: number
          launch_date?: string | null
          payment_gateway?: string
          payment_gateway_config?: Json | null
          phone_prefix?: string
          privacy_url?: string | null
          requires_ruc?: boolean | null
          services_enabled?: Json
          shipping_providers?: Json | null
          terms_url?: string | null
          updated_at?: string
        }
        Update: {
          beta_only?: boolean | null
          country_code?: string
          country_name?: string
          country_name_en?: string
          created_at?: string
          currency_code?: string
          currency_decimals?: number
          currency_symbol?: string
          date_format?: string
          default_language?: string
          flag_emoji?: string | null
          free_shipping_threshold?: number | null
          id?: string
          invoice_system?: string | null
          is_active?: boolean
          iva_pct?: number
          launch_date?: string | null
          payment_gateway?: string
          payment_gateway_config?: Json | null
          phone_prefix?: string
          privacy_url?: string | null
          requires_ruc?: boolean | null
          services_enabled?: Json
          shipping_providers?: Json | null
          terms_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      daas_api_clients: {
        Row: {
          allowed_countries: string[] | null
          allowed_dimensions: string[] | null
          api_key: string
          company_name: string
          contact_email: string
          contract_end: string | null
          contract_start: string | null
          created_at: string
          id: string
          is_active: boolean
          last_accessed_at: string | null
          monthly_fee_usd: number | null
          notes: string | null
          tier: string
        }
        Insert: {
          allowed_countries?: string[] | null
          allowed_dimensions?: string[] | null
          api_key?: string
          company_name: string
          contact_email: string
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          monthly_fee_usd?: number | null
          notes?: string | null
          tier?: string
        }
        Update: {
          allowed_countries?: string[] | null
          allowed_dimensions?: string[] | null
          api_key?: string
          company_name?: string
          contact_email?: string
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          monthly_fee_usd?: number | null
          notes?: string | null
          tier?: string
        }
        Relationships: []
      }
      donaciones: {
        Row: {
          created_at: string | null
          estado: string | null
          guest_email: string | null
          id: string
          mascota_id: string | null
          mensaje: string | null
          monto: number
          numero_orden: string | null
          refugio: string | null
          tipo: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          guest_email?: string | null
          id?: string
          mascota_id?: string | null
          mensaje?: string | null
          monto: number
          numero_orden?: string | null
          refugio?: string | null
          tipo?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          guest_email?: string | null
          id?: string
          mascota_id?: string | null
          mensaje?: string | null
          monto?: number
          numero_orden?: string | null
          refugio?: string | null
          tipo?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donaciones_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas_adopcion"
            referencedColumns: ["id"]
          },
        ]
      }
      mascotas: {
        Row: {
          country_code: string
          created_at: string
          especie: string
          fecha_nacimiento: string | null
          foto_url: string | null
          id: string
          nombre: string
          notas: string | null
          peso: number | null
          pet_hash: string | null
          raza: string | null
          sexo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          especie?: string
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          nombre: string
          notas?: string | null
          peso?: number | null
          pet_hash?: string | null
          raza?: string | null
          sexo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country_code?: string
          created_at?: string
          especie?: string
          fecha_nacimiento?: string | null
          foto_url?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          peso?: number | null
          pet_hash?: string | null
          raza?: string | null
          sexo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mascotas_adopcion: {
        Row: {
          activa: boolean | null
          color: string | null
          costo_esteril: number | null
          costo_vacunas: number | null
          created_at: string | null
          descripcion: string | null
          edad: string | null
          especie: string
          esterilizada: boolean | null
          foto: string | null
          id: string
          nombre: string
          raza: string | null
          refugio: string | null
          sexo: string | null
          tamanio: string | null
          urgente: boolean | null
          vacunada: boolean | null
        }
        Insert: {
          activa?: boolean | null
          color?: string | null
          costo_esteril?: number | null
          costo_vacunas?: number | null
          created_at?: string | null
          descripcion?: string | null
          edad?: string | null
          especie: string
          esterilizada?: boolean | null
          foto?: string | null
          id?: string
          nombre: string
          raza?: string | null
          refugio?: string | null
          sexo?: string | null
          tamanio?: string | null
          urgente?: boolean | null
          vacunada?: boolean | null
        }
        Update: {
          activa?: boolean | null
          color?: string | null
          costo_esteril?: number | null
          costo_vacunas?: number | null
          created_at?: string | null
          descripcion?: string | null
          edad?: string | null
          especie?: string
          esterilizada?: boolean | null
          foto?: string | null
          id?: string
          nombre?: string
          raza?: string | null
          refugio?: string | null
          sexo?: string | null
          tamanio?: string | null
          urgente?: boolean | null
          vacunada?: boolean | null
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          ciudad: string | null
          country_code: string
          courier: string | null
          created_at: string | null
          cupon_codigo: string | null
          descuento_monto: number | null
          direccion: string | null
          estado: string | null
          guest_email: string | null
          id: string
          items: Json | null
          kushki_charge_id: string | null
          kushki_response: Json | null
          kushki_status: string | null
          kushki_token: string | null
          metodo_pago: string | null
          notas_admin: string | null
          numero_orden: string | null
          pagado_en: string | null
          subtotal: number | null
          total: number | null
          tracking_code: string | null
          updated_at: string
          user_id: string | null
          vtex_order_id: string | null
        }
        Insert: {
          ciudad?: string | null
          country_code?: string
          courier?: string | null
          created_at?: string | null
          cupon_codigo?: string | null
          descuento_monto?: number | null
          direccion?: string | null
          estado?: string | null
          guest_email?: string | null
          id?: string
          items?: Json | null
          kushki_charge_id?: string | null
          kushki_response?: Json | null
          kushki_status?: string | null
          kushki_token?: string | null
          metodo_pago?: string | null
          notas_admin?: string | null
          numero_orden?: string | null
          pagado_en?: string | null
          subtotal?: number | null
          total?: number | null
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
          vtex_order_id?: string | null
        }
        Update: {
          ciudad?: string | null
          country_code?: string
          courier?: string | null
          created_at?: string | null
          cupon_codigo?: string | null
          descuento_monto?: number | null
          direccion?: string | null
          estado?: string | null
          guest_email?: string | null
          id?: string
          items?: Json | null
          kushki_charge_id?: string | null
          kushki_response?: Json | null
          kushki_status?: string | null
          kushki_token?: string | null
          metodo_pago?: string | null
          notas_admin?: string | null
          numero_orden?: string | null
          pagado_en?: string | null
          subtotal?: number | null
          total?: number | null
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
          vtex_order_id?: string | null
        }
        Relationships: []
      }
      productos: {
        Row: {
          categoria: string
          created_at: string
          descripcion: string | null
          id: string
          imagen_url: string | null
          nombre: string
          para_especie: string
          precio: number
        }
        Insert: {
          categoria: string
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre: string
          para_especie?: string
          precio?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          nombre?: string
          para_especie?: string
          precio?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ciudad: string | null
          country_code: string
          created_at: string
          direccion_apto: string | null
          direccion_ciudad: string | null
          direccion_completa: string | null
          direccion_guardada_como: string | null
          direccion_linea1: string | null
          direccion_pais: string | null
          direccion_principal: string | null
          direccion_referencias: string | null
          direccion_sector: string | null
          email: string
          foto_url: string | null
          id: string
          nombre: string | null
          onboarding_completo: boolean | null
          pais: string | null
          pais_codigo: string | null
          telefono: string | null
          telefono_codigo_pais: string | null
          telefono_tipo: string | null
          tipo_mascotas: string[] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          ciudad?: string | null
          country_code?: string
          created_at?: string
          direccion_apto?: string | null
          direccion_ciudad?: string | null
          direccion_completa?: string | null
          direccion_guardada_como?: string | null
          direccion_linea1?: string | null
          direccion_pais?: string | null
          direccion_principal?: string | null
          direccion_referencias?: string | null
          direccion_sector?: string | null
          email: string
          foto_url?: string | null
          id: string
          nombre?: string | null
          onboarding_completo?: boolean | null
          pais?: string | null
          pais_codigo?: string | null
          telefono?: string | null
          telefono_codigo_pais?: string | null
          telefono_tipo?: string | null
          tipo_mascotas?: string[] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          ciudad?: string | null
          country_code?: string
          created_at?: string
          direccion_apto?: string | null
          direccion_ciudad?: string | null
          direccion_completa?: string | null
          direccion_guardada_como?: string | null
          direccion_linea1?: string | null
          direccion_pais?: string | null
          direccion_principal?: string | null
          direccion_referencias?: string | null
          direccion_sector?: string | null
          email?: string
          foto_url?: string | null
          id?: string
          nombre?: string | null
          onboarding_completo?: boolean | null
          pais?: string | null
          pais_codigo?: string | null
          telefono?: string | null
          telefono_codigo_pais?: string | null
          telefono_tipo?: string | null
          tipo_mascotas?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      solicitudes_adopcion: {
        Row: {
          created_at: string | null
          email: string | null
          espacio_exterior: boolean | null
          id: string
          mascota_nombre: string | null
          motivo: string | null
          nombre_solicitante: string | null
          refugio: string | null
          telefono: string | null
          tiene_mascotas: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          espacio_exterior?: boolean | null
          id?: string
          mascota_nombre?: string | null
          motivo?: string | null
          nombre_solicitante?: string | null
          refugio?: string | null
          telefono?: string | null
          tiene_mascotas?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          espacio_exterior?: boolean | null
          id?: string
          mascota_nombre?: string | null
          motivo?: string | null
          nombre_solicitante?: string | null
          refugio?: string | null
          telefono?: string | null
          tiene_mascotas?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          country_code: string | null
          created_at: string
          id: string
          is_active: boolean
          role: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          role: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          country_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      vacunas: {
        Row: {
          archivo_url: string | null
          country_code: string
          created_at: string
          dosis: string | null
          fecha_aplicada: string | null
          fecha_proxima: string | null
          id: string
          lote: string | null
          mascota_id: string
          nombre: string
          prestador_id: string | null
          updated_at: string
          veterinario: string | null
          via_administracion: string | null
        }
        Insert: {
          archivo_url?: string | null
          country_code?: string
          created_at?: string
          dosis?: string | null
          fecha_aplicada?: string | null
          fecha_proxima?: string | null
          id?: string
          lote?: string | null
          mascota_id: string
          nombre: string
          prestador_id?: string | null
          updated_at?: string
          veterinario?: string | null
          via_administracion?: string | null
        }
        Update: {
          archivo_url?: string | null
          country_code?: string
          created_at?: string
          dosis?: string | null
          fecha_aplicada?: string | null
          fecha_proxima?: string | null
          id?: string
          lote?: string | null
          mascota_id?: string
          nombre?: string
          prestador_id?: string | null
          updated_at?: string
          veterinario?: string | null
          via_administracion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacunas_mascota_id_fkey"
            columns: ["mascota_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_alerts: {
        Row: {
          alert_type: string
          device_id: string
          id: string
          is_read: boolean
          message: string
          owner_id: string
          pet_id: string
          read_at: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          suggested_action: string | null
          telemetry_snapshot: Json | null
          title: string
          triggered_at: string
        }
        Insert: {
          alert_type: string
          device_id: string
          id?: string
          is_read?: boolean
          message: string
          owner_id: string
          pet_id: string
          read_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          suggested_action?: string | null
          telemetry_snapshot?: Json | null
          title: string
          triggered_at?: string
        }
        Update: {
          alert_type?: string
          device_id?: string
          id?: string
          is_read?: boolean
          message?: string
          owner_id?: string
          pet_id?: string
          read_at?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          suggested_action?: string | null
          telemetry_snapshot?: Json | null
          title?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wearable_alerts_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "wearable_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wearable_alerts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wearable_alerts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wearable_alerts_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_devices: {
        Row: {
          battery_pct: number | null
          country_code: string
          created_at: string
          device_model: string
          device_serial: string
          firmware_version: string | null
          id: string
          is_active: boolean
          last_lat: number | null
          last_lon: number | null
          last_seen_at: string | null
          owner_id: string
          paired_at: string
          pet_id: string
          updated_at: string
        }
        Insert: {
          battery_pct?: number | null
          country_code?: string
          created_at?: string
          device_model?: string
          device_serial: string
          firmware_version?: string | null
          id?: string
          is_active?: boolean
          last_lat?: number | null
          last_lon?: number | null
          last_seen_at?: string | null
          owner_id: string
          paired_at?: string
          pet_id: string
          updated_at?: string
        }
        Update: {
          battery_pct?: number | null
          country_code?: string
          created_at?: string
          device_model?: string
          device_serial?: string
          firmware_version?: string | null
          id?: string
          is_active?: boolean
          last_lat?: number | null
          last_lon?: number | null
          last_seen_at?: string | null
          owner_id?: string
          paired_at?: string
          pet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wearable_devices_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wearable_devices_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wearable_devices_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_telemetry: {
        Row: {
          activity_level: string | null
          battery_pct: number | null
          device_id: string
          heart_rate: number | null
          id: string
          lat: number | null
          location_accuracy_m: number | null
          lon: number | null
          pet_id: string
          recorded_at: string
          signal_strength: number | null
          steps: number | null
          synced_at: string
        }
        Insert: {
          activity_level?: string | null
          battery_pct?: number | null
          device_id: string
          heart_rate?: number | null
          id?: string
          lat?: number | null
          location_accuracy_m?: number | null
          lon?: number | null
          pet_id: string
          recorded_at: string
          signal_strength?: number | null
          steps?: number | null
          synced_at?: string
        }
        Update: {
          activity_level?: string | null
          battery_pct?: number | null
          device_id?: string
          heart_rate?: number | null
          id?: string
          lat?: number | null
          location_accuracy_m?: number | null
          lon?: number | null
          pet_id?: string
          recorded_at?: string
          signal_strength?: number | null
          steps?: number | null
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wearable_telemetry_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "wearable_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wearable_telemetry_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
      wearable_zones: {
        Row: {
          alert_on_enter: boolean
          alert_on_exit: boolean
          center_lat: number
          center_lon: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          owner_id: string
          pet_id: string | null
          radius_meters: number
        }
        Insert: {
          alert_on_enter?: boolean
          alert_on_exit?: boolean
          center_lat: number
          center_lon: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          owner_id: string
          pet_id?: string | null
          radius_meters?: number
        }
        Update: {
          alert_on_enter?: boolean
          alert_on_exit?: boolean
          center_lat?: number
          center_lon?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          pet_id?: string | null
          radius_meters?: number
        }
        Relationships: [
          {
            foreignKeyName: "wearable_zones_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wearable_zones_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_daas_eligible_users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "wearable_zones_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "mascotas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_conversion_funnel: {
        Row: {
          carritos: number | null
          checkouts: number | null
          country_code: string | null
          dia: string | null
          mascotas_agregadas: number | null
          pedidos_completados: number | null
          registros: number | null
          servicios_agendados: number | null
          suscripciones_prime: number | null
        }
        Relationships: []
      }
      v_daas_eligible_users: {
        Row: {
          country_code: string | null
          daas_consent_at: string | null
          daas_consent_version: string | null
          pais_codigo: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      email_exists: { Args: { check_email: string }; Returns: boolean }
      expirar_citas_pendientes: { Args: never; Returns: undefined }
      get_country_config: {
        Args: { p_country_code?: string }
        Returns: {
          beta_only: boolean | null
          country_code: string
          country_name: string
          country_name_en: string
          created_at: string
          currency_code: string
          currency_decimals: number
          currency_symbol: string
          date_format: string
          default_language: string
          flag_emoji: string | null
          free_shipping_threshold: number | null
          id: string
          invoice_system: string | null
          is_active: boolean
          iva_pct: number
          launch_date: string | null
          payment_gateway: string
          payment_gateway_config: Json | null
          phone_prefix: string
          privacy_url: string | null
          requires_ruc: boolean | null
          services_enabled: Json
          shipping_providers: Json | null
          terms_url: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "country_config"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_admin: { Args: never; Returns: boolean }
      log_analytics_event: {
        Args: {
          p_country_code?: string
          p_event_name: string
          p_platform?: string
          p_properties?: Json
          p_user_id?: string
        }
        Returns: string
      }
      service_active_in: {
        Args: { p_country_code?: string; p_service: string }
        Returns: boolean
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
