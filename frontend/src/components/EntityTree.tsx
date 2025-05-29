import NoteTreeItem from "./EntityTreeItem";
import { Entity } from "@/models/Entity";
import { RootState } from "@/store";
import { EntityState } from "@/store/slices/entitySlice";
import { useSelector } from "react-redux";
import { LoadingSpinner } from "@/components/common";


export const NoteTree = () => {
  const noteState: EntityState = useSelector((state: RootState) => state.entities);
  const notes: Entity[] = noteState.rootEntities;
  const { loading } = noteState;

  return (
    <div className="relative flex-initial justify-center w-full h-full theme-explorer-background">
      <div className="px-1 py-4">
        {notes.map((note: Entity) => (
          <NoteTreeItem key={note.id} noteID={note.id} depth={0}/>
        ))}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 bg-opacity-30 flex items-center justify-center z-50">
            <LoadingSpinner size="md" text="Loading notes..." />
        </div>
      )}
    </div>
  );
};