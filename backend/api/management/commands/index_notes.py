"""
Management command to index all existing notes in vector database

Usage:
    python manage.py index_notes
    python manage.py index_notes --force  # Re-index all notes even if already indexed
"""

from django.core.management.base import BaseCommand, CommandError
from api.models import Entity, EntityType
from api.services.vector_service import VectorService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Index all existing notes in vector database for semantic search'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Re-index all notes even if they already have embeddings',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=50,
            help='Number of notes to process in each batch (default: 50)',
        )

    def handle(self, *args, **options):
        try:
            vector_service = VectorService()
            force_reindex = options['force']
            batch_size = options['batch_size']
            
            # Get notes to index
            if force_reindex:
                notes_query = Entity.objects.filter(type=EntityType.NOTE)
                self.stdout.write(
                    self.style.WARNING('Force re-indexing all notes...')
                )
            else:
                notes_query = Entity.objects.filter(
                    type=EntityType.NOTE,
                    embedding__isnull=True
                )
                self.stdout.write('Indexing notes without embeddings...')
            
            total_notes = notes_query.count()
            
            if total_notes == 0:
                self.stdout.write(
                    self.style.SUCCESS('No notes need indexing.')
                )
                return
            
            self.stdout.write(f'Found {total_notes} notes to index.')
            
            # Process notes in batches
            indexed_count = 0
            failed_count = 0
            
            for i in range(0, total_notes, batch_size):
                batch_notes = notes_query[i:i + batch_size]
                
                self.stdout.write(f'Processing batch {i//batch_size + 1}...')
                
                for note in batch_notes:
                    try:
                        if vector_service.index_note(note):
                            indexed_count += 1
                            if indexed_count % 10 == 0:
                                self.stdout.write(f'  Indexed {indexed_count}/{total_notes} notes...')
                        else:
                            failed_count += 1
                            self.stdout.write(
                                self.style.WARNING(f'  Failed to index note: {note.title} (ID: {note.id})')
                            )
                    except Exception as e:
                        failed_count += 1
                        self.stdout.write(
                            self.style.ERROR(f'  Error indexing note {note.title}: {e}')
                        )
            
            # Print summary
            self.stdout.write('\n' + '='*50)
            self.stdout.write(f'Indexing completed!')
            self.stdout.write(f'Successfully indexed: {indexed_count} notes')
            if failed_count > 0:
                self.stdout.write(
                    self.style.WARNING(f'Failed to index: {failed_count} notes')
                )
            
            # Print vector stats
            stats = vector_service.get_stats()
            self.stdout.write('\nVector Index Statistics:')
            self.stdout.write(f'  Total notes: {stats.get("total_notes", 0)}')
            self.stdout.write(f'  Indexed notes: {stats.get("indexed_notes", 0)}')
            self.stdout.write(f'  Coverage: {stats.get("index_coverage", 0):.1%}')
            self.stdout.write(f'  Database: {stats.get("database_type", "Unknown")}')
            self.stdout.write(f'  Model: {stats.get("embedding_model", "Unknown")}')
            
            if indexed_count > 0:
                self.stdout.write(
                    self.style.SUCCESS(f'\nSuccessfully indexed {indexed_count} notes!')
                )
            
        except Exception as e:
            logger.error(f"Index command failed: {e}")
            raise CommandError(f'Failed to index notes: {e}')
