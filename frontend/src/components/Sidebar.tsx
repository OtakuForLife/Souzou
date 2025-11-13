import {
  StickyNote,
  LayoutDashboard,
  Tag,
  Upload,
  Menu,
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
import { TagManager } from "./TagManager";
import { useAppDispatch } from "@/hooks";
import { createEntity } from "@/store/slices/entitySlice";
import { openTab } from "@/store/slices/tabsSlice";
import { CONTENT_TYPE_CONFIG } from "@/config/constants";
import { EntityType } from "@/models/Entity";
import { createDefaultViewContent } from "@/types/widgetTypes";
import { useDialog } from "@/contexts/DialogContext";

interface AppSidebarProps {
  onToggleNoteTree: () => void;
  isNoteTreeVisible: boolean;
}

export default function AppSidebar({ onToggleNoteTree, isNoteTreeVisible }: AppSidebarProps) {
  const dispatch = useAppDispatch();
  const { openFileUpload } = useDialog();

  return (
    <Sidebar
      collapsible="none"
      className="min-w-11 !w-11 theme-sidebar-background theme-sidebar-text"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="cursor-pointer p-1 m-0"
              onClick={onToggleNoteTree}
            >
              <Menu className={isNoteTreeVisible ? "" : "rotate-90"} />
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
                      dispatch(openTab(result.payload.newNoteData.id));
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
                        dispatch(openTab(result.payload.newNoteData.id));
                    }
                  }}
                >
                  <LayoutDashboard/>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className="">
                <SidebarMenuButton
                  asChild
                  className="cursor-pointer p-1 m-0"
                  onClick={() => openFileUpload(null)}
                >
                  <Upload/>
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
              <TagManager>
                <Tag className="w-full h-full p-1 cursor-pointer" />
              </TagManager>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
