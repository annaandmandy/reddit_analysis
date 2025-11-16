/**
 * MigrationStats Component
 *
 * Displays key metrics for selected community
 * - Top 5 incoming migrations (where users come from)
 * - Top 5 outgoing migrations (where users go to)
 * - Average time gap for migration
 * - Migration velocity trend
 */
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowRight, ArrowLeft, TrendingUp, Clock } from 'lucide-react';
import { calculateCommunityStats, getCategoryColor } from '../utils/calculations';

const MigrationStats = ({ selectedCommunity, graph }) => {
  if (!selectedCommunity || !graph) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Click on a community to view migration patterns</p>
      </div>
    );
  }

  const stats = calculateCommunityStats(graph, selectedCommunity);

  if (!stats) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>No data available for this community</p>
      </div>
    );
  }

  const hasData = stats.incoming.count > 0 || stats.outgoing.count > 0;

  if (!hasData) {
    return (
      <div className="p-6 text-center text-gray-500">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          r/{selectedCommunity}
        </h3>
        <p className="mt-4">This community has no migration connections in the current filter.</p>
        <p className="text-sm mt-2">Try adjusting the minimum flow filter.</p>
      </div>
    );
  }

  const incomingData = stats.incoming.top.map(link => ({
    name: link.source,
    value: link.value,
    time: link.avg_time_gap
  }));

  const outgoingData = stats.outgoing.top.map(link => ({
    name: link.target,
    value: link.value,
    time: link.avg_time_gap
  }));

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          r/{selectedCommunity}
        </h3>
        <p className="text-sm text-gray-600">Migration Patterns</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <ArrowLeft className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Incoming</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.incoming.total}</p>
          <p className="text-xs text-blue-700 mt-1">
            Avg: {stats.incoming.avgTime} days
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <ArrowRight className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Outgoing</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.outgoing.total}</p>
          <p className="text-xs text-green-700 mt-1">
            Avg: {stats.outgoing.avgTime} days
          </p>
        </div>
      </div>

      {/* Net Flow */}
      <div className={`p-4 rounded-lg ${stats.netFlow > 0 ? 'bg-green-50' : stats.netFlow < 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className={`w-4 h-4 ${stats.netFlow > 0 ? 'text-green-600' : stats.netFlow < 0 ? 'text-red-600' : 'text-gray-600'}`} />
          <span className="text-sm font-medium text-gray-900">Net Flow</span>
        </div>
        <p className={`text-2xl font-bold ${stats.netFlow > 0 ? 'text-green-600' : stats.netFlow < 0 ? 'text-red-600' : 'text-gray-600'}`}>
          {stats.netFlow > 0 ? '+' : ''}{stats.netFlow}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          {stats.netFlow > 0 ? 'Growing community' : stats.netFlow < 0 ? 'Declining community' : 'Stable community'}
        </p>
      </div>

      {/* Incoming Migrations */}
      {incomingData.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">Users Coming From</h4>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={incomingData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 rounded shadow-lg border border-gray-200">
                        <p className="font-medium">r/{payload[0].payload.name}</p>
                        <p className="text-sm text-gray-600">
                          Users: {payload[0].value}
                        </p>
                        <p className="text-sm text-gray-600">
                          Avg time: {payload[0].payload.time} days
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Outgoing Migrations */}
      {outgoingData.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-green-600" />
            <h4 className="text-lg font-semibold text-gray-900">Users Going To</h4>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={outgoingData} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 rounded shadow-lg border border-gray-200">
                        <p className="font-medium">r/{payload[0].payload.name}</p>
                        <p className="text-sm text-gray-600">
                          Users: {payload[0].value}
                        </p>
                        <p className="text-sm text-gray-600">
                          Avg time: {payload[0].payload.time} days
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default MigrationStats;
