/**
 * NetworkGraph Component
 *
 * Main interactive force-directed graph visualization
 * - Draggable nodes
 * - Hover tooltips showing migration counts
 * - Click to select community
 * - Directional arrows showing flow
 * - Link thickness = migration volume
 * - Node size = community activity
 */
import { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getCategoryColor, calculateLinkWidth } from '../utils/calculations';

const NetworkGraph = ({ data, onNodeClick, highlightNodes = [], highlightLinks = [] }) => {
  const graphRef = useRef();
  const [hoveredNode, setHoveredNode] = useState(null);

  // Center graph on mount
  useEffect(() => {
    if (graphRef.current && data && data.nodes.length > 0) {
      graphRef.current.zoomToFit(400);
    }
  }, [data]);

  const handleNodeClick = (node) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  const handleNodeHover = (node) => {
    setHoveredNode(node);
  };

  const getNodeColor = (node) => {
    return getCategoryColor(node.category);
  };

  const getLinkWidth = (link) => {
    // Calculate width based on migration volume
    return calculateLinkWidth(link.value);
  };

  const getLinkColor = (link) => {
    // Highlight links if they're in the highlight list
    const isHighlighted = highlightLinks.some(
      hl => hl.source === link.source && hl.target === link.target
    );

    return isHighlighted ? '#fbbf24' : 'rgba(150, 150, 150, 0.3)';
  };

  const getNodeLabel = (node) => {
    return `${node.name}\nCategory: ${node.category}\nConnections: ${node.size}`;
  };

  // Custom node rendering
  const paintNode = (node, ctx, globalScale) => {
    const label = node.id;
    const fontSize = 12 / globalScale;
    const nodeSize = Math.sqrt(node.size) / 2;

    // Check if node is highlighted
    const isHighlighted = highlightNodes.includes(node.id) || hoveredNode === node;

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
    ctx.fillStyle = getNodeColor(node);
    ctx.fill();

    // Draw border if highlighted
    if (isHighlighted) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }

    // Draw label
    ctx.font = `${fontSize}px Sans-Serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1f2937';
    ctx.fillText(label, node.x, node.y + nodeSize + fontSize);
  };

  // Custom link rendering
  const paintLink = (link, ctx, globalScale) => {
    const start = link.source;
    const end = link.target;

    if (typeof start !== 'object' || typeof end !== 'object') return;

    const textPos = {
      x: start.x + (end.x - start.x) * 0.5,
      y: start.y + (end.y - start.y) * 0.5
    };

    // Draw link
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = getLinkColor(link);
    ctx.lineWidth = getLinkWidth(link) / globalScale;
    ctx.stroke();

    // Draw arrow
    const arrowLength = 10 / globalScale;
    const arrowAngle = Math.atan2(end.y - start.y, end.x - start.x);

    const arrowPos = {
      x: end.x - Math.cos(arrowAngle) * (Math.sqrt(end.size || 100) / 2),
      y: end.y - Math.sin(arrowAngle) * (Math.sqrt(end.size || 100) / 2)
    };

    ctx.beginPath();
    ctx.moveTo(arrowPos.x, arrowPos.y);
    ctx.lineTo(
      arrowPos.x - arrowLength * Math.cos(arrowAngle - Math.PI / 6),
      arrowPos.y - arrowLength * Math.sin(arrowAngle - Math.PI / 6)
    );
    ctx.lineTo(
      arrowPos.x - arrowLength * Math.cos(arrowAngle + Math.PI / 6),
      arrowPos.y - arrowLength * Math.sin(arrowAngle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = getLinkColor(link);
    ctx.fill();
  };

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <p className="text-gray-500">No migration data available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden">
      <ForceGraph2D
        ref={graphRef}
        graphData={data}
        nodeLabel={getNodeLabel}
        nodeCanvasObject={paintNode}
        linkCanvasObject={paintLink}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onNodeDragEnd={node => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        linkDirectionalArrowLength={0} // We draw custom arrows
        linkDirectionalArrowRelPos={1}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        cooldownTicks={100}
        warmupTicks={100}
        d3VelocityDecay={0.3}
      />

      {hoveredNode && (
        <div className="absolute top-4 left-4 bg-white p-3 rounded shadow-lg border border-gray-200 max-w-xs">
          <h4 className="font-bold text-sm">{hoveredNode.name}</h4>
          <p className="text-xs text-gray-600 mt-1">
            Category: <span className="font-medium">{hoveredNode.category}</span>
          </p>
          <p className="text-xs text-gray-600">
            Activity: <span className="font-medium">{hoveredNode.size}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default NetworkGraph;
