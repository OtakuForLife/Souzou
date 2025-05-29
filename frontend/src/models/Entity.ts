
enum EntityType {
    NOTE = "note",
}

interface Entity {
    id: string;
    type: EntityType;
    title: string;
    content: string;
    created_at: string;
    parent: string | null;
    children: string[];
}

export type { Entity };
export { EntityType };