import { Entity } from "@/models/Entity";
import { RootState } from "@/store";
import { ContentTypeFactory } from "@/types/contentRegistry";
import React from "react";
import { useSelector } from "react-redux";

// Content renderer component that dynamically renders the appropriate content
interface EntityRendererProps {
  entityID: string;
}

export const ContentRenderer: React.FC<EntityRendererProps> = ({ entityID }) => {
  const entity: Entity = useSelector((state: RootState) => state.entities.allEntities[entityID]);
  try {
      const ContentComponent = ContentTypeFactory.getContentComponent(entity.type);
      return React.createElement(ContentComponent, { entityID });
  } catch (error) {
    console.error('Error rendering content:', error);
    return (
      <div className="p-4 text-red-500">
        Error: Unknown content type "{entity.type}"
      </div>
    );
  }
};

export type { EntityRendererProps}