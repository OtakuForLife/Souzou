/**
 * AI Chat Widget - ChatGPT-like interface for AI interaction with notes context
 */

import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AIChatWidgetConfig } from '@/types/widgetTypes';
import { RootState } from '@/store';
import { aiService, ChatMessage } from '@/services';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ViewMode } from '../../ViewRenderer';
import { EntityType } from '@/models/Entity';
import { createEntity, saveEntity } from '@/store/slices/entitySlice';
import { AppDispatch } from '@/store';

// Chat message interface for the entity content
interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  contextNotes?: string[];
}

interface AIChatWidgetProps {
  widget: AIChatWidgetConfig;
  mode?: ViewMode;
  onUpdate?: (updates: Partial<AIChatWidgetConfig>) => void;
  onDelete?: () => void;
}

const AIChatWidget: React.FC<AIChatWidgetProps> = ({
  widget,
  mode = ViewMode.RENDER,
  onUpdate,
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [toolActivity, setToolActivity] = useState<string[]>([]);
  const [contextNotes, setContextNotes] = useState<any[]>([]);
  const [aiStatus, setAIStatus] = useState<{ available: boolean; error?: string }>({ available: true });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redux hooks
  const dispatch = useDispatch<AppDispatch>();
  const allEntities = useSelector((state: RootState) => state.entities.allEntities);
  const currentTabId = useSelector((state: RootState) => state.tabs.currentTab);

  // Get current note ID if available
  const currentNoteId = currentTabId && allEntities[currentTabId] ? currentTabId : undefined;

  // Get chat history entity
  const chatHistoryEntity = widget.config.chatHistoryEntityId
    ? allEntities[widget.config.chatHistoryEntityId]
    : null;

  // Parse chat history from entity content
  const chatHistory: ChatHistoryMessage[] = React.useMemo(() => {
    if (!chatHistoryEntity?.content) return [];
    try {
      return JSON.parse(chatHistoryEntity.content);
    } catch (error) {
      console.error('Failed to parse chat history:', error);
      return [];
    }
  }, [chatHistoryEntity?.content]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Check AI service status on mount
  useEffect(() => {
    checkAIStatus();
  }, []);

  const checkAIStatus = async () => {
    try {
      const status = await aiService.getStatus(widget.config.provider);
      setAIStatus({
        available: status.provider_available,
        error: status.provider_available ? undefined : `AI provider ${status.provider} is not available`
      });
    } catch (error) {
      setAIStatus({
        available: false,
        error: 'Failed to check AI service status'
      });
    }
  };

  // Helper function to create a new chat history entity
  const createChatHistoryEntity = async (): Promise<string | null> => {
    try {
      const result = await dispatch(createEntity({
        title: `AI Chat - ${new Date().toLocaleDateString()}`,
        content: JSON.stringify([]),
        parent: null,
        type: EntityType.AI_CHAT_HISTORY
      }));

      if (createEntity.fulfilled.match(result)) {
        return result.payload.newNoteData.id;
      }
      return null;
    } catch (error) {
      console.error('Failed to create chat history entity:', error);
      return null;
    }
  };

  // Helper function to update chat history entity
  const updateChatHistoryEntity = async (entityId: string, newHistory: ChatHistoryMessage[]) => {
    try {
      const entity = allEntities[entityId];
      if (!entity) {
        console.error('Chat history entity not found:', entityId);
        return;
      }

      // Create updated entity with new content
      const updatedEntity = {
        ...entity,
        content: JSON.stringify(newHistory)
      };

      await dispatch(saveEntity(updatedEntity));
    } catch (error) {
      console.error('Failed to update chat history entity:', error);
    }
  };

  // Helper function to ensure we have a chat history entity
  const ensureChatHistoryEntity = async (): Promise<string | null> => {
    if (widget.config.chatHistoryEntityId && chatHistoryEntity) {
      return widget.config.chatHistoryEntityId;
    }

    // Create new entity and update widget config
    const newEntityId = await createChatHistoryEntity();
    if (newEntityId && onUpdate) {
      onUpdate({
        config: {
          ...widget.config,
          chatHistoryEntityId: newEntityId
        }
      });
    }
    return newEntityId;
  };

  const getRelevantContext = async (userMessage: string) => {
    try {
      const conversationText = aiService.extractConversationText(
        chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      );

      conversationText.push(userMessage);

      const contextResponse = await aiService.getRelevantContext({
        conversation: conversationText,
        current_note_id: currentNoteId,
        max_notes: widget.config.maxContextNotes
      });

      if (contextResponse.success) {
        setContextNotes(contextResponse.notes);
        return contextResponse.notes.map(note => note.id);
      }

      return [];
    } catch (error) {
      console.error('Failed to get relevant context:', error);
      return [];
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading || isStreaming || !aiStatus.available) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    let entityId: string | null = null;
    let userChatMessage: ChatHistoryMessage | null = null;

    try {
      // Ensure we have a chat history entity
      entityId = await ensureChatHistoryEntity();
      if (!entityId) {
        console.error('Failed to create or get chat history entity');
        setIsLoading(false);
        return;
      }

      // Add user message to history immediately
      userChatMessage = {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
        contextNotes: []
      };

      const updatedHistory = [...chatHistory, userChatMessage];

      // Update entity with user message immediately
      await updateChatHistoryEntity(entityId, updatedHistory);

      // Get relevant context (with timeout handling)
      let contextNoteIds: string[] = [];
      try {
        contextNoteIds = await Promise.race([
          getRelevantContext(userMessage),
          new Promise<string[]>((_, reject) =>
            setTimeout(() => reject(new Error('Context timeout')), 5000)
          )
        ]);
      } catch (contextError) {
        console.warn('Context retrieval failed, continuing without context:', contextError);
        // Continue without context
      }

      // Update user message with context
      const userMessageWithContext: ChatHistoryMessage = {
        ...userChatMessage,
        contextNotes: contextNoteIds
      };

      const historyWithContext = [...chatHistory, userMessageWithContext];

      // Update entity with context
      await updateChatHistoryEntity(entityId, historyWithContext);

      // Prepare conversation history for AI
      const conversationHistory: ChatMessage[] = historyWithContext
        .slice(-10) // Last 10 messages for context
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Start streaming response
      setIsStreaming(true);
      setStreamingContent('');
      setToolActivity([]);

      let fullResponse = '';

      await aiService.chatStream({
        message: userMessage,
        context_notes: contextNoteIds,
        conversation_history: conversationHistory.slice(0, -1), // Exclude current message
        model: widget.config.model,
        provider: widget.config.provider || 'ollama', // Use configured provider
        temperature: widget.config.temperature,
        max_tokens: widget.config.maxTokens
      }, {
        onChunk: (chunk) => {
          if (chunk.type === 'content' && chunk.content) {
            fullResponse += chunk.content;
            setStreamingContent(fullResponse);
          } else if (chunk.type === 'tool_start' && chunk.message) {
            setToolActivity(prev => [...prev, `🔧 ${chunk.message}`]);
          } else if (chunk.type === 'tool_result' && chunk.content) {
            setToolActivity(prev => [...prev, `✅ Tool completed: ${chunk.content.substring(0, 100)}...`]);
          }
        },
        onComplete: async (response) => {
          setIsStreaming(false);

          // Add AI response to history
          const aiChatMessage: ChatHistoryMessage = {
            role: 'assistant',
            content: fullResponse || response,
            timestamp: new Date().toISOString(),
            contextNotes: contextNoteIds
          };

          const finalHistory = [...historyWithContext, aiChatMessage];
          await updateChatHistoryEntity(entityId, finalHistory);

          // Clear streaming states
          setStreamingContent('');
          setToolActivity([]);
        },
        onError: (error) => {
          setIsStreaming(false);
          setStreamingContent('');
          setToolActivity([]);
          console.error('Streaming error:', error);
          // Handle error appropriately
        }
      });
    } catch (error) {
      console.error('Chat error:', error);
      setIsStreaming(false);
      setStreamingContent('');
      setToolActivity([]);

      // Add error message to chat
      const errorMessage: ChatHistoryMessage = {
        role: 'assistant',
        content: error instanceof Error && error.message.includes('timeout')
          ? 'Sorry, the AI request timed out. Please try again with a shorter message or check your connection.'
          : 'Sorry, I encountered an unexpected error. Please try again.',
        timestamp: new Date().toISOString(),
        contextNotes: []
      };

      const errorHistory = userChatMessage
        ? [...chatHistory, userChatMessage, errorMessage]
        : [...chatHistory, errorMessage];
      if (entityId) {
        await updateChatHistoryEntity(entityId, errorHistory);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (mode === 'config') {
    return (
      <div className="h-full w-full flex items-center justify-center p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <Bot className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600">AI Chat Widget</p>
          <p className="text-sm text-gray-500 mt-1">Configure in properties panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col rounded-lg border theme-main-content-background theme-explorer-item-text">
      {/* Messages - Fixed height container with proper scrolling */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-4">
            {chatHistory.length === 0 ? (
              <div className="text-center py-8 theme-explorer-item-text">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start a conversation with your AI assistant</p>
                <p className="text-sm mt-1">I can help you with your notes and answer questions</p>
              </div>
            ) : (
              chatHistory.map((msg, index) => (
                <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}>
                      {msg.role === 'user' ? (
                        <User className="h-3 w-3 text-white" />
                      ) : (
                        <Bot className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <Card className="theme-explorer-background">
                      <CardContent className="p-3">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {widget.config.showContextPreview && msg.contextNotes && msg.contextNotes.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex flex-wrap gap-1">
                              {msg.contextNotes.slice(0, 3).map(noteId => {
                                const note = allEntities[noteId];
                                return note ? (
                                  <Badge key={noteId} variant="secondary" className="text-xs">
                                    {note.title}
                                  </Badge>
                                ) : null;
                              })}
                              {msg.contextNotes.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{msg.contextNotes.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                  <Card className="bg-gray-50">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                  <Card className="bg-gray-50">
                    <CardContent className="p-3">
                      <div className="flex-1">
                        {/* Tool activity display */}
                        {toolActivity.length > 0 && (
                          <div className="mb-2 p-2 bg-blue-50 rounded text-xs">
                            <div className="font-medium text-blue-700 mb-1">Agent Activity:</div>
                            {toolActivity.slice(-3).map((activity, index) => (
                              <div key={index} className="text-blue-600 mb-1">
                                {activity}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Streaming content */}
                        {streamingContent && (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown children={streamingContent}/>
                          </div>
                        )}

                        <div className="flex items-center gap-1 mt-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs text-gray-500">
                            {toolActivity.length > 0 ? 'Agent working...' : 'Streaming...'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-3 border-t flex-shrink-0 theme-main-content-background">
        {!aiStatus.available ? (
          <div className="text-center py-2">
            <p className="text-sm text-red-600">{aiStatus.error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={checkAIStatus}
              className="mt-2"
            >
              Retry Connection
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me anything about your notes..."
              className="min-h-[40px] max-h-[120px] resize-none"
              disabled={isLoading || isStreaming}
            />
            <Button
              onClick={() => handleSendMessage()} // Enable streaming by default
              disabled={!message.trim() || isLoading || isStreaming}
              size="sm"
              className="self-end"
            >
              {(isLoading || isStreaming) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChatWidget;
