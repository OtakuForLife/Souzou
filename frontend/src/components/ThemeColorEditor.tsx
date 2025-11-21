import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { THEME_COLORS_SCHEMA, ThemeColors } from '@/types/themeTypes';
import {
  flattenSchema,
  groupFieldsBySection,
  getByPath,
  getSectionName
} from '@/utils/themeSchemaUtils';

interface ThemeColorEditorProps {
  colors: Partial<ThemeColors>;
  onColorChange: (path: string[], value: string) => void;
  showScrollArea?: boolean;
  scrollHeight?: string;
}

// Generate all color fields from schema
const allColorFields = flattenSchema(THEME_COLORS_SCHEMA);
const fieldsBySection = groupFieldsBySection(allColorFields);

export const ThemeColorEditor: React.FC<ThemeColorEditorProps> = ({
  colors,
  onColorChange,
  showScrollArea = false,
  scrollHeight = '400px'
}) => {
  const content = (
    <div className="space-y-3 pr-4">
      {Object.entries(fieldsBySection).map(([section, fields]) => (
        <div key={section}>
          <Label className="text-xs font-semibold">{getSectionName([section])}</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {fields.map(field => (
              <div key={field.path.join('.')}>
                <Label className="text-xs text-muted-foreground">{field.label}</Label>
                <div className="flex gap-1">
                  <Input
                    type="color"
                    value={getByPath(colors, field.path) || field.default}
                    onChange={(e) => onColorChange(field.path, e.target.value)}
                    className="w-10 h-7 p-0.5"
                  />
                  <Input
                    value={getByPath(colors, field.path) || field.default}
                    onChange={(e) => onColorChange(field.path, e.target.value)}
                    className="flex-1 text-xs h-7"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (showScrollArea) {
    return <ScrollArea className={`h-[${scrollHeight}]`}>{content}</ScrollArea>;
  }

  return content;
};

