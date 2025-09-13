import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch } from "@/hooks";
import { openTab } from "@/store/slices/tabsSlice";
import { linkParsingService } from "@/services/linkParsingService";
import { EntityType } from "@/models/Entity";
import type { Entity } from "@/models/Entity";
import { Link } from "lucide-react";

export interface OutgoingLinksSectionProps {
  currentEntity: Entity | null;
  allEntities: Record<string, Entity>;
}

const OutgoingLinksSection: React.FC<OutgoingLinksSectionProps> = ({ currentEntity, allEntities }) => {
  const dispatch = useAppDispatch();
  const isNote = currentEntity?.type === EntityType.NOTE;
  const outgoingLinks = isNote && currentEntity
    ? linkParsingService.getOutgoingLinks(currentEntity.id, allEntities).filter((l) => !!l.targetNoteId)
    : [];

  return (
    <ScrollArea className="flex-1">
      <div className="p-3">
        <h2 className="text-lg font-semibold mb-4 px-3">Outgoing links</h2>
        {isNote && currentEntity ? (
          <div className="space-y-1 px-3">
            {outgoingLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outgoing links</p>
            ) : (
              outgoingLinks.map((link, idx) => (
                <button
                  key={`out-${idx}-${link.targetNoteId}`}
                  className="w-full text-left px-2 py-1 rounded hover:bg-muted/50 flex items-center gap-2"
                  onClick={() => link.targetNoteId && dispatch(openTab(link.targetNoteId))}
                >
                  <Link className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">
                    {link.targetNoteId ? linkParsingService.resolveNoteTitle(link.targetNoteId, allEntities) : link.displayText}
                  </span>
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

export default OutgoingLinksSection;

