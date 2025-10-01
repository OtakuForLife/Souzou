from .models import Entity, Theme, Tag
from .serializers import EntitySerializer, ThemeSerializer, TagSerializer
from .serializers import SyncEntitySerializer, SyncTagSerializer
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.utils.dateparse import parse_datetime
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

            from .services.vector_service import VectorService
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
            from .services.vector_service import VectorService
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
            return Response({"detail": "Default theme not set"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Failed to get default theme: {e}")
            return Response({"success": False, "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SyncPullView(APIView):
    """Return changes since a cursor (ISO timestamp)."""
    def get(self, request):
        since = request.query_params.get('since')
        try:
            since_dt = parse_datetime(since) if since else None
        except Exception:
            since_dt = None

        if since_dt is None:
            # If no cursor provided, start from epoch so client gets all data
            import datetime as dt
            since_dt = dt.datetime(1970, 1, 1, tzinfo=dt.timezone.utc)

        # Entities
        entity_upserts_qs = Entity.objects.filter(server_updated_at__gt=since_dt, deleted=False)
        entity_deletes_qs = Entity.objects.filter(server_updated_at__gt=since_dt, deleted=True)
        entities_upserts = SyncEntitySerializer(entity_upserts_qs, many=True).data
        entities_deletes = [str(eid) for eid in entity_deletes_qs.values_list('id', flat=True)]

        # Tags
        tag_upserts_qs = Tag.objects.filter(server_updated_at__gt=since_dt, deleted=False)
        tag_deletes_qs = Tag.objects.filter(server_updated_at__gt=since_dt, deleted=True)
        tags_upserts = SyncTagSerializer(tag_upserts_qs, many=True).data
        tags_deletes = [str(tid) for tid in tag_deletes_qs.values_list('id', flat=True)]

        new_cursor = timezone.now().isoformat()
        return Response({
            "cursor": new_cursor,
            "changes": {
                "entities": {"upserts": entities_upserts, "deletes": entities_deletes},
                "tags": {"upserts": tags_upserts, "deletes": tags_deletes},
            },
        })


class SyncPushView(APIView):
    """Apply client changes with basic rev-based conflict detection."""
    def post(self, request):
        payload = request.data or {}
        results = {"entities": [], "tags": []}

        def serialize_entity(o):
            return SyncEntitySerializer(o).data

        def serialize_tag(o):
            return SyncTagSerializer(o).data

        def apply_upsert(model_cls, item, serialize):
            obj_id = item.get('id') or (item.get('data') or {}).get('id')
            client_rev = item.get('client_rev', 0)
            op = item.get('op', 'upsert')
            data = item.get('data', {})

            if not obj_id:
                return {"status": "error", "error": "missing id"}

            try:
                obj = model_cls.objects.select_for_update().get(id=obj_id)
                server_rev = obj.rev
                if op == 'delete':
                    if client_rev == server_rev:
                        obj.deleted = True
                        obj.deleted_at = timezone.now()
                        obj.rev = server_rev + 1
                        obj.save()
                        return {"id": str(obj.id), "status": "applied", "rev": obj.rev, "server_updated_at": obj.server_updated_at}
                    else:
                        return {"id": str(obj.id), "status": "conflict", "server": serialize(obj)}
                else:
                    if client_rev == server_rev:
                        for k, v in data.items():
                            setattr(obj, k, v)
                        obj.rev = server_rev + 1
                        obj.save()
                        return {"id": str(obj.id), "status": "applied", "rev": obj.rev, "server_updated_at": obj.server_updated_at}
                    else:
                        return {"id": str(obj.id), "status": "conflict", "server": serialize(obj)}
            except model_cls.DoesNotExist:
                if op == 'delete':
                    return {"id": str(obj_id), "status": "applied", "rev": 0}
                obj = model_cls(id=obj_id, **data)
                obj.rev = 1 if client_rev == 0 else client_rev + 1
                obj.save()
                return {"id": str(obj.id), "status": "applied", "rev": obj.rev, "server_updated_at": obj.server_updated_at}

        for item in payload.get('entities', []):
            results['entities'].append(apply_upsert(Entity, item, serialize_entity))

        for item in payload.get('tags', []):
            results['tags'].append(apply_upsert(Tag, item, serialize_tag))

        return Response(results)

