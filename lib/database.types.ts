/**
 * Supabase Database Types (placeholder)
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Generate the real version with:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
 *
 * For now this provides a minimal type so the repository compiles.
 */

export type Database = {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          capacity: number;
          price_pence: number;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['rooms']['Row']>;
        Update: Partial<Database['public']['Tables']['rooms']['Row']>;
      };
      bookings: {
        Row: {
          id: string;
          room_id: string;
          user_id: string | null;
          booker_name: string;
          booker_email: string;
          booker_phone: string | null;
          start_time: string;
          end_time: string;
          purpose: string;
          attendee_count: number;
          status: string;
          deposit_amount_pence: number;
          payment_status: string;
          admin_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['bookings']['Row']>;
        Update: Partial<Database['public']['Tables']['bookings']['Row']>;
      };
      notifications: {
        Row: {
          id: string;
          booking_id: string;
          type: string;
          recipient_email: string;
          sent_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notifications']['Row']>;
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
      };
      profiles: {
        Row: {
          id: string;
          role: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
