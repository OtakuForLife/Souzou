from .models import Entity, Theme, Tag
from .serializers import EntitySerializer, ThemeSerializer, TagSerializer
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .services.vector_service import VectorService
from .services.ollama_service import OllamaService
import logging
import base64
import json
import mimetypes
from django.core.files.uploadedfile import InMemoryUploadedFile

logger = logging.getLogger(__name__)

class EntityViewSet(viewsets.ModelViewSet):
    serializer_class = EntitySerializer
    queryset = Entity.objects.all()

    @action(detail=False, methods=['post'])
    def get_relevant_context(self, request):
        """Get relevant notes for AI context - follows your @action pattern"""
        try:
            # Log incoming request
            logger.info("=== GET_RELEVANT_CONTEXT REQUEST ===")
            logger.info(f"Request data: {request.data}")

            vector_service = VectorService()
            conversation = request.data.get('conversation', [])
            current_note_id = request.data.get('current_note_id')
            max_notes = request.data.get('max_notes', 10)

            logger.info(f"Conversation history: {conversation}")
            logger.info(f"Current note ID: {current_note_id}")
            logger.info(f"Max notes requested: {max_notes}")

            relevant_notes = vector_service.find_relevant_context(
                conversation_history=conversation,
                current_note_id=current_note_id,
                max_notes=max_notes
            )

            logger.info(f"Found {len(relevant_notes)} relevant notes:")
            for i, note in enumerate(relevant_notes):
                logger.info(f"  {i+1}. {note.title} (ID: {note.id})")
                logger.info(f"     Content preview: {note.content[:100]}...")

            serializer = self.get_serializer(relevant_notes, many=True)
            response_data = {
                'success': True,
                'notes': serializer.data,
                'count': len(relevant_notes)
            }

            logger.info(f"Returning {len(relevant_notes)} notes to frontend")
            logger.info("=== GET_RELEVANT_CONTEXT RESPONSE ===")

            return Response(response_data)

        except Exception as e:
            logger.error(f"Failed to get relevant context: {e}")
            logger.error("=== GET_RELEVANT_CONTEXT ERROR ===")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def vector_stats(self, request):
        """Get vector index statistics"""
        try:
            vector_service = VectorService()
            stats = vector_service.get_stats()
            return Response({
                'success': True,
                'stats': stats
            })
        except Exception as e:
            logger.error(f"Failed to get vector stats: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def by_tags(self, request):
        """Filter entities by tags"""
        tag_ids = request.query_params.getlist('tags')
        if not tag_ids:
            return Response([])

        entities = Entity.objects.filter(tags__id__in=tag_ids).distinct()
        serializer = self.get_serializer(entities, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_tags(self, request, pk=None):
        """Add tags to entity"""
        entity = self.get_object()
        tag_ids = request.data.get('tag_ids', [])

        for tag_id in tag_ids:
            try:
                tag = Tag.objects.get(id=tag_id)
                entity.tags.add(tag)
            except Tag.DoesNotExist:
                continue

        serializer = self.get_serializer(entity)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'])
    def remove_tags(self, request, pk=None):
        """Remove tags from entity"""
        entity = self.get_object()
        tag_ids = request.data.get('tag_ids', [])

        for tag_id in tag_ids:
            try:
                tag = Tag.objects.get(id=tag_id)
                entity.tags.remove(tag)
            except Tag.DoesNotExist:
                continue

        serializer = self.get_serializer(entity)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def upload_file(self, request):
        """Upload a file and create a media entity"""
        try:
            logger.info("=== FILE UPLOAD REQUEST ===")

            # Get the uploaded file
            uploaded_file = request.FILES.get('file')
            if not uploaded_file:
                return Response({
                    'success': False,
                    'error': 'No file provided'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get additional metadata from request
            title = request.data.get('title', uploaded_file.name)
            parent_id = request.data.get('parent')

            logger.info(f"Uploading file: {uploaded_file.name}")
            logger.info(f"File size: {uploaded_file.size} bytes")
            logger.info(f"Content type: {uploaded_file.content_type}")
            logger.info(f"Title: {title}")

            # Validate file size (10MB limit)
            max_size = 10 * 1024 * 1024  # 10MB
            if uploaded_file.size > max_size:
                return Response({
                    'success': False,
                    'error': f'File too large. Maximum size is {max_size // (1024*1024)}MB'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Read and encode file data
            file_data = uploaded_file.read()
            base64_data = base64.b64encode(file_data).decode('utf-8')

            # Detect MIME type
            mime_type = uploaded_file.content_type
            if not mime_type:
                mime_type, _ = mimetypes.guess_type(uploaded_file.name)
                mime_type = mime_type or 'application/octet-stream'

            # Create structured content
            content_structure = {
                'data': base64_data,
                'mimeType': mime_type,
                'filename': uploaded_file.name,
                'size': uploaded_file.size
            }

            # Create the media entity
            entity_data = {
                'type': 'media',
                'title': title,
                'content': json.dumps(content_structure),
                'parent': parent_id
            }

            serializer = self.get_serializer(data=entity_data)
            if serializer.is_valid():
                entity = serializer.save()
                logger.info(f"Created media entity: {entity.id}")
                logger.info("=== FILE UPLOAD SUCCESS ===")

                return Response({
                    'success': True,
                    'entity': serializer.data
                }, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"Serializer errors: {serializer.errors}")
                return Response({
                    'success': False,
                    'error': 'Invalid entity data',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"File upload failed: {e}")
            logger.error("=== FILE UPLOAD ERROR ===")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def download_file(self, request, pk=None):
        """Download file data from a media entity"""
        try:
            entity = self.get_object()

            if entity.type != 'media':
                return Response({
                    'success': False,
                    'error': 'Entity is not a media type'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Parse the structured content
            try:
                content_data = json.loads(entity.content)
                file_data = base64.b64decode(content_data['data'])
                mime_type = content_data.get('mimeType', 'application/octet-stream')
                filename = content_data.get('filename', f'file_{entity.id}')

                from django.http import HttpResponse
                response = HttpResponse(file_data, content_type=mime_type)
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response

            except (json.JSONDecodeError, KeyError) as e:
                return Response({
                    'success': False,
                    'error': 'Invalid media entity content structure'
                }, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"File download failed: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    queryset = Tag.objects.all()

    @action(detail=False, methods=['get'])
    def hierarchy(self, request):
        """Get tags in hierarchical structure"""
        root_tags = Tag.objects.filter(parent=None).prefetch_related('children')
        serializer = TagSerializer(root_tags, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def entities(self, request, pk=None):
        """Get entities with this tag"""
        tag = self.get_object()
        entities = tag.entities.all()
        serializer = EntitySerializer(entities, many=True)
        return Response(serializer.data)


class ThemeViewSet(viewsets.ModelViewSet):
    serializer_class = ThemeSerializer
    queryset = Theme.objects.all()

    @action(detail=False, methods=['get'])
    def predefined(self, request):
        """Get all predefined themes"""
        predefined_themes = Theme.objects.filter(type='predefined')
        serializer = self.get_serializer(predefined_themes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def custom(self, request):
        """Get all custom themes"""
        custom_themes = Theme.objects.filter(type='custom')
        serializer = self.get_serializer(custom_themes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def default(self, request):
        """Get the default theme"""
        try:
            default_theme = Theme.objects.get(is_default=True)
            serializer = self.get_serializer(default_theme)
            return Response(serializer.data)
        except Theme.DoesNotExist:
            return Response({"error": "No default theme found"}, status=404)


class AIViewSet(viewsets.ViewSet):
    """AI operations - matches your ThemeViewSet structure"""

    @action(detail=False, methods=['post'])
    def chat(self, request):
        """Chat with AI using note context"""
        try:
            logger.info("=== AI CHAT REQUEST ===")
            logger.info(f"Full request data: {request.data}")

            ollama_service = OllamaService()

            # Check if Ollama is available
            logger.info("Checking Ollama availability...")
            if not ollama_service.is_available():
                logger.error("Ollama server is not available")
                return Response({
                    'success': False,
                    'error': 'Ollama server is not available. Please ensure Ollama is running.',
                    'error_type': 'service_unavailable'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            logger.info("Ollama server is available")

            # Extract request data
            user_message = request.data.get('message', '')
            context_note_ids = request.data.get('context_notes', [])
            conversation_history = request.data.get('conversation_history', [])
            model = request.data.get('model')
            temperature = request.data.get('temperature', 0.7)
            max_tokens = request.data.get('max_tokens')

            logger.info(f"User message: {user_message}")
            logger.info(f"Context note IDs: {context_note_ids}")
            logger.info(f"Conversation history length: {len(conversation_history)}")
            logger.info(f"Model: {model}")
            logger.info(f"Temperature: {temperature}")
            logger.info(f"Max tokens: {max_tokens}")

            if not user_message:
                logger.error("No user message provided")
                return Response({
                    'success': False,
                    'error': 'Message is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Get context notes
            context_notes = []
            if context_note_ids:
                logger.info(f"Fetching {len(context_note_ids)} context notes from database...")
                context_notes = Entity.objects.filter(id__in=context_note_ids)

                logger.info(f"Retrieved {len(context_notes)} context notes:")
                for i, note in enumerate(context_notes):
                    logger.info(f"  {i+1}. {note.title} (ID: {note.id})")
                    logger.info(f"     Content length: {len(note.content)} chars")
                    logger.info(f"     Content preview: {note.content[:200]}...")
            else:
                logger.info("No context notes provided")

            # Get AI response
            logger.info("Sending request to Ollama...")
            logger.info(f"Sending to Ollama - Message: {user_message}")
            logger.info(f"Sending to Ollama - Context notes count: {len(context_notes)}")
            logger.info(f"Sending to Ollama - Model: {model}")

            response = ollama_service.chat_with_context(
                user_message=user_message,
                context_notes=context_notes,
                conversation_history=conversation_history,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens
            )

            logger.info(f"Ollama response received: {response}")
            logger.info("=== AI CHAT RESPONSE ===")

            return Response(response)

        except Exception as e:
            logger.error(f"AI chat failed: {e}")
            logger.error("=== AI CHAT ERROR ===")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return Response({
                'success': False,
                'error': str(e),
                'error_type': 'unknown_error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def models(self, request):
        """List available Ollama models"""
        try:
            ollama_service = OllamaService()

            if not ollama_service.is_available():
                return Response({
                    'success': False,
                    'error': 'Ollama server is not available',
                    'models': []
                })

            models = ollama_service.list_models()
            return Response({
                'success': True,
                'models': models
            })

        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return Response({
                'success': False,
                'error': str(e),
                'models': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def status(self, request):
        """Check AI service status"""
        try:
            ollama_service = OllamaService()
            is_available = ollama_service.is_available()

            return Response({
                'success': True,
                'ollama_available': is_available,
                'base_url': ollama_service.base_url,
                'default_model': ollama_service.default_model
            })

        except Exception as e:
            logger.error(f"Failed to check AI status: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)