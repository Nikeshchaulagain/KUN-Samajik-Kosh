import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  MessageCircle,
  Send,
  AlertCircle,
  Sparkles,
  Filter,
  CheckCheck,
  Search,
  Lock,
  Shield,
  Eye,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFund } from '../context/FundContext';
import { useAuth } from '../context/AuthContext';
import { PaymentMethod, Member } from '../types';
import {
  formatDateReadable,
  getTodayDateString,
  formatCurrency,
} from '../utils/calculations';
import {
  formatWhatsAppUrl,
  formatSmsUrl,
  sendBrowserPushNotification,
} from '../utils/notifications';

export const DailyTrackerView: React.FC = () => {
  const {
    members,
    contributions,
    settings,
    recordDailyContribution,
    batchRecordDate,
    logReminder,
    canEdit,
    isReadOnlyMode,
  } = useFund();
  const { isAdmin } = useAuth();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'donated'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingContribMemberId, setEditingContribMemberId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(10);
  const [customMethod, setCustomMethod] = useState<PaymentMethod>('cash');
  const [customRemarks, setCustomRemarks] = useState<string>('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [reminderSentMap, setReminderSentMap] = useState<Record<string, boolean>>({});

  const activeMembers = members.filter((m) => m.status === 'active');

  // Map memberId -> contribution for selectedDate
  const dateContributionsMap = new Map(
    contributions
      .filter((c) => c.date === selectedDate)
      .map((c) => [c.memberId, c])
  );

  const donatedCount = activeMembers.filter(
    (m) => dateContributionsMap.get(m.id)?.hasDonated
  ).length;

  const totalCollectedToday = activeMembers.reduce((sum, m) => {
    const c = dateContributionsMap.get(m.id);
    return sum + (c?.hasDonated ? c.amount || 0 : 0);
  }, 0);

  const targetAmountToday = activeMembers.reduce(
    (sum, m) => sum + m.defaultDailyAmount,
    0
  );

  const collectionRate =
    targetAmountToday > 0
      ? Math.round((totalCollectedToday / targetAmountToday) * 100)
      : 0;

  // Date navigation helpers
  const handleShiftDate = (days: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newD = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${newY}-${newM}-${newD}`);
  };

  const isToday = selectedDate === getTodayDateString();

  // Toggle single member contribution
  const handleToggleDonation = async (member: Member) => {
    const existing = dateContributionsMap.get(member.id);
    const newStatus = !existing?.hasDonated;

    try {
      await recordDailyContribution(
        member.id,
        selectedDate,
        newStatus,
        newStatus ? member.defaultDailyAmount : 0,
        newStatus ? 'cash' : 'cash',
        newStatus ? 'Daily contribution recorded' : 'Marked absent/pending'
      );

      if (newStatus) {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#059669', '#10b981', '#34d399'],
        });
      }
    } catch (err) {
      console.error('Record error:', err);
    }
  };

  // Open custom amount & payment method modal for a member
  const handleOpenCustom = (member: Member) => {
    const existing = dateContributionsMap.get(member.id);
    setEditingContribMemberId(member.id);
    setCustomAmount(existing?.amount || member.defaultDailyAmount);
    setCustomMethod(existing?.paymentMethod || 'cash');
    setCustomRemarks(existing?.remarks || '');
  };

  const handleSaveCustom = async () => {
    if (!editingContribMemberId) return;
    try {
      await recordDailyContribution(
        editingContribMemberId,
        selectedDate,
        true,
        Number(customAmount),
        customMethod,
        customRemarks
      );
      setEditingContribMemberId(null);
    } catch (err) {
      console.error('Save custom error:', err);
    }
  };

  // Batch mark all
  const handleMarkAll = async (hasDonated: boolean) => {
    if (activeMembers.length === 0) return;
    setBatchLoading(true);
    try {
      await batchRecordDate(selectedDate, hasDonated);
      if (hasDonated) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Batch error:', err);
    } finally {
      setBatchLoading(false);
    }
  };

  // Send Reminder (WhatsApp/Push/SMS)
  const handleSendReminder = (member: Member, channel: 'whatsapp' | 'sms' | 'push') => {
    const message = (settings.reminderTemplate || 'नमस्ते {name} ज्यू, KUN Samajik Kosh मा मिति {date} को योगदान बाँकी रहेको व्यहोरा अनुरोध गर्दछौं।')
      .replace('{name}', member.fullName)
      .replace('{date}', selectedDate)
      .replace('{amount}', String(member.defaultDailyAmount));

    logReminder(member.id, member.fullName, channel, message, selectedDate);
    setReminderSentMap((prev) => ({ ...prev, [member.id]: true }));

    if (channel === 'whatsapp') {
      window.open(formatWhatsAppUrl(member.phone, message), '_blank');
    } else if (channel === 'sms') {
      window.open(formatSmsUrl(member.phone, message), '_self');
    } else if (channel === 'push') {
      sendBrowserPushNotification(`KUN Samajik Kosh Reminder`, {
        body: message,
      });
      alert(`Push reminder dispatched for ${member.fullName}!`);
    }
  };

  const filteredMembers = activeMembers.filter((m) => {
    const c = dateContributionsMap.get(m.id);
    const hasDonated = !!c?.hasDonated;

    const matchesSearch =
      m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery);

    if (!matchesSearch) return false;
    if (filterMode === 'pending') return !hasDonated;
    if (filterMode === 'donated') return hasDonated;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Read-Only Access Banner */}
      {!canEdit && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> View-Only Access (Audit Mode)
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                You can inspect all daily attendance records, statistics, and monthly totals. Modifications are restricted to Administrators.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 rounded-lg text-xs font-bold border border-amber-300 dark:border-amber-800 shrink-0">
            Read-Only
          </span>
        </div>
      )}

      {/* Date Navigation & Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Date Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
            <button
              onClick={() => handleShiftDate(-1)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none cursor-pointer border-b border-dashed border-slate-300 dark:border-slate-600 pb-0.5"
              />
            </div>

            <button
              onClick={() => handleShiftDate(1)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {!isToday && (
              <button
                onClick={() => setSelectedDate(getTodayDateString())}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 transition cursor-pointer"
              >
                Today
              </button>
            )}
          </div>

          {/* Batch Quick Actions (Admin Only) */}
          {canEdit ? (
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={() => handleMarkAll(true)}
                disabled={batchLoading}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold rounded-xl text-xs shadow-sm transition cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Donated
              </button>
              <button
                onClick={() => handleMarkAll(false)}
                disabled={batchLoading}
                className="flex-1 md:flex-none px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl text-xs transition cursor-pointer"
              >
                Reset Day
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">
              Changes restricted to Administrators
            </div>
          )}
        </div>

        {/* Date Humanized Subtitle */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center md:text-left">
          Recording entries for: <strong className="text-slate-700 dark:text-slate-200">{formatDateReadable(selectedDate)}</strong>
          {isToday && <span className="ml-2 text-emerald-600 font-semibold">(Today)</span>}
        </p>
      </div>

      {/* Daily Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-100 font-medium">Total Collected on this Date</p>
            <h3 className="text-2xl font-black mt-1">
              {formatCurrency(totalCollectedToday, settings.currency)}
            </h3>
            <p className="text-[11px] text-emerald-200 mt-0.5">
              Goal: {formatCurrency(targetAmountToday, settings.currency)}
            </p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl backdrop-blur-sm">
            💰
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Attendance & Collection Rate</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">
              {collectionRate}%
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {donatedCount} of {activeMembers.length} members contributed
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold text-lg">
            {donatedCount}/{activeMembers.length}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Pending Contributions</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {activeMembers.length - donatedCount} Members
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Estimated pending: {formatCurrency((activeMembers.length - donatedCount) * settings.defaultDailyAmount, settings.currency)}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-xl">
            ⏳
          </div>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterMode === 'all'
                ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            All ({activeMembers.length})
          </button>
          <button
            onClick={() => setFilterMode('donated')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterMode === 'donated'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            Donated ({donatedCount})
          </button>
          <button
            onClick={() => setFilterMode('pending')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              filterMode === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
            }`}
          >
            Pending ({activeMembers.length - donatedCount})
          </button>
        </div>
      </div>

      {/* Member Attendance & Donation List */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-700">
          <p className="text-3xl mb-2">✨</p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No members match the current filter
          </p>
          {filterMode === 'pending' && donatedCount === activeMembers.length && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              Outstanding! 100% of all members have completed their daily donation for this date! 🎉
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member) => {
            const contrib = dateContributionsMap.get(member.id);
            const hasDonated = !!contrib?.hasDonated;
            const amount = hasDonated ? contrib?.amount || member.defaultDailyAmount : 0;
            const method = contrib?.paymentMethod || 'cash';
            const reminderSent = reminderSentMap[member.id];

            return (
              <div
                key={member.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl p-4 border transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  hasDonated
                    ? 'border-emerald-300/80 dark:border-emerald-700/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-700/60'
                }`}
              >
                {/* Member Info */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => canEdit && handleToggleDonation(member)}
                    disabled={!canEdit}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      !canEdit ? 'cursor-default opacity-85' : 'cursor-pointer'
                    } ${
                      hasDonated
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'
                    }`}
                    title={!canEdit ? 'View-Only Access' : hasDonated ? 'Mark as Not Donated' : 'Mark as Donated'}
                  >
                    {hasDonated ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {member.fullName}
                      </h4>
                      {member.address && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                          • {member.address}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {member.phone}
                    </p>
                  </div>
                </div>

                {/* Status, Amount, & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-700/60">
                  {/* Amount / Pledge indicator */}
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span
                        className={`text-sm font-bold ${
                          hasDonated
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500 line-through'
                        }`}
                      >
                        {formatCurrency(hasDonated ? amount : member.defaultDailyAmount, settings.currency)}
                      </span>

                      {hasDonated && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase">
                          {method === 'qr_code' ? 'QR' : method}
                        </span>
                      )}
                    </div>

                    {contrib?.remarks && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic truncate max-w-[140px]">
                        {contrib.remarks}
                      </p>
                    )}
                  </div>

                  {/* Primary Toggle Switch */}
                  {canEdit ? (
                    <>
                      <button
                        onClick={() => handleToggleDonation(member)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          hasDonated
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                        }`}
                      >
                        {hasDonated ? 'Donated ✓' : 'Mark Paid'}
                      </button>

                      {/* Edit Custom Amount/Remarks Button */}
                      <button
                        onClick={() => handleOpenCustom(member)}
                        title="Edit custom amount or payment mode"
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 ${
                        hasDonated
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                      title="View-only: Modifications restricted to Administrators"
                    >
                      {hasDonated ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Donated
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-slate-400" /> Pending
                        </>
                      )}
                    </span>
                  )}

                  {/* If NOT donated, show quick 1-click reminders */}
                  {!hasDonated && (
                    <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => handleSendReminder(member, 'whatsapp')}
                        title="Send WhatsApp Reminder"
                        className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleSendReminder(member, 'sms')}
                        title="Send SMS Reminder"
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Amount / Method Modal */}
      {editingContribMemberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
              Custom Contribution Entry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter custom donation amount, payment method (Cash/QR), or advance payment remarks.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount ({settings.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method
                </label>
                <select
                  value={customMethod}
                  onChange={(e) => setCustomMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="cash">Cash (हस्ते नगद)</option>
                  <option value="qr_code">QR Code (Fonepay / eSewa)</option>
                  <option value="bank_transfer">Bank Transfer (मोबाइल बैंकिङ)</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Receipt Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid for 5 days or Fonepay TXN"
                  value={customRemarks}
                  onChange={(e) => setCustomRemarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setEditingContribMemberId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
                >
                  Save Contribution
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
