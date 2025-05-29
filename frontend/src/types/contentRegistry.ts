import React from 'react';
import { ContentType, ContentTypeRegistryEntry, ContentTypeMetadata, TabData } from './contentTypes';

// Import tab and content components
import NoteTab from '@/components/EntityTabTrigger';
import NoteTabContent from '@/components/EntityTabContent';

// Content type metadata
const contentTypeMetadata: Record<ContentType, ContentTypeMetadata> = {
  [ContentType.NOTE]: {
    type: ContentType.NOTE,
    displayName: 'Note',
    icon: 'FileText',
    defaultTitle: 'New Note'
  }
};

// Content type registry
const contentTypeRegistry: Record<ContentType, ContentTypeRegistryEntry> = {
  [ContentType.NOTE]: {
    metadata: contentTypeMetadata[ContentType.NOTE],
    tabComponent: NoteTab,
    contentComponent: NoteTabContent
  },
};

// Factory functions for creating content type components
export class ContentTypeFactory {
  static getTabComponent(contentType: ContentType): React.ComponentType<{ tabData: TabData }> {
    const entry = contentTypeRegistry[contentType];
    if (!entry) {
      throw new Error(`Unknown content type: ${contentType}`);
    }
    return entry.tabComponent;
  }

  static getContentComponent(contentType: ContentType): React.ComponentType<{ objectID: string }> {
    const entry = contentTypeRegistry[contentType];
    if (!entry) {
      throw new Error(`Unknown content type: ${contentType}`);
    }
    return entry.contentComponent;
  }

  static getMetadata(contentType: ContentType): ContentTypeMetadata {
    const metadata = contentTypeMetadata[contentType];
    if (!metadata) {
      throw new Error(`Unknown content type: ${contentType}`);
    }
    return metadata;
  }

  static getAllContentTypes(): ContentType[] {
    return Object.values(ContentType);
  }

  static isValidContentType(type: string): type is ContentType {
    return Object.values(ContentType).includes(type as ContentType);
  }
}


export { contentTypeRegistry, contentTypeMetadata };
