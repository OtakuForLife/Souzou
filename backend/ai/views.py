from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .llm.provider import AgentService, Provider
import logging


logger = logging.getLogger(__name__)

class AIViewSet(viewsets.ViewSet):
    """AI operations - matches your ThemeViewSet structure"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.agent_service = AgentService()

    @action(detail=False, methods=['get'])
    def status(self, request):
        """Check AI service status"""
        provider_name: str = request.query_params.get('provider')
        provider: Provider = AgentService.get_provider_by_name(provider_name)
        if provider:
            is_available = provider.is_available()
            if is_available:
                return Response({
                    'success': True,
                    'provider': provider.get_provider_name(),
                    'provider_available': is_available,
                })
            else:
                return Response({
                    'success': False,
                    'error': f'Provider {provider_name} is not available'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({
                'success': False,
                'error': f'Provider {provider_name} not found'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def providers(self, request):
        """List available AI providers"""
        try:

            providers = AgentService.get_available_providers()

            return Response({
                'success': True,
                'providers': providers
            })

        except Exception as e:
            logger.error(f"Failed to list providers: {e}")
            return Response({
                'success': False,
                'error': str(e),
                'providers': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)