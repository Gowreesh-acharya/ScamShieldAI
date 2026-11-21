import { useState, useEffect, useCallback } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ScanModal from './components/ScanModal';
import FeedbackModal from './components/FeedbackModal';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import MessageScanner from './pages/MessageScanner';
import UrlScanner from './pages/UrlScanner';
import ScreenshotScanner from './pages/ScreenshotScanner';
import CombinedScanner from './pages/CombinedScanner';
import InvestigationAssistant from './pages/InvestigationAssistant';
import EmergencyMode from './pages/EmergencyMode';
import ScanHistory from './pages/ScanHistory';
import DemoEvaluation from './pages/DemoEvaluation';
import ReportScam from './pages/ReportScam';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import FeedbackPage from './pages/FeedbackPage';
import { checkBackendStatus } from './services/api';
import { getScanHistory, getScanStats, getStoredTheme, setStoredTheme } from './utils/storage';

export default function App() {
  // Experience Mode: 'public' (Landing Website) or 'app' (Cybersecurity Dashboard & Engines)
  const [viewMode, setViewMode] = useState('public');
  const [activePage, setActivePage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true });
  const [history, setHistory] = useState(() => getScanHistory());
  const [stats, setStats] = useState(() => getScanStats());
  const [inspectedScan, setInspectedScan] = useState(null);
  const [theme, setTheme] = useState(() => getStoredTheme());
  const [feedbackScan, setFeedbackScan] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Apply Theme to documentElement
  useEffect(() => {
    const applyTheme = (currentTheme) => {
      let resolved = currentTheme;
      if (currentTheme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolved = prefersDark ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolved);
    };

    applyTheme(theme);

    // If system theme, listen to OS media queries
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e) => {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setStoredTheme(newTheme);
  };

  // Reload history & stats from storage
  const refreshStorageData = useCallback(() => {
    setHistory(getScanHistory());
    setStats(getScanStats());
  }, []);

  // Check backend health status
  const refreshBackend = useCallback(async () => {
    setBackendStatus(prev => ({ ...prev, checking: true }));
    const status = await checkBackendStatus();
    setBackendStatus({ ...status, checking: false });
  }, []);

  useEffect(() => {
    let isMounted = true;
    checkBackendStatus().then(status => {
      if (isMounted) {
        setBackendStatus({ ...status, checking: false });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleScanComplete = () => {
    refreshStorageData();
  };

  const handleOpenFeedback = (scanItem = null) => {
    setFeedbackScan(scanItem);
    setFeedbackOpen(true);
  };

  const handleInvestigateScan = () => {
    setViewMode('app');
    setActivePage('investigate');
    if (inspectedScan) setInspectedScan(null);
  };

  // Transition from Public Landing Page to Application Engine
  const handleLaunchApp = (targetPage = 'dashboard') => {
    setActivePage(targetPage);
    setViewMode('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-root-shell">
      {viewMode === 'public' ? (
        /* ====================================================================
           EXPERIENCE A: PUBLIC LANDING WEBSITE (Reference 1)
           ==================================================================== */
        <LandingPage
          onLaunchApp={handleLaunchApp}
          theme={theme}
          onThemeChange={handleThemeChange}
        />
      ) : (
        /* ====================================================================
           EXPERIENCE B: APPLICATION DASHBOARD & ENGINES (Reference 2)
           ==================================================================== */
        <div className="app-container">
          {/* Coffee Brown Fixed Sidebar */}
          <Sidebar
            activePage={activePage}
            setActivePage={setActivePage}
            backendStatus={backendStatus}
            stats={stats}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
            onGoToPublicSite={() => setViewMode('public')}
          />

          {/* Main Content Area */}
          <div className="main-wrapper">
            <Header
              activePage={activePage}
              backendStatus={backendStatus}
              onRefreshBackend={refreshBackend}
              mobileOpen={mobileOpen}
              setMobileOpen={setMobileOpen}
              onModeChange={refreshBackend}
              theme={theme}
              onThemeChange={handleThemeChange}
              onNavigate={setActivePage}
              onGoToPublicSite={() => setViewMode('public')}
            />

            {/* Page Router */}
            <main>
              {activePage === 'dashboard' && (
                <Dashboard
                  stats={stats}
                  history={history}
                  onNavigate={setActivePage}
                  onInspectScan={setInspectedScan}
                />
              )}

              {activePage === 'message' && (
                <MessageScanner onScanComplete={handleScanComplete} />
              )}

              {activePage === 'url' && (
                <UrlScanner onScanComplete={handleScanComplete} />
              )}

              {activePage === 'screenshot' && (
                <ScreenshotScanner onScanComplete={handleScanComplete} />
              )}

              {activePage === 'combined' && (
                <CombinedScanner onScanComplete={handleScanComplete} />
              )}

              {activePage === 'investigate' && (
                <InvestigationAssistant />
              )}

              {activePage === 'emergency' && (
                <EmergencyMode />
              )}

              {activePage === 'demo' && (
                <DemoEvaluation onNavigateToScanner={setActivePage} />
              )}

              {activePage === 'report' && (
                <ReportScam />
              )}

              {activePage === 'history' && (
                <ScanHistory
                  history={history}
                  onRefreshHistory={refreshStorageData}
                  onInspectScan={setInspectedScan}
                  onFeedback={handleOpenFeedback}
                />
              )}

              {activePage === 'feedback' && (
                <FeedbackPage />
              )}

              {activePage === 'profile' && (
                <Profile />
              )}

              {activePage === 'settings' && (
                <Settings
                  theme={theme}
                  onThemeChange={handleThemeChange}
                  onRefreshHistory={refreshStorageData}
                />
              )}
            </main>
          </div>

          {/* Audit Detail Modal */}
          {inspectedScan && (
            <ScanModal
              scan={inspectedScan}
              onClose={() => setInspectedScan(null)}
              onFeedback={handleOpenFeedback}
              onInvestigate={handleInvestigateScan}
            />
          )}

          {/* Security Feedback Modal */}
          {feedbackOpen && (
            <FeedbackModal
              scan={feedbackScan}
              onClose={() => {
                setFeedbackOpen(false);
                setFeedbackScan(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
