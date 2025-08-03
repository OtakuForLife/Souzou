
enum EntityType {
    NOTE = "note",
    VIEW = "view",
    AI_CHAT_HISTORY = "ai_chat_history",
    MEDIA = "media",
}

interface Entity {
    id: string;
    type: EntityType;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    parent: string | null;
    children: string[];
    tags: string[];
    metadata: Record<string, any>;
}

export type { Entity };
export { EntityType };