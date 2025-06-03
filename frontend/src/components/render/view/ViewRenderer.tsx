/**
 * ViewRenderer - Main component for rendering dashboard views with widgets
 */

import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { Settings, Eye, Plus, Save } from 'lucide-react';
import { RootState } from '@/store';
import { Entity } from '@/models/Entity';
import { ViewContent, WidgetConfig, WidgetType, createDefaultViewContent, createDefaultWidget } from '@/types/widgetTypes';
import { EntityRendererProps } from '@/components/ContentRenderer';
import { saveEntity, updateEntity } from '@/store/slices/entitySlice';
import GridLayout from '@/components/render/view/GridLayout';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/Input';
import { validateNoteTitle } from '@/utils/common';
import { useAppDispatch } from '@/hooks';

interface ViewRendererProps extends EntityRendererProps {
  entityID: string;
}

export enum ViewMode {
  RENDER = 'render',
  CONFIG = 'config',
}

const ViewRenderer: React.FC<ViewRendererProps> = ({ entityID }) => {
  const dispatch = useAppDispatch();
  const entity: Entity = useSelector((state: RootState) => state.entities.allEntities[entityID]);
  const [mode, setMode] = useState<ViewMode>(ViewMode.RENDER);
  const [titleError, setTitleError] = useState<string | undefined>();

  if (!entity) {
    return (
      <div className="p-4 text-red-500">
        Error: View not found
      </div>
    );
  }

  let viewContent: ViewContent;
  try {
    viewContent = entity.content ? JSON.parse(entity.content) : createDefaultViewContent();
  } catch (error) {
    console.error('Error parsing view content:', error);
    viewContent = createDefaultViewContent();
  }

  const handleLayoutChange = useCallback((updatedWidgets: WidgetConfig[]) => {
    const updatedViewContent: ViewContent = {
      ...viewContent,
      widgets: updatedWidgets,
    };

    dispatch(updateEntity({
      noteID: entityID,
      content: JSON.stringify(updatedViewContent),
    }));
  }, [dispatch, entityID, viewContent]);

  const handleWidgetUpdate = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    const updatedWidgets = viewContent.widgets.map(widget =>
      widget.id === widgetId ? { ...widget, ...updates } : widget
    );

    const updatedViewContent: ViewContent = {
      ...viewContent,
      widgets: updatedWidgets,
    };

    dispatch(updateEntity({
      noteID: entityID,
      content: JSON.stringify(updatedViewContent),
    }));
  }, [dispatch, entityID, viewContent]);

  const handleWidgetDelete = useCallback((widgetId: string) => {
    const updatedWidgets = viewContent.widgets.filter(widget => widget.id !== widgetId);

    const updatedViewContent: ViewContent = {
      ...viewContent,
      widgets: updatedWidgets,
    };

    dispatch(updateEntity({
      noteID: entityID,
      content: JSON.stringify(updatedViewContent),
    }));
  }, [dispatch, entityID, viewContent]);

  const handleWidgetAdd = useCallback((widget: WidgetConfig) => {
    const updatedWidgets = [...viewContent.widgets, widget];

    const updatedViewContent: ViewContent = {
      ...viewContent,
      widgets: updatedWidgets,
    };

    dispatch(updateEntity({
      noteID: entityID,
      content: JSON.stringify(updatedViewContent),
    }));
  }, [dispatch, entityID, viewContent]);

  const handleAddWidget = useCallback((widgetType: WidgetType) => {
    // Find a good position for the new widget
    const existingPositions = viewContent.widgets.map(w => w.position);
    let newY = 0;
    let newX = 0;

    // Simple placement algorithm - find the first available spot
    if (existingPositions.length > 0) {
      const maxY = Math.max(...existingPositions.map(p => p.y + p.h));
      newY = maxY;
    }

    const newWidget = createDefaultWidget(widgetType, {
      x: newX,
      y: newY,
      w: 6, // Default width
      h: 4, // Default height
    });

    handleWidgetAdd(newWidget);
  }, [viewContent.widgets, handleWidgetAdd]);

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="pb-8">
        {/* View Header with Mode Switch */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <span className="w-5 h-5 p-0"
              onClick={(e: React.MouseEvent<HTMLElement>) => {
                e.preventDefault();
                if (entity?.id) {
                  dispatch(saveEntity(entity));
                }
              }}
            >
              <Save className="w-5 h-5" />
            </span>
            <Input
              className="text-4xl h-15 p-0 py-1"
              value={entity?.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newTitle = e.currentTarget.value;

                // Validate title
                const validation = validateNoteTitle(newTitle);
                if (!validation.isValid) {
                  setTitleError(validation.error);
                } else {
                  setTitleError(undefined);
                }

                // Update note in store immediately for UI responsiveness
                dispatch(
                  updateEntity({
                    noteID: entity?.id,
                    title: newTitle,
                    content: entity?.content,
                    parent: entity?.parent,
                  }),
                );
              }}
            />
            {titleError && (
              <div className="text-sm mt-1 px-1">
                {titleError}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 theme-explorer-background theme-explorer-item-text">
            {/* Add Widget Button (only in config mode) */}
            {mode === ViewMode.CONFIG && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Widget
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='theme-explorer-background theme-explorer-item-text'>
                  <DropdownMenuItem onClick={() => handleAddWidget(WidgetType.GRAPH)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Graph Widget
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mode Switch */}
            <div className="flex items-center border rounded-md">
              <Button
                variant={mode === ViewMode.RENDER ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode(ViewMode.RENDER)}
                className="rounded-r-none"
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button
                variant={mode === ViewMode.CONFIG ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode(ViewMode.CONFIG)}
                className="rounded-l-none border-l"
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>

        {/* Grid Layout Container */}
        <div className="px-4">
          <GridLayout
            viewContent={viewContent}
            onLayoutChange={handleLayoutChange}
            onWidgetUpdate={handleWidgetUpdate}
            onWidgetDelete={handleWidgetDelete}
            isEditable={mode === ViewMode.CONFIG}
            mode={mode}
          />
        </div>
      </div>
    </div>
  );
};

export default ViewRenderer;
