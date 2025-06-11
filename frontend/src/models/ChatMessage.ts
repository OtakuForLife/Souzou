
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  contextNotes?: string[];
}

export type { ChatMessage };