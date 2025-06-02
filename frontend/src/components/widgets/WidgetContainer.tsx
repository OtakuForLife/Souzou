/**
 * WidgetContainer - Wrapper component for individual widgets with header and controls
 */

import React, { useState } from 'react';
import { Settings, X} from 'lucide-react';
import { WidgetConfig, WidgetType } from '@/types/widgetTypes';
import { Button } from '@/components/ui/button';
import WidgetRenderer from './WidgetRenderer';
import GraphWidgetConfigDialog from './graph/GraphWidgetConfigDialog';

interface WidgetContainerProps {
  widget: WidgetConfig;
  onUpdate?: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  onDelete?: (widgetId: string) => void;
  isEditable?: boolean;
  mode?: 'config' | 'render'; // Add mode prop to distinguish between config and render modes
  onConfigModalChange?: (widgetId: string, isOpen: boolean) => void; // Callback for config modal state
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({
  widget,
  onUpdate,
  onDelete,
  isEditable = true,
  mode = 'render',
  onConfigModalChange,
}) => {
  const [showControls, setShowControls] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handleTitleChange = (newTitle: string) => {
    if (onUpdate) {
      onUpdate(widget.id, { title: newTitle });
    }
  };

  const handleDelete = () => {
    if (onDelete && window.confirm(`Delete widget "${widget.title}"?`)) {
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

  const handleConfigSave = (updates: Partial<WidgetConfig>) => {
    if (onUpdate) {
      onUpdate(widget.id, updates);
    }
    // Don't call handleConfigClose here - let the modal handle its own closing
    setShowConfigModal(false);
    if (onConfigModalChange) {
      onConfigModalChange(widget.id, false);
    }
  };

  // Determine header visibility based on mode and widget setting
  const shouldShowHeader = mode === 'config' || (widget.showHeaderInViewMode ?? true);
  const shouldShowHeaderAsOverlay = mode === 'render' && !(widget.showHeaderInViewMode ?? true);

  if (shouldShowHeaderAsOverlay) {
    // Render mode with header disabled: Full-size content with hover overlay header
    return (
      <div
        className="h-full w-full relative border rounded-lg shadow-sm overflow-hidden"
      >
        {/* Widget Content - Takes full space */}
        <div className="h-full w-full overflow-hidden">
          <WidgetRenderer widget={widget} />
        </div>

        {/* Configuration Modal */}
        {widget.type === WidgetType.GRAPH && (
          <GraphWidgetConfigDialog
            widget={widget as any}
            isOpen={showConfigModal}
            onClose={() => setShowConfigModal(false)}
            onSave={handleConfigSave}
          />
        )}
      </div>
    );
  }

  // Default: Traditional layout with always-visible header
  return (
    <div
      className="h-full w-full border rounded-lg shadow-sm flex flex-col overflow-hidden"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Widget Header - Always visible */}
      {shouldShowHeader && (
        <div className="flex items-center justify-between p-3 border-b min-h-[48px] bg-white">
          <div className="flex-1 min-w-0">
            {(isEditable && mode === 'config') ? (
              <input
                type="text"
                value={widget.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full bg-transparent border-none outline-none font-medium text-sm truncate"
                placeholder="Widget title"
              />
            ) : (
              <h3 className="font-medium text-sm truncate">{widget.title}</h3>
            )}
          </div>

          {/* Widget Controls */}
          {isEditable && (
            <div className={`flex items-center gap-1 transition-opacity duration-200 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSettings}
                className="h-6 w-6 p-0"
                title="Widget Settings"
              >
                <Settings className="h-3 w-3" />
              </Button>

              {mode === 'config' && ( // Only show delete button in config mode
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  title="Delete Widget"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Widget Content */}
      <div className="flex-1 overflow-hidden relative">
        <WidgetRenderer widget={widget} />

        {/* Overlay to disable interaction in config mode */}
        {mode === 'config' && (
          <div className="absolute inset-0 bg-transparent pointer-events-auto cursor-not-allowed z-10" />
        )}
      </div>

      {/* Configuration Modal */}
      {widget.type === WidgetType.GRAPH && (
        <GraphWidgetConfigDialog
          widget={widget as any}
          isOpen={showConfigModal}
          onClose={handleConfigClose}
          onSave={handleConfigSave}
        />
      )}
    </div>
  );
};

export default WidgetContainer;
