export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Priority = "High" | "Medium" | "Low";
export type ProjectStatus = "In Progress" | "Completed" | "Review" | "Archived";
export type LearningLevel = "Beginner" | "Intermediate" | "Advanced" | "Exploratory";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          role: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          technologies: string[];
          technology_stack?: string[];
          progress: number;
          status: ProjectStatus;
          start_date: string | null;
          target_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          technologies?: string[];
          technology_stack?: string[];
          progress?: number;
          status?: ProjectStatus;
          start_date?: string | null;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          technologies?: string[];
          technology_stack?: string[];
          progress?: number;
          status?: ProjectStatus;
          start_date?: string | null;
          target_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          status: string;
          priority: Priority;
          completed: boolean;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          status?: string;
          priority?: Priority;
          completed?: boolean;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: Priority;
          completed?: boolean;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      code_snippets: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          language: string;
          code: string;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          language?: string;
          code: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          language?: string;
          code?: string;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      work_logs: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          entry_date: string;
          title: string;
          work_summary: string;
          challenges: string | null;
          lessons_learned: string | null;
          category: string;
          duration_minutes: number | null;
          logged_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          entry_date?: string;
          title: string;
          work_summary?: string;
          challenges?: string | null;
          lessons_learned?: string | null;
          category?: string;
          duration_minutes?: number | null;
          logged_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          entry_date?: string;
          title?: string;
          work_summary?: string;
          challenges?: string | null;
          lessons_learned?: string | null;
          category?: string;
          duration_minutes?: number | null;
          logged_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "work_logs_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      learning_entries: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          topic: string;
          description: string | null;
          category: string;
          status: string;
          target_date: string | null;
          level: LearningLevel;
          mastery_percentage: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          topic?: string;
          description?: string | null;
          category?: string;
          status?: string;
          target_date?: string | null;
          level?: LearningLevel;
          mastery_percentage?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          topic?: string;
          description?: string | null;
          category?: string;
          status?: string;
          target_date?: string | null;
          level?: LearningLevel;
          mastery_percentage?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      git_templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          change_type: string;
          branch_prefix: string;
          commit_template: string;
          pr_title_template: string;
          pr_description_template: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          change_type?: string;
          branch_prefix?: string;
          commit_template?: string;
          pr_title_template?: string;
          pr_description_template?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          change_type?: string;
          branch_prefix?: string;
          commit_template?: string;
          pr_title_template?: string;
          pr_description_template?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
