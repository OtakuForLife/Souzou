import {
  StickyNote,
  PanelsTopLeft,
  ChartNetwork,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import SettingsDialog from "./SettingsDialog";
import { useAppDispatch } from "@/hooks";
import { createNote } from "@/store/slices/notesSlice";
import { createGraph } from "@/store/slices/graphSlice";
import { openTab } from "@/store/slices/tabsSlice";
import { createSampleGraph } from "@/utils/testGraphData";
import { ContentType } from "@/types/contentTypes";
import { CONTENT_TYPE_CONFIG } from "@/config/constants";

interface AppSidebarProps {
  onIconOneClick: () => void;
}

export default function AppSidebar({ onIconOneClick }: AppSidebarProps) {
  const dispatch = useAppDispatch();

  return (
    <Sidebar
      collapsible="none"
      className="min-w-11 !w-11 theme-sidebar-background theme-sidebar-text"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="">
            <SidebarMenuButton
              asChild
              className="cursor-pointer p-1 m-0"
              onClick={onIconOneClick}
            >
              <PanelsTopLeft className="" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="">
            <SidebarMenu>
              <SidebarMenuItem className="">
                <SidebarMenuButton
                  asChild
                  className="cursor-pointer p-1 m-0"
                  onClick={async () => {
                    const result = await dispatch(
                      createNote({
                        title: CONTENT_TYPE_CONFIG.NOTE.DEFAULT_TITLE,
                        content: CONTENT_TYPE_CONFIG.NOTE.DEFAULT_CONTENT,
                        parent: null,
                      }),
                    );

                    // Open the newly created note in a tab
                    if (createNote.fulfilled.match(result) && result.payload.newNoteData) {
                      dispatch(openTab({
                        objectType: ContentType.NOTE,
                        objectID: result.payload.newNoteData.id
                      }));
                    }
                  }}
                >
                  <StickyNote/>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu>
              <SidebarMenuItem className="">
                <SidebarMenuButton
                  asChild
                  className="cursor-pointer p-1 m-0"
                  onClick={async () => {
                    const sampleGraph = createSampleGraph();
                    sampleGraph.title = CONTENT_TYPE_CONFIG.GRAPH.DEFAULT_TITLE;

                    // Add the graph to the store first
                    const result = await dispatch(createGraph(sampleGraph));

                    // Then open it in a tab using the new ID from the store
                    if (createGraph.fulfilled.match(result) && result.payload) {
                      dispatch(openTab({
                        objectType: ContentType.GRAPH,
                        objectID: result.payload.id
                      }));
                    }
                  }}
                >
                  <ChartNetwork />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="p-1 m-0">
              <SettingsDialog />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
