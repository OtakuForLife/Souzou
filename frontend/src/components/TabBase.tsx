import { useSortable } from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';
import { TabsTrigger } from "@radix-ui/react-tabs";
import { X } from "lucide-react";
import React from "react";
import { truncateText } from "@/utils/common";
import { DragType, EntityDragData } from "@/types/contentTypes";
import { EntityType } from "@/models/Entity";
import { Active, Over } from "@dnd-kit/core";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { EntityState } from "@/store/slices/entitySlice";


interface TabProps {
  objectID: string;
  objectType: EntityType;
  displayname: string;
  onClose: (e: React.MouseEvent<HTMLElement>) => void;
  onDropped: (active: Active, over: Over | null) => void;
}

function TabBase({ objectID, objectType, displayname, onClose, onDropped }: TabProps) {
  const uid = objectID;
  const entityState: EntityState = useSelector((state: RootState) => state.entities);
  const isDirty: boolean = entityState.dirtyEntityIDs.includes(objectID);

  const data: EntityDragData = {
    objectID: objectID,
    objectType: objectType,
    type: DragType.TAB,
    accepts: [DragType.TAB],
    onDragEnd: onDropped
  }

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: uid,
      data: data,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const tabRef = React.createRef<HTMLButtonElement>();

  return (
    <div
      className="flex w-[150px]"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      key={uid}
      data-dragging={isDragging}
    >
      <TabsTrigger
        asChild
        ref={tabRef}
        key={uid}
        className="flex justify-between w-full rounded-none rounded-t-lg p-1 theme-main-tab-background theme-main-tab-text"
        value={uid}
      >
        <div>
          <span className="pl-1" title={displayname}>
            {isDirty ? (
              <>
                <span className="text-red-500 pr-1">*</span>
                {truncateText(displayname, 12)}
              </>
            ) : (
              truncateText(displayname, 13)
            )}
          </span>
          <span
            className="p-0"
            onMouseDown={(e: React.MouseEvent<HTMLElement>) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={onClose}
          >
            <X className="size-6" />
          </span>
        </div>
      </TabsTrigger>
    </div>
  );
}

export default TabBase;
