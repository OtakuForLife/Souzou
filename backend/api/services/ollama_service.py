"""
Ollama Service for AI model integration

Handles communication with Ollama server for AI chat functionality.
"""

import requests
import json
import logging
from typing import List, Dict, Any, Optional
from django.conf import settings

logger = logging.getLogger(__name__)


class OllamaService:
    """Service for interacting with Ollama AI models"""
    
    def __init__(self):
        self.base_url = getattr(settings, 'OLLAMA_BASE_URL', 'http://localhost:11434')
        self.default_model = getattr(settings, 'OLLAMA_DEFAULT_MODEL', 'llama2')
        self.timeout = getattr(settings, 'OLLAMA_TIMEOUT', 30)
        
    def is_available(self) -> bool:
        """Check if Ollama server is available"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama server not available: {e}")
            return False
    
    def list_models(self) -> List[Dict[str, Any]]:
        """List available models from Ollama"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=self.timeout)
            response.raise_for_status()
            
            data = response.json()
            models = data.get('models', [])
            
            # Format model information
            formatted_models = []
            for model in models:
                formatted_models.append({
                    'name': model.get('name', ''),
                    'size': model.get('size', 0),
                    'modified_at': model.get('modified_at', ''),
                    'digest': model.get('digest', '')
                })
            
            return formatted_models
            
        except Exception as e:
            logger.error(f"Failed to list Ollama models: {e}")
            return []
    
    def chat_completion(self, messages: List[Dict[str, str]], model: Optional[str] = None, 
                       temperature: float = 0.7, max_tokens: Optional[int] = None) -> Dict[str, Any]:
        """
        Send chat completion request to Ollama
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            model: Model name to use (defaults to default_model)
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum tokens to generate
            
        Returns:
            Dictionary with response data
        """
        try:
            model = model or self.default_model

            logger.info("=== OLLAMA CHAT_COMPLETION ===")
            logger.info(f"Using model: {model}")
            logger.info(f"Temperature: {temperature}")
            logger.info(f"Max tokens: {max_tokens}")
            logger.info(f"Timeout: {self.timeout}s")

            # Convert messages to Ollama format
            prompt = self._format_messages_for_ollama(messages)
            logger.info(f"Formatted prompt length: {len(prompt)} chars")
            logger.info(f"Formatted prompt preview: {prompt[:1000]}...")

            payload = {
                'model': model,
                'prompt': prompt,
                'stream': False,
                'options': {
                    'temperature': temperature,
                }
            }

            if max_tokens:
                payload['options']['num_predict'] = max_tokens

            logger.info(f"Sending request to: {self.base_url}/api/generate")
            logger.info(f"Payload: {payload}")

            response = requests.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=self.timeout
            )
            logger.info(f"Ollama response status: {response.status_code}")
            response.raise_for_status()

            data = response.json()
            logger.info(f"Ollama response data: {data}")

            result = {
                'success': True,
                'response': data.get('response', ''),
                'model': model,
                'done': data.get('done', False),
                'context': data.get('context', []),
                'total_duration': data.get('total_duration', 0),
                'load_duration': data.get('load_duration', 0),
                'prompt_eval_count': data.get('prompt_eval_count', 0),
                'eval_count': data.get('eval_count', 0)
            }

            logger.info(f"Returning success response: {result}")
            logger.info("=== OLLAMA CHAT_COMPLETION SUCCESS ===")
            return result
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Ollama request failed: {e}")
            logger.error("=== OLLAMA REQUEST ERROR ===")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': f"Request failed: {str(e)}",
                'error_type': 'request_error'
            }
        except Exception as e:
            logger.error(f"Ollama chat completion failed: {e}")
            logger.error("=== OLLAMA CHAT_COMPLETION ERROR ===")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': f"Unexpected error: {str(e)}",
                'error_type': 'unknown_error'
            }
    
    def _format_messages_for_ollama(self, messages: List[Dict[str, str]]) -> str:
        """
        Format chat messages for Ollama prompt
        
        Args:
            messages: List of message dictionaries
            
        Returns:
            Formatted prompt string
        """
        formatted_parts = []
        
        for message in messages:
            role = message.get('role', 'user')
            content = message.get('content', '')
            
            if role == 'system':
                formatted_parts.append(f"System: {content}")
            elif role == 'user':
                formatted_parts.append(f"Human: {content}")
            elif role == 'assistant':
                formatted_parts.append(f"Assistant: {content}")
        
        # Add final prompt for assistant response
        formatted_parts.append("Assistant:")
        
        return "\n\n".join(formatted_parts)
    
    def chat_with_context(self, user_message: str, context_notes: List[Any],
                         conversation_history: List[Dict[str, str]] = None,
                         model: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """
        Chat with AI using note context

        Args:
            user_message: User's message
            context_notes: List of Entity objects to use as context
            conversation_history: Previous conversation messages
            model: Model to use
            **kwargs: Additional parameters for chat_completion

        Returns:
            Chat completion response
        """
        try:
            logger.info("=== OLLAMA CHAT_WITH_CONTEXT ===")
            logger.info(f"User message: {user_message}")
            logger.info(f"Context notes count: {len(context_notes)}")
            logger.info(f"Conversation history length: {len(conversation_history) if conversation_history else 0}")
            logger.info(f"Model: {model}")

            # Build context from notes
            context_text = self._build_context_from_notes(context_notes)
            logger.info(f"Built context text length: {len(context_text)} chars")
            logger.info(f"Context text preview: {context_text[:500]}...")

            # Build system prompt with context
            system_prompt = self._build_system_prompt(context_text)
            logger.info(f"System prompt length: {len(system_prompt)} chars")
            logger.info(f"System prompt preview: {system_prompt[:500]}...")

            # Build message list
            messages = [{'role': 'system', 'content': system_prompt}]

            # Add conversation history
            if conversation_history:
                logger.info(f"Adding {len(conversation_history)} conversation history messages")
                messages.extend(conversation_history)

            # Add current user message
            messages.append({'role': 'user', 'content': user_message})

            logger.info(f"Total messages to send to AI: {len(messages)}")
            for i, msg in enumerate(messages):
                logger.info(f"  Message {i+1}: {msg['role']} - {len(msg['content'])} chars")
                if msg['role'] == 'user':
                    logger.info(f"    Content: {msg['content']}")

            # Get AI response
            logger.info("Calling chat_completion...")
            return self.chat_completion(messages, model=model, **kwargs)
            
        except Exception as e:
            logger.error(f"Chat with context failed: {e}")
            logger.error("=== OLLAMA CHAT_WITH_CONTEXT ERROR ===")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': f"Failed to process chat with context: {str(e)}",
                'error_type': 'context_error'
            }
    
    def _build_context_from_notes(self, context_notes: List[Any]) -> str:
        """Build context text from note entities"""
        if not context_notes:
            return ""
        
        context_parts = ["# Available Notes Context\n"]
        
        for note in context_notes:
            context_parts.append(f"## {note.title}")
            if note.content:
                # Truncate very long content
                content = note.content[:2000] + "..." if len(note.content) > 2000 else note.content
                context_parts.append(content)
            context_parts.append("")  # Empty line between notes
        
        return "\n".join(context_parts)
    
    def _build_system_prompt(self, context_text: str) -> str:
        """Build system prompt with context"""
        base_prompt = """You are an AI assistant helping with note-taking and knowledge management. You have access to the user's notes and can help them understand, organize, and work with their information.

Key capabilities:
- Answer questions about the provided notes
- Help organize and structure information
- Suggest connections between ideas
- Create new notes when requested
- Update existing notes when requested

When creating or updating notes, always:
1. Ask for confirmation before making changes
2. Provide clear titles and well-structured content
3. Use markdown formatting appropriately

Be helpful, accurate, and concise in your responses."""

        if context_text:
            return f"{base_prompt}\n\n{context_text}"
        else:
            return base_prompt
    
    def get_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific model"""
        try:
            response = requests.post(
                f"{self.base_url}/api/show",
                json={'name': model_name},
                timeout=self.timeout
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get model info for {model_name}: {e}")
            return None
