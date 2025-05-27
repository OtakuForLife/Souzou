/**
 * Application-wide constants and configuration
 */

// Theme Configuration
export const THEME_CONFIG = {
  DEFAULT_THEME: 'default', // currently not used!
  LOCAL_STORAGE_KEY: 'theme',
} as const;



// API Configuration
export const API_CONFIG = {
  BASE_URL: `http://${import.meta.env.VITE_BACKEND_HOST || 'localhost'}:${import.meta.env.VITE_BACKEND_PORT || '8000'}`,
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  ENDPOINTS: {
    NOTES: '/api/notes/',
    GRAPHS: '/api/graphs/',
    THEMES: '/api/themes/',
  },
} as const;

// UI Configuration
export const UI_CONFIG = {
  SIDEBAR: {
    MIN_SIZE: 10,
    MAX_SIZE: 25,
    DEFAULT_SIZE: 15,
  },
  TAB: {
    MAX_WIDTH: 150,
    MIN_WIDTH: 100,
  },
  DRAG_AND_DROP: {
    ANIMATION_DURATION: 200,
  },
} as const;

// Content Type Configuration
export const CONTENT_TYPE_CONFIG = {
  NOTE: {
    DEFAULT_TITLE: 'New Note',
    DEFAULT_CONTENT: '',
    ICON: 'FileText',
  },
  GRAPH: {
    DEFAULT_TITLE: 'Graph View',
    ICON: 'Network',
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred. Please try again.',
  UNKNOWN_CONTENT_TYPE: 'Unknown content type',
  NOTE_NOT_FOUND: 'Note not found',
  GRAPH_NOT_FOUND: 'Graph not found',
  SAVE_FAILED: 'Failed to save changes',
  DELETE_FAILED: 'Failed to delete item',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  NOTE_CREATED: 'Note created successfully',
  NOTE_SAVED: 'Note saved successfully',
  NOTE_DELETED: 'Note deleted successfully',
  GRAPH_CREATED: 'Graph created successfully',
  GRAPH_SAVED: 'Graph saved successfully',
  GRAPH_DELETED: 'Graph deleted successfully',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  NOTE: {
    TITLE_MAX_LENGTH: 200,
    TITLE_MIN_LENGTH: 1,
    CONTENT_MAX_LENGTH: 50000,
  },
  GRAPH: {
    TITLE_MAX_LENGTH: 200,
    TITLE_MIN_LENGTH: 1,
  },
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: THEME_CONFIG.LOCAL_STORAGE_KEY,
  USER_PREFERENCES: 'user_preferences',
  RECENT_FILES: 'recent_files',
} as const;
