// Content type definitions for the extensible tab system

import { EntityType } from "@/models/Entity";

export interface SortableEntityDragData {
  objectType: EntityType;
  objectID: string;
  type: DragType;
  accepts: string[];
  onDragEnd: (active: any, over: any) => void;
}

export enum DragType {
  TAB = 'tab'
}

// Status enums for better state management
export enum ContentStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SAVING = 'saving',
  ERROR = 'error',
  SUCCESS = 'success'
}
