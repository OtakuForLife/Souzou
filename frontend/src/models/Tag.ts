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
}

export interface TagHierarchy extends Tag {
  children: TagHierarchy[];
}
