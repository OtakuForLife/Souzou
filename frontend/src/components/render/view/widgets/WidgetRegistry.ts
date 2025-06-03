/**
 * Simplified Widget Registry System
 * 
 * This module provides a clean, minimal way to register and discover widgets.
 * Adding a new widget type requires only adding a definition to this registry.
 */

import React from 'react';
import { WidgetType, WidgetConfigForType, GridPosition, WIDGET_CONSTRAINTS } from '@/types/widgetTypes';

/**
 * Minimal widget definition - everything needed to register a widget
 */
export interface WidgetDefinition<T extends WidgetType> {
  type: T;
  displayName: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<WidgetProps<T>>;
  configComponent: React.ComponentType<WidgetConfigProps<T>>;
  defaultConfig: WidgetConfigForType<T>['config'];
  constraints?: Partial<Required<Pick<GridPosition, 'minW' | 'minH' | 'maxW' | 'maxH'>>>;
}

/**
 * Widget component props interface
 */
export interface WidgetProps<T extends WidgetType> {
  widget: WidgetConfigForType<T>;
  mode?: 'render' | 'config';
  onUpdate?: (updates: Partial<WidgetConfigForType<T>>) => void;
  onDelete?: () => void;
}

/**
 * Widget configuration component props interface
 */
export interface WidgetConfigProps<T extends WidgetType> {
  widget: WidgetConfigForType<T>;
  onSave: (config: WidgetConfigForType<T>['config']) => void;
  onCancel: () => void;
}

/**
 * Widget Registry - Central registry for all widget types
 */
export class WidgetRegistry {
  private static widgets = new Map<WidgetType, WidgetDefinition<any>>();

  /**
   * Register a widget with the system
   * @param definition Widget definition
   */
  static register<T extends WidgetType>(definition: WidgetDefinition<T>): void {
    if (this.widgets.has(definition.type)) {
      console.warn(`Widget type '${definition.type}' is already registered. Overwriting.`);
    }

    // Merge with default constraints
    const constraints = {
      ...WIDGET_CONSTRAINTS[definition.type],
      ...definition.constraints
    };

    const fullDefinition = {
      ...definition,
      constraints,
      description: definition.description || `${definition.displayName} widget`,
      icon: definition.icon
    };

    this.widgets.set(definition.type, fullDefinition);
    
    console.log(`Registered widget: ${definition.displayName} (${definition.type})`);
  }

  /**
   * Unregister a widget
   * @param type Widget type to unregister
   */
  static unregister(type: WidgetType): void {
    if (this.widgets.delete(type)) {
      console.log(`Unregistered widget: ${type}`);
    } else {
      console.warn(`Widget type '${type}' was not registered`);
    }
  }

  /**
   * Get a specific widget definition
   * @param type Widget type
   * @returns Widget definition or null if not found
   */
  static get<T extends WidgetType>(type: T): WidgetDefinition<T> | null {
    return this.widgets.get(type) || null;
  }

  /**
   * Get all registered widgets
   * @returns Array of all widget definitions
   */
  static getAll(): WidgetDefinition<any>[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Check if a widget type is registered
   * @param type Widget type to check
   * @returns True if registered
   */
  static isRegistered(type: WidgetType): boolean {
    return this.widgets.has(type);
  }

  /**
   * Get widget component for rendering
   * @param type Widget type
   * @returns Widget component or null
   */
  static getComponent<T extends WidgetType>(type: T): React.ComponentType<WidgetProps<T>> | null {
    const definition = this.get(type);
    return definition?.component || null;
  }

  /**
   * Get widget configuration component
   * @param type Widget type
   * @returns Widget config component or null
   */
  static getConfigComponent<T extends WidgetType>(type: T): React.ComponentType<WidgetConfigProps<T>> | null {
    const definition = this.get(type);
    return definition?.configComponent || null;
  }

  /**
   * Get default configuration for a widget type
   * @param type Widget type
   * @returns Default config or null
   */
  static getDefaultConfig<T extends WidgetType>(type: T): WidgetConfigForType<T>['config'] | null {
    const definition = this.get(type);
    return definition?.defaultConfig || null;
  }

  /**
   * Get widget constraints
   * @param type Widget type
   * @returns Widget constraints
   */
  static getConstraints(type: WidgetType): Partial<Required<Pick<GridPosition, 'minW' | 'minH' | 'maxW' | 'maxH'>>> {
    const definition = this.get(type);
    return definition?.constraints || {};
  }

  /**
   * Get available widgets for UI display
   * @returns Array of widget info for UI
   */
  static getAvailableWidgets(): Array<{
    type: WidgetType;
    displayName: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> {
    return this.getAll().map(definition => ({
      type: definition.type,
      displayName: definition.displayName,
      description: definition.description || '',
      icon: definition.icon
    }));
  }

  /**
   * Clear all registered widgets (mainly for testing)
   */
  static clear(): void {
    this.widgets.clear();
    console.log('Cleared all registered widgets');
  }

  /**
   * Get registry statistics
   * @returns Registry stats
   */
  static getStats(): {
    totalWidgets: number;
    registeredTypes: WidgetType[];
  } {
    return {
      totalWidgets: this.widgets.size,
      registeredTypes: Array.from(this.widgets.keys())
    };
  }
}

/**
 * Type-safe widget registration helper
 * @param definition Widget definition
 */
export function registerWidget<T extends WidgetType>(definition: WidgetDefinition<T>): void {
  WidgetRegistry.register(definition);
}

/**
 * Get a registered widget definition with type safety
 * @param type Widget type
 * @returns Widget definition or null
 */
export function getWidget<T extends WidgetType>(type: T): WidgetDefinition<T> | null {
  return WidgetRegistry.get(type);
}

/**
 * Check if a widget type is available
 * @param type Widget type
 * @returns True if available
 */
export function isWidgetAvailable(type: WidgetType): boolean {
  return WidgetRegistry.isRegistered(type);
}
