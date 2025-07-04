/**
 * ViewRenderer - Main component for rendering dashboard views with widgets
 */

import React, { useCallback, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { Settings, Eye } from 'lucide-react';
import { RootState } from '@/store';
import { Entity } from '@/models/Entity';
import { ViewContent, WidgetConfig, createDefaultViewContent } from '@/types/widgetTypes';
import { parseAndValidateViewContent, formatValidationError } from '@/types/widgetValidation';
import { EntityRendererProps } from '@/components/ContentRenderer';
import { updateEntity } from '@/store/slices/entitySlice';
import GridLayout from '@/components/render/view/GridLayout';
import { Button } from '@/components/ui/button';
import { AddWidgetButton } from '@/components/render/view/widgets/AddWidgetButton';

// Import widget registry to ensure widgets are registered
import '@/components/render/view/widgets';
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

  // Create a memoized selector that only changes when THIS specific entity changes
  const selectViewEntity = useMemo(() =>
    createSelector(
      [(state: RootState) => state.entities.allEntities[entityID]],
      (entity) => entity
    ),
    [entityID]
  );

  const entity: Entity = useSelector(selectViewEntity);
  const [mode, setMode] = useState<ViewMode>(ViewMode.RENDER);
  const [titleError, setTitleError] = useState<string | undefined>();

  // DEBUG: Log when ViewRenderer renders
  console.log('🔍 ViewRenderer render - entityID:', entityID, 'entity title:', entity?.title);

  if (!entity) {
    return (
      <div className="p-4 text-red-500">
        Error: View not found
      </div>
    );
  }

  // Parse and validate view content with proper error handling - memoized to prevent unnecessary rerenders
  const { viewContent, contentError } = useMemo(() => {
    let parsedViewContent: ViewContent;
    let error: string | null = null;

    if (entity.content) {
      const validationResult = parseAndValidateViewContent(entity.content);
      if (validationResult.success) {
        parsedViewContent = validationResult.data!;
      } else {
        console.error('View content validation failed:', validationResult.error);
        if (validationResult.issues) {
          console.error('Validation issues:', formatValidationError(validationResult.issues));
        }
        error = validationResult.error || 'Invalid view content format';
        parsedViewContent = createDefaultViewContent();
      }
    } else {
      parsedViewContent = createDefaultViewContent();
    }

    return { viewContent: parsedViewContent, contentError: error };
  }, [entity.content]);

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
      widget.id === widgetId ? { ...widget, ...updates } as WidgetConfig : widget
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



  const handleAddWidget = useCallback((widget: WidgetConfig) => {
    const updatedViewContent = {
      ...viewContent,
      widgets: [...viewContent.widgets, widget],
    };

    dispatch(updateEntity({
      noteID: entityID,
      content: JSON.stringify(updatedViewContent)
    }));
  }, [dispatch, entityID, viewContent]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* View Header with Mode Switch */}
      <div className="flex-shrink-0 flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-4">
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
            <AddWidgetButton
              onAddWidget={handleAddWidget}
              className="theme-explorer-background theme-explorer-item-text"
            />
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

      {/* Content Error Display */}
      {contentError && (
        <div className="flex-shrink-0 mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800 text-sm">
            <strong>Content Error:</strong> {contentError}
          </div>
          <div className="text-red-600 text-xs mt-1">
            Using default configuration. Please check the view content format.
          </div>
        </div>
      )}

      {/* Grid Layout Container - Takes remaining space and handles its own scrolling */}
      <div className="flex-1 min-h-0">
        <GridLayout
          viewContent={viewContent}
          onLayoutChange={handleLayoutChange}
          onWidgetUpdate={handleWidgetUpdate}
          onWidgetDelete={handleWidgetDelete}
          mode={mode}
        />
      </div>
    </div>
  );
};

export default ViewRenderer;
