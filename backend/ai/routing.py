"""
WebSocket routing for AI streaming functionality
Following the Medium article pattern for Django Channels WebSocket routing
"""

from django.urls import re_path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    re_path(r'^ai/chat/$', ChatConsumer.as_asgi()),
]
