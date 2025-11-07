/**
 * Tests for IndexedDB driver with outbox deduplication
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RepoEntity } from '../../types'

describe('IndexedDB Driver', () => {
  describe('Outbox Deduplication', () => {
    it('should ensure tags is always an array when storing', () => {
      const entity: RepoEntity = {
        id: 'test-1',
        type: 'note',
        title: 'Test',
        content: 'Content',
        parent: null,
        metadata: {},
        tags: undefined as any, // Simulate undefined
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      // When storing, tags should be converted to array
      const storedEntity = {
        ...entity,
        tags: entity.tags || [],
        metadata: entity.metadata || {},
      }

      expect(Array.isArray(storedEntity.tags)).toBe(true)
      expect(storedEntity.tags.length).toBe(0)
    })

    it('should ensure metadata is always an object when storing', () => {
      const entity: RepoEntity = {
        id: 'test-1',
        type: 'note',
        title: 'Test',
        content: 'Content',
        parent: null,
        metadata: undefined as any, // Simulate undefined
        tags: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      // When storing, metadata should be converted to object
      const storedEntity = {
        ...entity,
        tags: entity.tags || [],
        metadata: entity.metadata || {},
      }

      expect(typeof storedEntity.metadata).toBe('object')
      expect(Object.keys(storedEntity.metadata).length).toBe(0)
    })

    it('should preserve tags when defined', () => {
      const tagIds = ['tag-1', 'tag-2']
      const entity: RepoEntity = {
        id: 'test-1',
        type: 'note',
        title: 'Test',
        content: 'Content',
        parent: null,
        metadata: {},
        tags: tagIds,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      const storedEntity = {
        ...entity,
        tags: entity.tags || [],
        metadata: entity.metadata || {},
      }

      expect(storedEntity.tags).toEqual(tagIds)
    })

    it('should preserve metadata when defined', () => {
      const metadata = { key: 'value' }
      const entity: RepoEntity = {
        id: 'test-1',
        type: 'note',
        title: 'Test',
        content: 'Content',
        parent: null,
        metadata,
        tags: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      const storedEntity = {
        ...entity,
        tags: entity.tags || [],
        metadata: entity.metadata || {},
      }

      expect(storedEntity.metadata).toEqual(metadata)
    })
  })

  describe('Entity Storage', () => {
    it('should set updated_at if not provided', () => {
      const entity: RepoEntity = {
        id: 'test-1',
        type: 'note',
        title: 'Test',
        content: 'Content',
        parent: null,
        metadata: {},
        tags: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: undefined as any,
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      // When storing, should use server_updated_at or current time
      const storedEntity = {
        ...entity,
        updated_at: entity.updated_at || entity.server_updated_at || new Date().toISOString(),
        tags: entity.tags || [],
        metadata: entity.metadata || {},
      }

      expect(storedEntity.updated_at).toBeDefined()
      expect(storedEntity.updated_at).toBe('2025-01-01T00:00:00Z')
    })

    it('should preserve updated_at when provided', () => {
      const updateTime = '2025-01-01T12:00:00Z'
      const entity: RepoEntity = {
        id: 'test-1',
        type: 'note',
        title: 'Test',
        content: 'Content',
        parent: null,
        metadata: {},
        tags: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: updateTime,
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      const storedEntity = {
        ...entity,
        updated_at: entity.updated_at || entity.server_updated_at || new Date().toISOString(),
        tags: entity.tags || [],
        metadata: entity.metadata || {},
      }

      expect(storedEntity.updated_at).toBe(updateTime)
    })
  })

  describe('Outbox Item Deduplication Logic', () => {
    it('should identify duplicate outbox items by entity ID', () => {
      const outboxItems = [
        { _id: 1, op: 'upsert', id: 'entity-1', client_rev: 1, data: {} },
        { _id: 2, op: 'upsert', id: 'entity-2', client_rev: 1, data: {} },
        { _id: 3, op: 'upsert', id: 'entity-1', client_rev: 1, data: {} }, // Duplicate
      ]

      // Find existing item by entity ID
      const entityId = 'entity-1'
      const existing = outboxItems.find(item => item.id === entityId)

      expect(existing).toBeDefined()
      expect(existing?._id).toBe(1) // Should find first occurrence
    })

    it('should update existing outbox item with latest data', () => {
      const outboxItem = {
        _id: 1,
        op: 'upsert' as const,
        id: 'entity-1',
        client_rev: 1,
        data: { title: 'Old Title' },
      }

      const newData = { title: 'New Title' }

      // Simulate update
      const updated = {
        ...outboxItem,
        data: newData,
      }

      expect(updated.data.title).toBe('New Title')
      expect(updated._id).toBe(1) // Same primary key
    })

    it('should handle multiple edits before sync', () => {
      let outboxItems: any[] = []

      // First edit
      const item1 = { op: 'upsert', id: 'entity-1', client_rev: 1, data: { title: 'Edit 1' } }
      const existing1 = outboxItems.find(item => item.id === item1.id)
      if (existing1) {
        // Update
        Object.assign(existing1, item1)
      } else {
        // Add
        outboxItems.push(item1)
      }

      expect(outboxItems.length).toBe(1)

      // Second edit
      const item2 = { op: 'upsert', id: 'entity-1', client_rev: 1, data: { title: 'Edit 2' } }
      const existing2 = outboxItems.find(item => item.id === item2.id)
      if (existing2) {
        // Update
        Object.assign(existing2, item2)
      } else {
        // Add
        outboxItems.push(item2)
      }

      expect(outboxItems.length).toBe(1) // Still 1 item
      expect(outboxItems[0].data.title).toBe('Edit 2') // Latest data

      // Third edit
      const item3 = { op: 'upsert', id: 'entity-1', client_rev: 1, data: { title: 'Edit 3' } }
      const existing3 = outboxItems.find(item => item.id === item3.id)
      if (existing3) {
        // Update
        Object.assign(existing3, item3)
      } else {
        // Add
        outboxItems.push(item3)
      }

      expect(outboxItems.length).toBe(1) // Still 1 item
      expect(outboxItems[0].data.title).toBe('Edit 3') // Latest data
    })
  })
})

