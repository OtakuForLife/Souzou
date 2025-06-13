import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

import { useAppDispatch } from "@/hooks";
import { TabsState, setCurrentTab } from "@/store/slices/tabsSlice";
import { RootState } from "@/store";
import { useSelector } from "react-redux";

import EntityTabTrigger from "./EntityTabTrigger";
import EntityTabContent from "./EntityTabContent";

export default function TabContentGroup() {
  const dispatch = useAppDispatch();
  const tabsState: TabsState = useSelector((state: RootState) => state.tabs);
  const allEntities = useSelector((state: RootState) => state.entities.allEntities);

  const openTabIDs: string[] = tabsState.openTabs;

  const onTabChange = (tabValue: string) => {
    const entity = allEntities[tabValue];
    if (entity) {
      dispatch(setCurrentTab(entity));
    }
  };

  const currentTabValue = tabsState.currentTab || openTabIDs[0];

  return (
    <Tabs
      className="flex flex-col h-full w-full gap-0 p-0"
      value={currentTabValue}
      onValueChange={onTabChange}
      activationMode="manual"
    >
      <TabsList className="flex-shrink-0 flex justify-start w-full theme-main-tabs-background p-0 gap-2 rounded-none">
        <SortableContext items={openTabIDs} strategy={rectSortingStrategy}>
          {tabsState.openTabs.map((tabId: string) => (
            <EntityTabTrigger key={tabId} entityID={tabId} />
          ))}
        </SortableContext>
      </TabsList>
      <div className="flex-1 min-h-0 theme-main-content-background theme-main-content-text">
        {tabsState.openTabs.map((tabId: string) => {
          const entity = allEntities[tabId];
          return entity ? (
            <TabsContent
              className="outline-2 outline-black data-[state=active]:flex data-[state=active]:flex-col h-full max-h-full"
              key={tabId}
              value={tabId}
            >
              <EntityTabContent entity={entity} />
            </TabsContent>
          ) : null;
        })}
      </div>
    </Tabs>
  );
}

