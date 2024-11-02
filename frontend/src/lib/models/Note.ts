
interface Note {
    
    id: number;
    title: string;
    content: string;
    created_at: string;
    parent: number;
    children: number[];
}

export type { Note };