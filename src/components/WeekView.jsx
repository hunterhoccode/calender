import { useCampaigns } from '../context/CampaignContext';
import {
  getWeekDays,
  isToday,
  format,
  getCampaignsForDay,
  getCategoryColor,
  parseISO,
  isSameDay,
  differenceInDays,
  addDays,
  formatDate,
} from '../utils/dateUtils';
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function WeekView({ currentDate, weekRef }) {
  const { dispatch, getFilteredCampaigns } = useCampaigns();
  const { hasPermission } = useAuth();
  const canDrag = hasPermission('canEdit');
  const campaigns = getFilteredCampaigns();
  const days = getWeekDays(currentDate);
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
    <div className="week-view" ref={weekRef}>
      <div className="week-header">
        {days.map((day, idx) => (
          <div
            key={idx}
            className={`week-header-cell ${isToday(day) ? 'today' : ''}`}
          >
            <div className="day-name">{format(day, 'EEE')}</div>
            <div className="day-num">{format(day, 'd')}</div>
          </div>
        ))}
      </div>
      <div className="week-body">
        {days.map((day, idx) => {
          const dayCampaigns = getCampaignsForDay(campaigns, day);
          const isDragOver = dragOverDate && isSameDay(day, dragOverDate);

          return (
            <div
              key={idx}
              className={`week-day-column ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, day)}
              onDrop={(e) => handleDrop(e, day)}
            >
              {dayCampaigns.map((campaign) => {
                const color = getCategoryColor(campaign.category);
                return (
                  <div
                    key={campaign.id}
                    className={`week-campaign-bar campaign-bar ${color}`}
                    draggable={canDrag}
                    onDragStart={canDrag ? (e) => handleDragStart(e, campaign) : undefined}
                    onDragEnd={canDrag ? handleDragEnd : undefined}
                    onClick={() =>
                      dispatch({ type: 'VIEW_CAMPAIGN', payload: campaign })
                    }
                  >
                    <div className="week-campaign-title">{campaign.name}</div>
                    <div className="week-campaign-time">
                      {format(parseISO(campaign.startDate), 'dd/MM')} –{' '}
                      {format(parseISO(campaign.endDate), 'dd/MM')}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
