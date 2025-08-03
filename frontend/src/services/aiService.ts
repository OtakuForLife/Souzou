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
  provider?: string;  // New: AI provider (ollama, openai, etc.)
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  model?: string;
  provider?: string;  // New: Which provider was used
  error?: string;
  error_type?: string;
  total_duration?: number;
  eval_count?: number;
}

// Streaming types following the Medium article
export interface StreamChunk {
  content?: string;
  worker?: string;
  provider?: string;
  model?: string;
  done?: boolean;
  full_response?: string;
  error?: string;
}

export interface StreamCallbacks {
  onChunk?: (chunk: StreamChunk) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: string) => void;
}

export interface StreamChunk {
  type: 'content' | 'done' | 'error' | 'start' | 'complete' | 'chain_end' | 'routing' | 'worker_complete' | 'tool_start' | 'tool_result';
  content?: string;
  worker?: string;
  provider?: string;
  model?: string;
  error?: string;
  error_type?: string;
  message?: string;
  event_type?: string;
  next_worker?: string;
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

export interface ModelsResponse {
  success: boolean;
  models: string[];
  error?: string;
}

export interface AIProvider {
  name: string;
  display_name: string;
  available: boolean;
  models: string[];
}

export interface ProvidersResponse {
  success: boolean;
  providers: AIProvider[];
  error?: string;
}

export interface AIStatus {
  success: boolean;
  provider: string;           // Backend returns provider name
  provider_available: boolean; // Backend returns provider_available
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
   * Chat with AI using WebSocket streaming (backend only supports WebSocket)
   * This method now wraps the streaming functionality to provide a Promise-based interface
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    return new Promise((resolve) => {
      let fullResponse = '';
      let hasError = false;

      this.chatStream(request, {
        onChunk: (chunk) => {
          if (chunk.content) {
            fullResponse += chunk.content;
          }
        },
        onComplete: (response) => {
          if (!hasError) {
            resolve({
              success: true,
              response: fullResponse || response || '', // Use accumulated content
              model: request.model,
              provider: request.provider
            });
          }
        },
        onError: (error) => {
          hasError = true;
          resolve({
            success: false,
            error: error,
            error_type: 'websocket_error'
          });
        }
      });
    });
  }

  /**
   * Stream chat with AI using WebSocket connection (following Medium article pattern)
   */
  async chatStream(request: ChatRequest, callbacks: StreamCallbacks): Promise<void> {
    try {
      log.info('Starting WebSocket streaming chat', {
        messageLength: request.message.length,
        contextNotes: request.context_notes?.length || 0,
        model: request.model,
        provider: request.provider
      });

      // Create WebSocket connection - match backend routing pattern
      // Backend expects 'ai/chat/' without leading slash
      const baseWsUrl = API_CONFIG.BASE_URL.replace('http', 'ws');
      const wsUrl = `${baseWsUrl}/ai/chat/`;
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        log.info('WebSocket connection established');

        // Send chat request
        const requestData = {
          type: 'chat',
          ...request
        };
        log.info('Sending chat request: ' + JSON.stringify(requestData));
        socket.send(JSON.stringify(requestData));
      };

      socket.onmessage = (event) => {
        try {
          log.info('WebSocket message received: ' + event.data);
          const data = JSON.parse(event.data) as StreamChunk;
          log.info('Parsed WebSocket data:', data);

          // Handle error events
          if (data.type === 'error') {
            log.error('Received error from backend: ' + (data.error || 'Unknown error'));
            callbacks.onError?.(data.error || 'Unknown error');
            socket.close();
            return;
          }

          // Handle content events (actual AI response text)
          if (data.type === 'content' && data.content) {
            log.info('Received content chunk: ' + data.content);
            callbacks.onChunk?.(data);
          }

          // Handle tool results (web search results, etc.)
          if (data.type === 'tool_result' && data.content) {
            log.info('Received tool result: ' + data.content);
            callbacks.onChunk?.(data);
          }

          // Handle completion events
          if (data.type === 'complete' || data.type === 'done') {
            log.info('Received completion signal');
            callbacks.onComplete?.(''); // LangGraph doesn't provide full_response
            socket.close();
            return;
          }

          // Handle status/progress events - log for user feedback
          if (data.type === 'start') {
            log.info('AI processing started', { message: data.message, worker: data.worker });
          }

          if (data.type === 'routing') {
            log.info('AI routing decision', { message: data.message, next_worker: data.next_worker });
          }

          if (data.type === 'tool_start') {
            try {
              log.info('AI tool execution', { message: data.message, worker: data.worker });
            } catch (toolError) {
              log.error('Error handling tool_start event: ' + toolError);
            }
          }

          if (data.type === 'worker_complete') {
            try {
              log.info('AI worker completed', { message: data.message, worker: data.worker });
            } catch (workerError) {
              log.error('Error handling worker_complete event: ' + workerError);
            }
          }

          // Log any unhandled event types
          if (!['error', 'content', 'tool_result', 'complete', 'done', 'start', 'routing', 'tool_start', 'worker_complete'].includes(data.type)) {
            log.warn('Unhandled event type: ' + data.type + ', data: ' + JSON.stringify(data));
          }

        } catch (parseError) {
          log.error('Failed to parse WebSocket message', parseError as Error);
          log.info('Raw message data: ' + event.data);

          // Don't close connection for parse errors - just skip the message
          // This makes the frontend more resilient to unexpected events
          log.warn('Skipping malformed message, continuing...');
        }
      };

      socket.onerror = (error) => {
        log.error('WebSocket error occurred: ' + JSON.stringify(error));
        callbacks.onError?.('WebSocket connection error: ' + (error as any)?.message || 'Unknown WebSocket error');
      };

      socket.onclose = (event) => {
        log.info('WebSocket connection closed - Code: ' + event.code + ', Reason: ' + event.reason);
        if (event.code !== 1000) { // 1000 = normal closure
          log.warn('WebSocket closed unexpectedly with code: ' + event.code);
          callbacks.onError?.('WebSocket connection closed unexpectedly (code: ' + event.code + ')');
        }
      };

    } catch (error) {
      log.error('Failed to establish WebSocket connection', error as Error);
      callbacks.onError?.('Failed to establish WebSocket connection');
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
        `${API_CONFIG.ENDPOINTS.ENTITIES}/get_relevant_context/`,
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
   * List available AI providers
   */
  async listProviders(): Promise<ProvidersResponse> {
    try {
      log.info('Fetching available AI providers');

      const response = await api.get<ProvidersResponse>(`${this.endpoint}/providers/`);

      log.info('AI providers fetched', {
        providerCount: response.data.providers?.length || 0
      });

      return response.data;
    } catch (error) {
      log.error('Failed to fetch AI providers', error as Error);
      return {
        success: false,
        providers: [],
        error: 'Failed to fetch available providers'
      };
    }
  }

  /**
   * Check AI service status for a specific provider
   */
  async getStatus(provider?: string): Promise<AIStatus> {
    try {
      log.info('Checking AI service status', { provider });

      const url = provider
        ? `${this.endpoint}/status/?provider=${encodeURIComponent(provider)}`
        : `${this.endpoint}/status/`;

      const response = await api.get<AIStatus>(url);

      log.info('AI service status checked', {
        provider: response.data.provider,
        available: response.data.provider_available
      });

      return response.data;
    } catch (error) {
      log.error('Failed to check AI service status', error as Error);
      return {
        success: false,
        provider: provider || 'unknown',
        provider_available: false,
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
        `${API_CONFIG.ENDPOINTS.ENTITIES}/vector_stats/`
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
