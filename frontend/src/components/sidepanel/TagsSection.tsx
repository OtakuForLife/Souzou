import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TagInput } from "../TagInput";
import type { Entity } from "@/models/Entity";
import type { Tag } from "@/models/Tag";

export interface TagsSectionProps {
  currentEntity: Entity | null;
  currentEntityTags: Tag[];
}

const TagsSection: React.FC<TagsSectionProps> = ({ currentEntity, currentEntityTags }) => {
  return (
    <ScrollArea className="flex-1 h-full">
      <div className="p-3">
        <h2 className="text-lg font-semibold mb-4 px-3">Tags</h2>
        {currentEntity && (
          <div className="mb-6 px-3">
            <TagInput entityId={currentEntity.id} currentTags={currentEntityTags} />
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default TagsSection;

