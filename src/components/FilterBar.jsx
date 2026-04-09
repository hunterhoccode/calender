import { useCampaigns } from '../contexts/CampaignContext';
import { CATEGORIES, getCategoryColor } from '../utils/dateUtils';
import { Search, Filter, X } from 'lucide-react';

const colorVarMap = {
  red: 'var(--campaign-red)',
  blue: 'var(--campaign-blue)',
  yellow: 'var(--campaign-yellow)',
  purple: 'var(--campaign-purple)',
  orange: 'var(--campaign-orange)',
  green: 'var(--campaign-green)',
};

export default function FilterBar() {
  const { state, dispatch } = useCampaigns();
  const { filters } = state;

  const hasFilters =
    filters.categories.length > 0 || filters.status || filters.search;

  return (
    <div className="filter-bar">
      {/* Search */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          size={13}
          style={{
            position: 'absolute',
            left: 12,
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          className="search-input"
          style={{ paddingLeft: 32 }}
          placeholder="Tìm chiến dịch..."
          value={filters.search}
          onChange={(e) =>
            dispatch({ type: 'SET_FILTER_SEARCH', payload: e.target.value })
          }
        />
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--border-color)' }} />

      {/* Category Filters */}
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          className={`filter-chip ${filters.categories.includes(cat.id) ? 'active' : ''}`}
          onClick={() =>
            dispatch({ type: 'SET_FILTER_CATEGORY', payload: cat.id })
          }
        >
          <span
            className="filter-dot"
            style={{ background: colorVarMap[cat.color] }}
          />
          {cat.label}
        </button>
      ))}

      <div style={{ width: 1, height: 20, background: 'var(--border-color)' }} />

      {/* Status Filters */}
      {[
        { id: 'active', label: 'Đang chạy' },
        { id: 'upcoming', label: 'Sắp tới' },
        { id: 'completed', label: 'Đã kết thúc' },
      ].map((s) => (
        <button
          key={s.id}
          className={`filter-chip ${filters.status === s.id ? 'active' : ''}`}
          onClick={() =>
            dispatch({ type: 'SET_FILTER_STATUS', payload: s.id })
          }
        >
          {s.label}
        </button>
      ))}

      {/* Clear all */}
      {hasFilters && (
        <button
          className="filter-chip"
          onClick={() => dispatch({ type: 'CLEAR_FILTERS' })}
          style={{ color: 'var(--campaign-red)', borderColor: 'var(--campaign-red-border)' }}
        >
          <X size={12} />
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}
