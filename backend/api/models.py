import uuid
from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

class EntityType(models.TextChoices):
    NOTE = "note", "Note"
    TEMPLATE = "template", "Template"
    MEDIA = "media", "Media"
    VIEW = "view", "View"
    WIDGET = "widget", "Widget"
    KANBAN = "kanban", "Kanban"
    CALENDAR = "calendar", "Calendar"
    CANVAS = "canvas", "Canvas"
    AI_CHAT_HISTORY = "ai_chat_history", "AI Chat History"


class Entity(models.Model):
    id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)
    type = models.CharField(max_length=50, choices=EntityType.choices, default=EntityType.NOTE)
    title = models.CharField(max_length=100, blank=False)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name="children", editable=True)

    # Vector fields for semantic search
    embedding = models.JSONField(null=True, blank=True, help_text="Vector embedding for semantic search")
    embedding_model = models.CharField(max_length=100, null=True, blank=True, help_text="Model used for embedding")
    embedding_updated_at = models.DateTimeField(null=True, blank=True, help_text="When embedding was last updated")

    class Meta:
        indexes = [
            models.Index(fields=['type']),
            models.Index(fields=['parent']),
            models.Index(fields=['updated_at']),
            models.Index(fields=['embedding_updated_at']),
        ]

    def __str__(self):
        return self.title


class ThemeType(models.TextChoices):
    PREDEFINED = "predefined", "Predefined"
    CUSTOM = "custom", "Custom"


class Theme(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, blank=False)
    type = models.CharField(max_length=20, choices=ThemeType.choices, default=ThemeType.PREDEFINED)
    colors = models.JSONField()  # Store theme colors as JSON
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    class Meta:
        ordering = ['type', 'name']

    def __str__(self):
        return f"{self.name} ({self.type})"


# Signal handlers for automatic vector indexing
@receiver(post_save, sender=Entity)
def update_embedding_on_save(sender, instance, created, **kwargs):
    """Automatically update embedding when note content changes"""
    if instance.type == EntityType.NOTE:
        # Check if this is a new note or content has changed
        should_reindex = (
            created or  # New note
            not instance.embedding or  # No embedding yet
            not instance.embedding_updated_at or  # Never indexed
            instance.updated_at > instance.embedding_updated_at  # Content newer than embedding
        )

        if should_reindex:
            try:
                from .services.vector_service import VectorService
                vector_service = VectorService()

                # Generate embedding in background (non-blocking)
                # In production, this could be moved to a task queue
                vector_service.index_note(instance)

            except Exception as e:
                logger.error(f"Failed to update embedding for note {instance.id}: {e}")


@receiver(post_delete, sender=Entity)
def remove_embedding_on_delete(sender, instance, **kwargs):
    """Clean up when note is deleted"""
    if instance.type == EntityType.NOTE:
        try:
            from .services.vector_service import VectorService
            vector_service = VectorService()
            vector_service.remove_note(str(instance.id))
        except Exception as e:
            logger.error(f"Failed to remove embedding for deleted note {instance.id}: {e}")