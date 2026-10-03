import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Users,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  Flame,
  CheckCircle2,
  Bell,
  QrCode,
  Sparkles,
  ChevronRight,
  BarChart3,
  Trophy,
  Target,
  Edit3,
  Flag,
  Check,
  Zap,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFund } from '../context/FundContext';
import { useAuth } from '../context/AuthContext';
import {
  getCurrentMonthKey,
  getTodayDateString,
  getDaysInMonth,
  formatCurrency,
  calculateMonthlyStats,
  formatDateReadable,
} from '../utils/calculations';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { members, contributions, settings, updateSettings, canEdit, isOwner } = useFund();
  const { currentUser } = useAuth();

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(getCurrentMonthKey());
  const [targetType, setTargetType] = useState<'monthly' | 'daily'>('monthly');
  const [isEditingTarget, setIsEditingTarget] = useState<boolean>(false);

  // Form states for setting target
  const [monthlyInput, setMonthlyInput] = useState<number>(settings.monthlyTargetGoal || 0);
  const [dailyInput, setDailyInput] = useState<number>(settings.dailyTargetGoal || 0);
  const [goalTitleInput, setGoalTitleInput] = useState<string>(settings.targetTitle || '');
  const [savingTarget, setSavingTarget] = useState<boolean>(false);

  const today = getTodayDateString();

  const [yearStr, monthStr] = selectedMonthKey.split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;
  const daysInMonth = getDaysInMonth(year, month);

  const activeMembers = members.filter((m) => m.status === 'active');
  const monthlyStats = calculateMonthlyStats(members, contributions, selectedMonthKey);

  // Month-to-date total collected
  const totalMonthCollected = monthlyStats.reduce((acc, s) => acc + s.totalDonated, 0);
  const calculatedPledgesMonth = monthlyStats.reduce((acc, s) => acc + s.expectedAmount, 0);

  // Target Goal Calculation
  const effectiveMonthlyTarget = settings.monthlyTargetGoal && settings.monthlyTargetGoal > 0
    ? settings.monthlyTargetGoal
    : (calculatedPledgesMonth > 0 ? calculatedPledgesMonth : 25000);

  const monthlyProgress = effectiveMonthlyTarget > 0
    ? Math.round((totalMonthCollected / effectiveMonthlyTarget) * 100)
    : 0;

  const monthlyRemaining = Math.max(0, effectiveMonthlyTarget - totalMonthCollected);

  // Today stats
  const todayContributions = contributions.filter((c) => c.date === today && c.hasDonated);
  const todayCollected = todayContributions.reduce((acc, c) => acc + (c.amount || 0), 0);
  const todayDonatedCount = todayContributions.length;
  const todayPendingCount = Math.max(0, activeMembers.length - todayDonatedCount);

  const calculatedDailyPledges = activeMembers.reduce((sum, m) => sum + m.defaultDailyAmount, 0);
  const effectiveDailyTarget = settings.dailyTargetGoal && settings.dailyTargetGoal > 0
    ? settings.dailyTargetGoal
    : (calculatedDailyPledges > 0 ? calculatedDailyPledges : 500);

  const dailyProgress = effectiveDailyTarget > 0
    ? Math.round((todayCollected / effectiveDailyTarget) * 100)
    : 0;

  const dailyRemaining = Math.max(0, effectiveDailyTarget - todayCollected);

  // Active target view data
  const currentGoalAmount = targetType === 'monthly' ? effectiveMonthlyTarget : effectiveDailyTarget;
  const currentCollectedAmount = targetType === 'monthly' ? totalMonthCollected : todayCollected;
  const currentProgressPct = targetType === 'monthly' ? monthlyProgress : dailyProgress;
  const currentRemaining = targetType === 'monthly' ? monthlyRemaining : dailyRemaining;
  const goalTitle = settings.targetTitle || (targetType === 'monthly' ? 'Monthly Community Welfare Goal' : "Today's Daily Collection Target");

  // Open modal handler
  const handleOpenEditTarget = () => {
    setMonthlyInput(effectiveMonthlyTarget);
    setDailyInput(effectiveDailyTarget);
    setGoalTitleInput(settings.targetTitle || '');
    setIsEditingTarget(true);
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTarget(true);
    try {
      await updateSettings({
        monthlyTargetGoal: Number(monthlyInput),
        dailyTargetGoal: Number(dailyInput),
        targetTitle: goalTitleInput.trim(),
      });
      setIsEditingTarget(false);
      if (monthlyProgress >= 100) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Target save error:', err);
      alert('Could not save target. Please try again.');
    } finally {
      setSavingTarget(false);
    }
  };

  // Generate Daily Trend Data for each day in this month
  const dailyTrends = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const dayContribs = contributions.filter((c) => c.date === dateStr && c.hasDonated);
    const amount = dayContribs.reduce((sum, c) => sum + (c.amount || 0), 0);
    const count = dayContribs.length;
    return {
      dayNum,
      dateStr,
      amount,
      count,
      isToday: dateStr === today,
      isFuture: dateStr > today,
    };
  });

  const maxDailyAmount = Math.max(...dailyTrends.map((d) => d.amount), 50);

  // Rankings
  const topContributors = [...monthlyStats]
    .sort((a, b) => b.totalDonated - a.totalDonated)
    .slice(0, 5);

  const consistencyChampions = [...monthlyStats]
    .sort((a, b) => b.daysDonated - a.daysDonated || b.longestStreak - a.longestStreak)
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            Live Cloud Synchronized
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {settings.orgName}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 leading-relaxed">
            Welcome to the community welfare treasury dashboard. Transparent daily donation tracking, fundraising goal monitoring, and real-time syncing for all members.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('daily')}
              className="px-4 py-2.5 bg-white text-emerald-800 font-bold rounded-xl text-xs sm:text-sm shadow-md hover:bg-emerald-50 active:scale-95 transition cursor-pointer"
            >
              📅 Record Today's Contributions
            </button>
            <button
              onClick={() => onNavigate('qr')}
              className="px-4 py-2.5 bg-emerald-900/60 hover:bg-emerald-900/80 text-white font-medium rounded-xl text-xs sm:text-sm border border-white/20 backdrop-blur-md transition cursor-pointer flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              View Donation QR
            </button>
          </div>
        </div>

        {/* Decorative corner graphic */}
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Fundraising Collection Target & Goal Progress Tracker Widget */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border border-slate-200 dark:border-slate-700 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Target & Goal Tracker
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {currentProgressPct}% Completed
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                {goalTitle}
              </h2>
            </div>
          </div>

          {/* Toggle Daily vs Monthly & Edit Target */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTargetType('monthly')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  targetType === 'monthly'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Monthly Goal
              </button>
              <button
                onClick={() => setTargetType('daily')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  targetType === 'daily'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Today's Goal
              </button>
            </div>

            {canEdit && (
              <button
                onClick={handleOpenEditTarget}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                title="Set or update fundraising targets"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Set Target</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Numerical Breakdown */}
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Current Collection vs Goal
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(currentCollectedAmount, settings.currency)}
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  / {formatCurrency(currentGoalAmount, settings.currency)}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              {currentRemaining > 0 ? (
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center sm:justify-end gap-1">
                  <Flag className="w-3.5 h-3.5" />
                  {formatCurrency(currentRemaining, settings.currency)} remaining to reach target
                </p>
              ) : (
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center sm:justify-end gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Goal Achieved! ({currentProgressPct}% of target)
                </p>
              )}
              <p className="text-[11px] text-slate-400 mt-0.5">
                {targetType === 'monthly'
                  ? `For ${formatDateReadable(selectedMonthKey + '-01').split(' ').slice(1, 3).join(' ')} (${daysInMonth} days)`
                  : `For ${formatDateReadable(today)}`}
              </p>
            </div>
          </div>

          {/* Dynamic Progress Bar with Milestone Checkpoints */}
          <div className="relative pt-2 pb-6">
            <div className="w-full bg-slate-100 dark:bg-slate-700/60 rounded-full h-4 overflow-hidden shadow-inner relative">
              <div
                className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 h-full rounded-full transition-all duration-700 relative"
                style={{ width: `${Math.min(100, currentProgressPct)}%` }}
              >
                {currentProgressPct > 10 && (
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-white drop-shadow">
                    {currentProgressPct}%
                  </span>
                )}
              </div>
            </div>

            {/* Checkpoint Indicators */}
            <div className="absolute left-0 right-0 top-6 flex justify-between text-[10px] text-slate-400 font-semibold px-1">
              <span className={currentProgressPct >= 0 ? 'text-emerald-600 font-bold' : ''}>0%</span>
              <span className={currentProgressPct >= 25 ? 'text-emerald-600 font-bold' : ''}>25%</span>
              <span className={currentProgressPct >= 50 ? 'text-emerald-600 font-bold' : ''}>50%</span>
              <span className={currentProgressPct >= 75 ? 'text-emerald-600 font-bold' : ''}>75%</span>
              <span className={currentProgressPct >= 100 ? 'text-emerald-600 font-black' : ''}>🎯 100% Target</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Month Raised */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Month-to-Date Total</span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
            {formatCurrency(totalMonthCollected, settings.currency)}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
              <div
                className="bg-emerald-600 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, monthlyProgress)}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
              {monthlyProgress}%
            </span>
          </div>
        </div>

        {/* Today's Collection */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Collected Today</span>
            <span className="p-1.5 bg-teal-50 dark:bg-teal-950/60 text-teal-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(todayCollected, settings.currency)}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {todayDonatedCount} of {activeMembers.length} members paid
          </p>
        </div>

        {/* Pending Donors Today */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Pending Today</span>
            <span className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {todayPendingCount} Members
          </h3>
          <button
            onClick={() => onNavigate('reminders')}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline mt-1 flex items-center gap-1 cursor-pointer"
          >
            Send Push/SMS Reminder <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Total Registered Members */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Active Community Donors</span>
            <span className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2">
            {activeMembers.length}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pledge: {formatCurrency(settings.defaultDailyAmount, settings.currency)} / day
          </p>
        </div>
      </div>

      {/* Monthly Contribution Trend Visualization */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Monthly Contribution Trends (Day-by-Day Collections)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive timeline showing daily funds collected across {daysInMonth} days in {yearStr}-{monthStr}.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 bg-emerald-600 rounded-sm inline-block" />
              Collected
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="w-3 h-3 bg-emerald-300 dark:bg-emerald-800 rounded-sm inline-block" />
              Today
            </span>
          </div>
        </div>

        {/* Daily Bar Chart Visualization */}
        <div className="pt-6 pb-2 overflow-x-auto">
          <div className="flex items-end gap-1.5 min-w-[620px] h-48 px-2 border-b border-slate-200 dark:border-slate-700">
            {dailyTrends.map((d) => {
              const heightPct = Math.max(6, Math.min(100, Math.round((d.amount / maxDailyAmount) * 100)));
              return (
                <div
                  key={d.dayNum}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg whitespace-nowrap z-20 shadow-lg">
                    Day {d.dayNum}: {formatCurrency(d.amount, settings.currency)} ({d.count} donors)
                  </div>

                  {/* Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-md transition-all ${
                      d.isToday
                        ? 'bg-emerald-400 ring-2 ring-emerald-500'
                        : d.amount > 0
                        ? 'bg-emerald-600 hover:bg-emerald-500'
                        : d.isFuture
                        ? 'bg-slate-100 dark:bg-slate-700/40'
                        : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                  {/* Day Label */}
                  <span
                    className={`text-[10px] mt-1 font-mono ${
                      d.isToday
                        ? 'font-bold text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {d.dayNum}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Member Rankings & Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Contributors */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Top Contributors Ranking
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">This Month</span>
          </div>

          <div className="space-y-3">
            {topContributors.map((stat, idx) => (
              <div
                key={stat.member.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-800'
                        : idx === 1
                        ? 'bg-slate-200 text-slate-700'
                        : idx === 2
                        ? 'bg-amber-700/20 text-amber-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                      {stat.member.fullName}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {stat.daysDonated} days contributed
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(stat.totalDonated, settings.currency)}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {stat.fulfillmentRate}% target
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Consistency Champions */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Consistency Champions (Streaks)
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Punctuality</span>
          </div>

          <div className="space-y-3">
            {consistencyChampions.map((stat, idx) => (
              <div
                key={stat.member.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold text-xs">
                    ⭐
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                      {stat.member.fullName}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Longest Streak: {stat.longestStreak} days
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    {stat.daysDonated} / {daysInMonth} Days
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Set & Edit Fundraising Target Modal */}
      {isEditingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Set Collection Goals & Targets
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Define the target fundraising amounts to track community progress on the dashboard.
            </p>

            <form onSubmit={handleSaveTarget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal / Drive Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. October Welfare Reserve Target"
                  value={goalTitleInput}
                  onChange={(e) => setGoalTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Monthly Collection Goal ({settings.currency})
                  </label>
                  {calculatedPledgesMonth > 0 && (
                    <button
                      type="button"
                      onClick={() => setMonthlyInput(calculatedPledgesMonth)}
                      className="text-[10px] text-emerald-600 font-semibold hover:underline"
                    >
                      Use Pledges: {formatCurrency(calculatedPledgesMonth, settings.currency)}
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  value={monthlyInput}
                  onChange={(e) => setMonthlyInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Daily Collection Target ({settings.currency})
                  </label>
                  {calculatedDailyPledges > 0 && (
                    <button
                      type="button"
                      onClick={() => setDailyInput(calculatedDailyPledges)}
                      className="text-[10px] text-emerald-600 font-semibold hover:underline"
                    >
                      Use Pledges: {formatCurrency(calculatedDailyPledges, settings.currency)}
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  value={dailyInput}
                  onChange={(e) => setDailyInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsEditingTarget(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTarget}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold rounded-xl text-xs shadow-md transition cursor-pointer"
                >
                  {savingTarget ? 'Saving...' : 'Save & Sync Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
