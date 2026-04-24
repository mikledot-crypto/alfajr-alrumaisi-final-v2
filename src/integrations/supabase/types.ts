export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      categories: {
        Row: { id: string; name_ar: string; slug: string; description: string | null; sort_order: number; created_at: string; updated_at: string };
        Insert: { id?: string; name_ar: string; slug: string; description?: string | null; sort_order?: number; created_at?: string; updated_at?: string };
        Update: { id?: string; name_ar?: string; slug?: string; description?: string | null; sort_order?: number; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      contact_messages: {
        Row: { id: string; name: string; email: string; subject: string | null; message: string; read: boolean; created_at: string };
        Insert: { id?: string; name: string; email: string; subject?: string | null; message: string; read?: boolean; created_at?: string };
        Update: { id?: string; name?: string; email?: string; subject?: string | null; message?: string; read?: boolean; created_at?: string };
        Relationships: [];
      };
      pages: {
        Row: { id: string; title: string; slug: string; content: string; seo_title: string | null; seo_description: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; title: string; slug: string; content: string; seo_title?: string | null; seo_description?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; title?: string; slug?: string; content?: string; seo_title?: string | null; seo_description?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          cover_image: string | null;
          category_id: string | null;
          status: string;
          published_at: string | null;
          reading_minutes: number;
          author_name: string;
          author_id: string | null;
          seo_title: string | null;
          seo_description: string | null;
          canonical_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content: string;
          cover_image?: string | null;
          category_id?: string | null;
          status?: string;
          published_at?: string | null;
          reading_minutes?: number;
          author_name?: string;
          author_id?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          canonical_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string;
          cover_image?: string | null;
          category_id?: string | null;
          status?: string;
          published_at?: string | null;
          reading_minutes?: number;
          author_name?: string;
          author_id?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          canonical_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [{ foreignKeyName: "posts_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "categories"; referencedColumns: ["id"] }];
      };
      profiles: {
        Row: { id: string; display_name: string | null; email: string | null; avatar_url: string | null; created_at: string; updated_at: string };
        Insert: { id: string; display_name?: string | null; email?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; display_name?: string | null; email?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      site_settings: {
        Row: { key: string; value: string | null; updated_at: string };
        Insert: { key: string; value?: string | null; updated_at?: string };
        Update: { key?: string; value?: string | null; updated_at?: string };
        Relationships: [];
      };
      subscribers: {
        Row: { id: string; email: string; created_at: string };
        Insert: { id?: string; email: string; created_at?: string };
        Update: { id?: string; email?: string; created_at?: string };
        Relationships: [];
      };
      user_roles: {
        Row: { id: string; user_id: string; role: Database["public"]["Enums"]["app_role"]; created_at: string };
        Insert: { id?: string; user_id: string; role: Database["public"]["Enums"]["app_role"]; created_at?: string };
        Update: { id?: string; user_id?: string; role?: Database["public"]["Enums"]["app_role"]; created_at?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      has_role: { Args: { _user_id: string; _role: Database["public"]["Enums"]["app_role"] }; Returns: boolean };
      is_admin: { Args: { _user_id: string }; Returns: boolean };
      is_editor: { Args: { _user_id: string }; Returns: boolean };
      can_manage_content: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: { app_role: "admin" | "editor" };
    CompositeTypes: { [_ in never]: never };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R }
      ? R
      : never
    : never;

export type TablesInsert<DefaultSchemaTableName extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][DefaultSchemaTableName] extends { Insert: infer I } ? I : never;
export type TablesUpdate<DefaultSchemaTableName extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][DefaultSchemaTableName] extends { Update: infer U } ? U : never;
export type Enums<DefaultSchemaEnumName extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][DefaultSchemaEnumName];
export type CompositeTypes<DefaultSchemaCompositeTypeName extends keyof DefaultSchema["CompositeTypes"]> = DefaultSchema["CompositeTypes"][DefaultSchemaCompositeTypeName];

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor"],
    },
  },
} as const;
