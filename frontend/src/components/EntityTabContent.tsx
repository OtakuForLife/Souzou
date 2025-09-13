import { Entity } from "@/models/Entity";
import { ContentRenderer } from "./ContentRenderer";
import { EntitySidePanel } from "./sidepanel/EntitySidePanel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { useRef } from "react";

interface EntityTabContentProps {
  entity: Entity;
  showSidePanel?: boolean;
  showProperties?: boolean;
  showTags?: boolean;
  onSidePanelVisibilityChange?: (visible: boolean) => void;
}

function EntityTabContent({ entity, showSidePanel = true, showProperties = true, showTags = true, onSidePanelVisibilityChange }: EntityTabContentProps) {
  if (!showSidePanel) {
    return (
      <div className="h-full w-full">
        <ContentRenderer entityID={entity.id} />
      </div>
    );
  }

  const lastVisibleRef = useRef<boolean>(true);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full w-full"
      onLayout={(sizes: number[]) => {
        const right = sizes[1] ?? 0;
        const visible = right > 0.1;
        if (visible !== lastVisibleRef.current) {
          lastVisibleRef.current = visible;
          onSidePanelVisibilityChange?.(visible);
        }
      }}
    >
      <ResizablePanel minSize={40} defaultSize={70} className="min-w-0">
        <div className="h-full w-full">
          <ContentRenderer entityID={entity.id} />
        </div>
      </ResizablePanel>
      <ResizableHandle className="w-1 theme-explorer-background" />
      <ResizablePanel minSize={10} maxSize={30} defaultSize={20} collapsible={true} className="theme-explorer-background theme-explorer-item-text">
        <EntitySidePanel
          currentEntityId={entity.id}
          showProperties={showProperties}
          showTags={showTags}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default EntityTabContent;

