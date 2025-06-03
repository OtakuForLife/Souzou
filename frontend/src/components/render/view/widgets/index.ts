/**
 * Widget Registration
 * 
 * This is the ONLY file you need to modify to add new widgets!
 * 
 * To add a new widget:
 * 1. Import your widget components
 * 2. Add a registration call with 5 lines
 * 3. That's it!
 */

import { WidgetType, DEFAULT_WIDGET_CONFIGS } from '@/types/widgetTypes';
import { WidgetRegistry } from './WidgetRegistry';

// Import widget components
import GraphWidget from './graph/GraphWidget';
import GraphWidgetConfigDialog from './graph/GraphWidgetConfigDialog';

// Widget icons (using lucide-react icons)
import { Network } from 'lucide-react';

const GraphIcon = Network;

/**
 * Register all widgets here
 * 
 * Adding a new widget is as simple as adding 5 lines:
 * 
 * WidgetRegistry.register({
 *   type: WidgetType.YOUR_WIDGET,
 *   displayName: 'Your Widget',
 *   component: YourWidget,
 *   configComponent: YourWidgetConfig,
 *   defaultConfig: DEFAULT_YOUR_WIDGET_CONFIG
 * });
 */

// Register Graph Widget
WidgetRegistry.register({
  type: WidgetType.GRAPH,
  displayName: 'Graph Widget',
  description: 'Visualize entity relationships and connections',
  icon: GraphIcon,
  component: GraphWidget,
  configComponent: GraphWidgetConfigDialog,
  defaultConfig: DEFAULT_WIDGET_CONFIGS[WidgetType.GRAPH],
});

// Future widgets can be added here with the same simple pattern:



// Export registry for use in other components
export { WidgetRegistry };

// Export helper functions
export { registerWidget, getWidget, isWidgetAvailable } from './WidgetRegistry';

// Log registered widgets for debugging
console.log('Registered widgets:', WidgetRegistry.getStats());
