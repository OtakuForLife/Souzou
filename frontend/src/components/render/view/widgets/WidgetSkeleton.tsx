/**
 * Widget Skeleton Components
 * 
 * Provides loading states and error displays for widgets
 */

import React from 'react';
import { WidgetConfig, WidgetType } from '@/types/widgetTypes';

interface WidgetSkeletonProps {
  widget?: WidgetConfig;
  className?: string;
}

interface WidgetErrorProps {
  error: Error;
  onRetry?: () => void;
  className?: string;
}

/**
 * Skeleton patterns for different widget types
 */
const SKELETON_PATTERNS: { [K in WidgetType]?: React.ReactNode } = {
  [WidgetType.GRAPH]: (
    <div className="space-y-4">
      {/* Graph nodes simulation */}
      <div className="flex justify-center space-x-4">
        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
      </div>
      {/* Graph connections simulation */}
      <div className="flex justify-center space-x-8">
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
      </div>
      {/* Bottom nodes */}
      <div className="flex justify-center space-x-6">
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  ),
  [WidgetType.NOTE]: (
    <div className="space-y-4">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="h-32 bg-gray-300 rounded"></div>
      <div className="h-4 bg-gray-300 rounded w-2/3"></div>
    </div>
    ),
};

/**
 * Default skeleton pattern for unknown widget types
 */
const DEFAULT_SKELETON = (
  <div className="space-y-4">
    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    <div className="h-32 bg-gray-300 rounded"></div>
    <div className="h-4 bg-gray-300 rounded w-2/3"></div>
  </div>
);

/**
 * Widget skeleton component with automatic sizing and type-specific patterns
 */
export const WidgetSkeleton: React.FC<WidgetSkeletonProps> = ({ 
  widget, 
  className = '' 
}) => {
  // Calculate dimensions based on widget configuration
  const width = widget ? `${widget.position.w * 100}px` : '100%';
  const height = widget ? `${widget.position.h * 50}px` : '200px';
  
  // Get skeleton pattern for widget type
  const skeletonPattern = widget?.type 
    ? SKELETON_PATTERNS[widget?.type] || DEFAULT_SKELETON
    : DEFAULT_SKELETON;

  return (
    <div 
      className={`animate-pulse bg-gray-100 rounded-lg border border-gray-200 p-4 ${className}`}
      style={{ width, height, minHeight: '120px' }}
    >
      {skeletonPattern}
    </div>
  );
};

/**
 * Widget error component with retry functionality
 */
export const WidgetError: React.FC<WidgetErrorProps> = ({ 
  error, 
  onRetry,
  className = '' 
}) => {
  return (
    <div className={`h-full w-full flex items-center justify-center p-4 ${className}`}>
      <div className="text-center max-w-md">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="w-6 h-6 bg-red-500 rounded-full"></div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Widget Error</h3>
        
        <p className="text-sm text-gray-600 mb-4">
          {error.message || 'An unexpected error occurred while loading this widget.'}
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        )}
        
        <details className="mt-4 text-left">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
            Technical Details
          </summary>
          <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto">
            {error.stack || error.toString()}
          </pre>
        </details>
      </div>
    </div>
  );
};

/**
 * Widget loading component
 */
export const WidgetLoading: React.FC<{ message?: string; className?: string }> = ({ 
  message = 'Loading widget...', 
  className = '' 
}) => {
  return (
    <div className={`h-full w-full flex items-center justify-center p-4 ${className}`}>
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
};
