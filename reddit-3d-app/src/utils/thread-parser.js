/**
 * Parse Reddit thread from URL using Reddit's JSON API
 * @param {string} url - Reddit thread URL
 * @returns {Promise<Object>} Parsed thread data
 */
export async function parseRedditThread(url) {
  try {
    // Convert Reddit URL to JSON API endpoint
    const jsonUrl = url.replace(/\/$/, '') + '.json'

    // Fetch the thread data
    const response = await fetch(jsonUrl)

    if (!response.ok) {
      throw new Error('Failed to fetch Reddit thread. Please check the URL.')
    }

    const data = await response.json()

    // Reddit returns an array: [post, comments]
    const post = data[0].data.children[0].data
    const comments = data[1].data.children

    // Build the tree structure
    const root = {
      id: post.id,
      depth: 0,
      text: post.selftext || post.title,
      author: post.author,
      score: post.score,
      timestamp: post.created_utc,
      children: parseComments(comments, 1)
    }

    return {
      postId: post.id,
      title: post.title,
      url: post.url,
      root
    }
  } catch (error) {
    console.error('Error parsing Reddit thread:', error)
    throw error
  }
}

/**
 * Recursively parse Reddit comments into tree structure
 * @param {Array} comments - Reddit comment objects
 * @param {number} depth - Current depth in the tree
 * @returns {Array} Array of parsed comment nodes
 */
function parseComments(comments, depth) {
  const nodes = []

  for (const comment of comments) {
    // Skip "more" comments and deleted comments
    if (comment.kind !== 't1' || !comment.data) {
      continue
    }

    const data = comment.data

    // Skip deleted or removed comments
    if (data.author === '[deleted]' || !data.body) {
      continue
    }

    const node = {
      id: data.id,
      depth,
      text: data.body,
      author: data.author,
      score: data.score,
      timestamp: data.created_utc,
      children: []
    }

    // Recursively parse replies
    if (data.replies && data.replies.data && data.replies.data.children) {
      node.children = parseComments(data.replies.data.children, depth + 1)
    }

    nodes.push(node)
  }

  return nodes
}

/**
 * Extract keywords from text for highlighting special nodes
 * @param {string} text - Comment text
 * @returns {Object} Keywords found
 */
export function extractKeywords(text) {
  const lowerText = text.toLowerCase()

  return {
    isSolution: /\b(solve|solved|fix|fixed|replaced|solution|answer|resolved)\b/.test(lowerText),
    isQuestion: /\b(how|why|what|when|where|who|\?)\b/.test(lowerText),
    isDebate: /\b(but|however|disagree|wrong|actually|technically)\b/.test(lowerText)
  }
}
