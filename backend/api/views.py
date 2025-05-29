from .models import Entity, Theme
from .serializers import EntitySerializer, ThemeSerializer
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

class EntityViewSet(viewsets.ModelViewSet):
    serializer_class = EntitySerializer
    queryset = Entity.objects.all()


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