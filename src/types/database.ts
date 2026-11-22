// ============================================================================
// Database Schema Typings for Supabase
// BB Parfum Premium Management System
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          code: string;
          name: string;
          type: 'WAREHOUSE' | 'STORE';
          address: string;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          type: 'WAREHOUSE' | 'STORE';
          address: string;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          type?: 'WAREHOUSE' | 'STORE';
          address?: string;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'SUPER_ADMIN' | 'LOGISTICS' | 'CASHIER';
          assigned_store_id: string | null;
          is_active: boolean;
          is_locked?: boolean | null;
          failed_login_attempts?: number | null;
          locked_at?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: 'SUPER_ADMIN' | 'LOGISTICS' | 'CASHIER';
          assigned_store_id?: string | null;
          is_active?: boolean;
          is_locked?: boolean | null;
          failed_login_attempts?: number | null;
          locked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'SUPER_ADMIN' | 'LOGISTICS' | 'CASHIER';
          assigned_store_id?: string | null;
          is_active?: boolean;
          is_locked?: boolean | null;
          failed_login_attempts?: number | null;
          locked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          sku: string;
          barcode: string | null;
          name: string;
          category_id: string | null;
          size_ml: number;
          scent_type: string;
          top_notes: string | null;
          middle_notes: string | null;
          base_notes: string | null;
          base_price: number;
          min_stock_alert: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          barcode?: string | null;
          name: string;
          category_id?: string | null;
          size_ml: number;
          scent_type: string;
          top_notes?: string | null;
          middle_notes?: string | null;
          base_notes?: string | null;
          base_price: number;
          min_stock_alert?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          barcode?: string | null;
          name?: string;
          category_id?: string | null;
          size_ml?: number;
          scent_type?: string;
          top_notes?: string | null;
          middle_notes?: string | null;
          base_notes?: string | null;
          base_price?: number;
          min_stock_alert?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_balances: {
        Row: {
          id: string;
          store_id: string;
          product_id: string;
          quantity: number;
          moving_avg_cost: number;
          last_updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          product_id: string;
          quantity?: number;
          moving_avg_cost?: number;
          last_updated_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          product_id?: string;
          quantity?: number;
          moving_avg_cost?: number;
          last_updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          user_email: string | null;
          role: string | null;
          store_id: string | null;
          action: string;
          entity_name: string;
          entity_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_email?: string | null;
          role?: string | null;
          store_id?: string | null;
          action: string;
          entity_name: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          user_email?: string | null;
          role?: string | null;
          store_id?: string | null;
          action?: string;
          entity_name?: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
