# Chrome Extension Conversion Roadmap

This document outlines the steps to convert the web app into a Chrome extension.

## Phase 1: Setup Extension Structure

### Create Extension Folder

```
extension/
├── manifest.json
├── content-script.js
├── background.js (optional)
├── popup/
│   ├── popup.html
│   ├── popup.js (bundled React app)
│   └── popup.css
└── assets/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Manifest.json Template

```json
{
  "manifest_version": 3,
  "name": "Reddit 3D Ecosystem Viewer",
  "version": "1.0.0",
  "description": "Visualize Reddit discussion threads as interactive 3D ecosystems",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "*://*.reddit.com/*"
  ],
  "content_scripts": [
    {
      "matches": ["*://*.reddit.com/r/*/comments/*"],
      "js": ["content-script.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "assets/icon16.png",
      "48": "assets/icon48.png",
      "128": "assets/icon128.png"
    }
  },
  "icons": {
    "16": "assets/icon16.png",
    "48": "assets/icon48.png",
    "128": "assets/icon128.png"
  }
}
```

## Phase 2: Adapt Content Script

### Content Script (content-script.js)

The content script will:
1. Parse the Reddit thread DOM directly (no API calls)
2. Extract comment tree structure
3. Send data to popup via message passing

#### Key Functions to Implement

```javascript
// Parse thread from current page
function parseThreadFromDOM() {
  const postElement = document.querySelector('[data-test-id="post-content"]')
  const commentsContainer = document.querySelector('.Comment')

  // Extract post data
  const post = {
    id: extractPostId(),
    title: document.querySelector('h1').textContent,
    author: extractAuthor(postElement),
    score: extractScore(postElement),
    text: extractText(postElement),
    timestamp: extractTimestamp(postElement)
  }

  // Extract comments recursively
  const comments = parseCommentsFromDOM(commentsContainer)

  return {
    postId: post.id,
    title: post.title,
    url: window.location.href,
    root: {
      ...post,
      depth: 0,
      children: comments
    }
  }
}

// Recursive comment parser
function parseCommentsFromDOM(container, depth = 1) {
  const comments = []
  const commentElements = container.querySelectorAll(':scope > .Comment')

  commentElements.forEach(element => {
    const comment = {
      id: element.getAttribute('data-comment-id'),
      depth,
      author: extractAuthor(element),
      score: extractScore(element),
      text: extractText(element),
      timestamp: extractTimestamp(element),
      children: []
    }

    // Find nested replies
    const repliesContainer = element.querySelector('.Comment__replies')
    if (repliesContainer) {
      comment.children = parseCommentsFromDOM(repliesContainer, depth + 1)
    }

    comments.push(comment)
  })

  return comments
}

// Send to popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getThreadData') {
    const threadData = parseThreadFromDOM()
    sendResponse({ threadData })
  }
})
```

### Scroll-to-Comment Feature

```javascript
// Listen for scroll requests from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrollToComment') {
    const element = document.querySelector(`[data-comment-id="${request.commentId}"]`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      element.style.animation = 'highlight 2s ease-in-out'
    }
  }
})

// Add CSS for highlight animation
const style = document.createElement('style')
style.textContent = `
  @keyframes highlight {
    0%, 100% { background-color: transparent; }
    50% { background-color: rgba(102, 126, 234, 0.3); }
  }
`
document.head.appendChild(style)
```

## Phase 3: Adapt Popup

### Popup HTML (popup/popup.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reddit 3D Ecosystem</title>
  <style>
    body {
      width: 800px;
      height: 600px;
      margin: 0;
      padding: 0;
    }
    #root {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="popup.js"></script>
</body>
</html>
```

### Popup Script Changes

Create a new entry point `src/popup.jsx`:

```javascript
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import Canvas3D from './components/Canvas3D'
import SidePanel from './components/SidePanel'
import './styles/app.css'

function PopupApp() {
  const [threadData, setThreadData] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Request thread data from content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: 'getThreadData' },
        (response) => {
          if (chrome.runtime.lastError) {
            setError('Please navigate to a Reddit thread first')
            setLoading(false)
            return
          }

          if (response && response.threadData) {
            setThreadData(response.threadData)
          } else {
            setError('Failed to parse thread data')
          }
          setLoading(false)
        }
      )
    })
  }, [])

  const handleNodeClick = (node) => {
    setSelectedNode(node)

    // Send scroll request to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'scrollToComment',
        commentId: node.id
      })
    })
  }

  if (loading) {
    return <div className="loading">Loading thread data...</div>
  }

  if (error) {
    return <div className="error">{error}</div>
  }

  return (
    <div className="popup-app">
      <Canvas3D
        threadData={threadData}
        selectedNode={selectedNode}
        onNodeClick={handleNodeClick}
      />
      <SidePanel
        threadData={threadData}
        selectedNode={selectedNode}
      />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>
)
```

## Phase 4: Build Configuration

### Update vite.config.js for Extension

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup.jsx'),
        content: resolve(__dirname, 'src/content-script.js')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'extension',
    emptyOutDir: false
  }
})
```

### Build Script

Add to package.json:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:extension": "vite build --mode extension && npm run copy:assets",
    "copy:assets": "cp manifest.json extension/ && cp -r assets extension/"
  }
}
```

## Phase 5: Testing

### Load Extension in Chrome

1. Build the extension: `npm run build:extension`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `extension/` folder

### Test Checklist

- [ ] Extension loads without errors
- [ ] Content script runs on Reddit thread pages
- [ ] Popup opens and displays 3D visualization
- [ ] Clicking nodes scrolls to comments on the page
- [ ] All visual features work (colors, animations, etc.)
- [ ] Side panel displays correct comment details
- [ ] Error handling works (non-Reddit pages, parsing errors)

## Phase 6: Additional Features for Extension

### Background Script (Optional)

For caching and offline support:

```javascript
// background.js
chrome.runtime.onInstalled.addListener(() => {
  console.log('Reddit 3D Ecosystem extension installed')
})

// Cache thread data
let threadCache = {}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'cacheThread') {
    threadCache[request.url] = request.data
    sendResponse({ success: true })
  }

  if (request.action === 'getCachedThread') {
    sendResponse({ data: threadCache[request.url] })
  }
})
```

### Context Menu Integration

Add to manifest.json:

```json
{
  "permissions": ["contextMenus"],
  "background": {
    "service_worker": "background.js"
  }
}
```

Add to background.js:

```javascript
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'visualize3D',
    title: 'Visualize as 3D Ecosystem',
    contexts: ['page'],
    documentUrlPatterns: ['*://*.reddit.com/r/*/comments/*']
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'visualize3D') {
    chrome.action.openPopup()
  }
})
```

## Phase 7: Publishing

### Prepare for Chrome Web Store

1. Create high-quality icons (16x16, 48x48, 128x128)
2. Create promotional images (1280x800, 640x400)
3. Write detailed description
4. Create privacy policy (if collecting any data)
5. Test on multiple screen sizes
6. Package extension as .zip file

### Submission Checklist

- [ ] All icons and images ready
- [ ] Manifest.json complete and valid
- [ ] Privacy policy created (if needed)
- [ ] Screenshots and promotional materials
- [ ] Extension tested thoroughly
- [ ] Description and keywords optimized
- [ ] Version number set correctly

## Reusable Components

These components can be used AS-IS in both web app and extension:

✅ **utils/graph-transformer.js** - Pure logic, no changes needed
✅ **utils/node-helpers.js** - Pure functions, no changes needed
✅ **components/Canvas3D.jsx** - Works in both contexts
✅ **components/Nodes.jsx** - Works in both contexts
✅ **components/Edges.jsx** - Works in both contexts
✅ **components/SidePanel.jsx** - Minor styling adjustments may be needed

## Components Requiring Adaptation

⚠️ **utils/thread-parser.js** - Split into:
  - Web version: Uses Reddit JSON API
  - Extension version: Parses DOM directly

⚠️ **App.jsx** - Replace with:
  - Web version: Current URL input interface
  - Extension version: popup.jsx with Chrome message passing

## Timeline Estimate

- **Phase 1-2**: 4-6 hours (Setup + Content Script)
- **Phase 3-4**: 3-4 hours (Popup + Build Config)
- **Phase 5**: 2-3 hours (Testing)
- **Phase 6**: 2-4 hours (Additional features)
- **Phase 7**: 2-3 hours (Publishing prep)

**Total**: 13-20 hours for full conversion

## Notes

- The current web app architecture is intentionally designed to minimize changes needed for extension conversion
- Core visualization logic is completely reusable
- Main changes are in data fetching (API vs DOM) and user interface (URL input vs automatic detection)
- Extension version will be faster as it doesn't require CORS or API calls
