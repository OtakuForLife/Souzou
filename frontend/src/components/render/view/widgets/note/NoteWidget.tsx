/**
 * NoteWidget - Widget component for displaying note content
 * 
 * This widget displays the content of a selected note with configurable
 * edit mode (editable or read-only).
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { NoteWidgetConfig, WidgetType } from '@/types/widgetTypes';
import { WidgetProps } from '../WidgetRegistry';
import { EntityType } from '@/models/Entity';
import NoteEditor from '@/components/render/note/NoteEditor';
import { useAppDispatch } from '@/hooks';
import { updateEntity, saveEntity } from '@/store/slices/entitySlice';
import { Save } from 'lucide-react';

interface NoteWidgetProps extends WidgetProps<WidgetType.NOTE> {
  widget: NoteWidgetConfig;
}

/**
 * Read-only note content renderer
 */
const ReadOnlyNoteContent: React.FC<{ content: string; title: string }> = ({ content, title }) => {
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="prose prose-sm max-w-none">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </div>
  );
};

const NoteWidget: React.FC<NoteWidgetProps> = ({
  widget,
}) => {
  const allEntities = useSelector((state: RootState) => state.entities.allEntities);
  const dirtyEntityIDs = useSelector((state: RootState) => state.entities.dirtyEntityIDs);
  const dispatch = useAppDispatch();

  const { noteId, isEditable } = widget.config;

  // Get the selected note
  const selectedNote = noteId ? allEntities[noteId] : null;

  // Check if the note has unsaved changes
  const isDirty = noteId ? dirtyEntityIDs.includes(noteId) : false;

  // Validate that the selected entity is actually a note
  const isValidNote = selectedNote && selectedNote.type === EntityType.NOTE;

  // Handle content changes when in editable mode
  const handleContentChange = (newContent: string) => {
    if (selectedNote && isEditable) {
      dispatch(updateEntity({
        noteID: selectedNote.id,
        content: newContent,
      }));
    }
  };

  // Handle save button click
  const handleSave = () => {
    if (selectedNote) {
      dispatch(saveEntity(selectedNote));
    }
  };

  // Render different states
  if (!noteId || !selectedNote) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-2">No note selected</p>
          <p className="text-sm">Configure this widget to select a note to display</p>
        </div>
      </div>
    );
  }

  if (!isValidNote) {
    return (
      <div className="h-full flex items-center justify-center text-red-500">
        <div className="text-center">
          <p className="text-lg mb-2">Invalid note</p>
          <p className="text-sm">The selected entity is not a note</p>
        </div>
      </div>
    );
  }

  // Render the note content
  return (
    <div className="h-full flex flex-col">
      {isEditable ? (
        // Editable mode - use NoteEditor
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold flex-1">
                  {isDirty && <span className="text-red-500 mr-1">*</span>}
                  {selectedNote.title}
                </h2>
                <span
                  className="p-1 cursor-pointer rounded"
                  onClick={handleSave}
                  title="Save Note"
                >
                  <Save className="w-5 h-5" />
                </span>
              </div>
            </div>
            <NoteEditor
              initialText={selectedNote.content}
              onContentChange={handleContentChange}
              currentNoteId={selectedNote.id}
            />
          </div>
        </div>
      ) : (
        // Read-only mode
        <ReadOnlyNoteContent 
          content={selectedNote.content} 
          title={selectedNote.title}
        />
      )}
    </div>
  );
};

export default NoteWidget;
