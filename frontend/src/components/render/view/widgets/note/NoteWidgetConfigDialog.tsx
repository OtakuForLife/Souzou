/**
 * NoteWidgetConfigDialog - Configuration modal for Note Widget
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { NoteWidgetConfig } from '@/types/widgetTypes';
import { RootState } from '@/store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EntityType } from '@/models/Entity';

interface NoteWidgetConfigProps {
  widget: NoteWidgetConfig;
  onSave: (config: NoteWidgetConfig['config']) => void;
  onCancel: () => void;
  // Legacy props for backward compatibility
  isOpen?: boolean;
  onClose?: () => void;
}

const NoteWidgetConfigDialog: React.FC<NoteWidgetConfigProps> = ({
  widget,
  onSave,
  onCancel,
  isOpen = true,
  onClose,
}) => {
  const allEntities = useSelector((state: RootState) => state.entities.allEntities);

  // Helper function to get safe config values
  const getSafeConfigValue = (key: keyof typeof widget.config, defaultValue: any) => {
    const value = widget.config?.[key];
    return value !== undefined && value !== null ? value : defaultValue;
  };

  // Local state for form values
  const [formData, setFormData] = useState({
    noteId: getSafeConfigValue('noteId', ''),
    isEditable: getSafeConfigValue('isEditable', false),
  });

  // Reset form data when widget changes
  useEffect(() => {
    setFormData({
      noteId: getSafeConfigValue('noteId', ''),
      isEditable: getSafeConfigValue('isEditable', false),
    });
  }, [widget]);

  // Filter entities to only show notes
  const noteEntities = Object.values(allEntities).filter(entity => entity.type === EntityType.NOTE);

  const handleSave = () => {
    const config: NoteWidgetConfig['config'] = {
      ...widget.config,
      noteId: formData.noteId || undefined,
      isEditable: formData.isEditable,
    };
    onSave(config);
    if (onClose) onClose();
  };

  const handleCancelClick = () => {
    // Reset form data to original values
    setFormData({
      noteId: getSafeConfigValue('noteId', ''),
      isEditable: getSafeConfigValue('isEditable', false),
    });
    onCancel();
    if (onClose) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose || onCancel}>
      <DialogContent className="max-w-md theme-explorer-background theme-explorer-item-text">
        <DialogHeader>
          <DialogTitle>Configure Note Widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Note Selection */}
          <div className="space-y-2">
            <Label htmlFor="noteSelection">Select Note</Label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={formData.noteId || ""}
              onChange={(e) => setFormData({ ...formData, noteId: e.target.value })}
            >
              <option value="">No note selected</option>
              {noteEntities.map((note) => (
                <option key={note.id} value={note.id}>
                  {note.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500">
              Select a note to display in this widget
            </p>
          </div>

          {/* Editable Toggle */}
          <div className="flex flex-row items-center justify-start space-x-2">
            <input
              type="checkbox"
              className=''
              id="isEditable"
              checked={formData.isEditable}
              onChange={(e) => setFormData({ ...formData, isEditable: e.target.checked })}
            />
            <Label htmlFor="isEditable">Allow Editing</Label>
          </div>
          <p className="text-xs text-gray-500">
            When enabled, the note content can be edited directly in the widget
          </p>
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

export default NoteWidgetConfigDialog;
