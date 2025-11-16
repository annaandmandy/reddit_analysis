# Reddit 3D Ecosystem Viewer

A web application that visualizes Reddit discussion threads as interactive 3D ecosystems using React and Three.js.

## Features

- **URL-based Input**: Paste any Reddit thread URL to visualize
- **3D Visualization**: Interactive 3D graph showing comment relationships
- **Node Classification**: Automatically identifies solutions, questions, debates, and deep discussions
- **Interactive Controls**: Click nodes to view details, rotate, pan, and zoom
- **Visual Indicators**: Color-coded nodes based on comment type and depth
- **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd reddit-3d-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## Usage

1. Enter a Reddit thread URL in the input box
   - Example: `https://www.reddit.com/r/AskReddit/comments/...`

2. Click "Visualize" to generate the 3D ecosystem

3. Interact with the visualization:
   - **Left click + drag**: Rotate the view
   - **Right click + drag**: Pan the view
   - **Scroll**: Zoom in/out
   - **Click on nodes**: View comment details in the side panel

## Node Color Legend

- **Green** (#4ade80): Solution nodes (contains fix/solve/answer keywords)
- **Yellow** (#fbbf24): Question nodes (contains how/why/what keywords)
- **Orange** (#fb923c): Debate nodes (contains but/however/disagree keywords)
- **Blue** (#60a5fa): Deep discussions (5+ levels deep)
- **Light Blue** (#6bbaff): Top-level comments (depth < 2)
- **Light Green** (#a4e86f): Mid-level comments (depth 2-4)

## Project Structure

```
reddit-3d-app/
├── src/
│   ├── components/
│   │   ├── Canvas3D.jsx       # Main 3D canvas component
│   │   ├── Nodes.jsx           # Node rendering with animations
│   │   ├── Edges.jsx           # Edge rendering
│   │   └── SidePanel.jsx       # Comment details panel
│   ├── utils/
│   │   ├── thread-parser.js    # Reddit API parser
│   │   ├── graph-transformer.js # Tree to 3D graph converter
│   │   └── node-helpers.js     # Utility functions
│   ├── styles/
│   │   └── app.css             # Global styles
│   ├── App.jsx                 # Main app component
│   └── main.jsx                # Entry point
├── index.html                  # HTML template
├── package.json                # Dependencies
├── vite.config.js              # Vite configuration
└── README.md                   # This file
```

## Architecture Design

This application is designed with **Chrome extension compatibility in mind**. The core logic is separated into reusable modules:

### Core Modules (Reusable for Extension)

1. **thread-parser.js**: Parses Reddit thread data from JSON API
   - Can be adapted to parse DOM directly in content script

2. **graph-transformer.js**: Converts tree structure to 3D graph
   - Pure logic, works in any environment

3. **node-helpers.js**: Utility functions for node operations
   - Pure functions, environment-agnostic

### UI Components (Web-specific)

1. **Canvas3D.jsx**: Three.js canvas setup
2. **Nodes.jsx**: Node rendering and interactions
3. **Edges.jsx**: Edge rendering
4. **SidePanel.jsx**: Comment details display

## Converting to Chrome Extension

To convert this to a Chrome extension:

### 1. Create Extension Structure

```
extension/
├── manifest.json              # Extension manifest
├── content-script.js          # DOM parser (adapted from thread-parser.js)
├── popup.html                 # Extension popup
├── popup.js                   # Popup script (bundle React app)
└── assets/                    # Icons and resources
```

### 2. Adapt Core Logic

**Content Script** (content-script.js):
- Use `thread-parser.js` logic to parse Reddit DOM directly
- Send parsed data via `chrome.runtime.sendMessage()`

**Popup** (popup.html + popup.js):
- Bundle the React app (Canvas3D, Nodes, Edges, SidePanel)
- Receive data via `chrome.runtime.onMessage`
- Reuse graph-transformer.js and node-helpers.js as-is

### 3. Manifest.json Example

```json
{
  "manifest_version": 3,
  "name": "Reddit 3D Ecosystem",
  "version": "1.0.0",
  "description": "Visualize Reddit threads as 3D ecosystems",
  "permissions": ["activeTab"],
  "content_scripts": [{
    "matches": ["*://*.reddit.com/r/*/comments/*"],
    "js": ["content-script.js"]
  }],
  "action": {
    "default_popup": "popup.html"
  }
}
```

### 4. Build Process

Use Vite to bundle the React app for the extension:

```bash
npm run build
# Output goes to dist/ folder
# Copy to extension/popup/ folder
```

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

## Technologies Used

- **React 18**: UI framework
- **Three.js**: 3D rendering engine
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Helpers for react-three-fiber
- **Vite**: Build tool and dev server

## Data Structure

The application uses a recursive tree structure for representing threads:

```javascript
{
  "postId": "string",
  "title": "string",
  "url": "string",
  "root": {
    "id": "string",
    "depth": 0,
    "text": "string",
    "author": "string",
    "score": number,
    "timestamp": number,
    "children": [
      {
        "id": "string",
        "depth": 1,
        "text": "string",
        "author": "string",
        "score": number,
        "timestamp": number,
        "children": [ ... ]
      }
    ]
  }
}
```

## How It Works

1. **URL Input**: User provides a Reddit thread URL
2. **Data Fetching**: App fetches thread data from Reddit's JSON API (URL + `.json`)
3. **Parsing**: Raw JSON is parsed into a recursive tree structure
4. **Graph Transformation**: Tree is converted to 3D graph with positions and visual properties
5. **Rendering**: Three.js renders nodes (spheres) and edges (lines) in 3D space
6. **Interaction**: Users can click nodes to view details and navigate the ecosystem

## CORS Note

Reddit's API allows cross-origin requests, so this app can fetch thread data directly from the browser. If you encounter CORS issues:

1. Use a CORS proxy (for development only)
2. Convert to Chrome extension (no CORS restrictions)
3. Set up a backend proxy server

## Future Enhancements

- [ ] Chrome extension version
- [ ] Save/export visualizations
- [ ] Filter by keywords or authors
- [ ] Timeline animation showing thread evolution
- [ ] Multiple thread comparison
- [ ] Search functionality within threads
- [ ] Dark/light theme toggle
- [ ] Export to image/video

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
