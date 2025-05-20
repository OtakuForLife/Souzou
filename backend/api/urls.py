from django.urls import path, include
from .views import NoteViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'notes', NoteViewSet, basename='note')

urlpatterns = [
    path('', include(router.urls)),
]
