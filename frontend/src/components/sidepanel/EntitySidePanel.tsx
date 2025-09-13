import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { fetchTags } from '@/store/slices/tagSlice';
import { useAppDispatch } from '@/hooks';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';

import PropertiesSection from './PropertiesSection';
import TagsSection from './TagsSection';
import OutgoingLinksSection from './OutgoingLinksSection';
import IncomingLinksSection from './IncomingLinksSection';


interface EntitySidePanelProps {
  currentEntityId?: string;
  showProperties?: boolean;
  showTags?: boolean;
  showOutgoingLinks?: boolean;
  showIncomingLinks?: boolean;
}


export const EntitySidePanel: React.FC<EntitySidePanelProps> = ({ currentEntityId, showProperties = true, showTags = true, showOutgoingLinks = false, showIncomingLinks = false }) => {
  const dispatch = useAppDispatch();
  const { allTags } = useSelector((state: RootState) => state.tags);
  const { allEntities } = useSelector((state: RootState) => state.entities);

  const currentEntity = currentEntityId ? allEntities[currentEntityId] : null;

  useEffect(() => {
    if (Object.keys(allTags).length === 0) {
      dispatch(fetchTags());
    }
  }, [dispatch]); // Remove allTags from dependency array to prevent infinite loop

  const currentEntityTagIds = currentEntity?.tags || [];
  // Convert tag IDs to Tag objects for display

  const currentEntityTags = currentEntityTagIds.map(tagId => allTags[tagId]).filter(Boolean);

  const enabledSections: React.ReactNode[] = [];
  if (showProperties) enabledSections.push(
    <PropertiesSection currentEntity={currentEntity} />
  );
  if (showTags) enabledSections.push(
    <TagsSection currentEntity={currentEntity} currentEntityTags={currentEntityTags} />
  );
  if (showOutgoingLinks) enabledSections.push(
    <OutgoingLinksSection currentEntity={currentEntity} allEntities={allEntities} />
  );
  if (showIncomingLinks) enabledSections.push(
    <IncomingLinksSection currentEntity={currentEntity} allEntities={allEntities} />
  );
  const hasAnySection = enabledSections.length > 0;
  const defaultSize = enabledSections.length > 0 ? Math.floor(100 / enabledSections.length) : 100;

  return (
    <div className="h-full flex flex-col theme-explorer-background theme-explorer-item-text">
      {enabledSections.length >= 2 ? (
        <ResizablePanelGroup direction="vertical" tagName="div" className="h-full w-full">
          {enabledSections.map((section, idx) => (
            <React.Fragment key={idx}>
              <ResizablePanel className="theme-explorer-background" minSize={15} defaultSize={defaultSize}>
                {section}
              </ResizablePanel>
              {idx < enabledSections.length - 1 && (
                <ResizableHandle className="w-1 theme-explorer-background" />
              )}
            </React.Fragment>
          ))}
        </ResizablePanelGroup>
      ) : (
        <div className="h-full w-full overflow-auto">
          {hasAnySection ? enabledSections[0] : (
            <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
              Side panel is hidden
            </div>
          )}
        </div>
      )}
    </div>
  );
};
