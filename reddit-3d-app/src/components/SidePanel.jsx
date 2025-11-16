import React from 'react'
import { formatTimestamp, formatScore, getNodeTypeLabel } from '../utils/node-helpers'

function SidePanel({ threadData, selectedNode }) {
  if (!selectedNode) {
    return (
      <div className="side-panel">
        <div className="panel-header">
          <h2>Thread Info</h2>
        </div>
        <div className="panel-content">
          <div className="thread-info">
            <h3>{threadData?.title}</h3>
            <p className="hint">Click on a node to view comment details</p>
            <div className="tips">
              <h4>Controls:</h4>
              <ul>
                <li>Left click + drag to rotate</li>
                <li>Right click + drag to pan</li>
                <li>Scroll to zoom</li>
                <li>Click on nodes to select</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="side-panel">
      <div className="panel-header">
        <h2>Comment Details</h2>
        <span className="node-type">{getNodeTypeLabel(selectedNode)}</span>
      </div>

      <div className="panel-content">
        <div className="comment-meta">
          <div className="meta-row">
            <span className="meta-label">Author:</span>
            <span className="meta-value author">u/{selectedNode.author}</span>
          </div>

          <div className="meta-row">
            <span className="meta-label">Score:</span>
            <span className="meta-value score">{formatScore(selectedNode.score)}</span>
          </div>

          <div className="meta-row">
            <span className="meta-label">Time:</span>
            <span className="meta-value">{formatTimestamp(selectedNode.timestamp)}</span>
          </div>

          <div className="meta-row">
            <span className="meta-label">Depth:</span>
            <span className="meta-value">Level {selectedNode.depth}</span>
          </div>

          <div className="meta-row">
            <span className="meta-label">Replies:</span>
            <span className="meta-value">{selectedNode.childrenCount}</span>
          </div>
        </div>

        <div className="comment-text">
          <h4>Comment:</h4>
          <p>{selectedNode.text}</p>
        </div>

        {selectedNode.isSolution && (
          <div className="badge solution-badge">
            Potential Solution
          </div>
        )}

        {selectedNode.isQuestion && (
          <div className="badge question-badge">
            Question
          </div>
        )}

        {selectedNode.isDebate && (
          <div className="badge debate-badge">
            Debate Point
          </div>
        )}

        {selectedNode.depth >= 5 && (
          <div className="badge deep-badge">
            Deep Discussion
          </div>
        )}

        {selectedNode.childrenCount > 3 && (
          <div className="badge branch-badge">
            Branch Point
          </div>
        )}
      </div>
    </div>
  )
}

export default SidePanel
