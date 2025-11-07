"""
Tests for sync push functionality with revision-based conflict detection.
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from api.models import Entity, Tag
from django.utils import timezone
import json


class SyncPushTestCase(TestCase):
    """Test cases for sync push endpoint"""

    def setUp(self):
        self.client = APIClient()
        self.entity1 = Entity.objects.create(
            type='note',
            title='Test Note 1',
            content='Content 1',
            rev=0
        )
        self.entity2 = Entity.objects.create(
            type='note',
            title='Test Note 2',
            content='Content 2',
            rev=0
        )
        self.tag1 = Tag.objects.create(name='tag1')

    def test_sync_push_update_success(self):
        """Test successful entity update via sync push"""
        payload = {
            'entities': [
                {
                    'op': 'upsert',
                    'id': str(self.entity1.id),
                    'client_rev': 1,  # server_rev (0) + 1
                    'data': {
                        'type': 'note',
                        'title': 'Updated Title',
                        'content': 'Updated Content',
                        'parent': None,
                        'metadata': {},
                        'tags': []
                    }
                }
            ],
            'tags': []
        }

        response = self.client.post(
            reverse('sync-push'),
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result = response.data['entities'][0]
        self.assertEqual(result['status'], 'applied')
        self.assertEqual(result['rev'], 1)

        # Verify entity was updated
        self.entity1.refresh_from_db()
        self.assertEqual(self.entity1.title, 'Updated Title')
        self.assertEqual(self.entity1.content, 'Updated Content')
        self.assertEqual(self.entity1.rev, 1)

    def test_sync_push_update_conflict(self):
        """Test update conflict when client_rev doesn't match expected"""
        # Set entity to rev 2
        self.entity1.rev = 2
        self.entity1.save()

        payload = {
            'entities': [
                {
                    'op': 'upsert',
                    'id': str(self.entity1.id),
                    'client_rev': 1,  # Wrong! Should be 3 (server_rev 2 + 1)
                    'data': {
                        'type': 'note',
                        'title': 'Conflicting Update',
                        'content': 'Conflicting Content',
                        'parent': None,
                        'metadata': {},
                        'tags': []
                    }
                }
            ],
            'tags': []
        }

        response = self.client.post(
            reverse('sync-push'),
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result = response.data['entities'][0]
        self.assertEqual(result['status'], 'conflict')
        self.assertIn('server', result)

        # Verify entity was NOT updated
        self.entity1.refresh_from_db()
        self.assertEqual(self.entity1.rev, 2)

    def test_sync_push_create_new_entity(self):
        """Test creating a new entity via sync push"""
        new_id = '12345678-1234-1234-1234-123456789012'
        payload = {
            'entities': [
                {
                    'op': 'upsert',
                    'id': new_id,
                    'client_rev': 0,  # New entity
                    'data': {
                        'type': 'note',
                        'title': 'New Note',
                        'content': 'New Content',
                        'parent': None,
                        'metadata': {},
                        'tags': []
                    }
                }
            ],
            'tags': []
        }

        response = self.client.post(
            reverse('sync-push'),
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result = response.data['entities'][0]
        self.assertEqual(result['status'], 'applied')
        self.assertEqual(result['rev'], 1)

        # Verify entity was created
        entity = Entity.objects.get(id=new_id)
        self.assertEqual(entity.title, 'New Note')
        self.assertEqual(entity.rev, 1)

    def test_sync_push_delete_entity(self):
        """Test deleting an entity via sync push"""
        payload = {
            'entities': [
                {
                    'op': 'delete',
                    'id': str(self.entity1.id),
                    'client_rev': 1,  # server_rev (0) + 1
                    'data': {}
                }
            ],
            'tags': []
        }

        response = self.client.post(
            reverse('sync-push'),
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result = response.data['entities'][0]
        self.assertEqual(result['status'], 'applied')
        self.assertEqual(result['rev'], 1)

        # Verify entity was marked as deleted
        self.entity1.refresh_from_db()
        self.assertTrue(self.entity1.deleted)
        self.assertIsNotNone(self.entity1.deleted_at)

    def test_sync_push_with_parent_relationship(self):
        """Test updating entity with parent relationship"""
        payload = {
            'entities': [
                {
                    'op': 'upsert',
                    'id': str(self.entity2.id),
                    'client_rev': 1,
                    'data': {
                        'type': 'note',
                        'title': 'Child Note',
                        'content': 'Content',
                        'parent': str(self.entity1.id),  # Set parent
                        'metadata': {},
                        'tags': []
                    }
                }
            ],
            'tags': []
        }

        response = self.client.post(
            reverse('sync-push'),
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result = response.data['entities'][0]
        self.assertEqual(result['status'], 'applied')

        # Verify parent relationship
        self.entity2.refresh_from_db()
        self.assertEqual(self.entity2.parent_id, self.entity1.id)

    def test_sync_push_with_tags(self):
        """Test updating entity with tags"""
        payload = {
            'entities': [
                {
                    'op': 'upsert',
                    'id': str(self.entity1.id),
                    'client_rev': 1,
                    'data': {
                        'type': 'note',
                        'title': 'Tagged Note',
                        'content': 'Content',
                        'parent': None,
                        'metadata': {},
                        'tags': [str(self.tag1.id)]
                    }
                }
            ],
            'tags': []
        }

        response = self.client.post(
            reverse('sync-push'),
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify tags were set
        self.entity1.refresh_from_db()
        self.assertIn(self.tag1, self.entity1.tags.all())

    def test_sync_push_multiple_entities(self):
        """Test pushing multiple entities at once"""
        payload = {
            'entities': [
                {
                    'op': 'upsert',
                    'id': str(self.entity1.id),
                    'client_rev': 1,
                    'data': {
                        'type': 'note',
                        'title': 'Updated 1',
                        'content': 'Content 1',
                        'parent': None,
                        'metadata': {},
                        'tags': []
                    }
                },
                {
                    'op': 'upsert',
                    'id': str(self.entity2.id),
                    'client_rev': 1,
                    'data': {
                        'type': 'note',
                        'title': 'Updated 2',
                        'content': 'Content 2',
                        'parent': None,
                        'metadata': {},
                        'tags': []
                    }
                }
            ],
            'tags': []
        }

        response = self.client.post(
            reverse('sync-push'),
            data=json.dumps(payload),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['entities']), 2)
        self.assertEqual(response.data['entities'][0]['status'], 'applied')
        self.assertEqual(response.data['entities'][1]['status'], 'applied')

