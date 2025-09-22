import { useAppDispatch } from "@/hooks";
import { Entity } from "@/models/Entity";
import { RootState } from "@/store";
import { EntityState } from "@/store/slices/entitySlice";
import { closeTab, moveTabByData } from "@/store/slices/tabsSlice";
import React from "react";
import { useSelector } from "react-redux";
import {Active, Over} from '@dnd-kit/core/dist/store/types';
import TabBase from "./TabBase";


interface noteTabProps {
  entityID: string;
}

function EntityTabTrigger({ entityID }: noteTabProps) {
  const entityState: EntityState = useSelector((state: RootState) => state.entities);
  const entity: Entity | undefined = entityState.allEntities[entityID];
  const dispatch = useAppDispatch();

  if (!entity) {
    // Entity not available yet; avoid rendering a broken tab
    return null;
  }

  const onTabDropped = (active: Active, over: Over | null) => {
    const activeData = active.data.current;
    const overData = over? over.data.current: null;

    if (activeData && overData) {
      const activeTab: Entity | undefined = entityState.allEntities[activeData.objectID];
      const overTab: Entity | undefined = entityState.allEntities[overData.objectID];

      if (activeTab && overTab) {
        dispatch(moveTabByData({ activeTab, overTab }));
      }
    }
  };

  const onTabClosed = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only close in the unified tabs slice
    dispatch(closeTab(entity));
  };

  return (
    <TabBase
      objectID={entity.id}
      objectType={entity.type}
      displayname={entity.title}
      onClose={onTabClosed}
      onDropped={onTabDropped}
    />
  );
}

export default EntityTabTrigger;
