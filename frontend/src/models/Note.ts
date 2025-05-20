
interface Note {
    
    id: string;
    title: string;
    content: string;
    created_at: string;
    parent: string;
    children: string[];
}

export type { Note };