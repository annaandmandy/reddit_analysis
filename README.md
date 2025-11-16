# reddit_analysis
reddit_analysis

Reddit Migration Flows

Visualizing the journey of users across Reddit communities
Ever wondered how people's interests evolve? Watch as users flow from r/fitness to r/intermittentfasting, or from r/learnprogramming to r/webdev. This project maps the fascinating migration patterns across Reddit's ecosystem.


📋 Project Structure
reddit-migration-flows/
├── 📂 backend/
│   ├── data_collector.py      # PRAW + Reddit API scraping
│   ├── data_processor.py      # Clean & aggregate migration data
│   ├── config.py              # API keys & configuration
│   └── requirements.txt       # Python dependencies
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── NetworkGraph.jsx       # Main force-directed graph
│   │   │   ├── MigrationStats.jsx     # Key metrics dashboard
│   │   │   ├── CommunityDetail.jsx    # Side panel with details
│   │   │   ├── TimelineFilter.jsx     # Time range controls
│   │   │   └── SearchBar.jsx          # Find specific communities
│   │   │
│   │   ├── 📂 utils/
│   │   │   ├── dataTransform.js       # Transform CSV to graph format
│   │   │   └── calculations.js        # Migration metrics
│   │   │
│   │   ├── 📂 styles/
│   │   │   └── globals.css
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── 📂 data/
│   ├── raw_user_posts.csv          # Raw scraped data
│   ├── community_flows.json        # Processed migration data
│   └── sample_data.json            # Mock data for testing
│
├── README.md
└── .env.example

🎯 Core Functions Breakdown
Backend Functions
1️⃣ data_collector.py
pythonclass RedditMigrationCollector:
    """
    Collects user posting history across subreddits
    """
    
    def __init__(self, client_id, client_secret):
        """Initialize PRAW Reddit instance"""
        
    def get_seed_communities(self, category: str) -> list:
        """
        Returns predefined seed subreddits by category
        - category: 'fitness', 'tech', 'finance', etc.
        """
        
    def scrape_active_users(self, subreddit: str, limit=100) -> list:
        """
        Gets top N active users from a subreddit
        - Scrapes recent top posts
        - Extracts unique authors
        - Returns list of usernames
        """
        
    def get_user_subreddit_history(self, username: str, time_window=90) -> dict:
        """
        Gets user's posting history across subreddits
        - Returns: {subreddit: post_count, first_post_date, last_post_date}
        - Limited to last N days
        """
        
    def build_migration_dataset(self, seed_subs: list) -> pd.DataFrame:
        """
        Main orchestrator function
        - For each seed subreddit:
          - Get active users
          - Get their cross-sub history
          - Identify migration patterns
        - Returns: DataFrame with columns [user, from_sub, to_sub, time_gap]
        """
2️⃣ data_processor.py
pythonclass MigrationProcessor:
    """
    Transforms raw data into visualization-ready formats
    """
    
    def detect_migrations(self, user_df: pd.DataFrame) -> pd.DataFrame:
        """
        Identifies actual migrations vs concurrent participation
        - Migration = stopped posting in A, started in B
        - Returns: Clean migration events with timestamps
        """
        
    def calculate_flow_metrics(self, migrations: pd.DataFrame) -> dict:
        """
        Aggregates migration data:
        - Total users migrating A → B
        - Average time gap
        - Migration velocity (migrations per month)
        """
        
    def build_network_graph(self, flows: pd.DataFrame) -> dict:
        """
        Converts to force-graph format:
        {
            "nodes": [{id, name, size, category}],
            "links": [{source, target, value}]
        }
        """
        
    def identify_bridge_communities(self, graph: dict) -> list:
        """
        Finds communities that connect multiple clusters
        - High betweenness centrality
        - Returns ranked list of bridge subreddits
        """
        
    def export_for_frontend(self, data: dict, filepath: str):
        """
        Saves processed data as JSON for frontend consumption
        """

Frontend Functions
3️⃣ NetworkGraph.jsx
jsxconst NetworkGraph = ({ data, onNodeClick, highlightPath }) => {
    /**
     * Main interactive force-directed graph
     * 
     * Features:
     * - Draggable nodes
     * - Hover tooltips showing migration counts
     * - Click to select community
     * - Directional arrows showing flow
     * - Link thickness = migration volume
     * - Node size = community activity
     */
    
    const handleNodeClick = (node) => {
        // Highlight all incoming/outgoing connections
        // Update CommunityDetail panel
        // Show migration statistics
    };
    
    const getNodeColor = (node) => {
        // Color by category (fitness=red, tech=blue, etc.)
    };
    
    const getLinkWidth = (link) => {
        // Scale width based on user count
        return Math.sqrt(link.value) * 2;
    };
    
    return (
        <ForceGraph2D
            graphData={data}
            nodeLabel={node => `${node.id} (${node.members} members)`}
            linkDirectionalArrowLength={6}
            onNodeClick={handleNodeClick}
            // ... configuration
        />
    );
};
4️⃣ MigrationStats.jsx
jsxconst MigrationStats = ({ selectedCommunity, data }) => {
    /**
     * Displays key metrics for selected community
     * 
     * Shows:
     * - Top 5 incoming migrations (where users come from)
     * - Top 5 outgoing migrations (where users go to)
     * - Average time gap for migration
     * - Migration velocity trend
     */
    
    const calculateIncomingFlows = () => {
        // Filter links where target = selectedCommunity
        // Sort by value, return top 5
    };
    
    const calculateOutgoingFlows = () => {
        // Filter links where source = selectedCommunity
        // Sort by value, return top 5
    };
    
    return (
        <div className="stats-panel">
            <h3>📊 {selectedCommunity} Migration Patterns</h3>
            
            <div className="flow-section">
                <h4>⬅️ Users Coming From:</h4>
                <BarChart data={incomingFlows} />
            </div>
            
            <div className="flow-section">
                <h4>➡️ Users Going To:</h4>
                <BarChart data={outgoingFlows} />
            </div>
        </div>
    );
};
5️⃣ dataTransform.js
javascript/**
 * Utility functions for data manipulation
 */

export const loadMigrationData = async () => {
    // Fetch from /data/community_flows.json
    // Parse and validate structure
};

export const filterByTimeRange = (data, startDate, endDate) => {
    // Filter migrations within date range
    // Recalculate aggregate flows
};

export const filterByCategory = (data, category) => {
    // Show only specific community categories
    // e.g., only fitness-related subs
};

export const findPath = (graph, sourceId, targetId) => {
    // BFS to find migration path between two communities
    // Returns array of intermediate nodes
};

export const calculateCentrality = (graph) => {
    // Simple betweenness centrality approximation
    // Identifies bridge communities
};

🚀 Quick Start Guide
Step 1: Set Up Backend (1.5 hours)
bashcd backend

# Install dependencies
pip install praw pandas python-dotenv

# Configure Reddit API
cp .env.example .env
# Add your Reddit API credentials

# Run data collection
python data_collector.py --category fitness --users 50

# Process data
python data_processor.py --input raw_user_posts.csv --output ../data/community_flows.json
Step 2: Set Up Frontend (30 minutes)
bashcd frontend

# Install dependencies
npm install
# Key packages: react-force-graph-2d, recharts, lucide-react

# Start development server
npm run dev
```

### **Step 3: Open Browser** 🎉

Navigate to `http://localhost:5173` and watch the migration flows come alive!

---

## 🎨 Visualization Features

### **Network Graph**
- **Nodes**: Subreddit communities (size = activity level)
- **Links**: User migration flows (thickness = volume)
- **Colors**: Category-coded (customizable)
- **Interactions**: Click, drag, hover

### **Metrics Dashboard**
- Total migrations detected
- Most popular migration paths
- Bridge communities (connect multiple clusters)
- Migration velocity over time

### **Filters**
- **Time Range**: Slide to focus on specific periods
- **Category**: Filter by topic (fitness, tech, finance)
- **Minimum Flow**: Hide low-volume connections

---

## 📊 Sample Insights You'll Discover
```
🏋️ Fitness Ecosystem:
r/fitness → r/loseit (180 users, avg 12 days)
r/loseit → r/intermittentfasting (145 users, avg 23 days)
r/intermittentfasting → r/keto (98 users, avg 31 days)

💡 Bridge Community: r/loseit
   Connects general fitness → specific diet methods

🔥 Fast Migration: r/fitness → r/bodyweightfitness
   Avg time gap: 8 days (quick pivot to home workouts)

⚙️ Configuration Options
backend/config.py
python# Data collection parameters
MAX_USERS_PER_SUB = 100
TIME_WINDOW_DAYS = 90
MIN_POSTS_THRESHOLD = 3  # Minimum posts to count as "active"

# Migration detection
MIN_TIME_GAP_DAYS = 7    # Minimum gap to count as migration
MAX_TIME_GAP_DAYS = 180  # Maximum gap to still be relevant

# Categories (expandable)
CATEGORIES = {
    'fitness': ['fitness', 'loseit', 'keto', 'intermittentfasting'],
    'tech': ['learnprogramming', 'webdev', 'reactjs', 'python'],
    'finance': ['personalfinance', 'investing', 'stocks', 'cryptocurrency']
}

🐛 Troubleshooting
"Rate limit exceeded"
→ Reddit API has strict limits. Add delays in scrape_active_users():
pythontime.sleep(2)  # Between each request
"Graph is too cluttered"
→ Increase MIN_FLOW_THRESHOLD in filters to hide small connections
"Data collection is slow"
→ Reduce MAX_USERS_PER_SUB or use sample_data.json for testing

🎯 6-Hour Implementation Timeline
TimeTaskFocus0:00-1:30Backend data collectionGet real Reddit data OR prepare quality mock data1:30-2:00Data processingConvert to graph format, calculate metrics2:00-3:30Core visualizationGet force graph working with interactions3:30-4:30Stats dashboardAdd metrics panel and filters4:30-5:30Polish & interactionsClick handlers, tooltips, smooth UX5:30-6:00Deploy & testVercel/Netlify deploy, final testing

🌟 Future Enhancements (Post-MVP)

 Sankey diagram view (alternative to network)
 Heatmap of migration timing patterns
 User-level drill-down (privacy-aware)
 Real-time data updates
 Sentiment analysis of communities
 Export insights as shareable reports


📚 Tech Stack
Backend

Python 3.9+
PRAW (Reddit API wrapper)
pandas (data processing)

Frontend

React 18
Vite (blazingly fast dev server)
react-force-graph-2d (network viz)
Recharts (charts & stats)
Tailwind CSS (styling)


🤝 Contributing
This is a research/portfolio project, but ideas are welcome! Open an issue or PR if you:

Find interesting migration patterns
Want to add new visualization types
Have suggestions for better metrics


📄 License
