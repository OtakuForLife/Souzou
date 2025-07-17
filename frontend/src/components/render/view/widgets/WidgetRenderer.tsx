/**
 * Simplified Widget Renderer
 *
 * Uses the widget registry to automatically render any registered widget type.
 * No need to modify this file when adding new widgets!
 */

import React from 'react';
import { WidgetConfig} from '@/types/widgetTypes';
import { WidgetRegistry, WidgetProps } from './WidgetRegistry';

// Import widget registrations to ensure they're loaded
import './index';
import { ViewMode } from '../ViewRenderer';

interface WidgetRendererProps {
  widget: WidgetConfig;
  mode?: ViewMode;
  onUpdate?: (updates: Partial<WidgetConfig>) => void;
  onDelete?: () => void;
}

const WidgetRenderer = ({
  widget,
  mode = ViewMode.RENDER,
  onUpdate,
  onDelete
}: WidgetRendererProps) => {
  // Get widget component from registry
  const WidgetComponent = WidgetRegistry.getComponent(widget.type);

  if (!WidgetComponent) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Unknown Widget Type</h3>
          <p className="text-gray-600">Widget type "{widget.type}" is not registered</p>
          <p className="text-sm text-gray-500 mt-2">
            Available types: {WidgetRegistry.getStats().registeredTypes.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  // Create props with proper typing
  const widgetProps: WidgetProps<any> = {
    widget,
    mode,
    onUpdate,
    onDelete
  };

  return <WidgetComponent {...widgetProps} />;
};

export default WidgetRenderer;
