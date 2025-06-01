import { Entity } from "@/models/Entity";
import { ContentRenderer } from "./ContentRenderer";

interface EntityTabContentProps {
  entity: Entity;
}

// In EntityTabContent.tsx:
function EntityTabContent({ entity }: EntityTabContentProps) {
  return (
      <ContentRenderer entityID={entity.id}/>
  );
}

export default EntityTabContent;

