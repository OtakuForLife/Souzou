"use client";

import { ChevronsLeft, MenuIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { ElementRef, useCallback, useEffect, useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { cn } from "@/lib/utils";
import {EntityTree} from "./EntityTree";


export const Navigation = () => {

    return (
        <div
        className="group/sidebar h-full bg-secondary overflow-y-auto relative flex w-full flex-col z-[99999]">
            <div className="mt-4">
                <EntityTree nodes={[
                    {id: "0", title: "Test Item", content: "Test Content", childNotes: []},
                    {id: "1", title: "Test Folder 1", content: "Test Folder", childNotes: [
                        {id: "2", title: "Test Item 2", content: "Test Content 2", childNotes: []}
                    ]}]}/>
            </div>
        </div>
    );
}