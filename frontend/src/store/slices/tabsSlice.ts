import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TabData, ContentType } from '@/types/contentTypes';

interface TabsState {
  openTabs: TabData[];
  currentTab: TabData | null;
}

const initialState: TabsState = {
  openTabs: [],
  currentTab: null,
};

export const tabsSlice = createSlice({
  name: 'tabs',
  initialState,
  reducers: {
    openTab: (state, action: PayloadAction<TabData>) => {
      const tab = action.payload;

      // Check if tab is already open
      const existingIndex = state.openTabs.findIndex(
        (t) => t.objectType === tab.objectType && t.objectID === tab.objectID
      );

      if (existingIndex === -1) {
        // Add new tab
        state.openTabs.push(tab);
      }

      // Set as current tab
      state.currentTab = tab;
    },

    closeTab: (state, action: PayloadAction<TabData>) => {
      const tab = action.payload;
      const tabIndex = state.openTabs.findIndex(
        (t) => t.objectType === tab.objectType && t.objectID === tab.objectID
      );

      if (tabIndex >= 0) {
        state.openTabs.splice(tabIndex, 1);

        // If the closed tab was the current tab, set current to the last open tab
        if (state.currentTab?.objectType === tab.objectType &&
            state.currentTab?.objectID === tab.objectID) {
          if (state.openTabs.length > 0) {
            const newIndex = Math.max(0, tabIndex - 1);
            state.currentTab = state.openTabs[newIndex];
          } else {
            state.currentTab = null;
          }
        }
      }
    },

    setCurrentTab: (state, action: PayloadAction<TabData>) => {
      const tab = action.payload;

      // Verify the tab is actually open
      const isOpen = state.openTabs.some(
        (t) => t.objectType === tab.objectType && t.objectID === tab.objectID
      );

      if (isOpen) {
        state.currentTab = tab;
      }
    },

    moveTab: (state, action: PayloadAction<{ from: number; to: number }>) => {
      const { from, to } = action.payload;

      if (from >= 0 && from < state.openTabs.length &&
          to >= 0 && to < state.openTabs.length &&
          from !== to) {
        const [movedTab] = state.openTabs.splice(from, 1);
        state.openTabs.splice(to, 0, movedTab);
      }
    },

    moveTabByData: (state, action: PayloadAction<{ activeTab: TabData; overTab: TabData }>) => {
      const { activeTab, overTab } = action.payload;

      const fromIndex = state.openTabs.findIndex(
        (t) => t.objectType === activeTab.objectType && t.objectID === activeTab.objectID
      );
      const toIndex = state.openTabs.findIndex(
        (t) => t.objectType === overTab.objectType && t.objectID === overTab.objectID
      );

      if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
        const [movedTab] = state.openTabs.splice(fromIndex, 1);
        state.openTabs.splice(toIndex, 0, movedTab);
      }
    },

    // Sync tabs from external sources (notes, graphs)
    syncTabsFromSources: (state, action: PayloadAction<{
      openNotes: Array<{ id: string; title: string }>;
      currentNoteId: string | null;
      openGraphs: Array<{ id: string; title: string }>;
      currentGraphId: string | null;
    }>) => {
      const { openNotes, currentNoteId, openGraphs, currentGraphId } = action.payload;

      // Create tab data from sources
      const noteTabs: TabData[] = openNotes.map(note => ({
        objectType: ContentType.NOTE,
        objectID: note.id
      }));

      const graphTabs: TabData[] = openGraphs.map(graph => ({
        objectType: ContentType.GRAPH,
        objectID: graph.id
      }));

      // Update open tabs, preserving order where possible
      const newTabs = [...noteTabs, ...graphTabs];

      // Filter out tabs that are no longer valid
      state.openTabs = state.openTabs.filter(tab =>
        newTabs.some(newTab =>
          newTab.objectType === tab.objectType && newTab.objectID === tab.objectID
        )
      );

      // Add new tabs that aren't already open
      newTabs.forEach(newTab => {
        const exists = state.openTabs.some(tab =>
          tab.objectType === newTab.objectType && tab.objectID === newTab.objectID
        );
        if (!exists) {
          state.openTabs.push(newTab);
        }
      });

      // Update current tab based on sources
      let newCurrentTab: TabData | null = null;
      if (currentNoteId) {
        newCurrentTab = { objectType: ContentType.NOTE, objectID: currentNoteId };
      } else if (currentGraphId) {
        newCurrentTab = { objectType: ContentType.GRAPH, objectID: currentGraphId };
      }

      // Only update current tab if it's actually open
      if (newCurrentTab && state.openTabs.some(tab =>
          tab.objectType === newCurrentTab!.objectType && tab.objectID === newCurrentTab!.objectID
        )) {
        state.currentTab = newCurrentTab;
      } else if (state.openTabs.length > 0) {
        state.currentTab = state.openTabs[0];
      } else {
        state.currentTab = null;
      }
    },

    clearAllTabs: (state) => {
      state.openTabs = [];
      state.currentTab = null;
    }
  },
});

export const {
  openTab,
  closeTab,
  setCurrentTab,
  moveTab,
  moveTabByData,
  syncTabsFromSources,
  clearAllTabs
} = tabsSlice.actions;

export default tabsSlice.reducer;
export type { TabsState };
