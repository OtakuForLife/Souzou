/**
 * Common utility functions used across the application
 */

import { VALIDATION_RULES } from '@/config/constants';

/**
 * Truncate text to specified length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Validate note title
 */
export const validateNoteTitle = (title: string): { isValid: boolean; error?: string } => {
  if (!title || title.trim().length === 0) {
    return { isValid: false, error: 'Title is required' };
  }

  if (title.length > VALIDATION_RULES.NOTE.TITLE_MAX_LENGTH) {
    return {
      isValid: false,
      error: `Title must be less than ${VALIDATION_RULES.NOTE.TITLE_MAX_LENGTH} characters`
    };
  }

  return { isValid: true };
};

