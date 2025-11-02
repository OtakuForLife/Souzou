"""
Celery tasks for background processing.

This module contains async tasks for:
- Lazy embedding generation
- Batch embedding updates
"""

from celery import shared_task
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, name='api.tasks.generate_embedding_for_entity')
def generate_embedding_for_entity(self, entity_id: str):
    """
    Generate embedding for a single entity.
    
    Args:
        entity_id: The ID of the entity to generate embedding for
        
    Returns:
        dict: Status information about the task
    """
    from api.models import Entity
    from api.services.vector_service import VectorService
    
    try:
        logger.info(f"Starting embedding generation for entity {entity_id}")
        
        # Get the entity
        try:
            entity = Entity.objects.get(id=entity_id)
        except Entity.DoesNotExist:
            logger.error(f"Entity {entity_id} not found")
            return {
                'status': 'error',
                'entity_id': entity_id,
                'error': 'Entity not found'
            }
        
        # Generate embedding
        vector_service = VectorService()
        
        # Combine title and content for embedding
        text_to_embed = f"{entity.title}\n\n{entity.content}"
        
        # Generate the embedding
        embedding = vector_service.generate_embedding(text_to_embed)
        
        # Store the embedding in the entity
        entity.embedding = embedding
        entity.embedding_updated_at = timezone.now()
        entity.save(update_fields=['embedding', 'embedding_updated_at'])
        
        logger.info(f"Successfully generated embedding for entity {entity_id}")
        
        return {
            'status': 'success',
            'entity_id': entity_id,
            'embedding_dimension': len(embedding) if embedding else 0,
            'updated_at': entity.embedding_updated_at.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to generate embedding for entity {entity_id}: {str(e)}")
        return {
            'status': 'error',
            'entity_id': entity_id,
            'error': str(e)
        }


@shared_task(bind=True, name='api.tasks.generate_embeddings_batch')
def generate_embeddings_batch(self, entity_ids: list[str]):
    """
    Generate embeddings for multiple entities in batch.
    
    Args:
        entity_ids: List of entity IDs to generate embeddings for
        
    Returns:
        dict: Summary of batch processing results
    """
    logger.info(f"Starting batch embedding generation for {len(entity_ids)} entities")
    
    results = {
        'total': len(entity_ids),
        'success': 0,
        'failed': 0,
        'errors': []
    }
    
    for entity_id in entity_ids:
        try:
            result = generate_embedding_for_entity(entity_id)
            if result['status'] == 'success':
                results['success'] += 1
            else:
                results['failed'] += 1
                results['errors'].append({
                    'entity_id': entity_id,
                    'error': result.get('error', 'Unknown error')
                })
        except Exception as e:
            results['failed'] += 1
            results['errors'].append({
                'entity_id': entity_id,
                'error': str(e)
            })
    
    logger.info(f"Batch embedding generation complete: {results['success']} success, {results['failed']} failed")
    
    return results


@shared_task(bind=True, name='api.tasks.regenerate_all_embeddings')
def regenerate_all_embeddings(self):
    """
    Regenerate embeddings for all entities.
    
    This is useful for:
    - Initial setup
    - Model upgrades
    - Fixing corrupted embeddings
    
    Returns:
        dict: Summary of regeneration results
    """
    from api.models import Entity
    
    logger.info("Starting full embedding regeneration")
    
    # Get all entity IDs
    entity_ids = list(Entity.objects.values_list('id', flat=True))
    
    logger.info(f"Found {len(entity_ids)} entities to process")
    
    # Use batch processing
    result = generate_embeddings_batch(entity_ids)
    
    logger.info(f"Full embedding regeneration complete: {result}")
    
    return result


@shared_task(bind=True, name='api.tasks.update_stale_embeddings')
def update_stale_embeddings(self, hours: int = 24):
    """
    Update embeddings for entities that have been modified but not re-indexed.
    
    Args:
        hours: Consider embeddings stale if entity was updated more than this many hours after embedding
        
    Returns:
        dict: Summary of update results
    """
    from api.models import Entity
    from datetime import timedelta
    
    logger.info(f"Checking for stale embeddings (older than {hours} hours)")
    
    # Find entities where:
    # 1. Embedding exists but is older than the entity's updated_at
    # 2. Or embedding doesn't exist at all
    cutoff_time = timezone.now() - timedelta(hours=hours)
    
    stale_entities = Entity.objects.filter(
        updated_at__gt=cutoff_time
    ).filter(
        # Either no embedding or embedding is older than entity
        embedding__isnull=True
    ) | Entity.objects.filter(
        updated_at__gt=cutoff_time,
        embedding_updated_at__lt=timezone.now() - timedelta(hours=hours)
    )
    
    entity_ids = list(stale_entities.values_list('id', flat=True))
    
    logger.info(f"Found {len(entity_ids)} entities with stale embeddings")
    
    if not entity_ids:
        return {
            'total': 0,
            'success': 0,
            'failed': 0,
            'message': 'No stale embeddings found'
        }
    
    # Use batch processing
    result = generate_embeddings_batch(entity_ids)
    
    logger.info(f"Stale embedding update complete: {result}")
    
    return result

