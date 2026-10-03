import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FundProvider, useFund } from './context/FundContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DailyTrackerView } from './components/DailyTrackerView';
import { MemberDirectoryView } from './components/MemberDirectoryView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { QrCodeDisplay } from './components/QrCodeDisplay';
import { RemindersHubView } from './components/RemindersHubView';
import { SettingsView } from './components/SettingsView';
import {
  ShieldCheck,
  LogIn,
  CheckCircle2,
  Calendar,
  BarChart3,
  QrCode,
  Bell,
  Users,
  FileText,
} from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentUser, loading: authLoading, signInWithGoogle, authError, clearAuthError } = useAuth();
  const { members, seedInitialDataIfEmpty } = useFund();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Auto-seed demo data if signed in and member list is empty
  useEffect(() => {
    if (currentUser && members.length === 0) {
      seedInitialDataIfEmpty();
    }
  }, [currentUser, members.length, seedInitialDataIfEmpty]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 animate-spin flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/30">
            K
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Connecting to KUN Samajik Kosh...
          </p>
        </div>
      </div>
    );
  }

  // If not logged in, show welcoming Google Sign-In portal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
        {/* Top Header with Theme Toggle */}
        <div className="max-w-5xl w-full mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow">
              K
            </div>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
              KUN Samajik Kosh
            </span>
          </div>

          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Toggle Light / Dark Mode"
          >
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
        <div className="max-w-4xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center items-center text-center">
          {/* Logo badge */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-4xl shadow-xl shadow-emerald-600/30 mb-6">
            K
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            KUN Samajik Kosh
          </h1>
          <p className="text-base sm:text-lg font-medium text-emerald-700 dark:text-emerald-400 mt-2">
            कुन सामाजिक कोष • Transparent Community Welfare Fund
          </p>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-4 max-w-xl leading-relaxed">
            Record daily contributions with a single tap, track monthly collection milestones, generate official audit PDF statements, and remind unpaid members with automated push notifications.
          </p>

          {authError && (
            <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl max-w-md">
              {authError}
            </div>
          )}

          {/* Primary Google Login Button */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-3 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/30 transition-all text-sm cursor-pointer"
            >
              <LogIn className="w-5 h-5" />
              Sign in with Google to Sync
            </button>
          </div>

          {/* Highlights feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 text-left w-full max-w-3xl">
            <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Calendar className="w-6 h-6 text-emerald-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Daily Attendance & Ledger
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Toggle daily donation status in seconds with cash, QR code, or bank transfer tagging.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <BarChart3 className="w-6 h-6 text-teal-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Monthly Visual Trends
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Interactive collection charts, member rankings, and exportable PDF audit statements.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <QrCode className="w-6 h-6 text-emerald-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Downloadable QR Menu
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Official Fonepay/eSewa standee QR code with 1-click download for mobile banking.
              </p>
            </div>
          </div>
        </div>

        <footer className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800">
          KUN Samajik Kosh • Secured by Google Cloud Firebase
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors flex flex-col">
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <main className="flex-1 pb-24 lg:pb-8">
        {currentTab === 'dashboard' && <DashboardView onNavigate={setCurrentTab} />}
        {currentTab === 'daily' && <DailyTrackerView />}
        {currentTab === 'members' && <MemberDirectoryView />}
        {currentTab === 'reports' && <MonthlyReportView />}
        {currentTab === 'qr' && <QrCodeDisplay />}
        {currentTab === 'reminders' && <RemindersHubView />}
        {currentTab === 'settings' && <SettingsView />}
      </main>

      <footer className="no-print hidden lg:block border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-900/50">
        KUN Samajik Kosh (कुन सामाजिक कोष) • Real-time database & Google Authentication • Connected as {currentUser.email}
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FundProvider>
        <MainContent />
      </FundProvider>
    </AuthProvider>
  );
}
