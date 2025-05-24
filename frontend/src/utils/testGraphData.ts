import { GraphContentData, ContentType } from '@/types/contentTypes';

// Sample graph data for testing the extensible tab system
export const createSampleGraph = (): GraphContentData => {
  return {
    id: `graph-${Date.now()}`,
    type: ContentType.GRAPH,
    title: 'Sample Graph',
    elements: [
      // Nodes
      { data: { id: 'a', label: 'Node A' } },
      { data: { id: 'b', label: 'Node B' } },
      { data: { id: 'c', label: 'Node C' } },
      { data: { id: 'd', label: 'Node D' } },
      
      // Edges
      { data: { id: 'ab', source: 'a', target: 'b' } },
      { data: { id: 'bc', source: 'b', target: 'c' } },
      { data: { id: 'cd', source: 'c', target: 'd' } },
      { data: { id: 'da', source: 'd', target: 'a' } }
    ],
    layout: {
      name: 'circle',
      fit: true,
      padding: 30
    },
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#4A90E2',
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'color': '#fff',
          'font-size': '14px',
          'width': '60px',
          'height': '60px'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#7ED321',
          'target-arrow-color': '#7ED321',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      }
    ],
    created_at: new Date().toISOString()
  };
};

export const createNetworkGraph = (): GraphContentData => {
  return {
    id: `graph-${Date.now() + 1}`,
    type: ContentType.GRAPH,
    title: 'Network Diagram',
    elements: [
      // Central hub
      { data: { id: 'hub', label: 'Hub' } },
      
      // Connected nodes
      { data: { id: 'node1', label: 'Server 1' } },
      { data: { id: 'node2', label: 'Server 2' } },
      { data: { id: 'node3', label: 'Database' } },
      { data: { id: 'node4', label: 'Client' } },
      { data: { id: 'node5', label: 'API' } },
      
      // Connections
      { data: { id: 'hub-node1', source: 'hub', target: 'node1' } },
      { data: { id: 'hub-node2', source: 'hub', target: 'node2' } },
      { data: { id: 'hub-node3', source: 'hub', target: 'node3' } },
      { data: { id: 'hub-node4', source: 'hub', target: 'node4' } },
      { data: { id: 'hub-node5', source: 'hub', target: 'node5' } },
      { data: { id: 'node1-node3', source: 'node1', target: 'node3' } },
      { data: { id: 'node2-node3', source: 'node2', target: 'node3' } },
      { data: { id: 'node4-node5', source: 'node4', target: 'node5' } }
    ],
    layout: {
      name: 'cose',
      fit: true,
      padding: 50,
      nodeRepulsion: 400000,
      idealEdgeLength: 100
    },
    style: [
      {
        selector: 'node',
        style: {
          'background-color': '#FF6B6B',
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'color': '#fff',
          'font-size': '12px',
          'width': '80px',
          'height': '40px',
          'shape': 'roundrectangle'
        }
      },
      {
        selector: 'node[id = "hub"]',
        style: {
          'background-color': '#4ECDC4',
          'width': '100px',
          'height': '60px'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': '#95A5A6',
          'target-arrow-color': '#95A5A6',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier'
        }
      }
    ],
    created_at: new Date().toISOString()
  };
};
