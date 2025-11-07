import { expect, test, vi, afterEach, describe, beforeEach } from "vitest"
import * as EntitySlice from "@/store/slices/entitySlice";
import api from '@/lib/api';
import { Entity, EntityType } from '@/models/Entity';
import { InternalAxiosRequestConfig } from "axios";

// Mock the API
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }
}));

const reducer = EntitySlice.default;
const {
  updateEntity,
  changeEntityParent,
  fetchEntities,
  createEntity,
  saveEntity,
  deleteEntity,
  selectRootEntities
} = EntitySlice;
type EntityState = EntitySlice.EntityState;

// Sample note data for testing
const mockNote1: Entity = {
  id: '1',
  title: 'Test Note 1',
  type: EntityType.NOTE,
  content: 'Test content 1',
  created_at: '2023-01-01T00:00:00Z',
  parent: '',
  children: []
};

const mockNote2: Entity = {
  id: '2',
  title: 'Test Note 2',
  type: EntityType.NOTE,
  content: 'Test content 2',
  created_at: '2023-01-02T00:00:00Z',
  parent: '',
  children: []
};

const mockNote3: Entity = {
  id: '3',
  title: 'Test Note 3',
  type: EntityType.NOTE,
  content: 'Test content 3',
  created_at: '2023-01-03T00:00:00Z',
  parent: '1',
  children: []
};

const mockNotes = [mockNote1, mockNote2, mockNote3];

describe('entitySlice', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should return the initial state', () => {
    const initialState = reducer(undefined, { type: '' });
    expect(initialState).toEqual({
      allEntities: {},
      dirtyEntityIDs: [],
      globalLoading: false,
      pendingCreates: [],
      pendingSaves: [],
      pendingDeletes: [],
      optimisticEntities: {},
      error: null
    });
  });

  describe('reducers', () => {
    test('should handle updateEntity', () => {
      const previousState: EntityState = {
        allEntities: { '1': mockNote1, '2': mockNote2 },
        dirtyEntityIDs: [],
        globalLoading: false,
        pendingCreates: [],
        pendingSaves: [],
        pendingDeletes: [],
        optimisticEntities: {},
        error: null
      };

      const updatedTitle = 'Updated Title';
      const updatedContent = 'Updated Content';

      const nextState = reducer(previousState, updateEntity({
        noteID: '1',
        title: updatedTitle,
        content: updatedContent,
        parent: ''
      }));

      expect(nextState.allEntities['1'].title).toEqual(updatedTitle);
      expect(nextState.allEntities['1'].content).toEqual(updatedContent);
    });

    test('should handle changeEntityParent', () => {
      const previousState: EntityState = {
        allEntities: { '1': mockNote1, '2': mockNote2 },
        dirtyEntityIDs: [],
        globalLoading: false,
        pendingCreates: [],
        pendingSaves: [],
        pendingDeletes: [],
        optimisticEntities: {},
        error: null
      };

      // Test that changeEntityParent actually changes the parent
      const nextState = reducer(previousState, changeEntityParent({ noteID: '1', newParent: '2' }));

      // The parent of note '1' should now be '2'
      expect(nextState.allEntities['1'].parent).toEqual('2');
      // Other properties should remain unchanged
      expect(nextState.allEntities['1'].title).toEqual(mockNote1.title);
      expect(nextState.allEntities['1'].content).toEqual(mockNote1.content);
      expect(nextState.allEntities['2']).toEqual(mockNote2);
    });
  });

  describe('dirtyEntityIDs tracking', () => {
    test('should add entity ID to dirtyEntityIDs when updateEntity is called', () => {
      const previousState: EntityState = {
        allEntities: { '1': mockNote1, '2': mockNote2 },
        dirtyEntityIDs: [],
        globalLoading: false,
        pendingCreates: [],
        pendingSaves: [],
        pendingDeletes: [],
        optimisticEntities: {},
        error: null
      };

      const nextState = reducer(previousState, updateEntity({
        noteID: '1',
        title: 'Updated Title'
      }));

      expect(nextState.dirtyEntityIDs).toContain('1');
      expect(nextState.dirtyEntityIDs).toHaveLength(1);
    });

    test('should not duplicate entity ID in dirtyEntityIDs when updating already dirty entity', () => {
      const previousState: EntityState = {
        allEntities: { '1': mockNote1, '2': mockNote2 },
        dirtyEntityIDs: ['1'], // Entity '1' is already dirty
        globalLoading: false,
        pendingCreates: [],
        pendingSaves: [],
        pendingDeletes: [],
        optimisticEntities: {},
        error: null
      };

      const nextState = reducer(previousState, updateEntity({
        noteID: '1',
        content: 'Updated Content'
      }));

      expect(nextState.dirtyEntityIDs).toContain('1');
      expect(nextState.dirtyEntityIDs).toHaveLength(1); // Should still be only 1 entry
    });

    test('should track multiple dirty entities', () => {
      const previousState: EntityState = {
        allEntities: { '1': mockNote1, '2': mockNote2 },
        dirtyEntityIDs: [],
        globalLoading: false,
        pendingCreates: [],
        pendingSaves: [],
        pendingDeletes: [],
        optimisticEntities: {},
        error: null
      };

      // Update first entity
      let nextState = reducer(previousState, updateEntity({
        noteID: '1',
        title: 'Updated Title 1'
      }));

      // Update second entity
      nextState = reducer(nextState, updateEntity({
        noteID: '2',
        title: 'Updated Title 2'
      }));

      expect(nextState.dirtyEntityIDs).toContain('1');
      expect(nextState.dirtyEntityIDs).toContain('2');
      expect(nextState.dirtyEntityIDs).toHaveLength(2);
    });

    test('should handle complete update-save workflow for dirtyEntityIDs', () => {
      const initialState: EntityState = {
        allEntities: { '1': mockNote1 },
        dirtyEntityIDs: [],
        globalLoading: false,
        pendingCreates: [],
        pendingSaves: [],
        pendingDeletes: [],
        optimisticEntities: {},
        error: null
      };

      // Step 1: Update entity - should add to dirtyEntityIDs
      const afterUpdate = reducer(initialState, updateEntity({
        noteID: '1',
        title: 'Updated Title'
      }));

      expect(afterUpdate.dirtyEntityIDs).toContain('1');
      expect(afterUpdate.dirtyEntityIDs).toHaveLength(1);
      expect(afterUpdate.allEntities['1'].title).toEqual('Updated Title');

      // Step 2: Save entity - should remove from dirtyEntityIDs
      const savedEntity = { ...afterUpdate.allEntities['1'] };
      const afterSave = reducer(afterUpdate, {
        type: saveEntity.fulfilled.type,
        payload: { savedEntity },
        meta: { arg: mockNote1, requestId: 'test-request-id', requestStatus: 'fulfilled' }
      });

      expect(afterSave.dirtyEntityIDs).not.toContain('1');
      expect(afterSave.dirtyEntityIDs).toHaveLength(0);
      expect(afterSave.allEntities['1'].title).toEqual('Updated Title');
    });
  });

  describe('async thunks', () => {
    test('should handle fetchNotes.fulfilled', async () => {
      // Mock API response
      vi.mocked(api.get).mockResolvedValueOnce({
        data: mockNotes,
        status: 0,
        statusText: "",
        headers: {},
        config: {} as InternalAxiosRequestConfig<any>
      });

      const previousState: EntityState = {
        allEntities: {},
        dirtyEntityIDs: [],
        globalLoading: false,
        pendingCreates: [],
        pendingSaves: [],
        pendingDeletes: [],
        optimisticEntities: {},
        error: null
      };

      // The issue is that the payload needs to match what the reducer expects
      // In the reducer, it filters notes where parent is null, but our mock notes use empty string
      // Let's modify our test to match the implementation
      const mockNotesWithNullParent = [
        {...mockNote1, parent: null},
        {...mockNote2, parent: null},
        mockNote3
      ];

      const action = { type: fetchEntities.fulfilled.type, payload: mockNotesWithNullParent };
      const nextState = reducer(previousState, action);

      expect(Object.keys(nextState.allEntities)).toHaveLength(3);
      // mockNote1 should have children array computed since mockNote3 has parent: '1'
      expect(nextState.allEntities['1']).toEqual({...mockNote1, parent: null, children: ['3']});
      expect(nextState.allEntities['2']).toEqual({...mockNote2, parent: null});
      expect(nextState.allEntities['3']).toEqual(mockNote3);
    });

    test('should handle createNote.fulfilled', async () => {
      const newNoteData: Entity = {
        id: '4',
        title: 'New Note',
        type: EntityType.NOTE,
        content: 'New content',
        created_at: '2023-01-04T00:00:00Z',
        parent: null,
        children: []
      };

      const previousState: EntityState = {
        allEntities: { '1': mockNote1, '2': mockNote2 },
        dirtyEntityIDs: [],
        globalLoading: false,
        pendingCreates: [],
        pendingSaves: [],
        pendingDeletes: [],
        optimisticEntities: {},
        error: null
      };

      const action = {
        type: createEntity.fulfilled.type,
        payload: {
          parent: null,
          newNoteData: newNoteData
        },
        meta: {
          arg: { tempId: 'temp-id', entity: newNoteData },
          requestId: 'test-request-id',
          requestStatus: 'fulfilled'
        }
      };

      const nextState = reducer(previousState, action);

      expect(Object.keys(nextState.allEntities)).toHaveLength(3);
      expect(nextState.allEntities['4']).toEqual(newNoteData);
    });

    test('should handle saveEntity.fulfilled', async () => {
      // Create mock entities with null parent for root entities
      const mockRootNote1 = { ...mockNote1, parent: null };
      const mockRootNote2 = { ...mockNote2, parent: null };
      const savedEntity = { ...mockRootNote1, title: 'Updated Title' };

      const previousState: EntityState = {
        allEntities: { '1': mockRootNote1, '2': mockRootNote2, '3': mockNote3 },
        dirtyEntityIDs: [],
        globalLoading: false,
        pendingCreates: [],
        pendingSaves: [],
        pendingDeletes: [],
        optimisticEntities: {},
        error: null
      };

      const action = {
        type: saveEntity.fulfilled.type,
        payload: { savedEntity },
        meta: { arg: mockRootNote1, requestId: 'test-request-id', requestStatus: 'fulfilled' }
      };

      const nextState = reducer(previousState, action);

      expect(nextState.allEntities['1'].title).toEqual('Updated Title');
    });

    test('should remove entity ID from dirtyEntityIDs when saveEntity.fulfilled', async () => {
      const mockRootNote1 = { ...mockNote1, parent: null };
      const savedEntity = { ...mockRootNote1, title: 'Updated Title' };

      const previousState: EntityState = {
        allEntities: { '1': mockRootNote1 },
        dirtyEntityIDs: ['1'], // Entity '1' is dirty
        globalLoading: false,
        pendingCreates: [],
        pendingSaves: [],
        pendingDeletes: [],
        optimisticEntities: {},
        error: null
      };

      const action = {
        type: saveEntity.fulfilled.type,
        payload: { savedEntity },
        meta: { arg: mockRootNote1, requestId: 'test-request-id', requestStatus: 'fulfilled' }
      };

      const nextState = reducer(previousState, action);

      expect(nextState.dirtyEntityIDs).not.toContain('1');
      expect(nextState.dirtyEntityIDs).toHaveLength(0);
    });

    test('should only remove saved entity ID from dirtyEntityIDs, leaving others', async () => {
      const mockRootNote1 = { ...mockNote1, parent: null };
      const mockRootNote2 = { ...mockNote2, parent: null };
      const savedEntity = { ...mockRootNote1, title: 'Updated Title' };

      const previousState: EntityState = {
        allEntities: { '1': mockRootNote1, '2': mockRootNote2 },
        dirtyEntityIDs: ['1', '2'], // Both entities are dirty
        globalLoading: false,
        pendingCreates: [],
        pendingSaves: [],
        pendingDeletes: [],
        optimisticEntities: {},
        error: null
      };

      const action = {
        type: saveEntity.fulfilled.type,
        payload: { savedEntity },
        meta: { arg: mockRootNote1, requestId: 'test-request-id', requestStatus: 'fulfilled' }
      };

      const nextState = reducer(previousState, action);

      expect(nextState.dirtyEntityIDs).not.toContain('1'); // Saved entity removed
      expect(nextState.dirtyEntityIDs).toContain('2'); // Other dirty entity remains
      expect(nextState.dirtyEntityIDs).toHaveLength(1);
    });

    test('should handle saveEntity.fulfilled when entity was not dirty', async () => {
      const mockRootNote1 = { ...mockNote1, parent: null };
      const savedEntity = { ...mockRootNote1, title: 'Updated Title' };

      const previousState: EntityState = {
        allEntities: { '1': mockRootNote1 },
        dirtyEntityIDs: [], // Entity '1' is not dirty
        globalLoading: false,
        pendingCreates: [],
        pendingSaves: [],
        pendingDeletes: [],
        optimisticEntities: {},
        error: null
      };

      const action = {
        type: saveEntity.fulfilled.type,
        payload: { savedEntity },
        meta: { arg: mockRootNote1, requestId: 'test-request-id', requestStatus: 'fulfilled' }
      };

      const nextState = reducer(previousState, action);

      // Should not crash and dirtyEntityIDs should remain empty
      expect(nextState.dirtyEntityIDs).toHaveLength(0);
      expect(nextState.allEntities['1'].title).toEqual('Updated Title');
    });

    test('should update entity when save succeeds with store configuration', async () => {
      // This test uses a different approach with configureStore like the /test version
      const mockEntity: Entity = {
        id: 'test-entity-1',
        type: EntityType.NOTE,
        title: 'Test Note',
        content: 'Test content',
        created_at: new Date().toISOString(),
        parent: null,
        children: []
      };

      let currentState: EntityState = {
        allEntities: { [mockEntity.id]: mockEntity },
        dirtyEntityIDs: [],
        globalLoading: false,
        pendingCreates: [],
        pendingSaves: [],
        pendingDeletes: [],
        optimisticEntities: {},
        error: null
      };

      const store = {
        getState: () => ({ entities: currentState }),
        dispatch: (action: any) => {
          // Mock dispatch that updates the state
          currentState = reducer(currentState, action);
        }
      };

      // Mock successful save response
      const mockSaveResponse = {
        savedEntity: { ...mockEntity, content: 'New content' }
      };

      // Dispatch save fulfilled action manually
      store.dispatch(saveEntity.fulfilled(mockSaveResponse, 'test-request-id', mockEntity));

      // Check that entity was updated
      expect(store.getState().entities.allEntities[mockEntity.id].content).toBe('New content');
    });

    test('should handle deleteNote.fulfilled', async () => {
      const remainingNotes = [mockNote2, mockNote3];

      const previousState: EntityState = {
        allEntities: { '1': mockNote1, '2': mockNote2, '3': mockNote3 },
        dirtyEntityIDs: [],
        globalLoading: false,
        pendingCreates: [],
        pendingSaves: [],
        pendingDeletes: [],
        optimisticEntities: {},
        error: null
      };

      const action = {
        type: deleteEntity.fulfilled.type,
        payload: remainingNotes,
        meta: { arg: '1', requestId: 'test-request-id', requestStatus: 'fulfilled' }
      };

      const nextState = reducer(previousState, action);

      expect(Object.keys(nextState.allEntities)).toHaveLength(2);
      expect(nextState.allEntities['1']).toBeUndefined();
    });
  });

  describe('selectors', () => {
    test('selectRootEntities should return entities with no parent', () => {
      const mockRootNote1 = { ...mockNote1, parent: null };
      const mockRootNote2 = { ...mockNote2, parent: null };
      const mockChildNote = { ...mockNote3, parent: '1' };

      const state = {
        entities: {
          allEntities: {
            '1': mockRootNote1,
            '2': mockRootNote2,
            '3': mockChildNote
          },
          dirtyEntityIDs: [],
          globalLoading: false,
          pendingCreates: [],
          pendingSaves: [],
          pendingDeletes: [],
          optimisticEntities: {},
          error: null
        }
      } as any;

      const rootEntities = selectRootEntities(state);

      expect(rootEntities).toHaveLength(2);
      expect(rootEntities.map(e => e.id)).toEqual(['1', '2']);
      expect(rootEntities.every(e => e.parent === null)).toBe(true);
    });

    test('selectRootEntities should return empty array when no root entities exist', () => {
      const mockChildNote1 = { ...mockNote1, parent: '2' };
      const mockChildNote2 = { ...mockNote2, parent: '1' };

      const state = {
        entities: {
          allEntities: {
            '1': mockChildNote1,
            '2': mockChildNote2
          },
          dirtyEntityIDs: [],
          globalLoading: false,
          pendingCreates: [],
          pendingSaves: [],
          pendingDeletes: [],
          optimisticEntities: {},
          error: null
        }
      } as any;

      const rootEntities = selectRootEntities(state);

      expect(rootEntities).toHaveLength(0);
    });
  });
});



