"use client";
import {Navigation} from "@/app/_components/navigation";
import dynamic from 'next/dynamic';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

// Importiere den Editor dynamisch und deaktiviere SSR
const Editor = dynamic(() => import('@/components/editor'), { ssr: false });


export default function Home() {
  return (
    <div className="h-full flex dark:bg-[#1F1F1F]">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={15}>
          <Navigation/>
        </ResizablePanel>
        <ResizableHandle/>
        <ResizablePanel defaultSize={85}>
            <Editor onChange={()=>{}}/>
        </ResizablePanel>
      </ResizablePanelGroup>
      
  </div>
  );
}
