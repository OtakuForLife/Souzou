import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ContentType, GraphContentData } from '@/types/contentTypes';
import { graphService, CreateGraphRequest, UpdateGraphRequest } from '@/services/graphService';
import { generateId } from '@/utils/common';

export const fetchGraphs = createAsyncThunk(
  'graphs/fetchGraphs',
  async () => {
    return await graphService.fetchGraphs();
  }
);

export const createGraph = createAsyncThunk(
  'graphs/createGraph',
  async (graph: CreateGraphRequest) => {
    // For now, create a temporary graph with proper structure
    const tempGraph: CreateGraphRequest = {
      ...graph,
      elements: graph.elements || [],
    };

    // TODO: Replace with actual service call when backend is ready
    const newGraph: GraphContentData = {
      id: generateId(),
      type: ContentType.GRAPH,
      title: tempGraph.title,
      elements: tempGraph.elements,
      layout: tempGraph.layout,
      style: tempGraph.style,
      created_at: new Date().toISOString(),
    };
    return newGraph;
  }
);

export const updateGraph = createAsyncThunk(
  'graphs/updateGraph',
  async (graph: UpdateGraphRequest) => {
    return await graphService.updateGraph(graph);
  }
);

export const deleteGraph = createAsyncThunk(
  'graphs/deleteGraph',
  async (graphId: string) => {
    await graphService.deleteGraph(graphId);
    return graphId;
  }
);

interface GraphState {
  allGraphs: { [id: string]: GraphContentData };
  loading: boolean;
  error: string | null;
}

const initialState: GraphState = {
  allGraphs: {},
  loading: false,
  error: null,
};

export const graphSlice = createSlice({
  name: 'graphs',
  initialState,
  reducers: {
    updateGraphData: (state, action: PayloadAction<{
      graphId: string;
      title?: string;
      elements?: any;
      layout?: any;
      style?: any;
    }>) => {
      const { graphId, ...updates } = action.payload;
      if (state.allGraphs[graphId]) {
        state.allGraphs[graphId] = { ...state.allGraphs[graphId], ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGraphs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGraphs.fulfilled, (state, action) => {
        state.loading = false;
        state.allGraphs = Object.fromEntries(action.payload.map((graph: GraphContentData) => [graph.id, graph]));
      })
      .addCase(fetchGraphs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch graphs';
      })
      .addCase(createGraph.fulfilled, (state, action) => {
        const newGraph = action.payload;
        state.allGraphs[newGraph.id] = newGraph;
      })
      .addCase(updateGraph.fulfilled, (state, action) => {
        const updates = action.payload;
        if (state.allGraphs[updates.id]) {
          state.allGraphs[updates.id] = { ...state.allGraphs[updates.id], ...updates };
        }
      })
      .addCase(deleteGraph.fulfilled, (state, action) => {
        const graphId = action.payload;
        delete state.allGraphs[graphId];
      });
  },
});

export const {
  updateGraphData,
} = graphSlice.actions;

export default graphSlice.reducer;
export type { GraphState };
