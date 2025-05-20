from rest_framework import serializers
from .models import Note



class NoteSerializer(serializers.ModelSerializer):

    #children = RecursiveNoteSerializer(many=True, read_only=True)

    class Meta:
        model = Note
        fields = ["id", "type", "title", "content", "created_at", "parent", "children"]
        extra_kwargs = {"parent": {"required": False}, "children": {"required": False}}
