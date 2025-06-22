from rest_framework import serializers
from .models import Entity, Theme, Tag, EntityTag


class TagSerializer(serializers.ModelSerializer):
    children_count = serializers.SerializerMethodField()
    entities_count = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = ["id", "name", "color", "description", "parent", "children_count", "entities_count", "created_at", "updated_at"]

    def get_children_count(self, obj):
        return obj.children.count()

    def get_entities_count(self, obj):
        return obj.entities.count()


class EntityTagSerializer(serializers.ModelSerializer):
    tag = TagSerializer(read_only=True)

    class Meta:
        model = EntityTag
        fields = ["tag", "created_at"]


class EntitySerializer(serializers.ModelSerializer):
    # Return tag IDs instead of full Tag objects
    tags = serializers.SerializerMethodField()
    tag_ids = serializers.ListField(child=serializers.UUIDField(), write_only=True, required=False)

    #children = RecursiveNoteSerializer(many=True, read_only=True)

    class Meta:
        model = Entity
        fields = ["id", "type", "title", "content", "created_at", "parent", "children", "tags", "tag_ids", "metadata"]
        extra_kwargs = {"parent": {"required": False}, "children": {"required": False}}

    def get_tags(self, obj):
        """Return list of tag IDs instead of full Tag objects"""
        return [str(tag.id) for tag in obj.tags.all()]

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        instance = super().update(instance, validated_data)

        if tag_ids is not None:
            instance.tags.set(tag_ids)

        return instance


class ThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Theme
        fields = ["id", "name", "type", "colors", "created_at", "updated_at"]

    def validate_colors(self, value):
        """
        #Validate that colors field has the required structure
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
        """
        return value
