export interface VaultStatus {
  status: "not_created" | "locked" | "unlocked";
}

export interface Entry {
  id: string;
  category_id: number | null;
  category_name: string | null;
  title: string;
  website: string | null;
  username: string | null;
  password: string | null;
  notes: string | null;
  custom_fields: CustomField[] | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  tag_ids: number[] | null;
  totp_secret?: string | null;
}

export interface CustomField {
  name: string;
  value: string;
}

export interface CreateEntry {
  category_id?: number | null;
  title: string;
  website?: string | null;
  username: string;
  password: string;
  notes?: string | null;
  custom_fields?: CustomField[] | null;
  tag_ids?: number[] | null;
  totp_secret?: string | null;
}

export interface UpdateEntry {
  category_id?: number | null;
  title?: string | null;
  website?: string | null;
  username?: string | null;
  password?: string | null;
  notes?: string | null;
  custom_fields?: CustomField[] | null;
  tag_ids?: number[] | null;
  totp_secret?: string | null;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  sort_order: number;
  entry_count: number;
}

export interface Tag {
  id: number;
  name: string;
  entry_count: number;
}
