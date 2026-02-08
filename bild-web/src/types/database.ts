export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      activity_feed: {
        Row: {
          action: string;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          project_id: string;
          task_id: string | null;
          user_id: string;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          project_id: string;
          task_id?: string | null;
          user_id: string;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          project_id?: string;
          task_id?: string | null;
          user_id?: string;
        };
      };
      chat_messages: {
        Row: {
          content: string | null;
          created_at: string | null;
          id: string;
          message_type: string | null;
          project_id: string;
          user_id: string;
          voice_url: string | null;
        };
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          company_name: string | null;
          created_at: string | null;
          full_name: string;
          id: string;
          onboarding_completed_at: string | null;
          role: string | null;
          trade: string | null;
        };
      };
      project_files: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          file_path: string;
          file_size: number | null;
          content_type: string | null;
          uploaded_by: string | null;
          created_at: string | null;
        };
      };
      project_blueprint_rooms: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          points: Json;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          points: Json;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          points?: Json;
          created_at?: string | null;
        };
      };
      project_blueprint_pins: {
        Row: {
          id: string;
          project_id: string;
          task_id: string;
          room_id: string | null;
          x: number;
          y: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          project_id: string;
          task_id: string;
          room_id?: string | null;
          x: number;
          y: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          project_id?: string;
          task_id?: string;
          room_id?: string | null;
          x?: number;
          y?: number;
          created_at?: string | null;
        };
      };
      project_members: {
        Row: {
          id: string;
          joined_at: string | null;
          project_id: string;
          role: string | null;
          user_id: string;
        };
      };
      projects: {
        Row: {
          address: string | null;
          blueprint_file_id: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          name: string;
          status: string | null;
          join_code: string;
          gemini_file_search_store_name: string | null;
          gemini_file_search_synced_at: string | null;
        };
        Insert: {
          address?: string | null;
          blueprint_file_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          status?: string | null;
          join_code?: string;
          gemini_file_search_store_name?: string | null;
          gemini_file_search_synced_at?: string | null;
        };
        Update: {
          address?: string | null;
          blueprint_file_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          status?: string | null;
          join_code?: string;
          gemini_file_search_store_name?: string | null;
          gemini_file_search_synced_at?: string | null;
        };
      };
      task_proofs: {
        Row: {
          annotation_url: string | null;
          created_at: string | null;
          id: string;
          photo_url: string | null;
          submitted_by: string | null;
          task_id: string;
          transcript: string | null;
          voice_note_url: string | null;
        };
      };
      tasks: {
        Row: {
          assigned_to: string | null;
          blocked_reason: string | null;
          completed_at: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          due_date: string | null;
          id: string;
          location: string | null;
          priority: string | null;
          project_id: string;
          status: string | null;
          title: string;
        };
        Insert: {
          assigned_to?: string | null;
          blocked_reason?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          location?: string | null;
          priority?: string | null;
          project_id: string;
          status?: string | null;
          title: string;
        };
        Update: {
          assigned_to?: string | null;
          blocked_reason?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          location?: string | null;
          priority?: string | null;
          project_id?: string;
          status?: string | null;
          title?: string;
        };
      };
    };
  };
};

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectFile = Database["public"]["Tables"]["project_files"]["Row"];
export type ProjectBlueprintRoom = Database["public"]["Tables"]["project_blueprint_rooms"]["Row"];
export type ProjectBlueprintPin = Database["public"]["Tables"]["project_blueprint_pins"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskProof = Database["public"]["Tables"]["task_proofs"]["Row"];
export type ActivityFeedItem = Database["public"]["Tables"]["activity_feed"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"];
