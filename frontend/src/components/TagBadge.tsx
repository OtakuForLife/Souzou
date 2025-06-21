import React from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Tag } from '@/models/Tag';

interface TagBadgeProps {
  tag: Tag;
  onRemove?: (tagId: string) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TagBadge: React.FC<TagBadgeProps> = ({
  tag,
  onRemove,
  size = 'sm',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <Badge
      variant="secondary"
      className={`inline-flex items-center gap-1 cursor-pointer hover:opacity-80 ${sizeClasses[size]} ${className} theme-explorer-item-text`}
      style={{ 
        backgroundColor: `${tag.color}30`, 
        borderColor: tag.color,
        border: `1px solid ${tag.color}`
      }}
      title={tag.description || tag.name}
      onClick={(e) => {
        e.stopPropagation();
        if(onRemove) {
          onRemove(tag.id);
        }
      }}
    >
      <span>{tag.name}</span>
      <X className="h-5 w-5"/>
    </Badge>
  );
};
