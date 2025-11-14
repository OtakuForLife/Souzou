"""
Tests for sync pull functionality with cursor-based incremental sync.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from api.models import Entity, Tag
from django.utils import timezone
from datetime import timedelta
import json


class SyncPullTestCase(TestCase):
    """Test cases for sync pull endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.now = timezone.now()
        
        # Create test entities with different timestamps
        self.entity1 = Entity.objects.create(
            type='note',
            title='Old Note',
            content='Old Content',
            rev=1,
            server_updated_at=self.now - timedelta(hours=1)
        )
        
        self.entity2 = Entity.objects.create(
            type='note',
            title='Recent Note',
            content='Recent Content',
            rev=2,
            server_updated_at=self.now - timedelta(minutes=5)
        )
        
        self.entity3 = Entity.objects.create(
            type='note',
            title='Very Recent Note',
            content='Very Recent Content',
            rev=1,
            server_updated_at=self.now
        )

    def test_sync_pull_all_entities(self):
        """Test pulling all entities when no cursor provided"""
        response = self.client.get(reverse('sync-pull'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        
        self.assertIn('cursor', data)
        self.assertIn('changes', data)
        self.assertIn('entities', data['changes'])
        
        entities = data['changes']['entities']['upserts']
        self.assertEqual(len(entities), 3)

    def test_sync_pull_with_cursor(self):
        """Test pulling only entities updated since cursor"""
        # Pull all entities first to get a baseline
        response_all = self.client.get(reverse('sync-pull'))
        self.assertEqual(response_all.status_code, status.HTTP_200_OK)
        all_entities = response_all.data['changes']['entities']['upserts']
        self.assertEqual(len(all_entities), 3)

        # Now use the cursor from the first pull as the new cursor
        # This should return no entities since nothing has changed
        cursor = response_all.data['cursor']

        response = self.client.get(
            reverse('sync-pull'),
            {'since': cursor}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        entities = response.data['changes']['entities']['upserts']

        # Should get no entities since nothing changed after the cursor
        self.assertEqual(len(entities), 0)

    def test_sync_pull_deleted_entities(self):
        """Test pulling deleted entities"""
        # Mark entity1 as deleted
        self.entity1.deleted = True
        self.entity1.deleted_at = self.now
        self.entity1.save()

        response = self.client.get(reverse('sync-pull'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        deletes = data['changes']['entities']['deletes']
        self.assertEqual(len(deletes), 1)
        # deletes is a list of ID strings, not objects
        self.assertEqual(deletes[0], str(self.entity1.id))

    def test_sync_pull_with_parent_relationships(self):
        """Test pulling entities with parent relationships"""
        # Create parent-child relationship
        self.entity2.parent = self.entity1
        self.entity2.save()
        
        response = self.client.get(reverse('sync-pull'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        entities = response.data['changes']['entities']['upserts']
        
        # Find entity2 in response
        entity2_data = next(e for e in entities if e['id'] == str(self.entity2.id))
        self.assertEqual(entity2_data['parent'], str(self.entity1.id))

    def test_sync_pull_with_tags(self):
        """Test pulling entities with tags"""
        tag = Tag.objects.create(name='test-tag')
        self.entity1.tags.add(tag)
        
        response = self.client.get(reverse('sync-pull'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        entities = response.data['changes']['entities']['upserts']
        
        # Find entity1 in response
        entity1_data = next(e for e in entities if e['id'] == str(self.entity1.id))
        self.assertIn(str(tag.id), entity1_data['tags'])

    def test_sync_pull_cursor_format(self):
        """Test that returned cursor is in ISO format"""
        response = self.client.get(reverse('sync-pull'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cursor = response.data['cursor']
        
        # Should be parseable as ISO format
        try:
            timezone.datetime.fromisoformat(cursor.replace('Z', '+00:00'))
        except ValueError:
            self.fail(f"Cursor '{cursor}' is not in ISO format")

    def test_sync_pull_empty_result(self):
        """Test pulling with cursor after all entities"""
        future_cursor = (self.now + timedelta(hours=1)).isoformat()
        
        response = self.client.get(
            reverse('sync-pull'),
            {'since': future_cursor}
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        entities = response.data['changes']['entities']['upserts']
        self.assertEqual(len(entities), 0)

    def test_sync_pull_includes_metadata(self):
        """Test that pulled entities include metadata"""
        self.entity1.metadata = {'key': 'value', 'nested': {'data': 123}}
        self.entity1.save()
        
        response = self.client.get(reverse('sync-pull'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        entities = response.data['changes']['entities']['upserts']
        
        entity1_data = next(e for e in entities if e['id'] == str(self.entity1.id))
        self.assertEqual(entity1_data['metadata'], self.entity1.metadata)

    def test_sync_pull_includes_revision(self):
        """Test that pulled entities include revision numbers"""
        response = self.client.get(reverse('sync-pull'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        entities = response.data['changes']['entities']['upserts']
        
        for entity in entities:
            self.assertIn('rev', entity)
            self.assertGreaterEqual(entity['rev'], 0)

    def test_sync_pull_tags_endpoint(self):
        """Test pulling tags"""
        tag1 = Tag.objects.create(name='tag1')
        tag2 = Tag.objects.create(name='tag2')
        
        response = self.client.get(reverse('sync-pull'))
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tags = response.data['changes']['tags']['upserts']
        
        self.assertEqual(len(tags), 2)
        tag_names = [t['name'] for t in tags]
        self.assertIn('tag1', tag_names)
        self.assertIn('tag2', tag_names)

