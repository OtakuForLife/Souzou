import uuid
from django.db import models

class NoteType(models.TextChoices):
    NOTE = "note", "Note"
    TEMPLATE = "template", "Template"
    MEDIA = "media", "Media"
    FILE = "file", "File"


class Note(models.Model):
    id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)
    type = models.CharField(max_length=50, choices=NoteType.choices, default=NoteType.NOTE)
    title = models.CharField(max_length=100, blank=False)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name="children", editable=True)

    def __str__(self):
        return self.title


class ThemeType(models.TextChoices):
    PREDEFINED = "predefined", "Predefined"
    CUSTOM = "custom", "Custom"


class Theme(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, blank=False)
    type = models.CharField(max_length=20, choices=ThemeType.choices, default=ThemeType.PREDEFINED)
    is_default = models.BooleanField(default=False)
    colors = models.JSONField()  # Store theme colors as JSON
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, editable=False)

    class Meta:
        ordering = ['type', 'name']

    def __str__(self):
        return f"{self.name} ({self.type})"