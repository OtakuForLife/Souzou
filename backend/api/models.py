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


class Tag(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=7, default="#6B7280")  # Hex color
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name="children")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['parent']),
        ]

    def __str__(self):
        return self.name


class EntityTag(models.Model):
    entity = models.ForeignKey('Entity', on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('entity', 'tag')
        indexes = [
            models.Index(fields=['entity']),
            models.Index(fields=['tag']),
        ]


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

    # Metadata field for custom properties
    metadata = models.JSONField(default=dict, blank=True, help_text="Custom metadata and properties stored as JSON")

    # Tags relationship
    tags = models.ManyToManyField(Tag, through=EntityTag, blank=True, related_name="entities")

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
# NOTE: Automatic embedding generation is disabled for performance
# Embeddings are now generated lazily on-demand (e.g., during semantic search)
@receiver(post_save, sender=Entity)
def update_embedding_on_save(sender, instance, created, **kwargs):
    """Track notes that need embedding updates (lazy generation)"""
    # Embedding generation moved to background tasks for better UX
    # See: tasks.py for async embedding generation
    pass


@receiver(post_delete, sender=Entity)
def remove_embedding_on_delete(sender, instance, **kwargs):
    """Clean up embedding when note is deleted"""
    # Embeddings are stored in the entity record, so they're automatically deleted
    # No additional cleanup needed
    pass