from .models import Note
from .serializers import NoteSerializer
from rest_framework import viewsets

class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    queryset = Note.objects.all()