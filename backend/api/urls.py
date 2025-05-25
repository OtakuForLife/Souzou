from django.urls import path, include
from .views import NoteViewSet, ThemeViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'notes', NoteViewSet, basename='note')
router.register(r'themes', ThemeViewSet, basename='theme')

urlpatterns = [
    path('', include(router.urls)),
]
