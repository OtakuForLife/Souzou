"""
WebSocket consumers for AI streaming functionality
Following the Medium article pattern for LangGraph streaming with Django Channels
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from .llm.provider import AgentService

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for streaming AI chat responses"""

    async def connect(self):
        """Accept WebSocket connection"""
        logger.info("=== CHATCONSUMER CONNECT CALLED ===")
        await self.accept()
        logger.info("WebSocket connection established")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        logger.info(f"WebSocket disconnected with code: {close_code}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        logger.info("=== WEBSOCKET MESSAGE RECEIVED ===")
        logger.info(f"Raw text_data: {text_data}")
        try:
            # Parse the incoming message
            data = json.loads(text_data)
            logger.info(f"Parsed data: {data}")
            message_type = data.get('type', 'chat')
            logger.info(f"Message type: {message_type}")

            if message_type == 'chat':
                logger.info("Calling handle_chat_message...")
                await self.handle_chat_message(data)
            else:
                logger.warning(f"Unknown message type: {message_type}")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'error': f'Unknown message type: {message_type}'
                }))

        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Error handling WebSocket message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': str(e)
            }))
    
    async def handle_chat_message(self, data):
        """Handle chat message and stream LangGraph response"""
        logger.info("=== HANDLE_CHAT_MESSAGE CALLED ===")
        logger.info(f"Received data: {data}")
        try:
            # Extract message data
            user_message = data.get('message', '')
            context_note_ids = data.get('context_notes', [])
            conversation_history = data.get('conversation_history', [])
            model = data.get('model')
            provider = data.get('provider', 'ollama')
            logger.info(f"Received chat message: {user_message} with context {context_note_ids} and history {conversation_history} for model {model} from provider {provider}")
            if not user_message:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'error': 'Message is required'
                }))
                return
            
            # Create agent service
            agent_service = AgentService()

            # Check if provider and model are valid
            provider_instance = agent_service.get_provider_by_name(provider)
            if not provider_instance:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'error': f'Provider {provider} not found'
                }))
                return
            
            if not model in provider_instance.list_models():
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'error': f'Model {model} not found'
                }))
                return
            
            # Send start signal
            await self.send(text_data=json.dumps({
                'type': 'start',
                'message': 'Starting AI response...'
            }))
            
            logger.info(f"Starting AI response for message: {user_message}")
            event_count = 0
            async for event in agent_service.chat(user_message, provider, model):
                event_count += 1
                logger.info(f"Event #{event_count}: {event}")
                logger.info(f"Event type: {type(event)}, Event keys: {list(event.keys()) if isinstance(event, dict) else 'Not a dict'}")

                # Process and serialize the LangGraph event
                try:
                    logger.info(f"About to serialize event of type: {event.get('event', 'unknown')}")

                    # Safety check: never send raw events with "next" field
                    if isinstance(event, dict) and 'next' in event:
                        logger.warning(f"Blocking raw event with 'next' field: {event}")
                        continue

                    serialized_event = self.serialize_langgraph_event(event)
                    logger.info(f"Serialized event result: {serialized_event}")

                    if serialized_event:
                        # Double-check serialized event doesn't contain raw "next" field
                        if isinstance(serialized_event, dict) and 'next' in serialized_event:
                            logger.warning(f"Blocking serialized event with raw 'next' field: {serialized_event}")
                            continue

                        try:
                            json_data = json.dumps(serialized_event)
                            logger.info(f"Sending JSON to frontend: {json_data}")
                            await self.send(text_data=json_data)
                            logger.info(f"Successfully sent event to frontend")
                        except Exception as send_error:
                            # Handle client disconnection gracefully
                            if "ClientDisconnected" in str(type(send_error)) or "ConnectionClosed" in str(send_error):
                                logger.info("Client disconnected, stopping event stream")
                                break
                            else:
                                logger.error(f"Error sending event to client: {send_error}")
                                raise
                    else:
                        logger.info(f"Event was filtered out (returned None)")
                except Exception as serialize_error:
                    logger.error(f"Error serializing event: {serialize_error}")
                    logger.error(f"Problematic event: {event}")
                    # Don't raise serialization errors - just skip the event
                    continue

            # Send completion signal
            logger.info(f"AI response completed after {event_count} events")
            try:
                await self.send(text_data=json.dumps({
                    'type': 'complete',
                    'message': 'AI response completed'
                }))
                logger.info("Completion signal sent to frontend")
            except Exception as completion_error:
                if "ClientDisconnected" in str(type(completion_error)) or "ConnectionClosed" in str(completion_error):
                    logger.info("Client disconnected before completion signal could be sent")
                else:
                    logger.error(f"Error sending completion signal: {completion_error}")
                    raise
                    
        except Exception as e:
            logger.error(f"Error in handle_chat_message: {e}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Error args: {e.args}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'error': str(e)
            }))

    def serialize_langgraph_event(self, event):
        """Convert LangGraph event to JSON-serializable format"""
        try:
            # LangGraph events have different types, we need to handle them appropriately
            event_type = event.get('event', '')
            event_name = event.get('name', '')
            data = event.get('data', {})

            if event_type == 'on_chat_model_stream':
                # Handle streaming chat model responses
                chunk = data.get('chunk', {})
                if hasattr(chunk, 'content') and chunk.content:
                    # Only send content from worker agents, not supervisor
                    metadata = event.get('metadata', {})
                    langgraph_node = metadata.get('langgraph_node', '')

                    # Skip supervisor content - it's just routing decisions
                    if langgraph_node == 'supervisor':
                        logger.info(f"Filtering out supervisor content: {chunk.content}")
                        return None

                    return {
                        'type': 'content',
                        'content': chunk.content,
                        'worker': event_name,
                        'provider': metadata.get('provider', ''),
                        'model': metadata.get('model', '')
                    }

            elif event_type == 'on_chat_model_end':
                # Handle end of chat model response
                metadata = event.get('metadata', {})
                langgraph_node = metadata.get('langgraph_node', '')

                # Skip supervisor done events - they're just routing decisions
                if langgraph_node == 'supervisor':
                    logger.info(f"Filtering out supervisor done event")
                    return None

                # Skip intermediate LLM calls within workers - only send done when worker actually completes
                # We'll send the final done event when the entire workflow completes
                logger.info(f"Filtering out intermediate LLM done event from {langgraph_node}")
                return None

            elif event_type == 'on_chain_start':
                # Handle start of chain execution
                if event_name in ['supervisor', 'web_researcher', 'notemanager']:
                    return {
                        'type': 'start',
                        'message': f"Starting {event_name}...",
                        'worker': event_name
                    }

            elif event_type == 'on_chain_end':
                # Handle end of chain execution
                logger.info(f"Processing on_chain_end for {event_name}, data: {data}")
                if event_name == 'supervisor':
                    # Extract routing decision from supervisor
                    output = data.get('output')
                    logger.info(f"Supervisor output: {output}, type: {type(output)}")
                    if hasattr(output, 'goto'):
                        goto_value = str(output.goto)
                        logger.info(f"Supervisor routing to: {goto_value}")
                        return {
                            'type': 'routing',
                            'message': f"Routing to {goto_value}",
                            'worker': 'supervisor',
                            'next_worker': goto_value
                        }
                    else:
                        logger.warning(f"Supervisor output has no 'goto' attribute: {output}")
                elif event_name in ['web_researcher', 'notemanager']:
                    # Extract the worker's response content if available
                    output = data.get('output')
                    if output and hasattr(output, 'update') and 'messages' in output.update:
                        messages = output.update['messages']
                        if messages and hasattr(messages[0], 'content'):
                            content = messages[0].content
                            logger.info(f"Worker {event_name} completed with content: {content[:100]}...")
                            return {
                                'type': 'content',
                                'content': content,
                                'worker': event_name
                            }

                    return {
                        'type': 'worker_complete',
                        'message': f"{event_name} completed",
                        'worker': event_name
                    }

            elif event_type == 'on_tool_start':
                # Handle tool execution start
                return {
                    'type': 'tool_start',
                    'message': f"Using tool: {event_name}",
                    'worker': event_name
                }

            elif event_type == 'on_tool_end':
                # Handle tool execution end
                output = data.get('output', '')
                if isinstance(output, str) and output.strip():
                    return {
                        'type': 'tool_result',
                        'content': output[:1000],  # Limit tool output
                        'worker': event_name
                    }

            # For message-based events, try to extract content
            if isinstance(data, dict):
                # Look for message content in various locations
                content = None

                # Check for messages in output
                if 'output' in data:
                    output = data['output']
                    if hasattr(output, 'content'):
                        content = output.content
                    elif isinstance(output, dict) and 'messages' in output:
                        messages = output['messages']
                        if messages and hasattr(messages[-1], 'content'):
                            content = messages[-1].content
                    elif isinstance(output, str):
                        content = output

                # Check for chunk content
                elif 'chunk' in data:
                    chunk = data['chunk']
                    if hasattr(chunk, 'content'):
                        content = chunk.content

                if content and isinstance(content, str) and content.strip():
                    return {
                        'type': 'content',
                        'content': content,
                        'worker': event_name,
                        'event_type': event_type
                    }

            # Skip events that don't contain useful information for the frontend
            return None

        except Exception as e:
            logger.error(f"Error serializing LangGraph event: {e}")
            logger.error(f"Event type: {event_type}, Event name: {event_name}")
            import traceback
            logger.error(f"Serialization traceback: {traceback.format_exc()}")
            # Don't send error events to frontend for serialization issues
            return None