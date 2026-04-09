import { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useCampaigns } from '../contexts/CampaignContext';
import { useAuth } from '../contexts/AuthContext';
import CommentThread from './CommentThread';
import { getCategoryColor, CATEGORIES } from '../utils/dateUtils';
import {
  X, Edit3, Trash2, Calendar, MessageCircle, Target, DollarSign,
  Building2, CheckCircle2, Circle, AlertTriangle, Clock, ImageIcon,
  Users, StickyNote, Milestone as MilestoneIcon, FileText, Zap, Copy,
} from 'lucide-react';

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

export default function CampaignDetailModal() {
  const { state, dispatch, getBrandById } = useCampaigns();
  const { hasPermission } = useAuth();
  const { detailOpen, viewingCampaign } = state;

  const [showConfirm, setShowConfirm] = useState(false);

  if (!detailOpen || !viewingCampaign) return null;

  const campaign = viewingCampaign;
  const brand = campaign.brandId ? getBrandById(campaign.brandId) : null;
  const color = getCategoryColor(campaign.category);
  const categoryLabel = CATEGORIES.find((c) => c.id === campaign.category)?.label || campaign.category;

  const now = new Date();
  const startDate = new Date(campaign.startDate);
  const endDate = new Date(campaign.endDate);
  const isActive = now >= startDate && now <= endDate;
  const isUpcoming = now < startDate;
  const isCompleted = now > endDate;

  // Calculate days remaining/ago
  const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
  const daysUntilEnd = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const daysPassed = isActive ? Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)) : 0;
  const progress = isCompleted ? 100 : isUpcoming ? 0 : Math.round((daysPassed / totalDays) * 100);

  const handleClose = () => dispatch({ type: 'CLOSE_DETAIL' });
  const handleEdit = () => dispatch({ type: 'OPEN_DRAWER', payload: campaign });
  const handleDelete = () => {
    setShowConfirm(false);
    dispatch({ type: 'DELETE_CAMPAIGN', payload: campaign.id });
  };
  const handleToggleMilestone = (msId) => {
    dispatch({ type: 'TOGGLE_MILESTONE', payload: { campaignId: campaign.id, milestoneId: msId } });
  };

  // Milestone urgency
  const getMilestoneStatus = (ms) => {
    if (ms.completed) return 'completed';
    const msDate = new Date(ms.date);
    const daysLeft = Math.ceil((msDate - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'overdue';
    if (daysLeft <= 2) return 'urgent';
    if (daysLeft <= 5) return 'soon';
    return 'normal';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const statusConfig = {
    active: { label: 'Đang chạy', color: 'var(--campaign-green)', bg: 'var(--campaign-green-bg)', Icon: Zap },
    upcoming: { label: 'Sắp tới', color: 'var(--campaign-blue)', bg: 'var(--campaign-blue-bg)', Icon: Clock },
    completed: { label: 'Hoàn thành', color: 'var(--text-tertiary)', bg: 'var(--bg-glass)', Icon: CheckCircle2 },
  };
  const status = isActive ? 'active' : isUpcoming ? 'upcoming' : 'completed';
  const st = statusConfig[status];

  return (
    <>
      <div className="modal-overlay" onClick={handleClose} />
      <div className="modal-container">
        <div className="modal-content detail-modal">
          {/* Header */}
          <div className="detail-header">
            <div className="detail-topbar">
              <div className="detail-header-badges">
                <span className="detail-status-badge" style={{ background: st.bg, color: st.color }}>
                  <st.Icon size={12} /> {st.label}
                </span>
                {brand && (
                  <span className="modal-brand-badge" style={{ background: brand.color + '20', color: brand.color }}>
                    {brand.logo} {brand.name}
                  </span>
                )}
                <span className="detail-category-badge" style={{ background: `${color}20`, color }}>
                  {categoryLabel}
                </span>
              </div>
              <div className="detail-header-actions">
                {hasPermission('canCreate') && (
                  <button className="detail-action-btn" onClick={() => dispatch({ type: 'DUPLICATE_CAMPAIGN', payload: campaign })} title="Nhân bản">
                    <Copy size={15} />
                  </button>
                )}
                {hasPermission('canEdit') && (
                  <button className="detail-action-btn" onClick={handleEdit} title="Chỉnh sửa">
                    <Edit3 size={15} />
                  </button>
                )}
                <button className="detail-action-btn" onClick={handleClose} aria-label="Đóng" title="Đóng">
                  <X size={15} />
                </button>
              </div>
            </div>
            <h1 className="detail-title">{campaign.name}</h1>
          </div>

          {/* Body */}
          <div className="modal-body">
            {/* Left - Main Content */}
            <div className="modal-col modal-col-main">
              {/* Media Gallery */}
              {campaign.media && campaign.media.length > 0 && (
                <div className="detail-section">
                  <div className="detail-media-gallery">
                    {campaign.media.map((src, idx) => (
                      <div key={idx} className="detail-media-item">
                        <img src={src} alt={`${campaign.name} media ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Message */}
              {campaign.keyMessage && (
                <div className="detail-section">
                  <div className="detail-section-label">
                    <MessageCircle size={14} />
                    Key Message
                  </div>
                  <blockquote className="detail-quote">
                    "{campaign.keyMessage}"
                  </blockquote>
                </div>
              )}

              {/* Channels */}
              {campaign.channels && campaign.channels.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-label">
                    <Target size={14} />
                    Kênh Triển Khai
                  </div>
                  <div className="detail-channels">
                    {campaign.channels.map((ch) => (
                      <span key={ch} className="detail-channel-tag">{ch}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Campaign Details / Rules - Rendered Markdown */}
              {campaign.details && (
                <div className="detail-section">
                  <div className="detail-section-label">
                    <FileText size={14} />
                    Nội Dung Chi Tiết
                  </div>
                  <div
                    className="detail-content-block md-rendered"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(campaign.details)) }}
                  />
                </div>
              )}

              {/* Milestones */}
              {campaign.milestones && campaign.milestones.length > 0 && (
                <div className="detail-section">
                  <div className="detail-section-label">
                    <MilestoneIcon size={14} />
                    Milestones
                    <span className="detail-milestone-count">
                      {campaign.milestones.filter(m => m.completed).length}/{campaign.milestones.length}
                    </span>
                  </div>
                  <div className="detail-milestone-list">
                    {campaign.milestones.map((ms) => {
                      const msStatus = getMilestoneStatus(ms);
                      return (
                        <div
                          key={ms.id}
                          className={`detail-milestone ${msStatus}`}
                          onClick={() => handleToggleMilestone(ms.id)}
                        >
                          <div className="detail-milestone-check">
                            {ms.completed ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <Circle size={18} />
                            )}
                          </div>
                          <div className="detail-milestone-info">
                            <span className={`detail-milestone-text ${ms.completed ? 'done' : ''}`}>
                              {ms.text}
                            </span>
                            <span className="detail-milestone-date">
                              {formatDate(ms.date)}
                            </span>
                          </div>
                          {msStatus === 'overdue' && !ms.completed && (
                            <span className="detail-milestone-warning overdue">
                              <AlertTriangle size={12} />
                              Quá hạn
                            </span>
                          )}
                          {msStatus === 'urgent' && !ms.completed && (
                            <span className="detail-milestone-warning urgent">
                              <AlertTriangle size={12} />
                              {Math.ceil((new Date(ms.date) - now) / (1000 * 60 * 60 * 24))} ngày
                            </span>
                          )}
                          {msStatus === 'soon' && !ms.completed && (
                            <span className="detail-milestone-warning soon">
                              <Clock size={12} />
                              {Math.ceil((new Date(ms.date) - now) / (1000 * 60 * 60 * 24))} ngày
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {campaign.notes && (
                <div className="detail-section">
                  <div className="detail-section-label">
                    <StickyNote size={14} />
                    Ghi Chú
                  </div>
                  <p className="detail-notes">{campaign.notes}</p>
                </div>
              )}

              {/* Comments */}
              <div className="detail-section">
                <CommentThread campaignId={campaign.id} />
              </div>
            </div>

            {/* Right - Meta Info */}
            <div className="modal-col modal-col-side">
              {/* Progress */}
              <div className="detail-progress-card">
                <div className="detail-progress-label">Tiến độ</div>
                <div className="detail-progress-bar-bg">
                  <div
                    className="detail-progress-bar-fill"
                    style={{ width: `${progress}%`, background: color }}
                  />
                </div>
                <div className="detail-progress-text">{progress}%</div>
              </div>

              {/* Timeline */}
              <div className="detail-info-card">
                <div className="detail-info-item">
                  <Calendar size={14} />
                  <div>
                    <div className="detail-info-label">Bắt đầu</div>
                    <div className="detail-info-value">{formatDate(campaign.startDate)}</div>
                  </div>
                </div>
                <div className="detail-info-item">
                  <Calendar size={14} />
                  <div>
                    <div className="detail-info-label">Kết thúc</div>
                    <div className="detail-info-value">{formatDate(campaign.endDate)}</div>
                  </div>
                </div>
                <div className="detail-info-item">
                  <Clock size={14} />
                  <div>
                    <div className="detail-info-label">Thời lượng</div>
                    <div className="detail-info-value">{totalDays} ngày</div>
                  </div>
                </div>
                {isActive && (
                  <div className="detail-info-item highlight">
                    <AlertTriangle size={14} />
                    <div>
                      <div className="detail-info-label">Còn lại</div>
                      <div className="detail-info-value">{daysUntilEnd} ngày</div>
                    </div>
                  </div>
                )}
                {isUpcoming && (
                  <div className="detail-info-item highlight-blue">
                    <Clock size={14} />
                    <div>
                      <div className="detail-info-label">Bắt đầu sau</div>
                      <div className="detail-info-value">{daysUntilStart} ngày</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Budget */}
              {campaign.budget && (
                <div className="detail-info-card">
                  <div className="detail-info-item">
                    <DollarSign size={14} />
                    <div>
                      <div className="detail-info-label">Ngân Sách</div>
                      <div className="detail-info-value">{campaign.budget}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Target Audience */}
              {campaign.targetAudience && (
                <div className="detail-info-card">
                  <div className="detail-info-item">
                    <Users size={14} />
                    <div>
                      <div className="detail-info-label">Đối Tượng</div>
                      <div className="detail-info-value">{campaign.targetAudience}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete */}
              {hasPermission('canDelete') && (
                <button className="btn btn-danger" onClick={() => setShowConfirm(true)} style={{ width: '100%', justifyContent: 'center' }}>
                  <Trash2 size={14} />
                  Xóa Chiến Dịch
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h3><AlertTriangle size={18} style={{ color: 'var(--campaign-red)' }} /> Xác nhận xóa</h3>
            <p>Bạn có chắc muốn xóa chiến dịch <strong>"{campaign.name}"</strong>? Hành động này không thể hoàn tác.</p>
            <div className="confirm-actions">
              <button className="btn" onClick={() => setShowConfirm(false)}>Hủy</button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <Trash2 size={14} /> Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
