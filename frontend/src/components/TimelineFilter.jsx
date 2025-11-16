/**
 * TimelineFilter Component
 *
 * Time range controls and category filters
 */
import { Filter, Sliders } from 'lucide-react';

const TimelineFilter = ({
  categories = [],
  selectedCategory = 'all',
  onCategoryChange,
  minFlow = 5,
  onMinFlowChange
}) => {
  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Filter className="w-4 h-4" />
          Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange && onCategoryChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Minimum Flow Filter */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <Sliders className="w-4 h-4" />
          Minimum Flow: {minFlow}
        </label>
        <input
          type="range"
          min="0"
          max="50"
          step="5"
          value={minFlow}
          onChange={(e) => onMinFlowChange && onMinFlowChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0</span>
          <span>25</span>
          <span>50</span>
        </div>
      </div>
    </div>
  );
};

export default TimelineFilter;
