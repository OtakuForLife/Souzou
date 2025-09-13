import React, { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppDispatch } from "@/hooks";
import { updateEntity } from "@/store/slices/entitySlice";
import { Type, Hash, CheckSquare, Calendar, Link, MoreHorizontal, X, Plus } from "lucide-react";

import type { Entity } from "@/models/Entity";

type PropertyType = "text" | "number" | "checkbox" | "date" | "url" | "multitext";

interface PropertyTypeDefinition {
  type: PropertyType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultValue: any;
}

const PROPERTY_TYPES: PropertyTypeDefinition[] = [
  { type: "text", label: "Text", icon: Type, defaultValue: "" },
  { type: "number", label: "Number", icon: Hash, defaultValue: 0 },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, defaultValue: false },
  { type: "date", label: "Date", icon: Calendar, defaultValue: "" },
  { type: "url", label: "URL", icon: Link, defaultValue: "" },
  { type: "multitext", label: "Multi-text", icon: MoreHorizontal, defaultValue: "" },
];

function getPropertyType(value: any): PropertyType {
  if (typeof value === "boolean") return "checkbox";
  if (typeof value === "number") return "number";
  if (typeof value === "string") {
    if (value.includes("\n")) return "multitext";
    if (value.startsWith("http://") || value.startsWith("https://")) return "url";
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) return "date";
  }
  return "text";
}

export interface PropertiesSectionProps {
  currentEntity: Entity | null;
}

const PropertiesSection: React.FC<PropertiesSectionProps> = ({ currentEntity }) => {
  const dispatch = useAppDispatch();
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newPropertyName, setNewPropertyName] = useState("");
  const [newPropertyType, setNewPropertyType] = useState<PropertyType>("text");

  const customProperties = useMemo(() => currentEntity?.metadata || {}, [currentEntity]);

  const handlePropertyUpdate = (key: string, value: any) => {
    if (!currentEntity) return;
    dispatch(
      updateEntity({
        noteID: currentEntity.id,
        metadata: {
          ...currentEntity.metadata,
          [key]: value,
        },
      })
    );
  };

  const handleAddProperty = () => {
    if (!currentEntity || !newPropertyName.trim()) return;
    const def = PROPERTY_TYPES.find((t) => t.type === newPropertyType);
    if (!def) return;
    dispatch(
      updateEntity({
        noteID: currentEntity.id,
        metadata: {
          ...currentEntity.metadata,
          [newPropertyName.trim()]: def.defaultValue,
        },
      })
    );
    setNewPropertyName("");
    setNewPropertyType("text");
    setShowAddProperty(false);
  };

  const handleDeleteProperty = (key: string) => {
    if (!currentEntity) return;
    const newMetadata = { ...currentEntity.metadata } as any;
    delete newMetadata[key];
    dispatch(updateEntity({ noteID: currentEntity.id, metadata: newMetadata }));
  };

  const renderPropertyInput = (key: string, value: any, type: PropertyType) => {
    const commonProps: any = {
      className: "text-sm flex-1 min-w-0",
      value: value ?? (type === "number" ? 0 : ""),
      onChange: (e: any) => {
        const newValue = type === "number" ? parseFloat(e.target.value) || 0 : e.target.value;
        handlePropertyUpdate(key, newValue);
      },
    };

    switch (type) {
      case "checkbox":
        return (
          <Checkbox
            checked={Boolean(value)}
            onCheckedChange={(checked) => handlePropertyUpdate(key, checked)}
            className="ml-1"
          />
        );
      case "number":
        return <Input type="number" {...commonProps} />;
      case "date":
        return <Input type="date" {...commonProps} />;
      case "url":
        return <Input type="url" {...commonProps} placeholder="https://" />;
      case "multitext":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => handlePropertyUpdate(key, e.target.value)}
            className="min-h-[60px] text-sm flex-1 min-w-0"
            rows={2}
          />
        );
      default:
        return <Input {...commonProps} placeholder="Empty" />;
    }
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-3">
        <h2 className="text-lg font-semibold mb-4 px-3">Properties</h2>
        {currentEntity ? (
          <div className="space-y-1">
            {Object.entries(customProperties).map(([key, value]) => {
              const type = getPropertyType(value);
              const def = PROPERTY_TYPES.find((t) => t.type === type);
              const IconComponent = (def?.icon || Type) as any;
              return (
                <div key={key} className="flex items-center gap-3 py-2 px-3 hover:bg-muted/50 rounded-md group">
                  <IconComponent className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  <div className="flex items-center gap-2">
                    <span className="w-20 text-sm font-medium text-muted-foreground truncate">{key}</span>
                    <div className="w-full">{renderPropertyInput(key, value, type)}</div>
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
            })}

            {showAddProperty ? (
              <div className="px-3 py-2 space-y-2 border rounded-md bg-muted/20">
                <div className="flex gap-2">
                  <Input
                    placeholder="Property name"
                    value={newPropertyName}
                    onChange={(e) => setNewPropertyName(e.target.value)}
                    className="text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddProperty();
                      else if (e.key === "Escape") {
                        setShowAddProperty(false);
                        setNewPropertyName("");
                      }
                    }}
                  />
                  <Select value={newPropertyType} onValueChange={(v: PropertyType) => setNewPropertyType(v)}>
                    <SelectTrigger className="w-32 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="theme-explorer-background theme-explorer-item-text">
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItem key={t.type} value={t.type}>
                          <div className="flex items-center gap-2">
                            <t.icon className="w-3 h-3" />
                            {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddProperty} disabled={!newPropertyName.trim()} className="text-xs">
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setShowAddProperty(false);
                      setNewPropertyName("");
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
  );
};

export default PropertiesSection;

