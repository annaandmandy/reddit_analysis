/**
 * CommunityDetail Component
 *
 * Side panel showing detailed information about selected community
 */
import { X, Users, ArrowRightLeft, Clock } from 'lucide-react';
import { getConnectedLinks, calculateNodeFlow } from '../utils/dataTransform';
import { getCategoryColor } from '../utils/calculations';

const CommunityDetail = ({ community, graph, onClose }) => {
  if (!community || !graph) {
    return null;
  }

  const node = graph.nodes.find(n => n.id === community);

  if (!node) {
    return null;
  }

  const { incoming, outgoing } = getConnectedLinks(graph, community);
  const flow = calculateNodeFlow(graph, community);

  return (
    <div className="absolute top-0 right-0 w-80 h-full bg-white shadow-xl border-l border-gray-200 overflow-y-auto z-10">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">{node.name}</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Category Badge */}
        <div>
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: getCategoryColor(node.category) }}
          >
            {node.category}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-600">Activity</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{node.size}</p>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRightLeft className="w-4 h-4 text-gray-600" />
              <span className="text-xs text-gray-600">Connections</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{incoming.length + outgoing.length}</p>
          </div>
        </div>

        {/* Flow Summary */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-3">Migration Flow</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-blue-700">Incoming</span>
              <span className="text-sm font-bold text-blue-900">{flow.incoming}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-blue-700">Outgoing</span>
              <span className="text-sm font-bold text-blue-900">{flow.outgoing}</span>
            </div>
            <div className="border-t border-blue-200 pt-2 flex justify-between items-center">
              <span className="text-xs text-blue-700">Net</span>
              <span className={`text-sm font-bold ${flow.incoming - flow.outgoing > 0 ? 'text-green-600' : flow.incoming - flow.outgoing < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {flow.incoming - flow.outgoing > 0 ? '+' : ''}{flow.incoming - flow.outgoing}
              </span>
            </div>
          </div>
        </div>

        {/* Incoming Connections */}
        {incoming.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Incoming from ({incoming.length})
            </h4>
            <div className="space-y-2">
              {incoming
                .sort((a, b) => b.value - a.value)
                .slice(0, 10)
                .map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm text-gray-700">r/{link.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900">{link.value}</span>
                      {link.avg_time_gap && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {link.avg_time_gap}d
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Outgoing Connections */}
        {outgoing.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Outgoing to ({outgoing.length})
            </h4>
            <div className="space-y-2">
              {outgoing
                .sort((a, b) => b.value - a.value)
                .slice(0, 10)
                .map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-sm text-gray-700">r/{link.target}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900">{link.value}</span>
                      {link.avg_time_gap && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {link.avg_time_gap}d
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityDetail;
