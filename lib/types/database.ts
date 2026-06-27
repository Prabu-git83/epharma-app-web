// Hand-written until `npx supabase gen types typescript` is wired up in Stage 10.
// Each table must include Relationships: [] to satisfy GenericTable from @supabase/postgrest-js v2.

export type Database = {
  public: {
    Tables: {
      regions: {
        Row: {
          id: string; code: string; name: string
          currency_code: string; currency_symbol: string; locale: string
          tax_rate: number; tax_label: string; rtl: boolean; active: boolean
        }
        Insert: Omit<Database['public']['Tables']['regions']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['regions']['Insert']>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string; full_name: string | null; phone: string | null
          dob: string | null; region_id: string | null
          preferred_currency: string | null
          role: 'customer' | 'pharmacist' | 'admin'
          expo_push_token: string | null; created_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id'>>
        Relationships: []
      }
      addresses: {
        Row: {
          id: string; user_id: string; label: string
          line1: string; line2: string | null; city: string
          state: string | null; zip: string | null; country_code: string
          is_default: boolean; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['addresses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['addresses']['Insert']>
        Relationships: []
      }
      categories: {
        Row: { id: string; name: string; slug: string; icon_url: string | null }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
        Relationships: []
      }
      drugs: {
        Row: {
          id: string; name: string; brand: string | null; category_id: string | null
          description: string | null; base_price_usd: number
          image_url: string | null; is_active: boolean; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['drugs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['drugs']['Insert']>
        Relationships: []
      }
      drug_region_rules: {
        Row: {
          id: string; drug_id: string; region_id: string
          requires_prescription: boolean; schedule_class: string | null
          regulatory_label: string | null; is_available: boolean; price_local: number | null
        }
        Insert: Omit<Database['public']['Tables']['drug_region_rules']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['drug_region_rules']['Insert']>
        Relationships: []
      }
      prescriptions: {
        Row: {
          id: string; user_id: string; image_url: string
          status: 'pending' | 'under_review' | 'verified' | 'rejected'
          verified_by: string | null; notes: string | null
          uploaded_at: string; verified_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['prescriptions']['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['prescriptions']['Insert']>
        Relationships: []
      }
      carts: {
        Row: { id: string; user_id: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['carts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['carts']['Insert']>
        Relationships: []
      }
      cart_items: {
        Row: {
          id: string; cart_id: string; drug_id: string
          quantity: number; prescription_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['cart_items']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['cart_items']['Insert']>
        Relationships: []
      }
      orders: {
        Row: {
          id: string; user_id: string
          status: 'placed' | 'confirmed' | 'dispensed' | 'shipped' | 'delivered' | 'cancelled'
          region_id: string | null; currency_code: string
          subtotal: number; tax_rate: number; tax_amount: number; total: number
          address_id: string | null; payment_method: string
          payment_status: 'pending' | 'paid' | 'refunded'
          stripe_payment_intent_id: string | null; notes: string | null; placed_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'placed_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
        Relationships: []
      }
      order_items: {
        Row: {
          id: string; order_id: string; drug_id: string
          quantity: number; unit_price_local: number; prescription_id: string | null
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
        Relationships: []
      }
      order_events: {
        Row: {
          id: string; order_id: string; status: string
          note: string | null; created_by: string | null; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['order_events']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['order_events']['Insert']>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string; user_id: string; title: string; body: string
          type: 'order_update' | 'prescription_update' | 'promo' | 'system'
          read: boolean; payload: Record<string, unknown> | null; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
        Relationships: []
      }
    }
    Views: { [K in never]: never }
    Functions: { [K in never]: never }
    Enums: { [K in never]: never }
    CompositeTypes: { [K in never]: never }
  }
}
