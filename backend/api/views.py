from .models import Entity, Theme, Tag
from .serializers import EntitySerializer, ThemeSerializer, TagSerializer
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .services.vector_service import VectorService
from .tasks import (
    generate_embedding_for_entity,
    generate_embeddings_batch,
    regenerate_all_embeddings,
    update_stale_embeddings
)
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


# ============================================================================
# EMBEDDING MANAGEMENT VIEWS
# ============================================================================

@api_view(['POST'])
def generate_entity_embedding(request, entity_id):
    """
    Trigger embedding generation for a specific entity.

    POST /api/entities/{entity_id}/generate-embedding/

    Returns:
        - 202: Task queued successfully
        - 404: Entity not found
    """
    entity = get_object_or_404(Entity, id=entity_id)

    # Queue the task
    task = generate_embedding_for_entity.delay(str(entity_id))

    logger.info(f"Queued embedding generation for entity {entity_id}, task_id: {task.id}")

    return Response({
        'status': 'queued',
        'entity_id': str(entity_id),
        'task_id': task.id,
        'message': f'Embedding generation queued for "{entity.title}"'
    }, status=status.HTTP_202_ACCEPTED)


@api_view(['POST'])
def generate_batch_embeddings(request):
    """
    Trigger embedding generation for multiple entities.

    POST /api/embeddings/generate-batch/
    Body: {
        "entity_ids": ["uuid1", "uuid2", ...]
    }

    Returns:
        - 202: Task queued successfully
        - 400: Invalid request
    """
    entity_ids = request.data.get('entity_ids', [])

    if not entity_ids:
        return Response({
            'error': 'entity_ids is required and must be a non-empty list'
        }, status=status.HTTP_400_BAD_REQUEST)

    if not isinstance(entity_ids, list):
        return Response({
            'error': 'entity_ids must be a list'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate that all entities exist
    existing_count = Entity.objects.filter(id__in=entity_ids).count()
    if existing_count != len(entity_ids):
        return Response({
            'error': f'Some entities not found. Requested: {len(entity_ids)}, Found: {existing_count}'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Queue the batch task
    task = generate_embeddings_batch.delay(entity_ids)

    logger.info(f"Queued batch embedding generation for {len(entity_ids)} entities, task_id: {task.id}")

    return Response({
        'status': 'queued',
        'entity_count': len(entity_ids),
        'task_id': task.id,
        'message': f'Batch embedding generation queued for {len(entity_ids)} entities'
    }, status=status.HTTP_202_ACCEPTED)


@api_view(['POST'])
def regenerate_all(request):
    """
    Trigger embedding regeneration for ALL entities.

    POST /api/embeddings/regenerate-all/

    Warning: This can be a long-running operation for large databases.

    Returns:
        - 202: Task queued successfully
    """
    # Queue the regeneration task
    task = regenerate_all_embeddings.delay()

    logger.info(f"Queued full embedding regeneration, task_id: {task.id}")

    return Response({
        'status': 'queued',
        'task_id': task.id,
        'message': 'Full embedding regeneration queued. This may take a while.'
    }, status=status.HTTP_202_ACCEPTED)


@api_view(['POST'])
def update_stale(request):
    """
    Update embeddings for entities that have been modified.

    POST /api/embeddings/update-stale/
    Body (optional): {
        "hours": 24  // Consider embeddings stale if older than this
    }

    Returns:
        - 202: Task queued successfully
    """
    hours = request.data.get('hours', 24)

    try:
        hours = int(hours)
        if hours < 1:
            raise ValueError("hours must be positive")
    except (ValueError, TypeError):
        return Response({
            'error': 'hours must be a positive integer'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Queue the update task
    task = update_stale_embeddings.delay(hours=hours)

    logger.info(f"Queued stale embedding update (hours={hours}), task_id: {task.id}")

    return Response({
        'status': 'queued',
        'hours': hours,
        'task_id': task.id,
        'message': f'Stale embedding update queued (checking entities modified in last {hours} hours)'
    }, status=status.HTTP_202_ACCEPTED)


@api_view(['GET'])
def embedding_status(request, entity_id):
    """
    Get embedding status for a specific entity.

    GET /api/entities/{entity_id}/embedding-status/

    Returns:
        - 200: Status information
        - 404: Entity not found
    """
    entity = get_object_or_404(Entity, id=entity_id)

    has_embedding = entity.embedding is not None
    embedding_dimension = len(entity.embedding) if has_embedding else 0

    # Check if embedding is stale (entity updated after embedding)
    is_stale = False
    if has_embedding and entity.embedding_updated_at:
        is_stale = entity.updated_at > entity.embedding_updated_at

    return Response({
        'entity_id': str(entity_id),
        'entity_title': entity.title,
        'has_embedding': has_embedding,
        'embedding_dimension': embedding_dimension,
        'embedding_model': entity.embedding_model,
        'embedding_updated_at': entity.embedding_updated_at.isoformat() if entity.embedding_updated_at else None,
        'entity_updated_at': entity.updated_at.isoformat(),
        'is_stale': is_stale,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def embedding_stats(request):
    """
    Get overall embedding statistics.

    GET /api/embeddings/stats/

    Returns:
        - 200: Statistics about embeddings
    """
    from django.db.models import Count, Q, F

    total_entities = Entity.objects.count()
    entities_with_embeddings = Entity.objects.filter(embedding__isnull=False).count()
    entities_without_embeddings = total_entities - entities_with_embeddings

    # Count stale embeddings (entity updated after embedding)
    stale_embeddings = Entity.objects.filter(
        embedding__isnull=False,
        embedding_updated_at__isnull=False,
        updated_at__gt=F('embedding_updated_at')
    ).count()

    return Response({
        'total_entities': total_entities,
        'entities_with_embeddings': entities_with_embeddings,
        'entities_without_embeddings': entities_without_embeddings,
        'stale_embeddings': stale_embeddings,
        'coverage_percentage': round((entities_with_embeddings / total_entities * 100), 2) if total_entities > 0 else 0,
    }, status=status.HTTP_200_OK)


# ============================================================================
# EMBEDDING MANAGEMENT VIEWS
# ============================================================================

from rest_framework.decorators import api_view
from django.shortcuts import get_object_or_404
from api.tasks import (
    generate_embedding_for_entity,
    generate_embeddings_batch,
    regenerate_all_embeddings,
    update_stale_embeddings
)


@api_view(['POST'])
def generate_entity_embedding(request, entity_id):
    """
    Trigger embedding generation for a specific entity.

    POST /api/entities/{entity_id}/generate-embedding/

    Returns:
        - 202: Task queued successfully
        - 404: Entity not found
    """
    entity = get_object_or_404(Entity, id=entity_id)

    # Queue the task
    task = generate_embedding_for_entity.delay(str(entity_id))

    logger.info(f"Queued embedding generation for entity {entity_id}, task_id: {task.id}")

    return Response({
        'status': 'queued',
        'entity_id': str(entity_id),
        'task_id': task.id,
        'message': f'Embedding generation queued for "{entity.title}"'
    }, status=status.HTTP_202_ACCEPTED)


@api_view(['POST'])
def generate_batch_embeddings(request):
    """
    Trigger embedding generation for multiple entities.

    POST /api/embeddings/generate-batch/
    Body: {
        "entity_ids": ["uuid1", "uuid2", ...]
    }

    Returns:
        - 202: Task queued successfully
        - 400: Invalid request
    """
    entity_ids = request.data.get('entity_ids', [])

    if not entity_ids:
        return Response({
            'error': 'entity_ids is required and must be a non-empty list'
        }, status=status.HTTP_400_BAD_REQUEST)

    if not isinstance(entity_ids, list):
        return Response({
            'error': 'entity_ids must be a list'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Validate that all entities exist
    existing_count = Entity.objects.filter(id__in=entity_ids).count()
    if existing_count != len(entity_ids):
        return Response({
            'error': f'Some entities not found. Requested: {len(entity_ids)}, Found: {existing_count}'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Queue the batch task
    task = generate_embeddings_batch.delay(entity_ids)

    logger.info(f"Queued batch embedding generation for {len(entity_ids)} entities, task_id: {task.id}")

    return Response({
        'status': 'queued',
        'entity_count': len(entity_ids),
        'task_id': task.id,
        'message': f'Batch embedding generation queued for {len(entity_ids)} entities'
    }, status=status.HTTP_202_ACCEPTED)


@api_view(['POST'])
def regenerate_all(request):
    """
    Trigger embedding regeneration for ALL entities.

    POST /api/embeddings/regenerate-all/

    Warning: This can be a long-running operation for large databases.

    Returns:
        - 202: Task queued successfully
    """
    # Queue the regeneration task
    task = regenerate_all_embeddings.delay()

    logger.info(f"Queued full embedding regeneration, task_id: {task.id}")

    return Response({
        'status': 'queued',
        'task_id': task.id,
        'message': 'Full embedding regeneration queued. This may take a while.'
    }, status=status.HTTP_202_ACCEPTED)


@api_view(['POST'])
def update_stale(request):
    """
    Update embeddings for entities that have been modified.

    POST /api/embeddings/update-stale/
    Body (optional): {
        "hours": 24  // Consider embeddings stale if older than this
    }

    Returns:
        - 202: Task queued successfully
    """
    hours = request.data.get('hours', 24)

    try:
        hours = int(hours)
        if hours < 1:
            raise ValueError("hours must be positive")
    except (ValueError, TypeError):
        return Response({
            'error': 'hours must be a positive integer'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Queue the update task
    task = update_stale_embeddings.delay(hours=hours)

    logger.info(f"Queued stale embedding update (hours={hours}), task_id: {task.id}")

    return Response({
        'status': 'queued',
        'hours': hours,
        'task_id': task.id,
        'message': f'Stale embedding update queued (checking entities modified in last {hours} hours)'
    }, status=status.HTTP_202_ACCEPTED)


@api_view(['GET'])
def embedding_status(request, entity_id):
    """
    Get embedding status for a specific entity.

    GET /api/entities/{entity_id}/embedding-status/

    Returns:
        - 200: Status information
        - 404: Entity not found
    """
    entity = get_object_or_404(Entity, id=entity_id)

    has_embedding = entity.embedding is not None
    embedding_dimension = len(entity.embedding) if has_embedding else 0

    # Check if embedding is stale (entity updated after embedding)
    is_stale = False
    if has_embedding and entity.embedding_updated_at:
        is_stale = entity.updated_at > entity.embedding_updated_at

    return Response({
        'entity_id': str(entity_id),
        'entity_title': entity.title,
        'has_embedding': has_embedding,
        'embedding_dimension': embedding_dimension,
        'embedding_model': entity.embedding_model,
        'embedding_updated_at': entity.embedding_updated_at.isoformat() if entity.embedding_updated_at else None,
        'entity_updated_at': entity.updated_at.isoformat(),
        'is_stale': is_stale,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def embedding_stats(request):
    """
    Get overall embedding statistics.

    GET /api/embeddings/stats/

    Returns:
        - 200: Statistics about embeddings
    """
    from django.db.models import Count, Q, F

    total_entities = Entity.objects.count()
    entities_with_embeddings = Entity.objects.filter(embedding__isnull=False).count()
    entities_without_embeddings = total_entities - entities_with_embeddings

    # Count stale embeddings (entity updated after embedding)
    stale_embeddings = Entity.objects.filter(
        embedding__isnull=False,
        embedding_updated_at__isnull=False,
        updated_at__gt=F('embedding_updated_at')
    ).count()

    return Response({
        'total_entities': total_entities,
        'entities_with_embeddings': entities_with_embeddings,
        'entities_without_embeddings': entities_without_embeddings,
        'stale_embeddings': stale_embeddings,
        'coverage_percentage': round((entities_with_embeddings / total_entities * 100), 2) if total_entities > 0 else 0,
    }, status=status.HTTP_200_OK)