from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Note


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        print(validated_data)
        user = User.objects.create_user(**validated_data)
        return user

""" class RecursiveNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ["id", "title", "content", "created_at", "children"]
        extra_kwargs = {"children": {"required": False}}

    children = serializers.SerializerMethodField()

    def get_children(self, obj):
        if obj.children.exists():
            return RecursiveNoteSerializer(obj.children.all(), many=True).data
        return None """

class NoteSerializer(serializers.ModelSerializer):

    #children = RecursiveNoteSerializer(many=True, read_only=True)

    class Meta:
        model = Note
        fields = ["id", "type", "title", "content", "created_at", "author", "parent", "children"]
        extra_kwargs = {"author": {"read_only": True}, "parent": {"required": False}, "children": {"required": False}}
