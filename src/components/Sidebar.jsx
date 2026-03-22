import { useCampaigns } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { getStatusForCampaign, checkOverlaps } from '../utils/dateUtils';
import UserBadge from './UserBadge';
import {
  LayoutGrid,
  LayoutDashboard,
  CalendarDays,
  GanttChart,
  Zap,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarPlus,
  Building2,
  Plus,
  MoreHorizontal,
  Shield,
  History,
} from 'lucide-react';

export default function Sidebar({ currentView, onViewChange, onOpenChangelog, isOpen }) {
  const { state, dispatch, getFilteredCampaigns } = useCampaigns();
  const { hasPermission, dispatch: authDispatch } = useAuth();
  const { campaigns, brands, activeBrandId } = state;

  const filteredCampaigns = getFilteredCampaigns();
  const activeCampaigns = filteredCampaigns.filter(
    (c) => getStatusForCampaign(c) === 'active'
  );
  const upcomingCampaigns = filteredCampaigns.filter(
    (c) => getStatusForCampaign(c) === 'upcoming'
  );
  const completedCampaigns = filteredCampaigns.filter(
    (c) => getStatusForCampaign(c) === 'completed'
  );
  const overlaps = checkOverlaps(filteredCampaigns);

  const getCampaignCountForBrand = (brandId) => {
    return campaigns.filter((c) => c.brandId === brandId).length;
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon"><Zap size={18} /></div>
          <div>
            <h1>CMP PRO</h1>
            <div className="subtitle">Campaign Manager</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Brands Section */}
        <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Brands</span>
          {hasPermission('canManageBrands') && (
            <button
              className="brand-add-btn"
              onClick={() => dispatch({ type: 'OPEN_BRAND_DRAWER' })}
              title="Thêm brand mới"
            >
              <Plus size={13} />
            </button>
          )}
        </div>

        {/* All Brands toggle */}
        <button
          className={`sidebar-nav-item ${activeBrandId === null ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_ACTIVE_BRAND', payload: null })}
          style={activeBrandId === null ? {} : {}}
        >
          <Building2 size={18} />
          Tất cả Brands
          <span className="brand-count">{campaigns.length}</span>
        </button>

        {/* Brand list */}
        {brands.map((brand) => (
          <div key={brand.id} className="brand-item-wrapper">
            <button
              className={`sidebar-nav-item brand-nav-item ${activeBrandId === brand.id ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'SET_ACTIVE_BRAND', payload: brand.id })}
            >
              <span
                className="brand-icon"
                style={{ background: brand.color + '20' }}
              >
                {brand.logo}
              </span>
              <span className="brand-name-text">{brand.name}</span>
              <span className="brand-count">{getCampaignCountForBrand(brand.id)}</span>
            </button>
            {hasPermission('canManageBrands') && (
              <button
                className="brand-edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'OPEN_BRAND_DRAWER', payload: brand });
                }}
                title="Chỉnh sửa brand"
              >
                <MoreHorizontal size={14} />
              </button>
            )}
          </div>
        ))}

        <div style={{ height: 12 }} />

        <div className="sidebar-section-title">Chế độ xem</div>
        <button
          className={`sidebar-nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>
        <button
          className={`sidebar-nav-item ${currentView === 'month' ? 'active' : ''}`}
          onClick={() => onViewChange('month')}
        >
          <LayoutGrid size={18} />
          Xem Tháng
        </button>
        <button
          className={`sidebar-nav-item ${currentView === 'week' ? 'active' : ''}`}
          onClick={() => onViewChange('week')}
        >
          <CalendarDays size={18} />
          Xem Tuần
        </button>
        <button
          className={`sidebar-nav-item ${currentView === 'timeline' ? 'active' : ''}`}
          onClick={() => onViewChange('timeline')}
        >
          <GanttChart size={18} />
          Timeline
        </button>

        <div style={{ height: 8 }} />

        <div className="sidebar-section-title">Hành động</div>
        {hasPermission('canCreate') && (
          <button
            className="sidebar-nav-item"
            onClick={() => dispatch({ type: 'OPEN_DRAWER' })}
            style={{ color: 'var(--accent-primary-hover)' }}
          >
            <CalendarPlus size={18} />
            Thêm Chiến Dịch
          </button>
        )}
        {hasPermission('canManageUsers') && (
          <button
            className="sidebar-nav-item"
            onClick={() => authDispatch({ type: 'OPEN_USER_MODAL' })}
          >
            <Shield size={18} />
            Quản Lý Người Dùng
          </button>
        )}
        <button
          className="sidebar-nav-item"
          onClick={onOpenChangelog}
        >
          <History size={18} />
          Lịch Sử Thay Đổi
        </button>

        <div style={{ flex: 1 }} />

        {/* Overlap Warning */}
        {overlaps.length > 0 && (
          <div
            className="overlap-badge"
            style={{ padding: '8px 12px', marginBottom: 8 }}
          >
            <AlertTriangle size={14} />
            {overlaps.length} cặp chiến dịch chồng chéo
          </div>
        )}
      </nav>

      {/* Stats */}
      <div className="sidebar-stats">
        <div className="sidebar-section-title" style={{ padding: '0 0 8px' }}>
          Tổng quan {activeBrandId && brands.find(b => b.id === activeBrandId) ? `· ${brands.find(b => b.id === activeBrandId).name}` : ''}
        </div>
        <div className="stat-item">
          <span className="stat-label">
            <Zap size={12} style={{ marginRight: 4 }} />
            Đang chạy
          </span>
          <span className="stat-value" style={{ color: 'var(--campaign-green)' }}>
            {activeCampaigns.length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">
            <Clock size={12} style={{ marginRight: 4 }} />
            Sắp tới
          </span>
          <span className="stat-value" style={{ color: 'var(--campaign-blue)' }}>
            {upcomingCampaigns.length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">
            <CheckCircle2 size={12} style={{ marginRight: 4 }} />
            Hoàn thành
          </span>
          <span className="stat-value" style={{ color: 'var(--text-tertiary)' }}>
            {completedCampaigns.length}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">
            <TrendingUp size={12} style={{ marginRight: 4 }} />
            Tổng
          </span>
          <span className="stat-value">{filteredCampaigns.length}</span>
        </div>
      </div>

      {/* User */}
      <UserBadge />
    </aside>
  );
}
