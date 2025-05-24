/**
 * Service layer for graph-related API operations
 */

import api from '@/lib/api';
import { GraphContentData } from '@/types/contentTypes';
import { API_CONFIG } from '@/config/constants';
import { log } from '@/lib/logger';

export interface CreateGraphRequest {
  title: string;
  elements: any;
  layout?: any;
  style?: any;
}

export interface UpdateGraphRequest {
  id: string;
  title?: string;
  elements?: any;
  layout?: any;
  style?: any;
}

class GraphService {
  private readonly endpoint = API_CONFIG.ENDPOINTS.GRAPHS;

  /**
   * Fetch all graphs
   */
  async fetchGraphs(): Promise<GraphContentData[]> {
    try {
      log.info('Fetching graphs');
      const response = await api.get<GraphContentData[]>(this.endpoint);
      log.info('Graphs fetched successfully', { count: response.data.length });
      return response.data;
    } catch (error) {
      log.error('Failed to fetch graphs', error as Error);
      throw error;
    }
  }

  /**
   * Create a new graph
   */
  async createGraph(graphData: CreateGraphRequest): Promise<GraphContentData> {
    try {
      log.info('Creating graph', { title: graphData.title });
      
      const response = await api.post<GraphContentData>(this.endpoint, graphData);
      
      if (response.status !== 201) {
        throw new Error(`Failed to create graph: ${response.status}`);
      }

      const newGraph = response.data;
      log.info('Graph created successfully', { id: newGraph.id, title: newGraph.title });
      return newGraph;
    } catch (error) {
      log.error('Failed to create graph', error as Error, { graphData });
      throw error;
    }
  }

  /**
   * Update an existing graph
   */
  async updateGraph(updateData: UpdateGraphRequest): Promise<GraphContentData> {
    try {
      log.info('Updating graph', { id: updateData.id });
      
      const response = await api.put<GraphContentData>(`${this.endpoint}${updateData.id}/`, updateData);
      
      if (response.status !== 200) {
        throw new Error(`Failed to update graph: ${response.status}`);
      }

      log.info('Graph updated successfully', { id: updateData.id });
      return response.data;
    } catch (error) {
      log.error('Failed to update graph', error as Error, { updateData });
      throw error;
    }
  }

  /**
   * Delete a graph
   */
  async deleteGraph(graphId: string): Promise<void> {
    try {
      log.info('Deleting graph', { id: graphId });
      
      const response = await api.delete(`${this.endpoint}${graphId}/`);
      
      if (response.status !== 200 && response.status !== 204) {
        throw new Error(`Failed to delete graph: ${response.status}`);
      }

      log.info('Graph deleted successfully', { id: graphId });
    } catch (error) {
      log.error('Failed to delete graph', error as Error, { graphId });
      throw error;
    }
  }

  /**
   * Get a specific graph by ID
   */
  async getGraph(graphId: string): Promise<GraphContentData> {
    try {
      log.info('Fetching graph', { id: graphId });
      
      const response = await api.get<GraphContentData>(`${this.endpoint}${graphId}/`);
      
      if (response.status !== 200) {
        throw new Error(`Failed to fetch graph: ${response.status}`);
      }

      log.info('Graph fetched successfully', { id: graphId });
      return response.data;
    } catch (error) {
      log.error('Failed to fetch graph', error as Error, { graphId });
      throw error;
    }
  }

  /**
   * Search graphs by title
   */
  async searchGraphs(query: string): Promise<GraphContentData[]> {
    try {
      log.info('Searching graphs', { query });
      
      const response = await api.get<GraphContentData[]>(`${this.endpoint}search/`, {
        params: { q: query },
      });

      log.info('Graphs search completed', { query, count: response.data.length });
      return response.data;
    } catch (error) {
      log.error('Failed to search graphs', error as Error, { query });
      throw error;
    }
  }
}

// Export singleton instance
export const graphService = new GraphService();
