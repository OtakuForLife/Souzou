import { Entity } from "@/models/Entity";
import NoteRenderer from "./render/note/NoteRenderer";

interface NoteTabContentProps {
  entity: Entity;
}

function NoteTabContent({ entity }: NoteTabContentProps) {
  return ( 
    <NoteRenderer entityID={entity.id}/>
  );
}

export default NoteTabContent;

