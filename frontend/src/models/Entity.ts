
import { Tag } from './Tag';

enum EntityType {
    NOTE = "note",
    VIEW = "view",
    AI_CHAT_HISTORY = "ai_chat_history",
}

interface Entity {
    id: string;
    type: EntityType;
    title: string;
    content: string;
    created_at: string;
    parent: string | null;
    children: string[];
    tags: Tag[];
    metadata: Record<string, any>;
}

export type { Entity };
export { EntityType };