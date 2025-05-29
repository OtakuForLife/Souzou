from rest_framework import serializers
from .models import Entity, Theme



class EntitySerializer(serializers.ModelSerializer):

    #children = RecursiveNoteSerializer(many=True, read_only=True)

    class Meta:
        model = Entity
        fields = ["id", "type", "title", "content", "created_at", "parent", "children"]
        extra_kwargs = {"parent": {"required": False}, "children": {"required": False}}


class ThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Theme
        fields = ["id", "name", "type", "is_default", "colors", "created_at", "updated_at"]
        extra_kwargs = {
            "is_default": {"read_only": True},  # Only admin can set default themes
        }

    def validate_colors(self, value):
        """Validate that colors field has the required structure"""
        required_fields = [
            'primary', 'primaryHover', 'secondary', 'background', 'surface', 'surfaceHover'
        ]

        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f"Missing required color field: {field}")

        # Validate nested text colors
        if 'text' not in value:
            raise serializers.ValidationError("Missing required 'text' color object")

        text_fields = ['primary', 'secondary', 'muted', 'onPrimary']
        for field in text_fields:
            if field not in value['text']:
                raise serializers.ValidationError(f"Missing required text color field: text.{field}")

        return value
