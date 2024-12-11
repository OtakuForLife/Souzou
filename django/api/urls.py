from django.urls import path
from . import views

urlpatterns = [
    path("notes/", views.NoteListCreate.as_view(), name="note-list"),
    path("notes/update/<uuid:pk>/", views.NoteUpdate.as_view(), name="update-note"),
    path("notes/delete/<uuid:pk>/", views.NoteDelete.as_view(), name="delete-note"),
]
