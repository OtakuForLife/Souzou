/**
 * GridLayout - Main grid container component using react-grid-layout
 */

import React, { useState, useCallback } from 'react';
import RGL, { WidthProvider, Layout } from 'react-grid-layout';
import { ViewContent, WidgetConfig} from '@/types/widgetTypes';
import WidgetContainer from '@/components/render/view/widgets/WidgetContainer';

// Import react-grid-layout CSS
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { ViewMode } from './ViewRenderer';

const ReactGridLayout = WidthProvider(RGL);

interface GridLayoutProps {
  viewContent: ViewContent;
  onLayoutChange?: (widgets: WidgetConfig[]) => void;
  onWidgetUpdate?: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  onWidgetDelete?: (widgetId: string) => void;
  mode?: ViewMode;
}

const GridLayout: React.FC<GridLayoutProps> = ({
  viewContent,
  onLayoutChange,
  onWidgetUpdate,
  onWidgetDelete,
  mode = ViewMode.RENDER,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [widgetsWithOpenModals, setWidgetsWithOpenModals] = useState<Set<string>>(new Set());

  // Handle config modal state changes
  const handleConfigModalChange = useCallback((widgetId: string, isOpen: boolean) => {
    setWidgetsWithOpenModals(prev => {
      const newSet = new Set(prev);
      if (isOpen) {
        newSet.add(widgetId);
      } else {
        newSet.delete(widgetId);
      }
      return newSet;
    });
  }, []);

  // Check if any widget has an open modal
  const hasOpenModal = widgetsWithOpenModals.size > 0;

  // Convert widget configs to react-grid-layout format
  const layoutItems: Layout[] = viewContent.widgets.map(widget => ({
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.position.w,
    h: widget.position.h,
    minW: widget.position.minW,
    minH: widget.position.minH,
    maxW: widget.position.maxW,
    maxH: widget.position.maxH,
  }));

  const handleLayoutChange = useCallback((layout: Layout[]) => {
    if (!onLayoutChange || isDragging) return;

    // Update widget positions based on layout changes
    const updatedWidgets = viewContent.widgets.map(widget => {
      const layoutItem = layout.find(item => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          position: {
            ...widget.position,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        };
      }
      return widget;
    });

    onLayoutChange(updatedWidgets);
  }, [viewContent.widgets, onLayoutChange, isDragging]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragStop = useCallback((layout: Layout[]) => {
    setIsDragging(false);
    handleLayoutChange(layout);
  }, [handleLayoutChange]);

  const handleResizeStop = useCallback((layout: Layout[]) => {
    handleLayoutChange(layout);
  }, [handleLayoutChange]);

  if (viewContent.widgets.length === 0) {
    return (
      <div className="min-h-full h-full w-full flex items-center justify-center">
        <div className="text-center p-2">
          <h3 className="text-lg font-semibold mb-2">No widgets yet</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-0">
      <ReactGridLayout
        className="layout"
        layout={layoutItems}
        cols={viewContent.layout.cols}
        rowHeight={viewContent.layout.rowHeight}
        margin={viewContent.layout.margin}
        containerPadding={viewContent.layout.containerPadding}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
        isDraggable={mode == ViewMode.CONFIG && !hasOpenModal}
        isResizable={mode == ViewMode.CONFIG && !hasOpenModal}
        useCSSTransforms={true}
        preventCollision={false}
        compactType="vertical"
      >
        {viewContent.widgets.map(widget => (
          <div key={widget.id} className="widget-grid-item">
            <WidgetContainer
              widget={widget}
              onUpdate={onWidgetUpdate}
              onDelete={onWidgetDelete}
              mode={mode}
              onConfigModalChange={handleConfigModalChange}
            />
          </div>
        ))}
      </ReactGridLayout>
    </div>
  );
};

export default GridLayout;
