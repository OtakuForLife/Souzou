import { useAppDispatch, useAppSelector } from "@/hooks";
import { Tag } from "@/models/Tag";
import { RootState } from "@/store";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ChevronDown, ChevronRight, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import Dropdown from "./common/Dropdown";
import { useState } from "react";
import { updateTag, deleteEntityTag } from "@/store/slices/tagSlice";


interface TagItemProps {
    tagID: string;
}

export const TagItem: React.FC<TagItemProps> = ({
    tagID,
}) => {
    const dispatch = useAppDispatch();
    const tag: Tag = useAppSelector((state: RootState) => state.tags.allTags[tagID]);
    const allTags = useAppSelector((state: RootState) => state.tags.allTags);

    const [editingTag, setEditingTag] = useState<Tag>({...tag});
    const [newAlias, setNewAlias] = useState<string>('');
    const [isExpanded, setIsExpanded] = useState(false);

    const saveTag = async () => {
        try {
          await dispatch(updateTag({
            id: editingTag.id,
            tagData: {
              name: editingTag.name,
              description: editingTag.description,
              color: editingTag.color,
              parent: editingTag.parent,
            }
          }));
        } catch (error) {
          console.error('Failed to save tag:', error);
        }
      };

    const deleteTag = async (tagId: string) => {
          try {
            dispatch(deleteEntityTag(tagId));
          } catch (error) {
            console.error('Failed to delete tag:', error);
          }
      };

    const addAlias = () => {
        if (newAlias.trim() && !editingTag.aliases.includes(newAlias.trim())) {
            setEditingTag({
                ...editingTag,
                aliases: [...editingTag.aliases, newAlias.trim()]
            });
            setNewAlias('');
        }
    };

    const removeAlias = (index: number) => {
        setEditingTag({
            ...editingTag,
            aliases: editingTag.aliases.filter((_, i) => i !== index)
        });
    };

    return (
        <div key={tag.id} className="border rounded-lg p-3 space-y-2">
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2 p-0 h-auto">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <Badge
                                style={{ backgroundColor: `${tag.color}30`, borderColor: tag.color }}
                                className="text-sm"
                            >
                                {tag.name}
                            </Badge>
                        </Button>
                    </CollapsibleTrigger>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {tag.entities_count} entities
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTag(tag.id)}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                </div>

                <CollapsibleContent className="space-y-4">
                    <div className="space-y-4 p-4 bg-muted/20 rounded-md">
                        {/* Name */}
                        <div>
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                value={tag.name}
                                onChange={(e) => setEditingTag({ ...tag, name: e.target.value })}
                                className="mt-1"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                value={tag.description}
                                onChange={(e) => setEditingTag({ ...editingTag, description: e.target.value })}
                                className="mt-1"
                                rows={3}
                            />
                        </div>

                        {/* Color */}
                        <div>
                            <label className="text-sm font-medium">Color</label>
                            <div className="flex items-center gap-2 mt-1">
                                <Input
                                    type="color"
                                    value={tag.color}
                                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                                    className="w-12 h-8 p-1"
                                />
                                <Input
                                    value={tag.color}
                                    onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                                    className="flex-1"
                                />
                            </div>
                        </div>

                        {/* Parent Tag */}
                        <div>
                            <label className="text-sm font-medium">Parent Tag</label>
                            <div className="mt-1">
                                <Dropdown
                                    value={editingTag.parent || 'none'}
                                    onChange={(value) => setEditingTag({ ...editingTag, parent: value })}
                                    placeholder="Select parent tag (optional)"
                                    options={[
                                        { value: 'none', label: 'No parent' },
                                        ...Object.values(allTags).map((tag: Tag) => ({
                                            value: tag.id,
                                            label: tag.name,
                                            description: tag.description
                                        }))
                                    ]}
                                />
                            </div>
                        </div>

                        {/* Aliases */}
                        <div>
                            <label className="text-sm font-medium">Aliases</label>
                            <div className="space-y-2 mt-1">
                                <div className="flex flex-wrap gap-1">
                                    {editingTag.aliases && editingTag.aliases.map((alias, index) => (
                                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                                            {alias}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeAlias(index)}
                                                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                            >
                                                <X className="w-2 h-2" />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add alias"
                                        value={newAlias}
                                        onChange={(e) => setNewAlias(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                addAlias();
                                            }
                                        }}
                                        className="flex-1"
                                    />
                                    <Button onClick={addAlias} size="sm" disabled={!newAlias.trim()}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button onClick={saveTag} size="sm">
                                <Save className="w-4 h-4 mr-2" />
                                Save
                            </Button>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};