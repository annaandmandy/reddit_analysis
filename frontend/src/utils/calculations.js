/**
 * Migration metrics calculations
 */

/**
 * Calculate migration statistics for a specific community
 */
export const calculateCommunityStats = (graph, communityId) => {
  if (!graph || !communityId) {
    return null;
  }

  const { links } = graph;

  const incomingLinks = links.filter(link => link.target === communityId);
  const outgoingLinks = links.filter(link => link.source === communityId);

  const totalIncoming = incomingLinks.reduce((sum, link) => sum + link.value, 0);
  const totalOutgoing = outgoingLinks.reduce((sum, link) => sum + link.value, 0);

  const avgIncomingTime = incomingLinks.length > 0
    ? incomingLinks.reduce((sum, link) => sum + (link.avg_time_gap || 0), 0) / incomingLinks.length
    : 0;

  const avgOutgoingTime = outgoingLinks.length > 0
    ? outgoingLinks.reduce((sum, link) => sum + (link.avg_time_gap || 0), 0) / outgoingLinks.length
    : 0;

  return {
    incoming: {
      count: incomingLinks.length,
      total: totalIncoming,
      avgTime: Math.round(avgIncomingTime * 10) / 10,
      top: incomingLinks
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    },
    outgoing: {
      count: outgoingLinks.length,
      total: totalOutgoing,
      avgTime: Math.round(avgOutgoingTime * 10) / 10,
      top: outgoingLinks
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    },
    netFlow: totalIncoming - totalOutgoing
  };
};

/**
 * Calculate overall network statistics
 */
export const calculateNetworkStats = (graph, metadata = {}) => {
  if (!graph) {
    return {};
  }

  const { nodes = [], links = [] } = graph;

  const totalFlow = links.reduce((sum, link) => sum + link.value, 0);
  const avgFlowPerLink = links.length > 0 ? totalFlow / links.length : 0;

  const avgTimeGap = links.length > 0
    ? links.reduce((sum, link) => sum + (link.avg_time_gap || 0), 0) / links.length
    : 0;

  // Find most connected node
  const nodeDegrees = new Map();
  nodes.forEach(node => nodeDegrees.set(node.id, 0));

  links.forEach(link => {
    nodeDegrees.set(link.source, (nodeDegrees.get(link.source) || 0) + 1);
    nodeDegrees.set(link.target, (nodeDegrees.get(link.target) || 0) + 1);
  });

  let mostConnected = null;
  let maxDegree = 0;

  nodeDegrees.forEach((degree, nodeId) => {
    if (degree > maxDegree) {
      maxDegree = degree;
      mostConnected = nodeId;
    }
  });

  return {
    totalNodes: nodes.length,
    totalLinks: links.length,
    totalFlow,
    avgFlowPerLink: Math.round(avgFlowPerLink * 10) / 10,
    avgTimeGap: Math.round(avgTimeGap * 10) / 10,
    mostConnected,
    maxDegree,
    ...metadata
  };
};

/**
 * Get color by category
 */
export const getCategoryColor = (category) => {
  const colors = {
    fitness: '#ef4444',      // red
    tech: '#3b82f6',         // blue
    finance: '#10b981',      // green
    gaming: '#a855f7',       // purple
    creative: '#f59e0b',     // orange
    other: '#6b7280'         // gray
  };

  return colors[category] || colors.other;
};

/**
 * Calculate link width based on value
 */
export const calculateLinkWidth = (value, minValue = 0, maxValue = 200) => {
  // Normalize value between 0 and 1
  const normalized = (value - minValue) / (maxValue - minValue);

  // Scale to width between 1 and 8
  const minWidth = 1;
  const maxWidth = 8;

  return Math.max(minWidth, Math.min(maxWidth, minWidth + normalized * (maxWidth - minWidth)));
};

/**
 * Format number with K/M suffix
 */
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Calculate migration velocity trend
 */
export const calculateVelocityTrend = (links) => {
  if (!links || links.length === 0) {
    return 'stable';
  }

  const velocities = links
    .filter(link => link.migration_velocity)
    .map(link => link.migration_velocity);

  if (velocities.length === 0) {
    return 'stable';
  }

  const avg = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;

  if (avg > 4) return 'high';
  if (avg > 2) return 'medium';
  return 'low';
};
