import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Entity } from '@/models/Entity';

interface TabsState {
  openTabs: string[]; // Array of entity IDs
  currentTab: string | null; // Entity ID
}

const initialState: TabsState = {
  openTabs: [],
  currentTab: null,
};

export const tabsSlice = createSlice({
  name: 'tabs',
  initialState,
  reducers: {
    openTab: (state, action: PayloadAction<Entity>) => {
      const tab = action.payload;

      // Check if tab is already open
      const existingIndex = state.openTabs.findIndex(
        (tabId) => tabId === tab.id
      );

      if (existingIndex === -1) {
        // Add new tab
        state.openTabs.push(tab.id);
      }

      // Set as current tab
      state.currentTab = tab.id;
    },

    closeTab: (state, action: PayloadAction<Entity>) => {
      const tab = action.payload;
      const tabIndex = state.openTabs.findIndex(
        (tabId) => tabId === tab.id
      );

      if (tabIndex >= 0) {
        state.openTabs.splice(tabIndex, 1);

        // If the closed tab was the current tab, set current to the last open tab
        if (state.currentTab === tab.id) {
          if (state.openTabs.length > 0) {
            const newIndex = Math.max(0, tabIndex - 1);
            state.currentTab = state.openTabs[newIndex];
          } else {
            state.currentTab = null;
          }
        }
      }
    },

    setCurrentTab: (state, action: PayloadAction<Entity>) => {
      const tab = action.payload;

      // Verify the tab is actually open
      const isOpen = state.openTabs.some(
        (tabId) => tabId === tab.id
      );

      if (isOpen) {
        state.currentTab = tab.id;
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

    moveTabByData: (state, action: PayloadAction<{ activeTab: Entity; overTab: Entity }>) => {
      const { activeTab, overTab } = action.payload;

      const fromIndex = state.openTabs.findIndex(
        (tabId) => tabId === activeTab.id
      );
      const toIndex = state.openTabs.findIndex(
        (tabId) => tabId === overTab.id
      );

      if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
        const [movedTab] = state.openTabs.splice(fromIndex, 1);
        state.openTabs.splice(toIndex, 0, movedTab);
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
  clearAllTabs
} = tabsSlice.actions;

export default tabsSlice.reducer;
export type { TabsState };
