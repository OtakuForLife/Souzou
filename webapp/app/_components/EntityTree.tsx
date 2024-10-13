'use client'
import { TreeItem } from './EntityTreeItem';
import {useHasHydrated} from '@/lib/utils';

interface Entity {
  id: string;
  title: string;
  content: string;
  childNotes: Entity[];
}

interface EntityTreeProps {
    nodes: Entity[];
}

export const EntityTree = ({ nodes }: EntityTreeProps) => {
  const hasHydrated = useHasHydrated();
  if (!hasHydrated) {
    return null;
  }
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Notes</h1>
      {nodes.map((node) => (
        <TreeItem key={node.id} title={node.title} id={node.id} childNotes={node.childNotes} />
      ))}
    </div>
  );
};

export type { Entity };