'use client'
import { ChevronDown, ChevronRight } from 'lucide-react'; // Icons von shadcn/lucide
import { Entity } from './EntityTree';
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useHasHydrated } from '@/lib/utils';
import { useState } from 'react';


interface NodeProps {
  title: string;
  id: string;
  childNotes: Entity[];
  depth?: number;
}

export const TreeItem = ({ title, id, childNotes, depth = 0}: NodeProps) => {
  const hasHydrated = useHasHydrated();
  const [isOpen, setIsOpen] = useState(false);
  const onClick = () => {
    console.log(id);
  };
  
  if (!hasHydrated) {
    return null;
  }
  if(childNotes.length>0){
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-[350px] space-y-1">
      <div className="flex items-center px-4" style={{ paddingLeft: `${depth * 25}px` }}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-9 p-0">
            {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            <span className="sr-only">Toggle</span>
          </Button>
        </CollapsibleTrigger>
        <button className="bg-transparent hover:bg-gray-200 text-gray-800 font-bold py-1 px-4 rounded inline-flex items-center" onClick={onClick}>
          <span>{title}</span>
        </button>
      </div>
      <CollapsibleContent className="space-y-1">
        {childNotes.map((child) => <TreeItem key={child.id} title={child.title} id={child.id} childNotes={child.childNotes} depth={depth + 1}/>)}
      </CollapsibleContent>
    </Collapsible>
    );
  }
  return (
    <div className="flex items-center ml-2" style={{ paddingLeft: `${depth * 25}px` }}>
      <button className="bg-transparent hover:bg-gray-200 text-gray-800 font-bold py-1 px-4 rounded inline-flex items-center" onClick={onClick}>
        <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
        <span>{title}</span>
      </button>
    </div>
  );
};

