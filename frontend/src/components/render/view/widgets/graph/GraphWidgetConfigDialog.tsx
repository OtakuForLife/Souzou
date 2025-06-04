/**
 * GraphWidgetConfig - Configuration modal for Graph Widget
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { GraphWidgetConfig } from '@/types/widgetTypes';
import { RootState } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface GraphWidgetConfigProps {
  widget: GraphWidgetConfig;
  onSave: (config: GraphWidgetConfig['config']) => void;
  onCancel: () => void;
  // Legacy props for backward compatibility
  isOpen?: boolean;
  onClose?: () => void;
}

const GraphWidgetConfigDialog: React.FC<GraphWidgetConfigProps> = ({
  widget,
  onSave,
  onCancel,
  isOpen = true,
  onClose,
}) => {
  const allEntities = useSelector((state: RootState) => state.entities.allEntities);
  const rootEntities = useSelector((state: RootState) => state.entities.rootEntities);

  // Helper function to get safe config values
  const getSafeConfigValue = (key: keyof typeof widget.config, defaultValue: any) => {
    const value = widget.config?.[key];
    return value !== undefined && value !== null ? value : defaultValue;
  };

  // Local state for form values
  const [formData, setFormData] = useState({
    rootEntityId: getSafeConfigValue('rootEntityId', ''),
    maxDepth: getSafeConfigValue('maxDepth', 2),
    layoutAlgorithm: getSafeConfigValue('layoutAlgorithm', 'circle'),
    showLabels: getSafeConfigValue('showLabels', true),
    nodeSize: getSafeConfigValue('nodeSize', 30),
    edgeWidth: getSafeConfigValue('edgeWidth', 2),
  });

  // Reset form data when widget changes
  useEffect(() => {
    setFormData({
      rootEntityId: getSafeConfigValue('rootEntityId', ''),
      maxDepth: getSafeConfigValue('maxDepth', 2),
      layoutAlgorithm: getSafeConfigValue('layoutAlgorithm', 'circle'),
      showLabels: getSafeConfigValue('showLabels', true),
      nodeSize: getSafeConfigValue('nodeSize', 30),
      edgeWidth: getSafeConfigValue('edgeWidth', 2),
    });
  }, [widget]);

  const handleSave = () => {
    const config: GraphWidgetConfig['config'] = {
      ...widget.config,
      rootEntityId: formData.rootEntityId || undefined,
      maxDepth: formData.maxDepth,
      layoutAlgorithm: formData.layoutAlgorithm,
      showLabels: formData.showLabels,
      nodeSize: formData.nodeSize,
      edgeWidth: formData.edgeWidth,
    };
    onSave(config);
    if (onClose) onClose();
  };

  const handleCancelClick = () => {
    // Reset form data to original values
    setFormData({
      rootEntityId: getSafeConfigValue('rootEntityId', ''),
      maxDepth: getSafeConfigValue('maxDepth', 2),
      layoutAlgorithm: getSafeConfigValue('layoutAlgorithm', 'circle'),
      showLabels: getSafeConfigValue('showLabels', true),
      nodeSize: getSafeConfigValue('nodeSize', 30),
      edgeWidth: getSafeConfigValue('edgeWidth', 2),
    });
    onCancel();
    if (onClose) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose || onCancel}>
      <DialogContent className="max-w-md theme-explorer-background theme-explorer-item-text">
        <DialogHeader>
          <DialogTitle>Configure Graph Widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Root Entity Selection */}
          <div className="space-y-2">
            <Label htmlFor="rootEntity">Root Entity (Optional)</Label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={formData.rootEntityId || ""}
              onChange={(e) => setFormData({ ...formData, rootEntityId: e.target.value })}
            >
              <option value="">All Root Entities</option>
              {Object.values(allEntities).map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.title} ({entity.type})
                </option>
              ))}
            </select>
            <p className="text-xs">
              Leave empty to show links from all root entities
            </p>
          </div>

          {/* Max Depth */}
          <div className="space-y-2">
            <Label htmlFor="maxDepth">Maximum Depth</Label>
            <Input
              id="maxDepth"
              type="number"
              min="1"
              max="5"
              value={formData.maxDepth}
              onChange={(e) => setFormData({ ...formData, maxDepth: parseInt(e.target.value) || 1 })}
            />
            <p className="text-xs">
              How many levels deep to traverse relationships
            </p>
          </div>

          {/* Layout Algorithm */}
          <div className="space-y-2">
            <Label htmlFor="layout">Layout Algorithm</Label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={formData.layoutAlgorithm || "circle"}
              onChange={(e) => setFormData({ ...formData, layoutAlgorithm: e.target.value as any })}
            >
              <option value="circle">Circle</option>
              <option value="grid">Grid</option>
              <option value="breadthfirst">Breadth First</option>
              <option value="cose">COSE</option>
            </select>
          </div>

          {/* Show Labels */}
          <div className="flex flex-row items-center justify-start space-x-2">
            <input
              type='checkbox'
              id="showLabels"
              checked={formData.showLabels}
              onChange={(e) => setFormData({ ...formData, showLabels: e.target.checked })}
            />
            <Label htmlFor="showLabels">Show Node Labels</Label>
          </div>

          {/* Node Size */}
          <div className="space-y-2">
            <Label htmlFor="nodeSize">Node Size</Label>
            <Input
              id="nodeSize"
              type="number"
              min="10"
              max="100"
              value={formData.nodeSize}
              onChange={(e) => setFormData({ ...formData, nodeSize: parseInt(e.target.value) || 30 })}
            />
          </div>

          {/* Edge Width */}
          <div className="space-y-2">
            <Label htmlFor="edgeWidth">Edge Width</Label>
            <Input
              id="edgeWidth"
              type="number"
              min="1"
              max="10"
              value={formData.edgeWidth}
              onChange={(e) => setFormData({ ...formData, edgeWidth: parseInt(e.target.value) || 2 })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancelClick}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GraphWidgetConfigDialog;
