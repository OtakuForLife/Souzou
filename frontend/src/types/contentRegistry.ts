import React from 'react';

// Import tab and content components
import { EntityType } from '@/models/Entity';
import NoteRenderer from '@/components/render/note/NoteRenderer';
import ViewRenderer from '@/components/render/view/ViewRenderer';
import MediaRenderer from '@/components/render/media/MediaRenderer';
import {EntityRendererProps} from '@/components/ContentRenderer'

// Content type metadata
interface EntityTypeMetadata {
  type: EntityType;
  defaultCreationTitle: string;
}

interface ContentTypeRegistryEntry {
  metadata: EntityTypeMetadata;
  contentComponent: React.ComponentType<EntityRendererProps>;
}


const entityTypeMetadata: Record<EntityType, EntityTypeMetadata> = {
  [EntityType.NOTE]: {
    type: EntityType.NOTE,
    defaultCreationTitle: 'New Note'
  },
  [EntityType.VIEW]: {
    type: EntityType.VIEW,
    defaultCreationTitle: 'New Dashboard'
  },
  [EntityType.MEDIA]: {
    type: EntityType.MEDIA,
    defaultCreationTitle: 'New Media'
  }
};

// Content type registry
const contentTypeRegistry: Record<EntityType, ContentTypeRegistryEntry> = {
  [EntityType.NOTE]: {
    metadata: entityTypeMetadata[EntityType.NOTE],
    contentComponent: NoteRenderer
  },
  [EntityType.VIEW]: {
    metadata: entityTypeMetadata[EntityType.VIEW],
    contentComponent: ViewRenderer
  },
  [EntityType.MEDIA]: {
    metadata: entityTypeMetadata[EntityType.MEDIA],
    contentComponent: MediaRenderer
  },
};

// Factory functions for creating content type components
export class ContentTypeFactory {

  static getContentComponent(contentType: EntityType): React.ComponentType<EntityRendererProps> {
    const entry = contentTypeRegistry[contentType];
    if (!entry) {
      throw new Error(`Unknown content type: ${contentType}`);
    }
    return entry.contentComponent;
  }

  static getMetadata(contentType: EntityType): EntityTypeMetadata {
    const metadata = entityTypeMetadata[contentType];
    if (!metadata) {
      throw new Error(`Unknown content type: ${contentType}`);
    }
    return metadata;
  }

  static getAllContentTypes(): EntityType[] {
    return Object.values(EntityType);
  }

  static isValidContentType(type: string): type is EntityType {
    return Object.values(EntityType).includes(type as EntityType);
  }
}


export { contentTypeRegistry, entityTypeMetadata };
