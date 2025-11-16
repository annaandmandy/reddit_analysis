/**
 * Main App Component
 *
 * Orchestrates all components and manages application state
 */
import { useState, useEffect } from 'react';
import NetworkGraph from './components/NetworkGraph';
import MigrationStats from './components/MigrationStats';
import CommunityDetail from './components/CommunityDetail';
import SearchBar from './components/SearchBar';
import TimelineFilter from './components/TimelineFilter';
import { loadMigrationData, filterByCategory, filterByMinFlow, getConnectedLinks } from './utils/dataTransform';
import { calculateNetworkStats } from './utils/calculations';
import { TrendingUp, Network, Users } from 'lucide-react';

function App() {
  const [rawData, setRawData] = useState(null);
  const [filteredData, setFilteredData] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minFlow, setMinFlow] = useState(1);
  const [highlightNodes, setHighlightNodes] = useState([]);
  const [highlightLinks, setHighlightLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await loadMigrationData();
        setRawData(data);
        setFilteredData(data);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters when category or minFlow changes
  useEffect(() => {
    if (!rawData) return;

    let filtered = rawData;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filterByCategory(filtered, selectedCategory);
    }

    // Apply min flow filter
    if (minFlow > 0) {
      filtered = filterByMinFlow(filtered, minFlow);
    }

    setFilteredData(filtered);

    // Clear selection if filtered out
    if (selectedCommunity) {
      const nodeExists = filtered.graph.nodes.some(n => n.id === selectedCommunity);
      if (!nodeExists) {
        setSelectedCommunity(null);
        setShowDetail(false);
        setHighlightNodes([]);
        setHighlightLinks([]);
      }
    }
  }, [rawData, selectedCategory, minFlow, selectedCommunity]);

  const handleNodeClick = (node) => {
    if (!filteredData) return;

    const communityId = node.id;
    setSelectedCommunity(communityId);
    setShowDetail(true);

    // Highlight connected nodes and links
    const { incoming, outgoing } = getConnectedLinks(filteredData.graph, communityId);

    const connectedNodes = new Set([communityId]);
    incoming.forEach(link => connectedNodes.add(link.source));
    outgoing.forEach(link => connectedNodes.add(link.target));

    setHighlightNodes(Array.from(connectedNodes));
    setHighlightLinks([...incoming, ...outgoing]);
  };

  const handleCommunitySelect = (communityId) => {
    if (!filteredData) return;

    const node = filteredData.graph.nodes.find(n => n.id === communityId);
    if (node) {
      handleNodeClick(node);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setHighlightNodes([]);
    setHighlightLinks([]);
  };

  // Get unique categories for filter
  const categories = rawData && rawData.graph
    ? [...new Set(rawData.graph.nodes.map(n => n.category))].sort()
    : [];

  // Get all community IDs for search
  const communities = rawData && rawData.graph
    ? rawData.graph.nodes.map(n => n.id).sort()
    : [];

  // Calculate network stats
  const networkStats = filteredData
    ? calculateNetworkStats(filteredData.graph, filteredData.metadata)
    : {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading migration data...</p>
        </div>
      </div>
    );
  }

  if (!filteredData || !filteredData.graph) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Failed to load data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reddit Migration Flows</h1>
            <p className="text-sm text-gray-600 mt-1">
              Visualizing user journey across communities
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-right">
              <div className="flex items-center gap-2 text-gray-600">
                <Network className="w-4 h-4" />
                <span className="text-xs">Communities</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{networkStats.totalNodes || 0}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs">Flows</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{networkStats.totalLinks || 0}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span className="text-xs">Total Migrations</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{networkStats.total_migrations || 0}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-80 flex-shrink-0 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Search */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Search</h3>
              <SearchBar
                communities={communities}
                onSelect={handleCommunitySelect}
              />
            </div>

            {/* Filters */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Filters</h3>
              <TimelineFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                minFlow={minFlow}
                onMinFlowChange={setMinFlow}
              />
            </div>

            {/* Legend */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Category Legend</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div key={category} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{
                        backgroundColor: {
                          fitness: '#ef4444',
                          tech: '#3b82f6',
                          finance: '#10b981',
                          gaming: '#a855f7',
                          creative: '#f59e0b',
                          other: '#6b7280'
                        }[category] || '#6b7280'
                      }}
                    />
                    <span className="text-sm text-gray-700 capitalize">{category}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Stats */}
            {networkStats.summary_stats && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Migration Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Time:</span>
                    <span className="font-medium">{networkStats.summary_stats.avg_migration_time} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fastest:</span>
                    <span className="font-medium">{networkStats.summary_stats.fastest_migration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slowest:</span>
                    <span className="font-medium">{networkStats.summary_stats.slowest_migration} days</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Graph Area */}
        <main className="flex-1 p-6 relative">
          <NetworkGraph
            data={filteredData.graph}
            onNodeClick={handleNodeClick}
            highlightNodes={highlightNodes}
            highlightLinks={highlightLinks}
          />
        </main>

        {/* Right Sidebar - Stats Panel */}
        <aside className="w-[28rem] flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
          <MigrationStats
            selectedCommunity={selectedCommunity}
            graph={filteredData.graph}
          />
        </aside>

        {/* Community Detail Overlay */}
        {showDetail && (
          <CommunityDetail
            community={selectedCommunity}
            graph={filteredData.graph}
            onClose={handleCloseDetail}
          />
        )}
      </div>
    </div>
  );
}

export default App;
