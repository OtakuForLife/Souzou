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
import { WidgetType, WidgetConfig, createDefaultWidget } from '@/types/widgetTypes';
import { WidgetRegistry } from './WidgetRegistry';

interface AddWidgetButtonProps {
  onAddWidget: (widget: WidgetConfig) => void;
  className?: string;
}



export const AddWidgetButton: React.FC<AddWidgetButtonProps> = ({ 
  onAddWidget, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const availableWidgets = WidgetRegistry.getAvailableWidgets();

  const handleAddWidget = (type: WidgetType) => {
    try {
      const newWidget = createDefaultWidget(type);
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
      
      <DialogContent className="sm:max-w-md theme-explorer-background theme-explorer-item-text">
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
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors text-left"
                >
                  {IconComponent && (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <h4 className="font-medium">{widget.displayName}</h4>
                    {widget.description && (
                      <p className="text-sm mt-1">{widget.description}</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
        {availableWidgets.length > 0 && (
          <div className="text-xs text-center">
            Widgets can be configured after adding them to the dashboard.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
