
enum EntityType {
    NOTE = "note",
    VIEW = "view",
    MEDIA = "media",
}

interface Entity {
    id: string;
    type: EntityType;
    title: string;
    content: string;
    created_at: string;
    updated_at?: string;
    // Sync fields
    rev?: number;
    server_updated_at?: string;
    deleted?: boolean;
    deleted_at?: string | null;

    parent: string | null;
    children: string[];
    tags?: string[];
    metadata?: Record<string, any>;
}

export type { Entity };
export { EntityType };