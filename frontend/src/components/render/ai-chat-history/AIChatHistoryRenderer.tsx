/**
 * AI Chat History Renderer
 * 
 * Renders a readonly view of AI chat history stored in an entity.
 * This is used when viewing an AI Chat History entity directly in a tab.
 */

import React from 'react';
import { Bot, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { EntityRendererProps } from '@/components/ContentRenderer';
import { ChatMessage } from '@/models/ChatMessage';



const AIChatHistoryRenderer: React.FC<EntityRendererProps> = ({ entityID }) => {
  const entity = useSelector((state: RootState) => state.entities.allEntities[entityID]);
  const allEntities = useSelector((state: RootState) => state.entities.allEntities);

  if (!entity) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">Chat history not found</p>
          <p className="text-sm">The requested chat history could not be loaded</p>
        </div>
      </div>
    );
  }

  // Parse chat history from entity content
  let chatHistory: ChatMessage[] = [];
  try {
    chatHistory = entity.content ? JSON.parse(entity.content) : [];
  } catch (error) {
    console.error('Failed to parse chat history:', error);
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <div>
            <h1 className="font-semibold">{entity.title}</h1>
            <p className="text-sm">
              {chatHistory.length} messages • Created {new Date(entity.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Messages - Fixed height container with proper scrolling */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 pb-12 space-y-4 max-w-4xl mx-auto">
            {chatHistory.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No messages in this chat history</p>
              </div>
            ) : (
              chatHistory.map((msg, index) => (
                <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}>
                      {msg.role === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>

                    <Card className="theme-explorer-background">
                      <CardContent className="p-4">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {/* Timestamp */}
                        <div className="mt-2 text-xs">
                          {new Date(msg.timestamp).toLocaleString()}
                        </div>

                        {/* Context notes */}
                        {msg.contextNotes && msg.contextNotes.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs mb-1">Context notes:</div>
                            <div className="flex flex-wrap gap-1">
                              {msg.contextNotes.slice(0, 5).map(noteId => {
                                const note = allEntities[noteId];
                                return note ? (
                                  <Badge key={noteId} variant="secondary" className="text-xs">
                                    {note.title}
                                  </Badge>
                                ) : null;
                              })}
                              {msg.contextNotes.length > 5 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{msg.contextNotes.length - 5} more
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
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AIChatHistoryRenderer;
