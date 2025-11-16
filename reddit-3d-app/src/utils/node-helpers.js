/**
 * Helper functions for node operations
 */

/**
 * Format timestamp to readable date
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date string
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = now - date

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  }

  // Less than 30 days
  if (diff < 2592000000) {
    const days = Math.floor(diff / 86400000)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  }

  // Default format
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format score with K/M suffixes
 * @param {number} score - Score value
 * @returns {string} Formatted score
 */
export function formatScore(score) {
  if (score >= 1000000) {
    return (score / 1000000).toFixed(1) + 'M'
  }
  if (score >= 1000) {
    return (score / 1000).toFixed(1) + 'K'
  }
  return score.toString()
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Get node type label
 * @param {Object} node - Graph node
 * @returns {string} Node type label
 */
export function getNodeTypeLabel(node) {
  if (node.isSolution) return 'Solution'
  if (node.isQuestion) return 'Question'
  if (node.isDebate) return 'Debate'
  if (node.depth >= 5) return 'Deep Discussion'
  if (node.childrenCount > 3) return 'Branch Point'
  return 'Comment'
}

/**
 * Check if node is a branch point
 * @param {Object} node - Graph node
 * @returns {boolean} True if branch point
 */
export function isBranchNode(node) {
  return node.childrenCount > 3
}

/**
 * Check if node is a deep node
 * @param {Object} node - Graph node
 * @returns {boolean} True if deep node
 */
export function isDeepNode(node) {
  return node.depth >= 5
}
