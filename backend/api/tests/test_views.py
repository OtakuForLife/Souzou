from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from api.models import Entity
import json
import base64


class MediaEntityTestCase(APITestCase):
    """Test cases for media entity functionality"""

    def setUp(self):
        self.client = APIClient()

    def test_upload_image_file(self):
        """Test uploading an image file"""
        # Create a simple test image (1x1 PNG)
        png_data = base64.b64decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=='
        )

        uploaded_file = SimpleUploadedFile(
            "test_image.png",
            png_data,
            content_type="image/png"
        )

        response = self.client.post(
            reverse('entity-upload-file'),
            {
                'file': uploaded_file,
                'title': 'Test Image'
            },
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])

        # Check that entity was created
        entity_data = response.data['entity']
        self.assertEqual(entity_data['type'], 'media')
        self.assertEqual(entity_data['title'], 'Test Image')

        # Verify content structure
        content = json.loads(entity_data['content'])
        self.assertIn('data', content)
        self.assertIn('mimeType', content)
        self.assertIn('filename', content)
        self.assertIn('size', content)
        self.assertEqual(content['mimeType'], 'image/png')
        self.assertEqual(content['filename'], 'test_image.png')

    def test_upload_text_file(self):
        """Test uploading a text file"""
        text_content = "Hello, this is a test text file!"

        uploaded_file = SimpleUploadedFile(
            "test.txt",
            text_content.encode('utf-8'),
            content_type="text/plain"
        )

        response = self.client.post(
            reverse('entity-upload-file'),
            {
                'file': uploaded_file,
                'title': 'Test Text File'
            },
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])

        entity_data = response.data['entity']
        content = json.loads(entity_data['content'])

        # Decode and verify content
        decoded_content = base64.b64decode(content['data']).decode('utf-8')
        self.assertEqual(decoded_content, text_content)
        self.assertEqual(content['mimeType'], 'text/plain')

    def test_upload_file_too_large(self):
        """Test uploading a file that's too large"""
        # Create a file larger than 10MB
        large_content = b'x' * (11 * 1024 * 1024)  # 11MB

        uploaded_file = SimpleUploadedFile(
            "large_file.txt",
            large_content,
            content_type="text/plain"
        )

        response = self.client.post(
            reverse('entity-upload-file'),
            {
                'file': uploaded_file,
                'title': 'Large File'
            },
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertIn('too large', response.data['error'])

    def test_upload_no_file(self):
        """Test upload endpoint without providing a file"""
        response = self.client.post(
            reverse('entity-upload-file'),
            {'title': 'No File'},
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'No file provided')

    def test_download_media_file(self):
        """Test downloading a media file"""
        # First upload a file
        text_content = "Test download content"
        uploaded_file = SimpleUploadedFile(
            "download_test.txt",
            text_content.encode('utf-8'),
            content_type="text/plain"
        )

        upload_response = self.client.post(
            reverse('entity-upload-file'),
            {
                'file': uploaded_file,
                'title': 'Download Test'
            },
            format='multipart'
        )

        entity_id = upload_response.data['entity']['id']

        # Now download it
        download_response = self.client.get(
            reverse('entity-download-file', kwargs={'pk': entity_id})
        )

        self.assertEqual(download_response.status_code, status.HTTP_200_OK)
        self.assertEqual(download_response.content.decode('utf-8'), text_content)
        self.assertEqual(download_response['Content-Type'], 'text/plain')

    def test_download_non_media_entity(self):
        """Test trying to download from a non-media entity"""
        # Create a regular note entity
        entity = Entity.objects.create(
            type='note',
            title='Regular Note',
            content='This is not a media file'
        )

        response = self.client.get(
            reverse('entity-download-file', kwargs={'pk': entity.id})
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
        self.assertEqual(response.data['error'], 'Entity is not a media type')


def test_nothing():
    """A dummy test"""
    assert True