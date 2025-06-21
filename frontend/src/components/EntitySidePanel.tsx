import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { fetchTags } from '@/store/slices/tagSlice';
import { TagInput } from './TagInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppDispatch } from '@/hooks';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  X,
  Hash,
  Type,
  CheckSquare,
  Calendar,
  Link,
  MoreHorizontal
} from 'lucide-react';
import { updateEntity } from '@/store/slices/entitySlice';

interface EntitySidePanelProps {
  currentEntityId?: string;
}

// Property types that can be added
type PropertyType = 'text' | 'number' | 'checkbox' | 'date' | 'url' | 'multitext';

interface PropertyTypeDefinition {
  type: PropertyType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultValue: any;
}

const PROPERTY_TYPES: PropertyTypeDefinition[] = [
  { type: 'text', label: 'Text', icon: Type, defaultValue: '' },
  { type: 'number', label: 'Number', icon: Hash, defaultValue: 0 },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, defaultValue: false },
  { type: 'date', label: 'Date', icon: Calendar, defaultValue: '' },
  { type: 'url', label: 'URL', icon: Link, defaultValue: '' },
  { type: 'multitext', label: 'Multi-text', icon: MoreHorizontal, defaultValue: '' },
];

export const EntitySidePanel: React.FC<EntitySidePanelProps> = ({ currentEntityId }) => {
  const dispatch = useAppDispatch();
  const { allTags } = useSelector((state: RootState) => state.tags);
  const { allEntities } = useSelector((state: RootState) => state.entities);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newPropertyType, setNewPropertyType] = useState<PropertyType>('text');

  const currentEntity = currentEntityId ? allEntities[currentEntityId] : null;

  useEffect(() => {
    if (Object.keys(allTags).length === 0) {
      dispatch(fetchTags());
    }
  }, [dispatch, allTags]);

  const currentEntityTags = currentEntity?.tags || [];

  // Get all custom properties from metadata
  const customProperties = currentEntity?.metadata || {};

  // Handle property updates
  const handlePropertyUpdate = (key: string, value: any) => {
    if (!currentEntity) return;

    const updates = {
      noteID: currentEntity.id,
      metadata: {
        ...currentEntity.metadata,
        [key]: value
      }
    };

    dispatch(updateEntity(updates));
  };

  // Add new property
  const handleAddProperty = () => {
    if (!currentEntity || !newPropertyName.trim()) return;

    const propertyType = PROPERTY_TYPES.find(t => t.type === newPropertyType);
    if (!propertyType) return;

    const updates = {
      noteID: currentEntity.id,
      metadata: {
        ...currentEntity.metadata,
        [newPropertyName.trim()]: propertyType.defaultValue
      }
    };

    dispatch(updateEntity(updates));
    setNewPropertyName('');
    setNewPropertyType('text');
    setShowAddProperty(false);
  };

  // Delete property
  const handleDeleteProperty = (key: string) => {
    if (!currentEntity) return;

    const newMetadata = { ...currentEntity.metadata };
    delete newMetadata[key];

    const updates = {
      noteID: currentEntity.id,
      metadata: newMetadata
    };

    dispatch(updateEntity(updates));
  };



  // Determine property type from value
  const getPropertyType = (value: any): PropertyType => {
    if (typeof value === 'boolean') return 'checkbox';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') {
      if (value.includes('\n')) return 'multitext';
      if (value.startsWith('http://') || value.startsWith('https://')) return 'url';
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) return 'date';
    }
    return 'text';
  };

  // Render property input based on type
  const renderPropertyInput = (key: string, value: any, type: PropertyType) => {
    const commonProps = {
      className: "text-sm flex-1 min-w-0",
      value: value || (type === 'number' ? 0 : ''),
      onChange: (e: any) => {
        const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
        handlePropertyUpdate(key, newValue);
      }
    };

    switch (type) {
      case 'checkbox':
        return (
          <Checkbox
            checked={Boolean(value)}
            onCheckedChange={(checked) => handlePropertyUpdate(key, checked)}
            className="ml-1"
          />
        );
      case 'number':
        return <Input type="number" {...commonProps} />;
      case 'date':
        return <Input type="date" {...commonProps} />;
      case 'url':
        return <Input type="url" {...commonProps} placeholder="https://" />;
      case 'multitext':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handlePropertyUpdate(key, e.target.value)}
            className="min-h-[60px] text-sm flex-1 min-w-0"
            rows={2}
          />
        );
      default:
        return <Input {...commonProps} placeholder="Empty" />;
    }
  };

  // Render a single property row
  const renderPropertyRow = (key: string, value: any) => {
    const type = getPropertyType(value);
    const typeDefinition = PROPERTY_TYPES.find(t => t.type === type);
    const IconComponent = typeDefinition?.icon || Type;

    return (
      <div key={key} className="flex items-center gap-3 py-2 px-3 hover:bg-muted/50 rounded-md group">
        <IconComponent className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
        <div className="flex items-center gap-2">
          <span className="w-20 text-sm font-medium text-muted-foreground truncate">
            {key}
          </span>
          <div className="w-full">
            {renderPropertyInput(key, value, type)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteProperty(key)}
            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col theme-explorer-background theme-explorer-item-text">
      <ResizablePanelGroup direction="vertical" tagName="div" className="h-full w-full">
        <ResizablePanel className="theme-explorer-background border-r" minSize={30} maxSize={70} defaultSize={50} collapsible={true}>
          {/* Properties */}
          <ScrollArea className="flex-1">
            <div className="p-3">
              <h2 className="text-lg font-semibold mb-4 px-3">Properties</h2>
              {currentEntity ? (
                <div className="space-y-1">
                  {/* Render existing properties */}
                  {Object.entries(customProperties).map(([key, value]) =>
                    renderPropertyRow(key, value)
                  )}

                  {/* Add Property Section */}
                  {showAddProperty ? (
                    <div className="px-3 py-2 space-y-2 border rounded-md bg-muted/20">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Property name"
                          value={newPropertyName}
                          onChange={(e) => setNewPropertyName(e.target.value)}
                          className="text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddProperty();
                            } else if (e.key === 'Escape') {
                              setShowAddProperty(false);
                              setNewPropertyName('');
                            }
                          }}
                        />
                        <Select value={newPropertyType} onValueChange={(value: PropertyType) => setNewPropertyType(value)}>
                          <SelectTrigger className="w-32 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className='theme-explorer-background theme-explorer-item-text'>
                            {PROPERTY_TYPES.map(type => (
                              <SelectItem key={type.type} value={type.type}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="w-3 h-3" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleAddProperty}
                          disabled={!newPropertyName.trim()}
                          className="text-xs"
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowAddProperty(false);
                            setNewPropertyName('');
                          }}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddProperty(true)}
                      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add property
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground px-3">No entity selected</p>
              )}
            </div>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle className="w-1 theme-explorer-background" />
        <ResizablePanel className="theme-explorer-background" minSize={40} maxSize={70} defaultSize={60} collapsible={true}>
          {/* Tags Section */}
          <ScrollArea className="flex-1 h-full">
            <div className="p-3">
              <h2 className="text-lg font-semibold mb-4 px-3">Tags</h2>

              {/* Tag Input Component */}
              {currentEntity && (
                <div className="mb-6 px-3">
                  <TagInput
                    entityId={currentEntity.id}
                    currentTags={currentEntityTags}
                  />
                </div>
              )}
            </div>
          </ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
