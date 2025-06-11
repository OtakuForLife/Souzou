/**
 * AI Service for interacting with AI models and vector search
 * 
 * Handles communication with the backend AI endpoints for:
 * - Chat completion with context
 * - Relevant context retrieval
 * - Model management
 */

import api from '@/lib/api';
import { API_CONFIG } from '@/config/constants';
import { log } from '@/lib/logger';
import { Entity } from '@/models/Entity';

// Types for AI service
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  context_notes?: string[];
  conversation_history?: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  model?: string;
  error?: string;
  error_type?: string;
  total_duration?: number;
  eval_count?: number;
}

export interface RelevantContextRequest {
  conversation: string[];
  current_note_id?: string;
  max_notes?: number;
}

export interface RelevantContextResponse {
  success: boolean;
  notes: Entity[];
  count: number;
  error?: string;
}

export interface AIModel {
  name: string;
  size: number;
  modified_at: string;
  digest: string;
}

export interface ModelsResponse {
  success: boolean;
  models: AIModel[];
  error?: string;
}

export interface AIStatus {
  success: boolean;
  ollama_available: boolean;
  base_url: string;
  default_model: string;
  error?: string;
}

export interface VectorStats {
  total_notes: number;
  indexed_notes: number;
  index_coverage: number;
  database_type: string;
  embedding_model: string;
}

export interface VectorStatsResponse {
  success: boolean;
  stats: VectorStats;
  error?: string;
}

/**
 * AI Service class - follows the same pattern as entityService
 */
class AIService {
  private readonly endpoint = API_CONFIG.ENDPOINTS.AI;

  /**
   * Chat with AI using note context
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      log.info('Sending chat request to AI', {
        messageLength: request.message.length,
        contextNotes: request.context_notes?.length || 0,
        model: request.model
      });

      // Use extended timeout for AI chat requests (60 seconds)
      const response = await api.post<ChatResponse>(
        `${this.endpoint}chat/`,
        request,
        { timeout: 60000 }
      );

      if (response.data.success) {
        log.info('AI chat completed successfully', {
          model: response.data.model,
          responseLength: response.data.response?.length || 0
        });
      } else {
        log.error('AI chat failed', new Error(response.data.error || 'Unknown error'));
      }

      return response.data;
    } catch (error) {
      log.error('Failed to send chat request', error as Error);

      // Better error handling for different error types
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          return {
            success: false,
            error: 'Request timed out. The AI model may be busy or your message is too complex.',
            error_type: 'timeout_error'
          };
        } else if (error.message.includes('Network Error')) {
          return {
            success: false,
            error: 'Network connection failed. Please check your internet connection.',
            error_type: 'network_error'
          };
        }
      }

      return {
        success: false,
        error: 'Failed to communicate with AI service',
        error_type: 'unknown_error'
      };
    }
  }

  /**
   * Get relevant notes for AI context
   */
  async getRelevantContext(request: RelevantContextRequest): Promise<RelevantContextResponse> {
    try {
      log.info('Getting relevant context', {
        conversationLength: request.conversation.length,
        currentNoteId: request.current_note_id,
        maxNotes: request.max_notes
      });

      // Use shorter timeout for context retrieval (10 seconds)
      const response = await api.post<RelevantContextResponse>(
        `${API_CONFIG.ENDPOINTS.ENTITIES}get_relevant_context/`,
        request,
        { timeout: 10000 }
      );

      log.info('Relevant context retrieved', {
        notesFound: response.data.notes?.length || 0
      });

      return response.data;
    } catch (error) {
      log.error('Failed to get relevant context', error as Error);

      // Better error handling
      let errorMessage = 'Failed to retrieve relevant context';
      if (error instanceof Error && error.message.includes('timeout')) {
        errorMessage = 'Context search timed out';
      }

      return {
        success: false,
        notes: [],
        count: 0,
        error: errorMessage
      };
    }
  }

  /**
   * List available AI models
   */
  async listModels(): Promise<ModelsResponse> {
    try {
      log.info('Fetching available AI models');

      const response = await api.get<ModelsResponse>(`${this.endpoint}models/`);
      
      log.info('AI models fetched', { 
        modelCount: response.data.models?.length || 0 
      });

      return response.data;
    } catch (error) {
      log.error('Failed to fetch AI models', error as Error);
      return {
        success: false,
        models: [],
        error: 'Failed to fetch available models'
      };
    }
  }

  /**
   * Check AI service status
   */
  async getStatus(): Promise<AIStatus> {
    try {
      log.info('Checking AI service status');

      const response = await api.get<AIStatus>(`${this.endpoint}status/`);
      
      log.info('AI service status checked', { 
        available: response.data.ollama_available 
      });

      return response.data;
    } catch (error) {
      log.error('Failed to check AI service status', error as Error);
      return {
        success: false,
        ollama_available: false,
        base_url: '',
        default_model: '',
        error: 'Failed to check service status'
      };
    }
  }

  /**
   * Get vector index statistics
   */
  async getVectorStats(): Promise<VectorStatsResponse> {
    try {
      log.info('Fetching vector statistics');

      const response = await api.get<VectorStatsResponse>(
        `${API_CONFIG.ENDPOINTS.ENTITIES}vector_stats/`
      );
      
      log.info('Vector statistics fetched', { 
        indexedNotes: response.data.stats?.indexed_notes || 0,
        totalNotes: response.data.stats?.total_notes || 0 
      });

      return response.data;
    } catch (error) {
      log.error('Failed to fetch vector statistics', error as Error);
      return {
        success: false,
        stats: {
          total_notes: 0,
          indexed_notes: 0,
          index_coverage: 0,
          database_type: 'Unknown',
          embedding_model: 'Unknown'
        },
        error: 'Failed to fetch vector statistics'
      };
    }
  }

  /**
   * Helper method to format conversation history for API
   */
  formatConversationHistory(messages: ChatMessage[]): ChatMessage[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  /**
   * Helper method to extract text from conversation for context search
   */
  extractConversationText(messages: ChatMessage[]): string[] {
    return messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => msg.content)
      .slice(-5); // Last 5 messages for context
  }
}

// Export singleton instance
export const aiService = new AIService();
