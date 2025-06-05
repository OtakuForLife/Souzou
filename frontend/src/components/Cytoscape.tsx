import { Component } from "react";
import cytoscape, { Core } from "cytoscape";

interface Props {
  containerID?: string;
  style: any;
  elements: any;
  layout?: any;
  cyRef?: any;
  styleContainer?: any;
  cytoscapeOptions?: any;
}

/** React cytoscape component
 * props : style, elements, layout, cyRef,styleContainer, cytoscapeOptions
 */
class ReactCytoscape extends Component<Props> {
  container: HTMLDivElement | null = null;
  cy: Core | null = null;

  getCyID() {
    return this.props.containerID || "cy";
  }

  getContainer() {
    return this.container;
  }

  defaultStyle() {
    return [
      {
        selector: "node",
        css: {
          content: function (ele: any) {
            return ele.data("label") || ele.data("id");
          },
          "text-valign": "center",
          "text-halign": "center",
        },
      },
      {
        selector: "$node > node",
        css: {
          "padding-top": "10px",
          "padding-left": "10px",
          "padding-bottom": "10px",
          "padding-right": "10px",
          "text-valign": "top",
          "text-halign": "center",
          "background-color": "#bbb",
        },
      },
      {
        selector: "edge",
        css: {
          "target-arrow-shape": "triangle",
        },
      },
      {
        selector: ":selected",
        css: {
          "background-color": "black",
          "line-color": "black",
          "target-arrow-color": "black",
          "source-arrow-color": "black",
        },
      },
    ];
  }

  style() {
    return this.props.style || this.defaultStyle();
  }

  elements() {
    return this.props.elements || {};
  }

  layout() {
    return this.props.layout || { name: "cola" };
  }

  cytoscapeOptions() {
    return this.props.cytoscapeOptions || {};
  }

  build() {
    const opts = Object.assign(
      {
        container: this.getContainer(),

        boxSelectionEnabled: false,
        autounselectify: true,

        style: this.style(),
        elements: this.elements(),
        layout: this.layout(),
      },
      this.cytoscapeOptions(),
    );

    this.cy = cytoscape(opts);

    if (this.props.cyRef) {
      this.props.cyRef(this.cy);
    }
    return this.cy;
  }

  componentWillUnmount() {
    this.clean();
  }

  componentDidMount() {
    this.build();
  }

  componentDidUpdate(prevProps: Props) {
    // Only rebuild if props that affect the graph have actually changed
    const shouldRebuild =
      prevProps.elements !== this.props.elements ||
      prevProps.style !== this.props.style ||
      prevProps.layout !== this.props.layout ||
      prevProps.cytoscapeOptions !== this.props.cytoscapeOptions;

    if (shouldRebuild) {
      this.clean();
      this.build();
    }
  }

  render() {
    const style = this.props.styleContainer || {};
    const styleContainer = Object.assign(
      { height: "100%", width: "100%", display: "block" },
      style,
    );
    return (
      <div
        className="graph"
        id={this.getCyID()}
        ref={(elt) => {
          this.container = elt;
        }}
        style={styleContainer}
      ></div>
    );
  }

  clean() {
    if (this.cy) {
      try {
        // Remove all event listeners first to prevent dangling references
        this.cy.removeAllListeners();

        // Check if the instance is still valid before destroying
        if (!this.cy.destroyed()) {
          this.cy.destroy();
        }
      } catch (error) {
        console.warn('Error during Cytoscape cleanup:', error);
        // Force destroy even if there's an error
        try {
          if (this.cy && !this.cy.destroyed()) {
            this.cy.destroy();
          }
        } catch (destroyError) {
          console.warn('Error during forced Cytoscape destroy:', destroyError);
        }
      } finally {
        this.cy = null;
      }
    }
  }
}

export default ReactCytoscape;
