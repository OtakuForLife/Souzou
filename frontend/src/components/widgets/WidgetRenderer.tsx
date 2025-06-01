/**
 * WidgetRenderer - Factory component for rendering different widget types
 */

import React from 'react';
import { WidgetConfig, WidgetType } from '@/types/widgetTypes';
import GraphWidget from './graph/GraphWidget';

interface WidgetRendererProps {
  widget: WidgetConfig;
}

const WidgetRenderer: React.FC<WidgetRendererProps> = ({ widget }) => {
  switch (widget.type) {
    case WidgetType.GRAPH:
      return <GraphWidget widget={widget} />;
    
    default:
      return (
        <div className="h-full w-full flex items-center justify-center p-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Unknown Widget Type</h3>
            <p className="">Widget type "{widget.type}" is not supported</p>
          </div>
        </div>
      );
  }
};

export default WidgetRenderer;
