import { useAppDispatch } from "@/hooks";
import { RootState } from "@/store";
import { GraphState } from "@/store/slices/graphSlice";
import { closeTab, moveTabByData } from "@/store/slices/tabsSlice";
import { GraphContentData } from "@/types/contentTypes";
import React from "react";
import { useSelector } from "react-redux";
import TabBase from "./TabBase";
import { TabData } from "@/types/contentTypes";

interface GraphTabProps {
  tabData: TabData;
}

function GraphTab({ tabData }: GraphTabProps) {
  const graphState: GraphState = useSelector((state: RootState) => state.graphs);
  const graph: GraphContentData = graphState.allGraphs[tabData.objectID];
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

  // Fallback if graph is not found
  if (!graph) {
    return (
      <TabBase
        objectID={tabData.objectID}
        objectType={tabData.objectType}
        displayname="Unknown Graph"
        onClose={onTabClosed}
        onDropped={onTabDropped}
      />
    );
  }

  return (
    <TabBase
      objectID={graph.id}
      objectType={tabData.objectType}
      displayname={graph.title}
      onClose={onTabClosed}
      onDropped={onTabDropped}
    />
  );
}

export default GraphTab;
