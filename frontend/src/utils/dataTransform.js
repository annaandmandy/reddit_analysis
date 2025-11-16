/**
 * Utility functions for data manipulation
 */

/**
 * Load migration data from JSON file
 */
export const loadMigrationData = async () => {
  try {
    // In development, load from sample data
    const response = await fetch('/data/sample_data.json');

    if (!response.ok) {
      throw new Error('Failed to load migration data');
    }

    const data = await response.json();

    // Validate structure
    if (!data.graph || !data.graph.nodes || !data.graph.links) {
      throw new Error('Invalid data structure');
    }

    return data;
  } catch (error) {
    console.error('Error loading migration data:', error);
    // Return empty structure on error
    return {
      graph: { nodes: [], links: [] },
      metadata: {},
      bridge_communities: [],
      summary_stats: {}
    };
  }
};

/**
 * Filter migrations within a specific time range
 */
export const filterByTimeRange = (data, startDate, endDate) => {
  if (!data || !data.graph) return data;

  // For now, return all data (can be extended to filter by migration_date)
  // This would require the full migration dataset with timestamps
  return data;
};

/**
 * Filter graph by category
 */
export const filterByCategory = (data, category) => {
  if (!data || !data.graph || category === 'all') {
    return data;
  }

  const { nodes, links } = data.graph;

  // Filter nodes by category
  const filteredNodes = nodes.filter(node => node.category === category);
  const nodeIds = new Set(filteredNodes.map(n => n.id));

  // Filter links to only include connections between filtered nodes
  const filteredLinks = links.filter(link =>
    nodeIds.has(link.source) && nodeIds.has(link.target)
  );

  return {
    ...data,
    graph: {
      nodes: filteredNodes,
      links: filteredLinks
    }
  };
};

/**
 * Filter by minimum flow threshold
 */
export const filterByMinFlow = (data, minFlow) => {
  if (!data || !data.graph || minFlow <= 0) {
    return data;
  }

  const { nodes, links } = data.graph;

  // Filter links by minimum value
  const filteredLinks = links.filter(link => link.value >= minFlow);

  // Keep only nodes that have at least one connection
  const connectedNodeIds = new Set();
  filteredLinks.forEach(link => {
    connectedNodeIds.add(link.source);
    connectedNodeIds.add(link.target);
  });

  const filteredNodes = nodes.filter(node => connectedNodeIds.has(node.id));

  return {
    ...data,
    graph: {
      nodes: filteredNodes,
      links: filteredLinks
    }
  };
};

/**
 * Find path between two communities using BFS
 */
export const findPath = (graph, sourceId, targetId) => {
  if (!graph || !graph.nodes || !graph.links) {
    return [];
  }

  // Build adjacency list
  const adjacency = new Map();

  graph.links.forEach(link => {
    if (!adjacency.has(link.source)) {
      adjacency.set(link.source, []);
    }
    adjacency.get(link.source).push(link.target);
  });

  // BFS to find shortest path
  const queue = [[sourceId]];
  const visited = new Set([sourceId]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (current === targetId) {
      return path;
    }

    const neighbors = adjacency.get(current) || [];

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return []; // No path found
};

/**
 * Calculate simple betweenness centrality approximation
 */
export const calculateCentrality = (graph) => {
  if (!graph || !graph.nodes || !graph.links) {
    return {};
  }

  const centrality = {};

  // Initialize centrality scores
  graph.nodes.forEach(node => {
    centrality[node.id] = 0;
  });

  // For each pair of nodes, find shortest path and increment centrality
  // of intermediate nodes
  graph.nodes.forEach(source => {
    graph.nodes.forEach(target => {
      if (source.id !== target.id) {
        const path = findPath(graph, source.id, target.id);

        // Increment centrality for intermediate nodes
        for (let i = 1; i < path.length - 1; i++) {
          centrality[path[i]]++;
        }
      }
    });
  });

  // Normalize by number of node pairs
  const numNodes = graph.nodes.length;
  const normalizer = (numNodes - 1) * (numNodes - 2) / 2;

  if (normalizer > 0) {
    Object.keys(centrality).forEach(nodeId => {
      centrality[nodeId] /= normalizer;
    });
  }

  return centrality;
};

/**
 * Get connected links for a specific node
 */
export const getConnectedLinks = (graph, nodeId) => {
  if (!graph || !graph.links) {
    return { incoming: [], outgoing: [] };
  }

  const incoming = graph.links.filter(link => link.target === nodeId);
  const outgoing = graph.links.filter(link => link.source === nodeId);

  return { incoming, outgoing };
};

/**
 * Calculate total flow for a node (incoming + outgoing)
 */
export const calculateNodeFlow = (graph, nodeId) => {
  const { incoming, outgoing } = getConnectedLinks(graph, nodeId);

  const incomingFlow = incoming.reduce((sum, link) => sum + link.value, 0);
  const outgoingFlow = outgoing.reduce((sum, link) => sum + link.value, 0);

  return {
    incoming: incomingFlow,
    outgoing: outgoingFlow,
    total: incomingFlow + outgoingFlow
  };
};

/**
 * Get top N flows (sorted by value)
 */
export const getTopFlows = (links, n = 5) => {
  if (!links || links.length === 0) {
    return [];
  }

  return [...links]
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
};
