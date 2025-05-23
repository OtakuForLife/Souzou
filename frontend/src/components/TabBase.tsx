import { useSortable } from "@dnd-kit/sortable";
import {CSS} from '@dnd-kit/utilities';
import { TabsTrigger } from "@radix-ui/react-tabs";
import { X } from "lucide-react";
import React from "react";
import { truncateText } from "@/utils/common";

interface TabProps {
  objectID: string;
  objectType: string;
  displayname: string;
  onClose: (e: React.MouseEvent<HTMLElement>) => void;
  onDropped: (active: any, over: any) => void;
}

function TabBase({ objectID, objectType, displayname, onClose, onDropped }: TabProps) {
    const uid = objectType + "-" + objectID;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: uid,
      data: {
        objectID: objectID,
        objectType: objectType,
        type: "tab",
        accepts: ["tab"],
        onDragEnd: onDropped
      },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const tabRef = React.createRef<HTMLButtonElement>();

  return (
    <div
      className="flex text-skin-primary w-[150px]"
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
        className="flex justify-between custom-tab text-skin-primary w-full rounded-none rounded-t-lg p-1"
        value={uid}
      >
        <div>
          <span className="pr-1" title={displayname}>{truncateText(displayname, 15)}</span>
          <span
            className="p-0"
            onMouseDown={(e: React.MouseEvent<HTMLElement>) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={onClose}
          >
            <X className="w-5 h-5 hover:bg-skin-primary-hover" />
          </span>
        </div>
      </TabsTrigger>
    </div>
  );
}

export default TabBase;
