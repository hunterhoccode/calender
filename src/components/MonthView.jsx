import { useCampaigns } from '../context/CampaignContext';
import {
  getCalendarDays,
  isSameMonth,
  isSameDay,
  isToday,
  format,
  getCampaignsForDay,
  getCategoryColor,
  parseISO,
  differenceInDays,
  addDays,
  formatDate,
} from '../utils/dateUtils';
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function MonthView({ currentDate }) {
  const { state, dispatch, getFilteredCampaigns, getBrandById } = useCampaigns();
  const { hasPermission } = useAuth();
  const canDrag = hasPermission('canEdit');
  const campaigns = getFilteredCampaigns();
  const days = getCalendarDays(currentDate);
  const [dragOverDate, setDragOverDate] = useState(null);

  const handleDragStart = useCallback((e, campaign) => {
    e.dataTransfer.setData('campaignId', campaign.id);
    e.dataTransfer.setData('startDate', campaign.startDate);
    e.dataTransfer.setData('endDate', campaign.endDate);
    e.target.classList.add('dragging');
  }, []);

  const handleDragEnd = useCallback((e) => {
    e.target.classList.remove('dragging');
    setDragOverDate(null);
  }, []);

  const handleDragOver = useCallback((e, day) => {
    e.preventDefault();
    setDragOverDate(day);
  }, []);

  const handleDrop = useCallback(
    (e, day) => {
      e.preventDefault();
      setDragOverDate(null);
      const campaignId = e.dataTransfer.getData('campaignId');
      const oldStart = parseISO(e.dataTransfer.getData('startDate'));
      const oldEnd = parseISO(e.dataTransfer.getData('endDate'));
      const duration = differenceInDays(oldEnd, oldStart);
      const newStart = formatDate(day);
      const newEnd = formatDate(addDays(day, duration));

      dispatch({
        type: 'DRAG_UPDATE',
        payload: { id: campaignId, startDate: newStart, endDate: newEnd },
      });
    },
    [dispatch]
  );

  return (
    <div className="calendar-grid">
      <div className="calendar-weekdays">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
          <div key={d} className="weekday-header">
            {d}
          </div>
        ))}
      </div>
      <div className="calendar-days">
        {days.map((day, idx) => {
          const dayCampaigns = getCampaignsForDay(campaigns, day);
          const isOther = !isSameMonth(day, currentDate);
          const isTodayDay = isToday(day);
          const isDragOver = dragOverDate && isSameDay(day, dragOverDate);

          return (
            <div
              key={idx}
              className={`calendar-day ${isOther ? 'other-month' : ''} ${isTodayDay ? 'today' : ''} ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, day)}
              onDrop={(e) => handleDrop(e, day)}
              onClick={() => dispatch({ type: 'OPEN_DRAWER', payload: null })}
            >
              <div className="day-number">
                {isTodayDay ? (
                  <span>{format(day, 'd')}</span>
                ) : (
                  format(day, 'd')
                )}
              </div>
              <div className="day-events">
                {dayCampaigns.slice(0, 3).map((campaign) => {
                  const start = parseISO(campaign.startDate);
                  const end = parseISO(campaign.endDate);
                  const isFirstDay = isSameDay(day, start);
                  const isLastDay = isSameDay(day, end);
                  const brand = campaign.brandId ? getBrandById(campaign.brandId) : null;

                  return (
                    <div
                      key={campaign.id}
                      className={`campaign-bar ${getCategoryColor(campaign.category)} ${isFirstDay ? 'bar-start' : ''} ${isLastDay ? 'bar-end' : ''} ${!isFirstDay && !isLastDay ? 'bar-mid' : ''}`}
                      draggable={canDrag}
                      onDragStart={canDrag ? (e) => handleDragStart(e, campaign) : undefined}
                      onDragEnd={canDrag ? handleDragEnd : undefined}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'VIEW_CAMPAIGN', payload: campaign });
                      }}
                      title={campaign.name}
                    >
                      {isFirstDay ? (
                        <span className="bar-content">
                          {brand && <span className="bar-brand-icon">{brand.logo}</span>}
                          <span className="bar-name">{campaign.name}</span>
                        </span>
                      ) : (
                        <span className="bar-continuation">
                          <span className="bar-name">{campaign.name}</span>
                        </span>
                      )}
                    </div>
                  );
                })}
                {dayCampaigns.length > 3 && (
                  <div className="campaign-more">
                    +{dayCampaigns.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
