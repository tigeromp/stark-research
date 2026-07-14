export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          thesis: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          thesis: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          thesis?: string
          created_at?: string
          updated_at?: string
        }
      }
      citations: {
        Row: {
          id: string
          project_id: string
          author: string
          title: string
          year: string
          journal: string
          volume: string
          issue: string
          pages: string
          publisher: string
          url: string
          doi: string
          notes: string
          categories: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          author: string
          title: string
          year?: string
          journal?: string
          volume?: string
          issue?: string
          pages?: string
          publisher?: string
          url?: string
          doi?: string
          notes?: string
          categories?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          author?: string
          title?: string
          year?: string
          journal?: string
          volume?: string
          issue?: string
          pages?: string
          publisher?: string
          url?: string
          doi?: string
          notes?: string
          categories?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
