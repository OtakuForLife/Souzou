import { useAppDispatch } from "@/hooks";
import { Entity } from "@/models/Entity";
import { RootState } from "@/store";
import { EntityState } from "@/store/slices/entiySlice";
import { closeTab, moveTabByData } from "@/store/slices/tabsSlice";
import React from "react";
import { useSelector } from "react-redux";
import TabBase from "./TabBase";
import { TabData } from "@/types/contentTypes";


interface noteTabProps {
  tabData: TabData;
}

function NoteTab({ tabData }: noteTabProps) {
  const noteState: EntityState = useSelector((state: RootState) => state.notes);
  const note: Entity = noteState.allNotes[tabData.objectID];
  const dispatch = useAppDispatch();

  const onTabDropped = (active: any, over: any) => {
    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData && overData) {
      const activeTab: TabData = {
        objectType: activeData.objectType,
        objectID: activeData.objectID
      };
      const overTab: TabData = {
        objectType: overData.objectType,
        objectID: overData.objectID
      };

      dispatch(moveTabByData({ activeTab, overTab }));
    }
  };

  const onTabClosed = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only close in the unified tabs slice
    dispatch(closeTab(tabData));
  };

  // Fallback if note is not found
  if (!note) {
    return (
      <TabBase
        objectID={tabData.objectID}
        objectType={tabData.objectType}
        displayname="Unknown Note"
        onClose={onTabClosed}
        onDropped={onTabDropped}
      />
    );
  }

  return (
    <TabBase
      objectID={note.id}
      objectType={tabData.objectType}
      displayname={note.title}
      onClose={onTabClosed}
      onDropped={onTabDropped}
    />
  );
}

export default NoteTab;
