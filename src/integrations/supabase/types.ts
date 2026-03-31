// Local type definitions mirroring the former Supabase generated types.
// Used by admin components via: import type { Tables } from "@/integrations/supabase/types"

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

interface TableDefs {
  career_jobs: {
    id: string;
    title: string;
    description: string;
    location: string;
    job_type: string;
    is_visible: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  client_logos: {
    id: string;
    name: string;
    logo_url: string;
    is_visible: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  contact_submissions: {
    id: string;
    full_name: string;
    company_name: string | null;
    email: string;
    phone: string | null;
    message: string;
    is_read: boolean;
    created_at: string;
  };
  seo_settings: {
    id: string;
    page_key: string;
    title: string;
    description: string;
    keywords: string;
    og_image: string | null;
    updated_at: string;
    updated_by: string | null;
  };
  services: {
    id: string;
    title: string;
    description: string;
    image_url: string | null;
    icon: string | null;
    accent_color: string | null;
    is_visible: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
  };
  site_content: {
    id: string;
    section_key: string;
    content: Json;
    updated_at: string;
    updated_by: string | null;
  };
  chat_threads: {
    id: string;
    title: string;
    contact: string | null;
    channel: string;
    last_message: string | null;
    created_at: string;
    updated_at: string;
  };
  chat_messages: {
    id: string;
    thread_id: string | null;
    direction: "outbound" | "inbound" | "bot";
    channel: string;
    message: string;
    to_number: string | null;
    from_number: string | null;
    status: string;
    model: string | null;
    error: string | null;
    meta: Json | null;
    created_at: string;
  };
  job_applications: {
    id: string;
    applicant_name: string;
    email: string;
    phone: string | null;
    job_id: string | null;
    resume_url: string | null;
    cover_letter: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  };
  application_replies: {
    id: string;
    application_id: string;
    sender: string;
    message: string;
    created_at: string;
  };
  submission_replies: {
    id: string;
    submission_id: string;
    sender: string;
    message: string;
    created_at: string;
  };
  testimonials: {
    id: string;
    name: string;
    company: string;
    message: string;
    avatar_url: string | null;
    rating: number;
    is_visible: boolean;
    created_at: string;
    updated_at: string;
  };
  users: {
    id: string;
    email: string;
    password: string;
    userrole: string;
    created_at: string;
    updated_at: string;
  };
}

export type Tables<T extends keyof TableDefs> = TableDefs[T];

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
