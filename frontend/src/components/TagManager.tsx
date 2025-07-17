import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAppDispatch } from '@/hooks';
import { fetchTags, createTag } from '@/store/slices/tagSlice';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Dropdown from '@/components/common/Dropdown';
import {
  Tag as TagIcon,
  Plus,
} from 'lucide-react';
import { Tag } from '@/models/Tag';
import { TagItem } from './TagItem';

interface TagManagerProps {
  children: React.ReactNode;
}

interface NewTag {
  name: string;
  description: string;
  color: string;
  aliases: string[];
  parent: string | null;
}

export const TagManager: React.FC<TagManagerProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { allTags, loading } = useSelector((state: RootState) => state.tags);
  const [open, setOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTag, setNewTag] = useState<NewTag>({
    name: '',
    description: '',
    color: '#6B7280',
    aliases: [],
    parent: null,
  });

  useEffect(() => {
    if (open && Object.keys(allTags).length === 0) {
      dispatch(fetchTags());
    }
  }, [open, dispatch]); // Remove allTags from dependency array to prevent infinite loop


  const createNewTag = async () => {
    if (!newTag.name.trim()) return;

    try {
      await dispatch(createTag({
        name: newTag.name,
        description: newTag.description,
        color: newTag.color,
        parent: newTag.parent,
      }));

      // Reset form
      setNewTag({
        name: '',
        description: '',
        color: '#6B7280',
        aliases: [],
        parent: null,
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent
        className="!max-w-none w-1/2 h-2/3 theme-explorer-background theme-explorer-item-text flex flex-col"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <TagIcon className="w-5 h-5" />
            Tag Manager
          </DialogTitle>
          <DialogDescription>
            Manage your tags, their properties, and relationships.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-shrink-0">
          {/* Create New Tag Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Tags</h3>
            <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Tag
            </Button>
          </div>

          {/* Create Tag Form */}
          {showCreateForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
              <h4 className="font-medium">Create New Tag</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    placeholder="Tag name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="color"
                      value={newTag.color}
                      onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      value={newTag.color}
                      onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTag.description}
                  onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                  placeholder="Tag description (optional)"
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Parent Tag</label>
                <div className="mt-1">
                  <Dropdown
                    value={newTag.parent || 'none'}
                    onChange={(value) => setNewTag({ ...newTag, parent: value === 'none' ? null : value })}
                    placeholder="Select parent tag (optional)"
                    options={[
                      { value: 'none', label: 'No parent' },
                      ...Object.values(allTags).map(tag => ({
                        value: tag.id,
                        label: tag.name,
                        description: tag.description
                      }))
                    ]}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={createNewTag} disabled={!newTag.name.trim()}>
                  Create Tag
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewTag({
                      name: '',
                      description: '',
                      color: '#6B7280',
                      aliases: [],
                      parent: null,
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <Separator />
        </div>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-4 px-6">
            {loading ? (
              <div className="text-center py-8">Loading tags...</div>
            ) : Object.keys(allTags).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tags found. Create your first tag to get started.
              </div>
            ) : (
              Object.values(allTags).map(
                (tag: Tag) => <TagItem tagID={tag.id} key={tag.id} />
              )
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
