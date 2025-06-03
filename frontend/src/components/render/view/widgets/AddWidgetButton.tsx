/**
 * Add Widget Button Component
 * 
 * Provides a UI for adding new widgets to a dashboard view
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { WidgetType, WidgetConfig, DEFAULT_WIDGET_CONFIGS } from '@/types/widgetTypes';
import { WidgetRegistry } from './WidgetRegistry';

interface AddWidgetButtonProps {
  onAddWidget: (widget: WidgetConfig) => void;
  className?: string;
}

/**
 * Generate a unique widget ID
 */
const generateWidgetId = (): string => {
  return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a new widget configuration
 */
const createNewWidget = (type: WidgetType): WidgetConfig => {
  const defaultConfig = DEFAULT_WIDGET_CONFIGS[type];
  const constraints = WidgetRegistry.getConstraints(type);
  
  const baseWidget = {
    id: generateWidgetId(),
    type,
    title: `New ${WidgetRegistry.get(type)?.displayName || 'Widget'}`,
    position: {
      x: 0,
      y: 0,
      w: constraints.minW || 4,
      h: constraints.minH || 3,
      minW: constraints.minW,
      minH: constraints.minH,
      maxW: constraints.maxW,
      maxH: constraints.maxH,
    },
    showHeaderInViewMode: true,
  };

  // Type-safe widget creation based on widget type
  switch (type) {
    case WidgetType.GRAPH:
      return {
        ...baseWidget,
        type: WidgetType.GRAPH,
        config: defaultConfig,
      } as WidgetConfig;
    
    default:
      throw new Error(`Unknown widget type: ${type}`);
  }
};

export const AddWidgetButton: React.FC<AddWidgetButtonProps> = ({ 
  onAddWidget, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const availableWidgets = WidgetRegistry.getAvailableWidgets();

  const handleAddWidget = (type: WidgetType) => {
    try {
      const newWidget = createNewWidget(type);
      onAddWidget(newWidget);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create widget:', error);
      // TODO: Show error toast
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 ${className}`}
        >
          <Plus className="w-4 h-4" />
          Add Widget
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Widget</DialogTitle>
          <DialogDescription>
            Choose a widget type to add to your dashboard.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {availableWidgets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No widgets available</p>
              <p className="text-sm mt-1">
                Register widgets in the widget registry to see them here.
              </p>
            </div>
          ) : (
            availableWidgets.map((widget) => {
              const IconComponent = widget.icon;
              return (
                <button
                  key={widget.type}
                  onClick={() => handleAddWidget(widget.type)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  {IconComponent && (
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{widget.displayName}</h4>
                    {widget.description && (
                      <p className="text-sm text-gray-600 mt-1">{widget.description}</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
        
        {availableWidgets.length > 0 && (
          <div className="text-xs text-gray-500 text-center">
            Widgets can be configured after adding them to the dashboard.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
