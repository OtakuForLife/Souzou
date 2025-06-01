/**
 * GraphWidget - Graph visualization widget using Cytoscape
 */

import React, { useMemo, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ReactCytoscape from '@/components/Cytoscape';
import { GraphWidgetConfig } from '@/types/widgetTypes';
import { RootState } from '@/store';
import { linkParsingService } from '@/services/linkParsingService';

interface GraphWidgetProps {
  widget: GraphWidgetConfig;
}

const GraphWidget: React.FC<GraphWidgetProps> = ({ widget }) => {
  const allEntities = useSelector((state: RootState) => state.entities.allEntities);
  const rootEntities = useSelector((state: RootState) => state.entities.rootEntities);
  const [graphElements, setGraphElements] = useState<any[]>([]);

  // Generate graph elements based on widget configuration
  useEffect(() => {
    const generateGraphElements = () => {
      const { rootEntityId, maxDepth } = widget.config;

      if (!rootEntityId || !allEntities[rootEntityId]) {
        // If no specific root entity is configured, show links from all root entities
        if (rootEntities.length === 0) {
          // Show message if no entities exist at all
          return [];
        }

        const nodes: any[] = [];
        const edges: any[] = [];
        const processedEntities = new Set<string>();

        // Process all root entities and their links
        rootEntities.forEach(rootEntity => {
          if (processedEntities.has(rootEntity.id)) return;

          processedEntities.add(rootEntity.id);

          // Add root entity node
          nodes.push({
            data: {
              id: rootEntity.id,
              label: rootEntity.title,
              type: rootEntity.type,
            }
          });

          // Parse links from root entity content
          if (rootEntity.content) {
            const linkResult = linkParsingService.parseLinks(rootEntity.content, allEntities);

            linkResult.links.forEach(link => {
              if (link.targetNoteId && allEntities[link.targetNoteId]) {
                const targetEntity = allEntities[link.targetNoteId];

                // Add target node if not already added
                if (!processedEntities.has(link.targetNoteId)) {
                  processedEntities.add(link.targetNoteId);
                  nodes.push({
                    data: {
                      id: link.targetNoteId,
                      label: targetEntity.title,
                      type: targetEntity.type,
                    }
                  });
                }

                // Add edge
                edges.push({
                  data: {
                    id: `${rootEntity.id}-${link.targetNoteId}`,
                    source: rootEntity.id,
                    target: link.targetNoteId,
                    type: link.type,
                  }
                });
              }
            });
          }
        });

        return [...nodes, ...edges];
      }

      const nodes: any[] = [];
      const edges: any[] = [];
      const processedEntities = new Set<string>();
      const entityQueue: Array<{ id: string; depth: number }> = [{ id: rootEntityId, depth: 0 }];

      while (entityQueue.length > 0) {
        const { id: entityId, depth } = entityQueue.shift()!;

        if (processedEntities.has(entityId) || depth > maxDepth) {
          continue;
        }

        const entity = allEntities[entityId];
        if (!entity) continue;

        processedEntities.add(entityId);

        // Add node
        nodes.push({
          data: {
            id: entityId,
            label: entity.title,
            type: entity.type,
          }
        });

        // Parse links from entity content and add edges
        if (entity.content) {
          const linkResult = linkParsingService.parseLinks(entity.content, allEntities);

          linkResult.links.forEach(link => {
            if (link.targetNoteId && !processedEntities.has(link.targetNoteId)) {
              // Add target entity to queue for processing
              entityQueue.push({ id: link.targetNoteId, depth: depth + 1 });

              // Add edge
              edges.push({
                data: {
                  id: `${entityId}-${link.targetNoteId}`,
                  source: entityId,
                  target: link.targetNoteId,
                  type: link.type,
                }
              });
            }
          });
        }

        // Add parent-child relationships
        if (entity.parent && !processedEntities.has(entity.parent)) {
          entityQueue.push({ id: entity.parent, depth: depth + 1 });
          edges.push({
            data: {
              id: `${entity.parent}-${entityId}`,
              source: entity.parent,
              target: entityId,
              type: 'parent-child',
            }
          });
        }

        // Add children relationships
        entity.children?.forEach(childId => {
          if (!processedEntities.has(childId)) {
            entityQueue.push({ id: childId, depth: depth + 1 });
            edges.push({
              data: {
                id: `${entityId}-${childId}`,
                source: entityId,
                target: childId,
                type: 'parent-child',
              }
            });
          }
        });
      }

      return [...nodes, ...edges];
    };

    setGraphElements(generateGraphElements());
  }, [widget.config, allEntities, rootEntities]);

  // Memoize layout configuration
  const layout = useMemo(() => ({
    name: widget.config.layoutAlgorithm,
    fit: true,
    padding: 30,
    animate: true,
    animationDuration: 500,
  }), [widget.config.layoutAlgorithm]);

  // Memoize style configuration
  const style = useMemo(() => [
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': widget.config.showLabels ? 'data(label)' : '',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': '#fff',
        'font-size': '12px',
        'width': widget.config.nodeSize,
        'height': widget.config.nodeSize,
      }
    },
    {
      selector: 'edge',
      style: {
        'width': widget.config.edgeWidth,
        'line-color': '#ccc',
        'target-arrow-color': '#ccc',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    },
    {
      selector: 'node[type="note"]',
      style: {
        'background-color': '#3b82f6',
      }
    },
    {
      selector: 'node[type="view"]',
      style: {
        'background-color': '#10b981',
      }
    },
    {
      selector: 'edge[type="parent-child"]',
      style: {
        'line-color': '#f59e0b',
        'target-arrow-color': '#f59e0b',
      }
    }
  ], [widget.config]);

  // Memoize cytoscape options
  const cytoscapeOptions = useMemo(() => ({
    boxSelectionEnabled: true,
    autounselectify: false,
    userZoomingEnabled: true,
    userPanningEnabled: true,
  }), []);

  // Memoize style container
  const styleContainer = useMemo(() => ({
    height: '100%',
    width: '100%'
  }), []);

  if (graphElements.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Graph Data</h3>
          <p className="text-gray-500 text-sm">
            {widget.config.rootEntityId
              ? 'No connections found for the selected entity'
              : rootEntities.length === 0
                ? 'No entities available to display'
                : 'No links found between root entities'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactCytoscape
        containerID={`graph-widget-${widget.id}`}
        elements={graphElements}
        layout={layout}
        style={style}
        styleContainer={styleContainer}
        cytoscapeOptions={cytoscapeOptions}
      />
    </div>
  );
};

export default GraphWidget;
