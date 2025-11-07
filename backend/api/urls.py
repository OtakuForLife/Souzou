from django.urls import path, include
from .views import (
    EntityViewSet, ThemeViewSet, TagViewSet,
    generate_entity_embedding,
    generate_batch_embeddings,
    regenerate_all,
    update_stale,
    embedding_status,
    embedding_stats,
    health_check,
    SyncPullView,
    SyncPushView
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'entities', EntityViewSet, basename='entity')
router.register(r'themes', ThemeViewSet, basename='theme')
router.register(r'tags', TagViewSet, basename='tag')

urlpatterns = [
    path('', include(router.urls)),
    # Health check endpoint
    path('health/', health_check, name='health-check'),
    # Embedding management endpoints
    path('entities/<uuid:entity_id>/generate-embedding/', generate_entity_embedding, name='generate-entity-embedding'),
    path('entities/<uuid:entity_id>/embedding-status/', embedding_status, name='embedding-status'),
    path('embeddings/generate-batch/', generate_batch_embeddings, name='generate-batch-embeddings'),
    path('embeddings/regenerate-all/', regenerate_all, name='regenerate-all-embeddings'),
    path('embeddings/update-stale/', update_stale, name='update-stale-embeddings'),
    path('embeddings/stats/', embedding_stats, name='embedding-stats'),

    path('sync/pull', SyncPullView.as_view(), name='sync-pull'),
    path('sync/push', SyncPushView.as_view(), name='sync-push'),
]
