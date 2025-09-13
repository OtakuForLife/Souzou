import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

import { useAppDispatch } from "@/hooks";
import { TabsState, setCurrentTab } from "@/store/slices/tabsSlice";
import { RootState } from "@/store";
import { useSelector } from "react-redux";

import EntityTabTrigger from "./EntityTabTrigger";
import EntityTabContent from "./EntityTabContent";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TabContentGroup() {
  const dispatch = useAppDispatch();
  const tabsState: TabsState = useSelector((state: RootState) => state.tabs);
  const allEntities = useSelector((state: RootState) => state.entities.allEntities);

  const [showSidePanel, setShowSidePanel] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showOutgoingLinks, setShowOutgoingLinks] = useState(false);
  const [showIncomingLinks, setShowIncomingLinks] = useState(false);

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
      <TabsList className="flex-shrink-0 flex items-center justify-start w-full theme-main-tabs-background p-0 gap-2 rounded-none">
        <SortableContext items={openTabIDs} strategy={rectSortingStrategy}>
          {tabsState.openTabs.map((tabId: string) => (
            <EntityTabTrigger key={tabId} entityID={tabId} />
          ))}
        </SortableContext>
        <div className="ml-auto pr-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Tab options"
                className="p-1 rounded hover:bg-muted/50 theme-main-content-text"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="theme-explorer-background theme-explorer-item-text">
              <DropdownMenuLabel>View options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showSidePanel}
                onCheckedChange={(v) => {
                  const next = Boolean(v);
                  if (next) {
                    // If enabling panel while no sections are selected, default to Properties
                    if (!showProperties && !showTags && !showOutgoingLinks && !showIncomingLinks) {
                      setShowProperties(true);
                    }
                  }
                  setShowSidePanel(next);
                }}
              >
                Show side panel
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showProperties}
                onCheckedChange={(v) => {
                  const next = Boolean(v);
                  setShowProperties(next);
                  if (!next && !showTags && !showOutgoingLinks && !showIncomingLinks) {
                    // Hide panel if no section is selected
                    setShowSidePanel(false);
                  } else if (next) {
                    setShowSidePanel(true);
                  }
                }}
                disabled={!showSidePanel}
              >
                Show properties
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showTags}
                onCheckedChange={(v) => {
                  const next = Boolean(v);
                  setShowTags(next);
                  if (!next && !showProperties && !showOutgoingLinks && !showIncomingLinks) {
                    setShowSidePanel(false);
                  } else if (next) {
                    setShowSidePanel(true);
                  }
                }}
                disabled={!showSidePanel}
              >
                Show tags
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showOutgoingLinks}
                onCheckedChange={(v) => {
                  const next = Boolean(v);
                  setShowOutgoingLinks(next);
                  if (!next && !showProperties && !showTags && !showIncomingLinks) {
                    setShowSidePanel(false);
                  } else if (next) {
                    setShowSidePanel(true);
                  }
                }}
                disabled={!showSidePanel}
              >
                Show outgoing links
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showIncomingLinks}
                onCheckedChange={(v) => {
                  const next = Boolean(v);
                  setShowIncomingLinks(next);
                  if (!next && !showProperties && !showTags && !showOutgoingLinks) {
                    setShowSidePanel(false);
                  } else if (next) {
                    setShowSidePanel(true);
                  }
                }}
                disabled={!showSidePanel}
              >
                Show incoming links
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TabsList>
      <div className="flex-1 min-h-0 theme-main-content-background theme-main-content-text">
        {tabsState.openTabs.map((tabId: string) => {
          const entity = allEntities[tabId];
          return entity ? (
            <TabsContent
              className="data-[state=active]:flex data-[state=active]:flex-col h-full max-h-full"
              key={tabId}
              value={tabId}
            >
              <EntityTabContent
                entity={entity}
                showSidePanel={showSidePanel}
                showProperties={showProperties}
                showTags={showTags}
                showOutgoingLinks={showOutgoingLinks}
                showIncomingLinks={showIncomingLinks}
                onSidePanelVisibilityChange={(visible) => setShowSidePanel(visible)}
              />
            </TabsContent>
          ) : null;
        })}
      </div>
    </Tabs>
  );
}

