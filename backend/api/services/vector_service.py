"""
Vector Service for semantic search functionality

Handles vector embeddings for notes using sentence transformers.
Works with both SQLite (development) and PostgreSQL (production).
"""

from django.db import connection
from django.conf import settings
from django.utils import timezone
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Tuple, Optional
import json
import logging

logger = logging.getLogger(__name__)


class VectorService:
    """Service for handling vector embeddings and semantic search"""
    
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.is_postgresql = 'postgresql' in settings.DATABASES['default']['ENGINE']
        logger.info(f"VectorService initialized with {'PostgreSQL' if self.is_postgresql else 'SQLite'}")
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for text
        
        Args:
            text: Text to embed
            
        Returns:
            List of floats representing the embedding vector
        """
        try:
            embedding = self.model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    def index_note(self, note) -> bool:
        """
        Generate and store embedding for a note
        
        Args:
            note: Entity instance to index
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Import here to avoid circular imports
            from ..models import Entity, EntityType
            
            if note.type != EntityType.NOTE:
                return False
                
            # Create content for embedding (title + content)
            content_for_embedding = f"{note.title}\n{note.content}".strip()
            
            if not content_for_embedding:
                logger.warning(f"Note {note.id} has no content to embed")
                return False
            
            # Generate embedding
            embedding = self.generate_embedding(content_for_embedding)
            
            # Update note with embedding
            Entity.objects.filter(id=note.id).update(
                embedding=embedding,
                embedding_model="all-MiniLM-L6-v2",
                embedding_updated_at=timezone.now()
            )
            
            logger.info(f"Successfully indexed note {note.id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to index note {note.id}: {e}")
            return False
    
    def remove_note(self, note_id: str) -> bool:
        """
        Remove note embedding from index
        
        Args:
            note_id: ID of note to remove
            
        Returns:
            True if successful, False otherwise
        """
        try:
            from ..models import Entity
            
            Entity.objects.filter(id=note_id).update(
                embedding=None,
                embedding_model=None,
                embedding_updated_at=None
            )
            
            logger.info(f"Successfully removed note {note_id} from index")
            return True
            
        except Exception as e:
            logger.error(f"Failed to remove note {note_id} from index: {e}")
            return False
    
    def find_similar_notes(self, query_text: str, limit: int = 5, threshold: float = 0.8, exclude_ids: Optional[List[str]] = None):
        """
        Find similar notes using appropriate method for current database
        
        Args:
            query_text: Text to search for
            limit: Maximum number of results
            threshold: Minimum similarity threshold (0.0 to 1.0)
            exclude_ids: List of note IDs to exclude from results
            
        Returns:
            List of Entity objects
        """
        try:
            query_embedding = self.generate_embedding(query_text)
            exclude_ids = exclude_ids or []
            
            if self.is_postgresql:
                return self._find_similar_postgresql(query_embedding, limit, threshold, exclude_ids)
            else:
                return self._find_similar_sqlite(query_embedding, limit, threshold, exclude_ids)
                
        except Exception as e:
            logger.error(f"Failed to find similar notes: {e}")
            return []
    
    def _find_similar_postgresql(self, query_embedding: List[float], limit: int, threshold: float, exclude_ids: List[str]):
        """Use pgvector for PostgreSQL (future implementation)"""
        # For now, fall back to SQLite method
        # TODO: Implement pgvector when available in production
        return self._find_similar_sqlite(query_embedding, limit, threshold, exclude_ids)
    
    def _find_similar_sqlite(self, query_embedding: List[float], limit: int, threshold: float, exclude_ids: List[str]):
        """Use cosine similarity for SQLite"""
        from ..models import Entity, EntityType
        
        # Get all notes with embeddings
        notes_query = Entity.objects.filter(
            type=EntityType.NOTE,
            embedding__isnull=False
        )
        
        if exclude_ids:
            notes_query = notes_query.exclude(id__in=exclude_ids)
        
        notes_with_embeddings = notes_query.all()
        
        similarities = []
        for note in notes_with_embeddings:
            if note.embedding:
                try:
                    similarity = self._cosine_similarity(query_embedding, note.embedding)
                    if similarity >= threshold:
                        similarities.append((note, similarity))
                except Exception as e:
                    logger.warning(f"Failed to calculate similarity for note {note.id}: {e}")
                    continue
        
        # Sort by similarity and return top results
        similarities.sort(key=lambda x: x[1], reverse=True)
        return [note for note, _ in similarities[:limit]]
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            vec1_np = np.array(vec1)
            vec2_np = np.array(vec2)
            
            # Handle zero vectors
            norm1 = np.linalg.norm(vec1_np)
            norm2 = np.linalg.norm(vec2_np)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            return np.dot(vec1_np, vec2_np) / (norm1 * norm2)
        except Exception as e:
            logger.error(f"Failed to calculate cosine similarity: {e}")
            return 0.0
    
    def find_relevant_context(self, conversation_history: List[str], current_note_id: Optional[str] = None, max_notes: int = 10):
        """
        Find relevant notes for AI context based on conversation history

        Args:
            conversation_history: List of recent conversation messages
            current_note_id: ID of currently open note
            max_notes: Maximum number of notes to return

        Returns:
            List of Entity objects representing relevant context
        """
        try:
            logger.info("=== VECTOR SERVICE FIND_RELEVANT_CONTEXT ===")
            logger.info(f"Conversation history: {conversation_history}")
            logger.info(f"Current note ID: {current_note_id}")
            logger.info(f"Max notes: {max_notes}")

            # Combine recent conversation messages for context
            conversation_text = " ".join(conversation_history[-3:]) if conversation_history else ""
            logger.info(f"Combined conversation text: {conversation_text}")

            if not conversation_text and not current_note_id:
                logger.info("No conversation text or current note ID - returning empty context")
                return []

            exclude_ids = [current_note_id] if current_note_id else []
            logger.info(f"Excluding note IDs: {exclude_ids}")

            # Find semantically similar notes
            if conversation_text:
                logger.info(f"Searching for similar notes with query: '{conversation_text}'")
                similar_notes = self.find_similar_notes(
                    query_text=conversation_text,
                    limit=max_notes,
                    threshold=0.3,  # Temporarily lowered for debugging
                    exclude_ids=exclude_ids
                )
                logger.info(f"Found {len(similar_notes)} similar notes from conversation")
            else:
                logger.info("No conversation text - skipping similarity search")
                similar_notes = []
            
            # If we have a current note, also find notes similar to it
            if current_note_id and len(similar_notes) < max_notes:
                logger.info(f"Looking for notes similar to current note: {current_note_id}")
                from ..models import Entity
                try:
                    current_note = Entity.objects.get(id=current_note_id)
                    if current_note.content:
                        logger.info(f"Finding notes similar to current note content: {current_note.title}")
                        content_similar = self.find_similar_notes(
                            query_text=f"{current_note.title}\n{current_note.content}",
                            limit=max_notes - len(similar_notes),
                            threshold=0.3,  # Temporarily lowered for debugging
                            exclude_ids=exclude_ids + [note.id for note in similar_notes]
                        )
                        logger.info(f"Found {len(content_similar)} notes similar to current note")
                        similar_notes.extend(content_similar)
                    else:
                        logger.info("Current note has no content to search with")
                except Entity.DoesNotExist:
                    logger.warning(f"Current note not found: {current_note_id}")

            final_notes = similar_notes[:max_notes]
            logger.info(f"Returning {len(final_notes)} total context notes:")
            for i, note in enumerate(final_notes):
                logger.info(f"  {i+1}. {note.title} (ID: {note.id})")

            logger.info("=== VECTOR SERVICE CONTEXT COMPLETE ===")
            return final_notes
            
        except Exception as e:
            logger.error(f"Failed to find relevant context: {e}")
            logger.error("=== VECTOR SERVICE CONTEXT ERROR ===")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return []
    
    def get_stats(self) -> dict:
        """Get statistics about the vector index"""
        try:
            from ..models import Entity, EntityType
            
            total_notes = Entity.objects.filter(type=EntityType.NOTE).count()
            indexed_notes = Entity.objects.filter(
                type=EntityType.NOTE,
                embedding__isnull=False
            ).count()
            
            return {
                'total_notes': total_notes,
                'indexed_notes': indexed_notes,
                'index_coverage': indexed_notes / total_notes if total_notes > 0 else 0,
                'database_type': 'PostgreSQL' if self.is_postgresql else 'SQLite',
                'embedding_model': 'all-MiniLM-L6-v2'
            }
        except Exception as e:
            logger.error(f"Failed to get vector stats: {e}")
            return {}
