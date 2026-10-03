import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Send,
  MessageCircle,
  Smartphone,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle,
  Volume2,
  Settings,
  History,
  Copy,
  Check,
} from 'lucide-react';
import { useFund } from '../context/FundContext';
import { useAuth } from '../context/AuthContext';
import { getTodayDateString, formatCurrency, formatDateReadable } from '../utils/calculations';
import {
  isNotificationSupported,
  requestNotificationPermission,
  sendBrowserPushNotification,
  formatWhatsAppUrl,
  formatSmsUrl,
} from '../utils/notifications';

export const RemindersHubView: React.FC = () => {
  const { members, contributions, settings, reminders, logReminder } = useFund();
  const { currentUser } = useAuth();

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'whatsapp' | 'sms' | 'push'>('all');
  const [autoReminderEnabled, setAutoReminderEnabled] = useState<boolean>(() => {
    return localStorage.getItem('kun_auto_reminder') === 'true';
  });

  const today = getTodayDateString();

  useEffect(() => {
    if (isNotificationSupported()) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      sendBrowserPushNotification('KUN Samajik Kosh', {
        body: 'Push notifications are now enabled! You will receive daily alerts for pending contributions.',
      });
    }
  };

  const handleToggleAutoReminder = (enabled: boolean) => {
    setAutoReminderEnabled(enabled);
    localStorage.setItem('kun_auto_reminder', String(enabled));
    if (enabled && notificationPermission !== 'granted') {
      handleRequestPermission();
    }
  };

  // Identify who has not donated today
  const activeMembers = members.filter((m) => m.status === 'active');
  const todayPaidMemberIds = new Set(
    contributions.filter((c) => c.date === today && c.hasDonated).map((c) => c.memberId)
  );

  const pendingMembersToday = activeMembers.filter((m) => !todayPaidMemberIds.has(m.id));

  // Trigger automated push broadcast for pending members
  const handleBroadcastPush = () => {
    if (pendingMembersToday.length === 0) {
      alert('All members have already contributed today! No reminders needed.');
      return;
    }

    const title = `⚠️ KUN Samajik Kosh: ${pendingMembersToday.length} Pending Contributions`;
    const body = `Reminder: ${pendingMembersToday.map((m) => m.fullName).slice(0, 3).join(', ')}${
      pendingMembersToday.length > 3 ? ` and ${pendingMembersToday.length - 3} more` : ''
    } have not submitted today's contribution.`;

    const sent = sendBrowserPushNotification(title, { body });

    // Log in database
    pendingMembersToday.forEach((m) => {
      logReminder(m.id, m.fullName, 'push', body, today);
    });

    if (sent) {
      alert(`Push reminder dispatched to your device!`);
    } else {
      alert(`Push reminder logged. Please grant browser notification permission if not yet enabled.`);
    }
  };

  const handleSendSingle = (memberId: string, memberName: string, phone: string, channel: 'whatsapp' | 'sms' | 'push') => {
    const member = members.find((m) => m.id === memberId);
    const amount = member ? member.defaultDailyAmount : settings.defaultDailyAmount;
    const message = (settings.reminderTemplate || 'नमस्ते {name} ज्यू, KUN Samajik Kosh मा मिति {date} को दैनिक योगदान रू {amount} बाँकी रहेको व्यहोरा सादर स्मरण गराउँदछौं। धन्यवाद!')
      .replace('{name}', memberName)
      .replace('{date}', today)
      .replace('{amount}', String(amount));

    logReminder(memberId, memberName, channel, message, today);

    if (channel === 'whatsapp') {
      window.open(formatWhatsAppUrl(phone, message), '_blank');
    } else if (channel === 'sms') {
      window.open(formatSmsUrl(phone, message), '_self');
    } else if (channel === 'push') {
      sendBrowserPushNotification(`Contribution Reminder: ${memberName}`, {
        body: message,
      });
    }
  };

  const handleCopyTemplate = () => {
    if (settings.reminderTemplate) {
      navigator.clipboard.writeText(settings.reminderTemplate);
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <BellRing className="w-3.5 h-3.5" /> Automated Reminder Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Pending Contribution Reminders
          </h1>
          <p className="text-amber-100 text-xs sm:text-sm mt-1 max-w-xl">
            Remind members who have not yet submitted their daily pledge via Web Push Notifications, WhatsApp, and SMS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notificationPermission !== 'granted' ? (
            <button
              onClick={handleRequestPermission}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-amber-800 font-bold rounded-xl text-xs sm:text-sm shadow-md hover:bg-amber-50 active:scale-95 transition cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              Enable Push Notifications
            </button>
          ) : (
            <button
              onClick={handleBroadcastPush}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-amber-800 font-bold rounded-xl text-xs sm:text-sm shadow-md hover:bg-amber-50 active:scale-95 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Trigger Push Alert ({pendingMembersToday.length})
            </button>
          )}
        </div>
      </div>

      {/* Push Status & Auto Reminder Settings Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Permission status card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Push Notification Status</p>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 capitalize mt-1 flex items-center gap-1.5">
              {notificationPermission === 'granted' ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Active & Enabled
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  {notificationPermission}
                </>
              )}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Supports lock screen & desktop notifications
            </p>
          </div>
          {notificationPermission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="px-3 py-1.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 text-xs font-semibold rounded-lg hover:bg-amber-200 transition cursor-pointer"
            >
              Allow
            </button>
          )}
        </div>

        {/* Automated System Toggle */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily Auto-Reminder Check</p>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
              {autoReminderEnabled ? 'Automated Alert ON' : 'Disabled'}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Checks pending status on app launch
            </p>
          </div>
          <button
            onClick={() => handleToggleAutoReminder(!autoReminderEnabled)}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              autoReminderEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                autoReminderEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Pending Summary */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pending Unpaid Members</p>
            <h4 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {pendingMembersToday.length} of {activeMembers.length}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Date: {formatDateReadable(today)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-lg">
            ⏳
          </div>
        </div>
      </div>

      {/* Pending Members List */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Members Awaiting Contribution Today
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Send immediate 1-click WhatsApp, SMS, or browser push notifications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl transition cursor-pointer"
            >
              {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedTemplate ? 'Template Copied' : 'Copy Message'}
            </button>
          </div>
        </div>

        {pendingMembersToday.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
              🎉
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              All Members Have Donated Today!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              There are no pending contributions for today's date ({formatDateReadable(today)}). Great job by all contributors!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingMembersToday.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {m.fullName}
                    </h4>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {m.phone}
                    </p>
                    {m.address && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {m.address}
                      </p>
                    )}
                  </div>

                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg">
                    {formatCurrency(m.defaultDailyAmount, settings.currency)} Due
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleSendSingle(m.id, m.fullName, m.phone, 'whatsapp')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleSendSingle(m.id, m.fullName, m.phone, 'sms')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    SMS
                  </button>
                  <button
                    onClick={() => handleSendSingle(m.id, m.fullName, m.phone, 'push')}
                    className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer"
                    title="Send Push Alert"
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reminder Audit History */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-slate-500" />
          Recent Reminder Log & Notification History
        </h3>

        {reminders.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No reminders have been dispatched yet.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100">
                      {rem.memberName}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-md text-[10px] uppercase font-semibold text-slate-600 dark:text-slate-300">
                      {rem.channel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    "{rem.message}"
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                  {new Date(rem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
