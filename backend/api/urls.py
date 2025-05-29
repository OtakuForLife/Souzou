from django.urls import path, include
from .views import EntityViewSet, ThemeViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'entities', EntityViewSet, basename='enity')
router.register(r'themes', ThemeViewSet, basename='theme')

urlpatterns = [
    path('', include(router.urls)),
]
