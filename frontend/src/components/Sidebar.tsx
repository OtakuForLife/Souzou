import React, {useState} from "react";
import { Calendar, Command, Home, Inbox, Search, Settings, Send, ArchiveX, Trash2, File, StickyNote, PanelsTopLeft, ChevronDown, ChevronRight } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInput,
    SidebarMenu,
    SidebarMenuAction,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
  } from "./ui/sidebar";
import { Button } from "./ui/button";
import SettingsDialog from "./SettingsDialog";
import { useAppDispatch } from "../lib/hooks";
import { createNote } from "../lib/slices/notesSlice";

interface AppSidebarProps {
  onIconOneClick: ()=>void
}

export default function AppSidebar({ onIconOneClick }: AppSidebarProps) {
    const dispatch = useAppDispatch();
    
    return (
      <Sidebar
      collapsible="none"
      className="!w-11 bg-skin-secondary text-skin-primary">
        <SidebarHeader>
            <SidebarMenu>
                <SidebarMenuItem className="">
                    <SidebarMenuButton asChild className="cursor-pointer p-1 m-0" onClick={onIconOneClick}>
                        <PanelsTopLeft className=""/>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
            <SidebarGroup>
                <SidebarGroupContent className="">
                    <SidebarMenu>
                        <SidebarMenuItem  className="">
                            <SidebarMenuButton asChild className="cursor-pointer p-1 m-0" onClick={()=>{
                                dispatch(createNote({title: "New Note", content:"", parent:null}));
                            }}>
                                <StickyNote/>
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
                        <SettingsDialog/>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    )
}