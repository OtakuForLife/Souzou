import {
  StickyNote,
  Menu,
  LayoutDashboard,
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
import { createEntity } from "@/store/slices/entitySlice";
import { openTab } from "@/store/slices/tabsSlice";
import { CONTENT_TYPE_CONFIG } from "@/config/constants";
import { EntityType } from "@/models/Entity";
import { createDefaultViewContent } from "@/types/widgetTypes";

interface AppSidebarProps {
  onIconOneClick: () => void;
  isNoteTreeCollapsed: boolean;
}

export default function AppSidebar({ onIconOneClick, isNoteTreeCollapsed }: AppSidebarProps) {
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
              {isNoteTreeCollapsed ? <Menu className="rotate-90" />: <Menu className="" />}
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
                      createEntity({
                        title: CONTENT_TYPE_CONFIG.NOTE.DEFAULT_TITLE,
                        content: CONTENT_TYPE_CONFIG.NOTE.DEFAULT_CONTENT,
                        parent: null,
                      }),
                    );

                    // Open the newly created note in a tab
                    if (createEntity.fulfilled.match(result) && result.payload.newNoteData) {
                      dispatch(openTab(result.payload.newNoteData));
                    }
                  }}
                >
                  <StickyNote/>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className="">
                <SidebarMenuButton
                  asChild
                  className="cursor-pointer p-1 m-0"
                  onClick={async () => {
                    const result = await dispatch(createEntity({
                        title: CONTENT_TYPE_CONFIG.VIEW.DEFAULT_TITLE,
                        content: JSON.stringify(createDefaultViewContent()),
                        parent: null,
                        type: EntityType.VIEW
                    }));
    
                    if (createEntity.fulfilled.match(result) && result.payload.newNoteData) {
                        dispatch(openTab(result.payload.newNoteData));
                    }
                  }}
                >
                  <LayoutDashboard/>
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
