import { useState, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChangeLogProvider } from './context/ChangeLogContext';
import { CampaignProvider } from './context/CampaignContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import TimelineView from './components/TimelineView';
import DashboardView from './components/DashboardView';
import CampaignDrawer from './components/CampaignDrawer';
import CampaignDetailModal from './components/CampaignDetailModal';
import BrandDrawer from './components/BrandDrawer';
import FilterBar from './components/FilterBar';
import ExportButton from './components/ExportButton';
import UserManagement from './components/UserManagement';
import ChangeLogModal from './components/ChangeLogModal';
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  formatMonthYear,
  formatWeekRange,
} from './utils/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Menu,
  Zap,
} from 'lucide-react';
import './index.css';

function AppContent() {
  const [currentView, setCurrentView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const timelineRef = useRef(null);
  const monthRef = useRef(null);
  const weekRef = useRef(null);

  const getExportRef = () => {
    if (currentView === 'timeline') return timelineRef;
    if (currentView === 'week') return weekRef;
    return monthRef;
  };

  const navigatePrev = () => {
    if (currentView === 'week') {
      setCurrentDate((d) => subWeeks(d, 1));
    } else {
      setCurrentDate((d) => subMonths(d, 1));
    }
  };

  const navigateNext = () => {
    if (currentView === 'week') {
      setCurrentDate((d) => addWeeks(d, 1));
    } else {
      setCurrentDate((d) => addMonths(d, 1));
    }
  };

  const goToday = () => setCurrentDate(new Date());

  const getPeriodLabel = () => {
    if (currentView === 'week') return formatWeekRange(currentDate);
    return formatMonthYear(currentDate);
  };

  const viewLabels = {
    dashboard: 'Dashboard',
    month: 'Tháng',
    week: 'Tuần',
    timeline: 'Timeline',
  };

  return (
    <div className="app-layout">
      {/* Sidebar Backdrop (mobile) */}
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={(v) => {
          setCurrentView(v);
          setSidebarOpen(false);
        }}
        onOpenChangelog={() => setChangelogOpen(true)}
        isOpen={sidebarOpen}
      />

      {/* Main */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button
              className="sidebar-mobile-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Mở menu"
            >
              <Menu size={18} />
            </button>

            <div className="header-nav-date">
              <button className="nav-btn" onClick={navigatePrev} aria-label="Kỳ trước">
                <ChevronLeft size={16} />
              </button>
              <span className="current-period">{getPeriodLabel()}</span>
              <button className="nav-btn" onClick={navigateNext} aria-label="Kỳ sau">
                <ChevronRight size={16} />
              </button>
            </div>

            <button className="today-btn" onClick={goToday}>
              <CalendarDays size={12} style={{ marginRight: 4 }} />
              Hôm nay
            </button>
          </div>

          <div className="header-right">
            <div className="view-tabs">
              {['month', 'week', 'timeline'].map((view) => (
                <button
                  key={view}
                  className={`view-tab ${currentView === view ? 'active' : ''}`}
                  onClick={() => setCurrentView(view)}
                >
                  {viewLabels[view]}
                </button>
              ))}
            </div>

            <ExportButton targetRef={getExportRef()} />
          </div>
        </header>

        {/* Filter */}
        <FilterBar />

        {/* Calendar View */}
        <div className="calendar-container">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'month' && <MonthView currentDate={currentDate} monthRef={monthRef} />}
          {currentView === 'week' && <WeekView currentDate={currentDate} weekRef={weekRef} />}
          {currentView === 'timeline' && (
            <TimelineView currentDate={currentDate} timelineRef={timelineRef} />
          )}
        </div>
      </main>

      {/* Modals */}
      <CampaignDetailModal />
      <CampaignDrawer />
      <BrandDrawer />
      <UserManagement />
      <ChangeLogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo">
          <Zap size={28} />
        </div>
        <h1 className="splash-title">CMP PRO</h1>
        <p className="splash-subtitle">Campaign Manager</p>
        <div className="splash-bar"><div className="splash-bar-fill" /></div>
      </div>
    </div>
  );
}

function AuthGate() {
  const { isLoggedIn, loading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // Splash hiện tối thiểu 1s, chỉ chạy 1 lần khi mount
    const t = setTimeout(() => setSplashDone(true), 1000);
    return () => clearTimeout(t);
  }, []);

  // Hiện splash khi đang restore HOẶC chưa hết thời gian splash
  if (loading || !splashDone) return <SplashScreen />;
  return isLoggedIn ? <AppContent /> : <LoginPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChangeLogProvider>
          <CampaignProvider>
            <AuthGate />
          </CampaignProvider>
        </ChangeLogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
