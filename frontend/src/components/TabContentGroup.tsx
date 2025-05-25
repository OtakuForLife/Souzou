import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

import { useAppDispatch } from "@/hooks";
import { TabsState, setCurrentTab } from "@/store/slices/tabsSlice";
import { RootState } from "@/store";
import { useSelector } from "react-redux";

import { ContentRenderer } from "./ContentRenderer";
import { TabData, ContentType } from "@/types/contentTypes";

export default function TabContentGroup() {
  const dispatch = useAppDispatch();
  const tabsState: TabsState = useSelector((state: RootState) => state.tabs);

  const openTabIDs: string[] = tabsState.openTabs.map(
    (t: TabData) => t.objectType + "-" + t.objectID,
  );

  const onTabChange = (tabValue: string) => {
    // More robust parsing: split only on the first dash
    const dashIndex = tabValue.indexOf('-');
    if (dashIndex === -1) return;

    const objectType = tabValue.substring(0, dashIndex);
    const objectID = tabValue.substring(dashIndex + 1);

    const tabData: TabData = { objectType: objectType as ContentType, objectID };

    // Update unified tabs state only
    dispatch(setCurrentTab(tabData));
  };

  const currentTabValue = tabsState.currentTab ? tabsState.currentTab.objectType + "-" + tabsState.currentTab.objectID : "";

  return (
    <Tabs
      className="flex size-full gap-0 p-0"
      value={currentTabValue}
      onValueChange={onTabChange}
      activationMode="manual"
    >
      <TabsList className="flex justify-start w-full theme-main-tabs-background p-0 gap-2 rounded-none">
        <SortableContext items={openTabIDs} strategy={rectSortingStrategy}>
          {tabsState.openTabs.map((tab: TabData) => (
            <ContentRenderer
              key={tab.objectType + "-" + tab.objectID}
              tabData={tab}
              renderType="tab"
            />
          ))}
        </SortableContext>
      </TabsList>
      <div className="pb-2 w-full h-full">
        {tabsState.openTabs.map((tab: TabData) => (
          <TabsContent
            className="w-full h-full max-w-full max-h-full p-4 theme-main-content-background theme-main-content-text outline-2 outline-black"
            key={tab.objectType + "-" + tab.objectID}
            value={tab.objectType + "-" + tab.objectID}
          >
            <ContentRenderer
              tabData={tab}
              renderType="content"
            />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

