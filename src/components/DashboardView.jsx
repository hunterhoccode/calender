import { useCampaigns } from '../contexts/CampaignContext';
import {
  getStatusForCampaign,
  checkOverlaps,
  CATEGORIES,
  getCategoryColor,
  parseISO,
  differenceInDays,
} from '../utils/dateUtils';
import {
  Zap, Clock, CheckCircle2, TrendingUp, AlertTriangle,
  DollarSign, Target, Calendar, Milestone as MilestoneIcon,
} from 'lucide-react';

export default function DashboardView() {
  const { state, dispatch, getFilteredCampaigns, getBrandById } = useCampaigns();
  const campaigns = getFilteredCampaigns();
  const { brands } = state;

  const now = new Date();
  const activeCampaigns = campaigns.filter((c) => getStatusForCampaign(c) === 'active');
  const upcomingCampaigns = campaigns.filter((c) => getStatusForCampaign(c) === 'upcoming');
  const completedCampaigns = campaigns.filter((c) => getStatusForCampaign(c) === 'completed');
  const overlaps = checkOverlaps(campaigns);

  // Parse budget to number
  const parseBudget = (str) => {
    if (!str) return 0;
    const num = str.replace(/[^\d]/g, '');
    return parseInt(num, 10) || 0;
  };

  const totalBudget = campaigns.reduce((sum, c) => sum + parseBudget(c.budget), 0);
  const formatVND = (n) => n.toLocaleString('vi-VN') + ' VND';

  // Category distribution
  const categoryStats = CATEGORIES.map((cat) => {
    const count = campaigns.filter((c) => c.category === cat.id).length;
    return { ...cat, count, percent: campaigns.length ? Math.round((count / campaigns.length) * 100) : 0 };
  }).filter((c) => c.count > 0);

  // Upcoming milestones (next 7 days, not completed)
  const upcomingMilestones = [];
  campaigns.forEach((c) => {
    (c.milestones || []).forEach((ms) => {
      if (ms.completed) return;
      const msDate = parseISO(ms.date);
      const daysLeft = differenceInDays(msDate, now);
      if (daysLeft >= 0 && daysLeft <= 7) {
        upcomingMilestones.push({ ...ms, campaignName: c.name, campaignId: c.id, daysLeft });
      }
    });
  });
  upcomingMilestones.sort((a, b) => a.daysLeft - b.daysLeft);

  // Upcoming campaigns (next 7 days)
  const soonCampaigns = campaigns.filter((c) => {
    const start = parseISO(c.startDate);
    const days = differenceInDays(start, now);
    return days >= 0 && days <= 7;
  });

  // Budget by brand
  const brandBudgets = brands.map((b) => {
    const total = campaigns.filter((c) => c.brandId === b.id).reduce((sum, c) => sum + parseBudget(c.budget), 0);
    return { ...b, total };
  }).filter((b) => b.total > 0).sort((a, b) => b.total - a.total);

  const colorVarMap = {
    red: 'var(--campaign-red)',
    blue: 'var(--campaign-blue)',
    yellow: 'var(--campaign-yellow)',
    purple: 'var(--campaign-purple)',
    orange: 'var(--campaign-orange)',
    green: 'var(--campaign-green)',
  };

  return (
    <div className="dashboard">
      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="dashboard-card stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--accent-primary-glow)', color: 'var(--accent-primary-hover)' }}>
            <TrendingUp size={20} />
          </div>
          <div className="stat-card-info">
            <div className="stat-card-value">{campaigns.length}</div>
            <div className="stat-card-label">Tổng chiến dịch</div>
          </div>
        </div>
        <div className="dashboard-card stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--campaign-green-bg)', color: 'var(--campaign-green)' }}>
            <Zap size={20} />
          </div>
          <div className="stat-card-info">
            <div className="stat-card-value">{activeCampaigns.length}</div>
            <div className="stat-card-label">Đang chạy</div>
          </div>
        </div>
        <div className="dashboard-card stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--campaign-blue-bg)', color: 'var(--campaign-blue)' }}>
            <Clock size={20} />
          </div>
          <div className="stat-card-info">
            <div className="stat-card-value">{upcomingCampaigns.length}</div>
            <div className="stat-card-label">Sắp tới</div>
          </div>
        </div>
        <div className="dashboard-card stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(120,136,154,0.15)', color: 'var(--text-tertiary)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-card-info">
            <div className="stat-card-value">{completedCampaigns.length}</div>
            <div className="stat-card-label">Hoàn thành</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-col">
          {/* Category Distribution */}
          <div className="dashboard-card">
            <h3 className="dashboard-card-title"><Target size={16} /> Phân bổ theo loại</h3>
            <div className="category-bars">
              {categoryStats.map((cat) => (
                <div key={cat.id} className="category-bar-row">
                  <div className="category-bar-label">
                    <span className="filter-dot" style={{ background: colorVarMap[cat.color] }} />
                    {cat.label}
                  </div>
                  <div className="category-bar-track">
                    <div
                      className="category-bar-fill"
                      style={{ width: `${cat.percent}%`, background: colorVarMap[cat.color] }}
                    />
                  </div>
                  <span className="category-bar-count">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Budget by Brand */}
          <div className="dashboard-card">
            <h3 className="dashboard-card-title"><DollarSign size={16} /> Ngân sách theo Brand</h3>
            {totalBudget > 0 ? (
              <>
                <div className="budget-total">{formatVND(totalBudget)}</div>
                <div className="budget-brands">
                  {brandBudgets.map((b) => (
                    <div key={b.id} className="budget-brand-row">
                      <span className="budget-brand-icon" style={{ background: b.color + '20', color: b.color }}>{b.logo}</span>
                      <span className="budget-brand-name">{b.name}</span>
                      <span className="budget-brand-value">{formatVND(b.total)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>Chưa có dữ liệu ngân sách</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-col">
          {/* Upcoming Milestones */}
          <div className="dashboard-card">
            <h3 className="dashboard-card-title"><MilestoneIcon size={16} /> Milestones sắp đến hạn</h3>
            {upcomingMilestones.length > 0 ? (
              <div className="milestone-upcoming-list">
                {upcomingMilestones.slice(0, 8).map((ms) => (
                  <div key={ms.id} className="milestone-upcoming-item">
                    <div className="milestone-upcoming-dot" style={{
                      background: ms.daysLeft <= 1 ? 'var(--campaign-red)' : ms.daysLeft <= 3 ? 'var(--campaign-yellow)' : 'var(--campaign-green)'
                    }} />
                    <div className="milestone-upcoming-info">
                      <div className="milestone-upcoming-text">{ms.text}</div>
                      <div className="milestone-upcoming-campaign">{ms.campaignName}</div>
                    </div>
                    <span className="milestone-upcoming-days" style={{
                      color: ms.daysLeft <= 1 ? 'var(--campaign-red)' : ms.daysLeft <= 3 ? 'var(--campaign-yellow)' : 'var(--text-tertiary)'
                    }}>
                      {ms.daysLeft === 0 ? 'Hôm nay' : `${ms.daysLeft} ngày`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>Không có milestone nào trong 7 ngày tới</p>
            )}
          </div>

          {/* Overlap Warnings */}
          {overlaps.length > 0 && (
            <div className="dashboard-card" style={{ borderColor: 'var(--campaign-red-border)' }}>
              <h3 className="dashboard-card-title" style={{ color: 'var(--campaign-red)' }}>
                <AlertTriangle size={16} /> Cảnh báo chồng chéo ({overlaps.length})
              </h3>
              <div className="overlap-list">
                {overlaps.slice(0, 5).map(([idA, idB], idx) => {
                  const a = campaigns.find((c) => c.id === idA);
                  const b = campaigns.find((c) => c.id === idB);
                  if (!a || !b) return null;
                  return (
                    <div key={idx} className="overlap-item">
                      <span className="overlap-name" onClick={() => dispatch({ type: 'VIEW_CAMPAIGN', payload: a })}>{a.name}</span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-xs)' }}>&amp;</span>
                      <span className="overlap-name" onClick={() => dispatch({ type: 'VIEW_CAMPAIGN', payload: b })}>{b.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Campaigns */}
          <div className="dashboard-card">
            <h3 className="dashboard-card-title"><Calendar size={16} /> Đang hoạt động</h3>
            {activeCampaigns.length > 0 ? (
              <div className="active-campaign-list">
                {activeCampaigns.map((c) => {
                  const brand = c.brandId ? getBrandById(c.brandId) : null;
                  const color = getCategoryColor(c.category);
                  const end = parseISO(c.endDate);
                  const daysLeft = differenceInDays(end, now);
                  return (
                    <div
                      key={c.id}
                      className="active-campaign-item"
                      onClick={() => dispatch({ type: 'VIEW_CAMPAIGN', payload: c })}
                      style={{ borderLeftColor: colorVarMap[color] }}
                    >
                      <div className="active-campaign-info">
                        <div className="active-campaign-name">
                          {brand && <span style={{ marginRight: 4 }}>{brand.logo}</span>}
                          {c.name}
                        </div>
                        <div className="active-campaign-dates">
                          Còn {daysLeft} ngày
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--font-sm)' }}>Không có chiến dịch nào đang chạy</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
