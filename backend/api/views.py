from .models import Entity, Theme, Tag
from .serializers import EntitySerializer, ThemeSerializer, TagSerializer
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .services.vector_service import VectorService
import logging

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
