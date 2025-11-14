import { Entity } from "@/models/Entity";
import { ContentRenderer } from "./ContentRenderer";
import { EntitySidePanel } from "./sidepanel/EntitySidePanel";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { useRef, useState, useEffect } from "react";

interface EntityTabContentProps {
  entity: Entity;
  showSidePanel?: boolean;
  showProperties?: boolean;
  showTags?: boolean;
  showOutgoingLinks?: boolean;
  showIncomingLinks?: boolean;
  onSidePanelVisibilityChange?: (visible: boolean) => void;
}

function EntityTabContent({ entity, showSidePanel = true, showProperties = true, showTags = true, showOutgoingLinks = false, showIncomingLinks = false, onSidePanelVisibilityChange }: EntityTabContentProps) {
  const [isLargeViewport, setIsLargeViewport] = useState(window.innerWidth >= 1024);
  const lastVisibleRef = useRef<boolean>(true);

  // Track viewport size for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsLargeViewport(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!showSidePanel) {
    return (
      <div className="h-full w-full">
        <ContentRenderer entityID={entity.id} />
      </div>
    );
  }

  // Mobile/Tablet: Vertical layout (side panel below content)
  if (!isLargeViewport) {
    return (
      <ResizablePanelGroup
        direction="vertical"
        className="h-full w-full"
        onLayout={(sizes: number[]) => {
          const bottom = sizes[1] ?? 0;
          const visible = bottom > 0.1;
          if (visible !== lastVisibleRef.current) {
            lastVisibleRef.current = visible;
            onSidePanelVisibilityChange?.(visible);
          }
        }}
      >
        <ResizablePanel minSize={40} defaultSize={60} className="min-h-0">
          <div className="h-full w-full">
            <ContentRenderer entityID={entity.id} />
          </div>
        </ResizablePanel>
        <ResizableHandle className="h-1 theme-explorer-background" />
        <ResizablePanel minSize={20} maxSize={60} defaultSize={40} collapsible={true} className="theme-explorer-background theme-explorer-item-text">
          <EntitySidePanel
            currentEntityId={entity.id}
            showProperties={showProperties}
            showTags={showTags}
            showOutgoingLinks={showOutgoingLinks}
            showIncomingLinks={showIncomingLinks}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  // Desktop: Horizontal layout (side panel to the right)
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
          showOutgoingLinks={showOutgoingLinks}
          showIncomingLinks={showIncomingLinks}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default EntityTabContent;

