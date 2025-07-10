/**
 * WidgetContainer - Wrapper component for individual widgets with header and controls
 */

import React, { useState, useCallback } from 'react';
import { Settings, X} from 'lucide-react';
import { WidgetConfig} from '@/types/widgetTypes';
import { Button } from '@/components/ui/button';
import WidgetRenderer from './WidgetRenderer';
import { WidgetRegistry } from './WidgetRegistry';

// Import widget registrations to ensure they're loaded
import './index';
import { ViewMode } from '../ViewRenderer';

interface WidgetContainerProps {
  widget: WidgetConfig;
  onUpdate?: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  onDelete?: (widgetId: string) => void;
  mode?: ViewMode; // Add mode prop to distinguish between config and render modes
  onConfigModalChange?: (widgetId: string, isOpen: boolean) => void; // Callback for config modal state
}

const WidgetContainer = ({
  widget,
  onUpdate,
  onDelete,
  mode = ViewMode.RENDER,
  onConfigModalChange,
}: WidgetContainerProps) => {
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handleDelete = () => {
    if (onDelete && window.confirm('Delete this widget?')) {
      onDelete(widget.id);
    }
  };

  const handleSettings = () => {
    setShowConfigModal(true);
    if (onConfigModalChange) {
      onConfigModalChange(widget.id, true);
    }
  };

  const handleConfigClose = () => {
    setShowConfigModal(false);
    if (onConfigModalChange) {
      onConfigModalChange(widget.id, false);
    }
  };

  const handleConfigSave = (config: any) => {
    if (onUpdate) {
      onUpdate(widget.id, { config });
    }
    // Don't call handleConfigClose here - let the modal handle its own closing
    setShowConfigModal(false);
    if (onConfigModalChange) {
      onConfigModalChange(widget.id, false);
    }
  };

  // Create a wrapper for onUpdate that matches the expected signature
  const handleWidgetUpdate = useCallback((updates: Partial<WidgetConfig>) => {
    if (onUpdate) {
      onUpdate(widget.id, updates);
    }
  }, [onUpdate, widget.id]);

  // Create a stable callback for onDelete
  const handleWidgetDelete = useCallback(() => {
    if (onDelete) {
      onDelete(widget.id);
    }
  }, [onDelete, widget.id]);

  if (mode === ViewMode.RENDER) {
    // View mode: Full-size content with no header
    return (
      <div className="h-full w-full border rounded-lg shadow-sm overflow-hidden">
        {/* Widget Content - Takes full space */}
        <div className="h-full w-full overflow-hidden">
          <WidgetRenderer
            widget={widget}
            onUpdate={handleWidgetUpdate}
            onDelete={handleWidgetDelete}
          />
        </div>

        {/* Configuration Modal */}
        {showConfigModal && (() => {
          const ConfigComponent = WidgetRegistry.getConfigComponent(widget.type);
          if (!ConfigComponent) return null;

          return (
            <ConfigComponent
              widget={widget}
              onSave={handleConfigSave}
              onCancel={() => setShowConfigModal(false)}
            />
          );
        })()}
      </div>
    );
  }

  // Config mode: Show header with controls
  return (
    <div
      className="h-full w-full border rounded-lg shadow-sm flex flex-col overflow-hidden"
    >
        <div className="flex items-center justify-end p-3 border-b min-h-[48px]">
          
            <div className="flex items-center gap-1 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSettings}
                className="h-6 w-6 p-0"
                title="Widget Settings"
              >
                <Settings className="h-3 w-3" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                title="Delete Widget"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
        </div>

      {/* Widget Content */}
      <div className="flex-1 overflow-hidden relative">
        <WidgetRenderer
          widget={widget}
          onUpdate={handleWidgetUpdate}
          onDelete={handleWidgetDelete}
        />
        {/* Overlay to disable interaction in config mode */}
        <div className="absolute inset-0 bg-transparent pointer-events-auto cursor-not-allowed z-10" />
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (() => {
        const ConfigComponent = WidgetRegistry.getConfigComponent(widget.type);
        if (!ConfigComponent) return null;

        return (
          <ConfigComponent
            widget={widget}
            onSave={handleConfigSave}
            onCancel={handleConfigClose}
          />
        );
      })()}
    </div>
  );
};

export default WidgetContainer;
