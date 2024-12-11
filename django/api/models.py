from django.db import models
from django.contrib.auth.models import User
import uuid

note_types = [("note", "Note"), ("template", "Template"), ("media", "Media")]

class Note(models.Model):
    id = models.UUIDField(primary_key = True, default = uuid.uuid4, editable = False)
    type = models.CharField(max_length=50, choices=note_types, default="note")
    title = models.CharField(max_length=100)
    content = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notes")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name="children")

    def __str__(self):
        return self.title
