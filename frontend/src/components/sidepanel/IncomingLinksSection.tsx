import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch } from "@/hooks";
import { openTab } from "@/store/slices/tabsSlice";
import { linkParsingService } from "@/services/linkParsingService";
import { EntityType } from "@/models/Entity";
import type { Entity } from "@/models/Entity";
import { Link } from "lucide-react";

export interface IncomingLinksSectionProps {
  currentEntity: Entity | null;
  allEntities: Record<string, Entity>;
}

const IncomingLinksSection: React.FC<IncomingLinksSectionProps> = ({ currentEntity, allEntities }) => {
  const dispatch = useAppDispatch();
  const isNote = currentEntity?.type === EntityType.NOTE;
  const incomingLinks = isNote && currentEntity
    ? linkParsingService.getIncomingLinks(currentEntity.id, allEntities)
    : [];

  return (
    <ScrollArea className="flex-1">
      <div className="p-3">
        <h2 className="text-lg font-semibold mb-4 px-3">Incoming links</h2>
        {isNote && currentEntity ? (
          <div className="space-y-1 px-3">
            {incomingLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No incoming links</p>
            ) : (
              incomingLinks.map((item, idx) => (
                <button
                  key={`in-${idx}-${item.sourceNote.id}`}
                  className="w-full text-left px-2 py-1 rounded hover:bg-muted/50 flex items-center gap-2"
                  onClick={() => dispatch(openTab(item.sourceNote.id))}
                >
                  <Link className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{item.sourceNote.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{item.links.length}</span>
                </button>
              ))
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground px-3">Only available for notes</p>
        )}
      </div>
    </ScrollArea>
  );
};

export default IncomingLinksSection;

