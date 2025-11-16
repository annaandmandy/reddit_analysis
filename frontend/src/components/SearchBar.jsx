/**
 * SearchBar Component
 *
 * Search and filter communities
 */
import { useState } from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ communities = [], onSelect }) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredCommunities = communities.filter(community =>
    community.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (community) => {
    if (onSelect) {
      onSelect(community);
    }
    setQuery('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search communities..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {showResults && query && filteredCommunities.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-20">
          {filteredCommunities.slice(0, 10).map((community, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(community)}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <span className="text-sm text-gray-900">r/{community}</span>
            </button>
          ))}
        </div>
      )}

      {showResults && query && filteredCommunities.length === 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
          <p className="text-sm text-gray-500">No communities found</p>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
