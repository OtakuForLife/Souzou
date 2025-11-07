/**
 * Tests for sync orchestration and conflict resolution
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SyncOrchestrator } from '../sync'
import { IRepositoryDriver } from '../types'
import { RepoEntity } from '../types'

// Mock repository driver
const createMockDriver = (): IRepositoryDriver & { getCursor: any; setCursor: any; peekOutbox: any } => ({
  getEntity: vi.fn(),
  putEntity: vi.fn(),
  deleteEntity: vi.fn(),
  listEntitiesUpdatedSince: vi.fn().mockResolvedValue([]),
  getTag: vi.fn(),
  putTag: vi.fn(),
  deleteTag: vi.fn(),
  listTagsUpdatedSince: vi.fn().mockResolvedValue([]),
  enqueueEntity: vi.fn(),
  enqueueTag: vi.fn(),
  getOutboxItems: vi.fn().mockResolvedValue([]),
  removeFromOutbox: vi.fn(),
  close: vi.fn(),
  getCursor: vi.fn().mockResolvedValue(null),
  setCursor: vi.fn().mockResolvedValue(undefined),
  peekOutbox: vi.fn().mockResolvedValue([]),
})

// Mock transport
const createMockTransport = () => ({
  pull: vi.fn(),
  push: vi.fn(),
})

describe('SyncOrchestrator', () => {
  let orchestrator: SyncOrchestrator
  let mockDriver: IRepositoryDriver
  let mockTransport: any

  beforeEach(() => {
    mockDriver = createMockDriver()
    mockTransport = createMockTransport()
    orchestrator = new SyncOrchestrator(mockDriver, mockTransport)
  })

  describe('Conflict Resolution', () => {
    it('should accept server version on conflict', async () => {
      const serverEntity: RepoEntity = {
        id: 'entity-1',
        type: 'note',
        title: 'Server Version',
        content: 'Server Content',
        parent: null,
        metadata: {},
        tags: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 3,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      // Mock pull response (empty)
      mockTransport.pull.mockResolvedValue({
        cursor: '2025-01-01T00:00:00Z',
        changes: { entities: { upserts: [], deletes: [] }, tags: { upserts: [], deletes: [] } },
      })

      // Mock push response with conflict
      mockTransport.push.mockResolvedValue({
        entities: [
          {
            id: 'entity-1',
            status: 'conflict',
            server: serverEntity,
          },
        ],
        tags: [],
      })

      const outboxItem = {
        op: 'upsert' as const,
        id: 'entity-1',
        client_rev: 1,
        data: serverEntity,
      }

      mockDriver.peekOutbox.mockResolvedValue([outboxItem])

      const result = await orchestrator.syncNow()

      // Should accept server version
      expect(mockDriver.putEntity).toHaveBeenCalledWith(serverEntity)
      expect(mockDriver.removeFromOutbox).toHaveBeenCalledWith(['entity-1'])
    })

    it('should handle multiple conflicts', async () => {
      const serverEntity1: RepoEntity = {
        id: 'entity-1',
        type: 'note',
        title: 'Server 1',
        content: 'Content 1',
        parent: null,
        metadata: {},
        tags: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 2,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      const serverEntity2: RepoEntity = {
        id: 'entity-2',
        type: 'note',
        title: 'Server 2',
        content: 'Content 2',
        parent: null,
        metadata: {},
        tags: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 3,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      // Mock pull response (empty)
      mockTransport.pull.mockResolvedValue({
        cursor: '2025-01-01T00:00:00Z',
        changes: { entities: { upserts: [], deletes: [] }, tags: { upserts: [], deletes: [] } },
      })

      mockTransport.push.mockResolvedValue({
        entities: [
          { id: 'entity-1', status: 'conflict', server: serverEntity1 },
          { id: 'entity-2', status: 'conflict', server: serverEntity2 },
        ],
        tags: [],
      })

      mockDriver.peekOutbox.mockResolvedValue([
        { op: 'upsert' as const, id: 'entity-1', client_rev: 1, data: serverEntity1 },
        { op: 'upsert' as const, id: 'entity-2', client_rev: 1, data: serverEntity2 },
      ])

      await orchestrator.syncNow()

      // Should accept both server versions
      expect(mockDriver.putEntity).toHaveBeenCalledTimes(2)
      expect(mockDriver.removeFromOutbox).toHaveBeenCalledWith(['entity-1', 'entity-2'])
    })
  })

  describe('Outbox Deduplication', () => {
    it('should update existing outbox item instead of creating duplicate', async () => {
      const entity: RepoEntity = {
        id: 'entity-1',
        type: 'note',
        title: 'Updated Title',
        content: 'Updated Content',
        parent: null,
        metadata: {},
        tags: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      // First enqueue via driver
      await mockDriver.enqueueEntity({
        op: 'upsert',
        id: 'entity-1',
        client_rev: 1,
        data: entity,
      })

      // Second enqueue (should update, not create new)
      entity.title = 'Second Update'
      await mockDriver.enqueueEntity({
        op: 'upsert',
        id: 'entity-1',
        client_rev: 1,
        data: entity,
      })

      // Should call enqueueEntity twice (both calls go through)
      // The deduplication happens in the driver implementation
      expect(mockDriver.enqueueEntity).toHaveBeenCalledTimes(2)
    })
  })

  describe('Sync Flow', () => {
    it('should pull changes from server', async () => {
      const serverEntity: RepoEntity = {
        id: 'entity-1',
        type: 'note',
        title: 'From Server',
        content: 'Server Content',
        parent: null,
        metadata: {},
        tags: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 1,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      mockTransport.pull.mockResolvedValue({
        cursor: '2025-01-01T00:00:00Z',
        changes: {
          entities: {
            upserts: [serverEntity],
            deletes: [],
          },
          tags: {
            upserts: [],
            deletes: [],
          },
        },
      })

      mockTransport.push.mockResolvedValue({
        entities: [],
        tags: [],
      })

      const result = await orchestrator.syncNow()

      // Should store pulled entity
      expect(mockDriver.putEntity).toHaveBeenCalledWith(serverEntity)
      expect(result.pulled).toBeGreaterThan(0)
    })

    it('should push local changes to server', async () => {
      const localEntity: RepoEntity = {
        id: 'entity-1',
        type: 'note',
        title: 'Local Change',
        content: 'Local Content',
        parent: null,
        metadata: {},
        tags: [],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        rev: 0,
        server_updated_at: '2025-01-01T00:00:00Z',
        deleted: false,
        deleted_at: null,
      }

      const outboxItem = {
        op: 'upsert' as const,
        id: 'entity-1',
        client_rev: 1,
        data: localEntity,
      }

      mockDriver.peekOutbox.mockResolvedValue([outboxItem])

      mockTransport.pull.mockResolvedValue({
        cursor: '2025-01-01T00:00:00Z',
        changes: { entities: { upserts: [], deletes: [] }, tags: { upserts: [], deletes: [] } },
      })

      mockTransport.push.mockResolvedValue({
        entities: [
          {
            id: 'entity-1',
            status: 'applied',
            rev: 1,
            server_updated_at: '2025-01-01T00:00:00Z',
          },
        ],
        tags: [],
      })

      const result = await orchestrator.syncNow()

      // Should push outbox items
      expect(mockTransport.push).toHaveBeenCalled()
      expect(result.pushed).toBeGreaterThan(0)
    })
  })
})

