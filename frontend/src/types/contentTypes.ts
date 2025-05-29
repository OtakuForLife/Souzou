// Content type definitions for the extensible tab system

export enum ContentType {
  NOTE = 'note',
}

// Status enums for better state management
export enum ContentStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SAVING = 'saving',
  ERROR = 'error',
  SUCCESS = 'success'
}

// Base interface for all content types
export interface BaseContentData {
  id: string;
  type: ContentType;
  title: string;
  created_at?: string;
  updated_at?: string;
  status?: ContentStatus;
  lastModified?: string;
  version?: number;
}

// Note-specific content data
export interface NoteContentData extends BaseContentData {
  type: ContentType.NOTE;
  content: string;
  parent: string | null;
  children: string[];
}

// Union type for all content data types
export type ContentData = NoteContentData;

// Tab data interface with improved type safety
export interface TabData {
  objectType: ContentType;
  objectID: string;
}

// Content type metadata for registry
export interface ContentTypeMetadata {
  type: ContentType;
  displayName: string;
  icon?: string;
  defaultTitle: string;
}

// Content type registry entry
export interface ContentTypeRegistryEntry {
  metadata: ContentTypeMetadata;
  tabComponent: React.ComponentType<{ tabData: TabData }>;
  contentComponent: React.ComponentType<{ objectID: string }>;
}
