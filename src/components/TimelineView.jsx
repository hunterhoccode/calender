import { useCampaigns } from '../context/CampaignContext';
import {
  getTimelineDays,
  isToday,
  isWeekend,
  format,
  parseISO,
  differenceInDays,
  getCategoryColor,
  isSameDay,
} from '../utils/dateUtils';
import { useRef } from 'react';

export default function TimelineView({ currentDate, timelineRef }) {
  const { dispatch, getFilteredCampaigns } = useCampaigns();
  const campaigns = getFilteredCampaigns();
  const days = getTimelineDays(currentDate, 35);

  const getBarPosition = (campaign) => {
    const start = parseISO(campaign.startDate);
    const end = parseISO(campaign.endDate);
    const gridStart = days[0];
    const gridEnd = days[days.length - 1];

    const effectiveStart = start < gridStart ? gridStart : start;
    const effectiveEnd = end > gridEnd ? gridEnd : end;

    const leftDays = differenceInDays(effectiveStart, gridStart);
    const barDays = differenceInDays(effectiveEnd, effectiveStart) + 1;

    if (leftDays < 0 || leftDays >= days.length) return null;
    if (barDays <= 0) return null;

    const cellWidth = 45;
    const left = leftDays * cellWidth;
    const width = Math.max(barDays * cellWidth - 4, 20);

    return { left, width };
  };

  // Use raw color values so html2canvas can render them correctly for export
  const colorMap = {
    red: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '#ef4444' },
    blue: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '#3b82f6' },
    yellow: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '#f59e0b' },
    purple: { bg: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '#a855f7' },
    orange: { bg: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: '#f97316' },
    green: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '#10b981' },
  };

  return (
    <div className="timeline-view" ref={timelineRef}>
      {/* Header */}
      <div className="timeline-header">
        <div className="timeline-label-col">Campaign</div>
        <div className="timeline-dates">
          {days.map((day, idx) => (
            <div
              key={idx}
              className={`timeline-date-cell ${isToday(day) ? 'today' : ''} ${isWeekend(day) ? 'weekend' : ''}`}
            >
              <div className="date-day">{format(day, 'd')}</div>
              <div className="date-weekday">{format(day, 'EEE')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="timeline-body">
        {campaigns.length === 0 ? (
          <div className="empty-state" style={{ minHeight: '200px' }}>
            <p>Không có chiến dịch nào. Thêm chiến dịch mới để bắt đầu!</p>
          </div>
        ) : (
          campaigns.map((campaign) => {
            const color = getCategoryColor(campaign.category);
            const pos = getBarPosition(campaign);
            const styles = colorMap[color] || colorMap.blue;

            return (
              <div key={campaign.id} className="timeline-row">
                <div
                  className="timeline-row-label"
                  onClick={() =>
                    dispatch({ type: 'VIEW_CAMPAIGN', payload: campaign })
                  }
                >
                  <div
                    className="campaign-dot"
                    style={{ background: styles.border }}
                  />
                  <div className="campaign-name">{campaign.name}</div>
                </div>
                <div className="timeline-row-grid">
                  {days.map((day, idx) => (
                    <div
                      key={idx}
                      className={`timeline-cell ${isToday(day) ? 'today' : ''} ${isWeekend(day) ? 'weekend' : ''}`}
                    />
                  ))}
                  {pos && (
                    <div
                      className="timeline-bar-wrapper"
                      style={{ left: pos.left + 'px', width: pos.width + 'px' }}
                    >
                      <div
                        className="timeline-bar"
                        style={{
                          width: '100%',
                          background: styles.bg,
                          color: styles.color,
                          borderLeft: `3px solid ${styles.border}`,
                        }}
                        onClick={() =>
                          dispatch({ type: 'VIEW_CAMPAIGN', payload: campaign })
                        }
                      >
                        {campaign.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
