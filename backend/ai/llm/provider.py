"""
AI Service providers for model integration

Handles communication with different AI services including Ollama and LangGraph agents.
"""

import requests
import json
import logging
from typing import List, Dict, Any, Optional
from django.conf import settings
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.language_models import BaseChatModel
from .agent import get_llm_graph

logger = logging.getLogger(__name__)

class Provider:
    """Base class for AI providers"""

    def __init__(self):
        self.url = None
        self.api_key = None

    def is_available(self) -> bool:
        """Check if the provider is available"""
        raise NotImplementedError

    def list_models(self) -> List[Dict[str, Any]]:
        """List available models from the provider"""
        raise NotImplementedError

    def get_provider_name(self) -> str:
        """Get the name of the provider"""
        raise NotImplementedError
    
    def get_config(self) -> Dict[str, Any]:
        """Get the configuration for the provider"""
        raise NotImplementedError
    

class OllamaProvider(Provider):
    """Provider for interacting with Ollama AI models"""

    def __init__(self):
        super().__init__()
        self.base_url = getattr(settings, 'OLLAMA_BASE_URL', 'http://localhost:11434')
        self.default_model = getattr(settings, 'OLLAMA_DEFAULT_MODEL', 'llama3.2:3b')
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
                formatted_models.append(model.get('name', ''))
            
            return formatted_models
            
        except Exception as e:
            logger.error(f"Failed to list Ollama models: {e}")
            return []
    
    def get_provider_name(self) -> str:
        return "ollama"

    def get_config(self):
        return {
            "base_url": self.base_url,
            "model": self.default_model,
            "timeout": self.timeout,
            "model_provider": self.get_provider_name()
        }


class OpenAIProvider(Provider):
    """Provider for interacting with OpenAI API"""

    def __init__(self):
        super().__init__()
        self.api_key = getattr(settings, 'OPENAI_API_KEY', None)
        self.base_url = getattr(settings, 'OPENAI_BASE_URL', 'https://api.openai.com/v1')
        self.default_model = getattr(settings, 'OPENAI_DEFAULT_MODEL', 'gpt-3.5-turbo')
        self.timeout = getattr(settings, 'OPENAI_TIMEOUT', 30)

    def is_available(self) -> bool:
        """Check if OpenAI API is available"""
        if not self.api_key:
            logger.warning("OpenAI API key not configured")
            return False
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            response = requests.get(f"{self.base_url}/models", headers=headers, timeout=5)
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"OpenAI API not available: {e}")
            return False

    def list_models(self) -> List[Dict[str, Any]]:
        """List available models from OpenAI"""
        if not self.api_key:
            return []
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            response = requests.get(f"{self.base_url}/models", headers=headers, timeout=self.timeout)
            response.raise_for_status()

            data = response.json()
            models = data.get('data', [])

            # Format model information
            formatted_models = []
            for model in models:
                formatted_models.append(model.get('id'))

            return formatted_models

        except Exception as e:
            logger.error(f"Failed to list OpenAI models: {e}")
            return []

    def get_provider_name(self) -> str:
        return "openai"
    
    def get_config(self):
        return {
            "api_key": self.api_key,
            "base_url": self.base_url,
            "model": self.default_model,
            "timeout": self.timeout,
            "model_provider": self.get_provider_name()
        }


class AgentService:
    """Service for interacting with LangGraph agents"""

    PROVIDERS = [OllamaProvider(), OpenAIProvider()]

    def __init__(self):
        pass
    
    def chat(self, msg: str, provider_name: str, model_name: str):
        print(f"=== AGENTSERVICE.CHAT CALLED: {msg} ===")
        logger.info(f"AgentService.chat called with msg='{msg}', provider='{provider_name}', model='{model_name}'")
        input = {
            "messages": HumanMessage(content=msg)
        }
        logger.info(f"Created input: {input}")

        provider = self.get_provider_by_name(provider_name)
        logger.info(f"Got provider: {provider}")

        provider_config = provider.get_config()
        provider_config["model"] = model_name
        logger.info(f"Provider config: {provider_config}")

        logger.info(f"About to call get_llm_graph...")
        try:
            llm_graph = get_llm_graph(provider_config)
            logger.info(f"get_llm_graph returned: {type(llm_graph)}")

            logger.info(f"About to call astream_events...")
            stream = llm_graph.astream_events(input, version="v2")
            logger.info(f"astream_events returned: {type(stream)}")
            return stream
        except Exception as e:
            logger.error(f"Error in AgentService.chat: {e}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            raise
    
    @staticmethod
    def get_provider_by_name(name: str) -> Optional[Provider]:
        provider: Provider
        for provider in AgentService.PROVIDERS:
            if provider.get_provider_name().lower() == name.lower():
                return provider
        return None

    @staticmethod
    def get_available_providers() -> List[Dict[str, Any]]:
        """Get list of available providers with their status"""
        providers = []

        provider: Provider
        for provider in AgentService.PROVIDERS:
            is_available = provider.is_available()
            try:
                providers.append({
                    'name': provider.get_provider_name(),
                    'display_name': provider.get_provider_name(),
                    'available': is_available,
                    'models': provider.list_models() if is_available else []
                })
            except Exception as e:
                logger.error(f"Error checking provider {provider.get_provider_name()}: {e}")

        return providers