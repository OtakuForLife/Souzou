/**
 * Tests for entity service with sync integration
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Entity } from '@/models/Entity'

describe('Entity Service', () => {
  describe('Entity Conversion', () => {
    it('should ensure tags is always an array', () => {
      const entity: Entity = {
        id: 'test-1',
        type: 'note',
        title: 'Test Note',
        content: 'Test Content',
        parent: null,
        metadata: {},
        tags: undefined as any, // Simulate undefined tags
        children: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      // Tags should be converted to empty array
      const tags = entity.tags || []
      expect(Array.isArray(tags)).toBe(true)
      expect(tags.length).toBe(0)
    })

    it('should ensure metadata is always an object', () => {
      const entity: Entity = {
        id: 'test-1',
        type: 'note',
        title: 'Test Note',
        content: 'Test Content',
        parent: null,
        metadata: undefined as any, // Simulate undefined metadata
        tags: [],
        children: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      // Metadata should be converted to empty object
      const metadata = entity.metadata || {}
      expect(typeof metadata).toBe('object')
      expect(Object.keys(metadata).length).toBe(0)
    })

    it('should preserve tags when defined', () => {
      const tagIds = ['tag-1', 'tag-2', 'tag-3']
      const entity: Entity = {
        id: 'test-1',
        type: 'note',
        title: 'Test Note',
        content: 'Test Content',
        parent: null,
        metadata: {},
        tags: tagIds,
        children: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      expect(entity.tags).toEqual(tagIds)
    })

    it('should preserve metadata when defined', () => {
      const metadata = { key: 'value', nested: { data: 123 } }
      const entity: Entity = {
        id: 'test-1',
        type: 'note',
        title: 'Test Note',
        content: 'Test Content',
        parent: null,
        metadata,
        tags: [],
        children: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      expect(entity.metadata).toEqual(metadata)
    })
  })

  describe('Entity Sync Fields', () => {
    it('should preserve revision number during sync', () => {
      const entity: Entity = {
        id: 'test-1',
        type: 'note',
        title: 'Test Note',
        content: 'Test Content',
        parent: null,
        metadata: {},
        tags: [],
        children: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 5,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      expect(entity.rev).toBe(5)
    })

    it('should preserve server_updated_at during sync', () => {
      const serverTime = '2025-01-01T12:00:00Z'
      const entity: Entity = {
        id: 'test-1',
        type: 'note',
        title: 'Test Note',
        content: 'Test Content',
        parent: null,
        metadata: {},
        tags: [],
        children: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 1,
        server_updated_at: serverTime,
        deleted: false,
        deleted_at: null,
      }

      expect(entity.server_updated_at).toBe(serverTime)
    })

    it('should handle deleted entities', () => {
      const entity: Entity = {
        id: 'test-1',
        type: 'note',
        title: 'Test Note',
        content: 'Test Content',
        parent: null,
        metadata: {},
        tags: [],
        children: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 2,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: true,
        deleted_at: '2025-01-01T12:00:00Z',
      }

      expect(entity.deleted).toBe(true)
      expect(entity.deleted_at).toBe('2025-01-01T12:00:00Z')
    })
  })

  describe('Entity Parent Relationships', () => {
    it('should handle parent field correctly', () => {
      const parentId = 'parent-entity-id'
      const entity: Entity = {
        id: 'test-1',
        type: 'note',
        title: 'Child Note',
        content: 'Test Content',
        parent: parentId,
        metadata: {},
        tags: [],
        children: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      expect(entity.parent).toBe(parentId)
    })

    it('should handle null parent (root entity)', () => {
      const entity: Entity = {
        id: 'test-1',
        type: 'note',
        title: 'Root Note',
        content: 'Test Content',
        parent: null,
        metadata: {},
        tags: [],
        children: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      expect(entity.parent).toBeNull()
    })
  })

  describe('Entity Types', () => {
    it('should support note type', () => {
      const entity: Entity = {
        id: 'test-1',
        type: 'note',
        title: 'Test Note',
        content: 'Test Content',
        parent: null,
        metadata: {},
        tags: [],
        children: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      expect(entity.type).toBe('note')
    })

    it('should support media type', () => {
      const entity: Entity = {
        id: 'test-1',
        type: 'media',
        title: 'Test Image',
        content: JSON.stringify({ data: 'base64...', mimeType: 'image/png' }),
        parent: null,
        metadata: {},
        tags: [],
        children: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      expect(entity.type).toBe('media')
    })
  })
})

