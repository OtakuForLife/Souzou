
from django.urls import path
from .views import AIViewSet

urlpatterns = [
    path('models/', AIViewSet.as_view({'get': 'models'}), name='models'),
    path('status/', AIViewSet.as_view({'get': 'status'}), name='status'),
    path('providers/', AIViewSet.as_view({'get': 'providers'}), name='providers'),
]