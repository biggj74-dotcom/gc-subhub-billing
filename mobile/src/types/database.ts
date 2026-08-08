/**
 * Hand-written types mirroring the Supabase schema in supabase/migrations.
 * Once you have a live Supabase project, regenerate this file with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 * and this file's shape (Database['public']['Tables']...) will still match
 * how it's consumed throughout src/, so callers won't need to change.
 *
 * NOTE: these are `type` aliases, not `interface`s, on purpose — TS
 * interfaces don't structurally satisfy `Record<string, unknown>`, which is
 * what supabase-js's generic constraints require to resolve table types.
 */

export type UserRole = 'driver' | 'dispatcher' | 'fleet' | 'broker';
export type TruckStatus = 'available' | 'on_load' | 'off_duty';
export type LoadStatus = 'open' | 'booked' | 'en_route' | 'delivered' | 'cancelled';
export type OfferStatus = 'pending' | 'accepted' | 'rejected';
export type DocumentType = 'insurance' | 'cdl' | 'medical_card' | 'rate_confirmation' | 'other';
export type DocumentStatus = 'pending_review' | 'verified' | 'expiring' | 'rejected';

export type UserRow = {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  role: UserRole;
  dot_number: string | null;
  mc_number: string | null;
  cdl_verified_at: string | null;
  medical_card_expires_at: string | null;
  expo_push_token: string | null;
  created_at: string;
};

export type TruckRow = {
  id: string;
  fleet_owner_id: string | null;
  truck_number: string;
  status: TruckStatus;
  current_driver_id: string | null;
  last_location_lat: number | null;
  last_location_lng: number | null;
  updated_at: string;
};

export type LoadRow = {
  id: string;
  posted_by_id: string;
  origin: string;
  destination: string;
  miles: number | null;
  rate: number | null;
  equipment_type: string | null;
  weight: string | null;
  pickup_date: string | null;
  hazmat: boolean;
  status: LoadStatus;
  assigned_driver_id: string | null;
  created_at: string;
};

export type LoadOfferRow = {
  id: string;
  load_id: string;
  driver_id: string;
  offered_rate: number;
  status: OfferStatus;
  created_at: string;
};

export type TrackingEventRow = {
  id: string;
  load_id: string;
  lat: number;
  lng: number;
  note: string | null;
  created_at: string;
};

export type DocumentRow = {
  id: string;
  user_id: string;
  type: DocumentType;
  file_url: string;
  status: DocumentStatus;
  expires_at: string | null;
  uploaded_at: string;
};

export type SettlementRow = {
  id: string;
  driver_id: string;
  load_id: string | null;
  gross: number;
  deductions: number;
  net: number;
  paid_at: string | null;
};

export type MessageRow = {
  id: string;
  load_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type SubscriptionRow = {
  id: string;
  user_id: string;
  plan: UserRole;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string | null;
  current_period_end: string | null;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
};

type TableDef<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13';
  };
  public: {
    Tables: {
      users: TableDef<UserRow>;
      trucks: TableDef<TruckRow>;
      loads: TableDef<LoadRow>;
      load_offers: TableDef<LoadOfferRow>;
      tracking_events: TableDef<TrackingEventRow>;
      documents: TableDef<DocumentRow>;
      settlements: TableDef<SettlementRow>;
      messages: TableDef<MessageRow>;
      subscriptions: TableDef<SubscriptionRow>;
      notifications: TableDef<NotificationRow>;
    };
    Views: Record<string, never>;
    Functions: {
      accept_load_offer: {
        Args: { p_offer_id: string };
        Returns: LoadRow;
      };
    };
  };
};
