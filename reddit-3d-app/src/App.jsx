import React, { useState } from 'react'
import Canvas3D from './components/Canvas3D'
import SidePanel from './components/SidePanel'
import { parseRedditThread } from './utils/thread-parser'

function App() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [threadData, setThreadData] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate Reddit URL
      if (!url.includes('reddit.com')) {
        throw new Error('Please enter a valid Reddit URL')
      }

      // Parse the Reddit thread
      const data = await parseRedditThread(url)
      setThreadData(data)
    } catch (err) {
      setError(err.message)
      console.error('Error parsing thread:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setUrl('')
    setThreadData(null)
    setSelectedNode(null)
    setError(null)
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Reddit Thread 3D Ecosystem</h1>
        {!threadData && (
          <p className="subtitle">Visualize Reddit discussions as an interactive 3D ecosystem</p>
        )}
      </header>

      {!threadData ? (
        <div className="input-container">
          <form onSubmit={handleSubmit} className="url-form">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste Reddit thread URL (e.g., https://www.reddit.com/r/...)"
              className="url-input"
              disabled={loading}
            />
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !url}
            >
              {loading ? 'Loading...' : 'Visualize'}
            </button>
          </form>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="examples">
            <p>Example URLs:</p>
            <button
              onClick={() => setUrl('https://www.reddit.com/r/AskReddit/comments/example')}
              className="example-btn"
            >
              Use Example 1
            </button>
            <button
              onClick={() => setUrl('https://www.reddit.com/r/programming/comments/example')}
              className="example-btn"
            >
              Use Example 2
            </button>
          </div>
        </div>
      ) : (
        <div className="visualization-container">
          <button onClick={handleReset} className="reset-btn">
            ← New URL
          </button>

          <div className="content">
            <Canvas3D
              threadData={threadData}
              selectedNode={selectedNode}
              onNodeClick={setSelectedNode}
            />

            <SidePanel
              threadData={threadData}
              selectedNode={selectedNode}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
