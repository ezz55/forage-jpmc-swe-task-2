import React, { Component } from "react";
import { Table } from "@finos/perspective";
import { ServerRespond } from "./DataStreamer";
import "./Graph.css";

/**
 * Props declaration for <Graph />
 */
interface IProps {
  data: ServerRespond[];
}

/**
 * Perspective library adds load to HTMLElement prototype.
 * This interface acts as a wrapper for Typescript compiler.
 */
interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void;
}

interface IState {
  lastUpdateTimestamp: number;
}

/**
 * React component that renders Perspective based on data
 * parsed from its parent through data property.
 */
class Graph extends Component<IProps, IState> {
  // Update the state type here
  // Perspective table
  table: Table | undefined;

  constructor(props: IProps) {
    super(props);
    // Initialise the state
    this.state = {
      lastUpdateTimestamp: 0,
    };
  }

  render() {
    return React.createElement("perspective-viewer");
  }

  componentDidMount() {
    // Get element to attach the table from the DOM.
    const elem = (document.getElementsByTagName(
      "perspective-viewer"
    )[0] as unknown) as PerspectiveViewerElement;

    const schema = {
      stock: "string",
      top_ask_price: "float",
      top_bid_price: "float",
      timestamp: "date",
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      elem.setAttribute("view", "y_line");
      elem.setAttribute("column-pivots", '["stock"]');
      elem.setAttribute("row-pivots", '["timestamp"]');
      elem.setAttribute("columns", '["top_ask_price"]');
      elem.setAttribute(
        "aggregates",
        `
        {"stock" : "distinct count",
        "top_ask_price" : "avg",
        "top_bid_price": "avg" ,
        "timestamp" : "distinct count" }`
      );
      elem.load(this.table);
    }
  }

  componentDidUpdate(prevProps: IProps) {
    // Only update the table with new data.
    if (this.table) {
      const newData = this.props.data.filter((data) => {
        // Convert timestamp to a number for comparison
        const dataTimestamp = new Date(data.timestamp).getTime();
        return dataTimestamp > this.state.lastUpdateTimestamp;
      });

      if (newData.length > 0) {
        // Update the table with new data
        this.table.update(
          newData.map((el: any) => {
            return {
              stock: el.stock,
              top_ask_price: (el.top_ask && el.top_ask.price) || 0,
              top_bid_price: (el.top_bid && el.top_bid.price) || 0,
              timestamp: el.timestamp,
            };
          })
        );

        // Update the lastUpdateTimestamp in the state
        this.setState({
          lastUpdateTimestamp: new Date(
            newData[newData.length - 1].timestamp
          ).getTime(),
        });
      }
    }
  }
}

export default Graph;
