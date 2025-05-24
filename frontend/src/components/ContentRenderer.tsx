import { ContentTypeFactory } from "@/types/contentRegistry";
import { TabData } from "@/types/contentTypes";
import React from "react";

// Content renderer component that dynamically renders the appropriate content
interface ContentRendererProps {
  tabData: TabData;
  renderType: 'tab' | 'content';
}

export const ContentRenderer: React.FC<ContentRendererProps> = ({ tabData, renderType }) => {
  try {
    if (renderType === 'tab') {
      const TabComponent = ContentTypeFactory.getTabComponent(tabData.objectType);
      return React.createElement(TabComponent, { tabData });
    } else {
      const ContentComponent = ContentTypeFactory.getContentComponent(tabData.objectType);
      return React.createElement(ContentComponent, { objectID: tabData.objectID });
    }
  } catch (error) {
    console.error('Error rendering content:', error);
    return (
      <div className="p-4 text-red-500">
        Error: Unknown content type "{tabData.objectType}"
      </div>
    );
  }
};