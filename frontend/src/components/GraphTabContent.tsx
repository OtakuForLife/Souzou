import { RootState } from "@/store";
import { GraphState } from "@/store/slices/graphSlice";
import { GraphContentData } from "@/types/contentTypes";
import { Settings } from "lucide-react";
import { useSelector } from "react-redux";
import ReactCytoscape from "@/components/Cytoscape";
import { useMemo } from "react";

interface GraphTabContentProps {
  objectID: string;
}

function GraphTabContent({ objectID }: GraphTabContentProps) {
  const graphState: GraphState = useSelector((state: RootState) => state.graphs);
  const graph: GraphContentData = graphState.allGraphs[objectID];

  // Memoize default graph elements to prevent re-renders
  const defaultElements = useMemo(() => graph?.elements || [
    { data: { id: 'a', label: 'Node A' } },
    { data: { id: 'b', label: 'Node B' } },
    { data: { id: 'c', label: 'Node C' } },
    { data: { id: 'ab', source: 'a', target: 'b' } },
    { data: { id: 'bc', source: 'b', target: 'c' } },
    { data: { id: 'ca', source: 'c', target: 'a' } }
  ], [graph?.elements]);

  // Memoize default layout to prevent re-renders
  const defaultLayout = useMemo(() => graph?.layout || {
    name: 'circle',
    fit: true,
    padding: 30
  }, [graph?.layout]);

  // Memoize default style to prevent re-renders
  const defaultStyle = useMemo(() => graph?.style || [
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': '#fff',
        'font-size': '12px'
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': '#ccc',
        'target-arrow-color': '#ccc',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier'
      }
    }
  ], [graph?.style]);

  // Memoize cytoscape options to prevent re-renders
  const cytoscapeOptions = useMemo(() => ({
    boxSelectionEnabled: true,
    autounselectify: false,
    userZoomingEnabled: true,
    userPanningEnabled: true
  }), []);

  // Memoize style container to prevent re-renders
  const styleContainer = useMemo(() => ({
    height: '100%',
    width: '100%'
  }), []);

  // Fallback if graph is not found
  if (!graph) {
    return (
      <div className="p-2 h-full bg-skin-secondary">
        <div className="flex items-center justify-center h-full">
          <p className="text-skin-primary">Graph not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 h-full bg-skin-secondary">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-5 h-5 p-0 text-skin-primary hover:bg-skin-primary-hover cursor-pointer"
          title="Graph Settings"
        >
          <Settings className="w-5 h-5" />
        </span>
      </div>
      <div className="h-[calc(100vh-200px)] w-[calc(100vw-350px)] border border-gray-300 rounded overflow-hidden">
        <ReactCytoscape
          containerID={`graph-${graph.id}`}
          elements={defaultElements}
          layout={defaultLayout}
          style={defaultStyle}
          styleContainer={styleContainer}
          cytoscapeOptions={cytoscapeOptions}
        />
      </div>
    </div>
  );
}

export default GraphTabContent;
