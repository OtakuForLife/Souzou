import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

import { useAppDispatch } from "@/hooks";
import { TabsState, setCurrentTab } from "@/store/slices/tabsSlice";
import { RootState } from "@/store";
import { useSelector } from "react-redux";

import { Entity } from "@/models/Entity";
import EntityTabTrigger from "./EntityTabTrigger";
import EntityTabContent from "./EntityTabContent";

export default function TabContentGroup() {
  const dispatch = useAppDispatch();
  const tabsState: TabsState = useSelector((state: RootState) => state.tabs);

  const openTabIDs: string[] = tabsState.openTabs.map(
    (t: Entity) => t.id,
  );

  const onTabChange = (tabValue: string) => {
    const tabData: Entity | undefined = tabsState.openTabs.find(
      (e: Entity) => e.id === tabValue
    );
    if (tabData)
      dispatch(setCurrentTab(tabData));
  };

  const currentTabValue = tabsState.currentTab?.id;

  return (
    <Tabs
      className="flex flex-col h-full w-full gap-0 p-0"
      value={currentTabValue}
      onValueChange={onTabChange}
      activationMode="manual"
    >
      <TabsList className="flex justify-start w-full theme-main-tabs-background p-0 gap-2 rounded-none">
        <SortableContext items={openTabIDs} strategy={rectSortingStrategy}>
          {tabsState.openTabs.map((tab: Entity) => (
            <EntityTabTrigger key={tab.id} entityID={tab.id} />
          ))}
        </SortableContext>
      </TabsList>
      <div className="theme-main-content-background theme-main-content-text h-full">
        {tabsState.openTabs.map((tab: Entity) => (
          <TabsContent
            className="outline-2 outline-black data-[state=active]:flex data-[state=active]:flex-col h-full max-h-full"
            key={tab.id}
            value={tab.id}
          >
            <EntityTabContent entity={tab} />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}

