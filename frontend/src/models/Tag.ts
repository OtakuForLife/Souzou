export interface Tag {
  id: string;
  name: string;
  color: string;
  description?: string;
  parent?: string;
  aliases: string[];
  entities_count: number;
  created_at: string;
  updated_at: string;
  // Sync fields
  rev?: number;
  server_updated_at?: string;
  deleted?: boolean;
  deleted_at?: string | null;
}

export interface TagHierarchy extends Tag {
  children: TagHierarchy[];
}
