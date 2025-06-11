/**
 * Service layer exports
 */

export { entityService } from './entityService';
export { themeService } from './themeService';
export { aiService } from './aiService';

export type {
  CreateEntityRequest,
  UpdateEntityRequest,
  CreateEntityResponse,
  SaveEntityResponse,
} from './entityService';

export type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  RelevantContextRequest,
  RelevantContextResponse,
  AIModel,
  ModelsResponse,
  AIStatus,
  VectorStats,
  VectorStatsResponse,
} from './aiService';

