import { extractKeywords } from './thread-parser'

/**
 * Transform tree structure into 3D graph nodes and edges
 * @param {Object} root - Root node of the thread tree
 * @returns {Object} Object containing nodes and edges arrays
 */
export function transformTreeTo3DGraph(root) {
  const nodes = []
  const edges = []
  let maxScore = 0

  // First pass: collect all nodes and find max score
  function collectNodes(node, parent = null, xOffset = 0) {
    maxScore = Math.max(maxScore, node.score)

    // Calculate position
    const position = {
      x: parent ? parent.position.x + xOffset : 0,
      y: -node.depth * 0.8,
      z: (Math.random() - 0.5) * 0.6
    }

    const keywords = extractKeywords(node.text)

    const graphNode = {
      id: node.id,
      depth: node.depth,
      text: node.text,
      author: node.author,
      score: node.score,
      timestamp: node.timestamp,
      childrenCount: node.children.length,
      position,
      ...keywords
    }

    nodes.push(graphNode)

    // Create edge from parent
    if (parent) {
      edges.push({
        source: parent.id,
        target: node.id,
        sourcePos: parent.position,
        targetPos: position
      })
    }

    // Process children with spread positioning
    if (node.children.length > 0) {
      const spread = Math.min(node.children.length * 0.3, 2)
      const startOffset = -spread / 2

      node.children.forEach((child, index) => {
        const childOffset = startOffset + (spread / node.children.length) * index
        collectNodes(child, graphNode, childOffset)
      })
    }
  }

  collectNodes(root)

  // Second pass: compute visual properties based on max score
  nodes.forEach(node => {
    node.size = computeNodeSize(node.childrenCount)
    node.color = computeNodeColor(node)
    node.opacity = computeNodeOpacity(node.score, maxScore)
  })

  return { nodes, edges, maxScore }
}

/**
 * Compute node size based on children count
 * @param {number} childrenCount - Number of children
 * @returns {number} Node size
 */
function computeNodeSize(childrenCount) {
  return Math.min(Math.max(1 + Math.log(childrenCount + 1), 1), 4) * 0.05
}

/**
 * Compute node color based on properties
 * @param {Object} node - Graph node
 * @returns {string} Color hex code
 */
function computeNodeColor(node) {
  // Solution nodes are green
  if (node.isSolution) {
    return '#4ade80'
  }

  // Question nodes are yellow
  if (node.isQuestion) {
    return '#fbbf24'
  }

  // Debate nodes are orange
  if (node.isDebate) {
    return '#fb923c'
  }

  // Deep nodes (depth >= 5) are blue
  if (node.depth >= 5) {
    return '#60a5fa'
  }

  // Default color based on depth
  if (node.depth < 2) {
    return '#6bbaff'
  } else if (node.depth < 5) {
    return '#a4e86f'
  } else {
    return '#ffda8e'
  }
}

/**
 * Compute node opacity based on score
 * @param {number} score - Node score
 * @param {number} maxScore - Maximum score in the graph
 * @returns {number} Opacity value between 0.4 and 1
 */
function computeNodeOpacity(score, maxScore) {
  if (maxScore === 0) return 0.7

  const normalized = score / maxScore
  return 0.4 + (normalized * 0.6)
}

/**
 * Compute node energy for animations
 * @param {number} score - Node score
 * @param {number} depth - Node depth
 * @param {number} childrenCount - Number of children
 * @returns {number} Energy value
 */
export function computeNodeEnergy(score, depth, childrenCount) {
  return (score * 0.5) + (childrenCount * 2) - (depth * 0.3)
}

/**
 * Detect if a node represents a resurgence (old reply)
 * @param {Object} node - Graph node
 * @param {Object} parent - Parent node
 * @returns {boolean} True if resurgence detected
 */
export function detectResurgence(node, parent) {
  if (!parent) return false

  // If timestamp difference is more than 7 days (604800 seconds)
  const timeDiff = Math.abs(node.timestamp - parent.timestamp)
  return timeDiff > 604800
}
