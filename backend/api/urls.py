from django.urls import path, include
from .views import EntityViewSet, ThemeViewSet, TagViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'entities', EntityViewSet, basename='entity')
router.register(r'themes', ThemeViewSet, basename='theme')
router.register(r'tags', TagViewSet, basename='tag')

urlpatterns = [
    path('', include(router.urls)),
]
