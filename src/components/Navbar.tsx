import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Users,
  FileText,
  QrCode,
  Bell,
  Settings,
  Sun,
  Moon,
  LogOut,
  LogIn,
  Wifi,
  WifiOff,
  Menu,
  X,
  Building2,
  ChevronDown,
  KeyRound,
  Share2,
  Lock,
  Eye,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFund } from '../context/FundContext';
import { getTodayDateString } from '../utils/calculations';
import { FundSwitcherModal } from './FundSwitcherModal';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  darkMode,
  onToggleDarkMode,
}) => {
  const { currentUser, signInWithGoogle, logout, isAdmin } = useAuth();
  const { online, members, contributions, settings, currentFund, canEdit, isReadOnlyMode, toggleReadOnlyMode } = useFund();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fundModalOpen, setFundModalOpen] = useState(false);

  // Check URL join param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      setFundModalOpen(true);
    }
  }, []);

  const today = getTodayDateString();
  const activeMembers = members.filter((m) => m.status === 'active');
  const todayPaidCount = contributions.filter((c) => c.date === today && c.hasDonated).length;
  const pendingCount = Math.max(0, activeMembers.length - todayPaidCount);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'daily', label: 'Daily Tracker', icon: Calendar, badge: pendingCount > 0 ? `${pendingCount} due` : undefined },
    { id: 'members', label: 'Members', icon: Users, count: members.length },
    { id: 'reports', label: 'Monthly Report', icon: FileText },
    { id: 'qr', label: 'QR Code', icon: QrCode },
    { id: 'reminders', label: 'Reminders', icon: Bell, badge: pendingCount > 0 ? String(pendingCount) : undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (tabId: string) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="no-print sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo, Brand & Fund Switcher */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20 text-base shrink-0">
                  K
                </div>
                <div className="hidden sm:block">
                  <span className="font-black text-slate-900 dark:text-white text-base tracking-tight flex items-center gap-1.5">
                    KUN Samajik Kosh
                  </span>
                  <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wider uppercase -mt-0.5">
                    कुन सामाजिक कोष
                  </span>
                </div>
              </div>

              {/* Fund Switcher Dropdown Button */}
              {currentUser && (
                <button
                  onClick={() => setFundModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer max-w-[150px] sm:max-w-[210px] truncate"
                  title="Switch or Join Another Samajik Kosh"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{currentFund.name}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </button>
              )}
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-white animate-pulse">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Action Icons: Join/Share, Online Status, Dark Mode, Profile */}
            <div className="flex items-center gap-2">
              {/* Quick Join/Share Kosh Button */}
              {currentUser && (
                <button
                  onClick={() => setFundModalOpen(true)}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs font-semibold transition cursor-pointer"
                  title="Invite or Join Another Samajik Kosh"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Join / Switch Kosh</span>
                </button>
              )}

              {/* Access Mode Pill */}
              {currentUser && (
                <button
                  onClick={toggleReadOnlyMode}
                  className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                    canEdit
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 hover:bg-amber-100'
                  }`}
                  title={
                    canEdit
                      ? 'Access: Editor (Tap to simulate Read-Only view)'
                      : 'Access: View-Only (Tap to toggle)'
                  }
                >
                  {canEdit ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      <span>Admin</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>View-Only</span>
                    </>
                  )}
                </button>
              )}

              {/* Cloud Sync indicator */}
              <div
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                  online
                    ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}
                title={online ? 'Real-time database connected' : 'Offline'}
              >
                {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                <span className="hidden lg:inline">{online ? 'Cloud Synced' : 'Offline'}</span>
              </div>

              {/* Dark mode toggle */}
              <button
                onClick={onToggleDarkMode}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Toggle Theme"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Google Authentication */}
              {currentUser ? (
                <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-8 h-8 rounded-full border border-emerald-500"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                      {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <button
                    onClick={logout}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Google Sign In</span>
                </button>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1 shadow-2xl animate-in slide-in-from-top duration-150">
            {/* Quick Switch Kosh on Mobile */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setFundModalOpen(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold mb-2 border border-emerald-200 dark:border-emerald-800/40"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Switch / Join Samajik Kosh</span>
              </div>
              <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded text-[10px]">
                {currentFund.code}
              </span>
            </button>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white text-emerald-800' : 'bg-amber-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (Sticky at bottom on small screens) */}
      <div className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 py-1 px-2 flex items-center justify-around shadow-lg">
        {[
          { id: 'dashboard', label: 'Trends', icon: BarChart3 },
          { id: 'daily', label: 'Today', icon: Calendar, badge: pendingCount > 0 ? String(pendingCount) : undefined },
          { id: 'qr', label: 'QR Pay', icon: QrCode },
          { id: 'members', label: 'Members', icon: Users },
          { id: 'reports', label: 'Reports', icon: FileText },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center py-1.5 px-3 rounded-xl relative transition cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
              {item.badge && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Fund Switcher & Join Modal */}
      <FundSwitcherModal
        isOpen={fundModalOpen}
        onClose={() => setFundModalOpen(false)}
      />
    </>
  );
};
