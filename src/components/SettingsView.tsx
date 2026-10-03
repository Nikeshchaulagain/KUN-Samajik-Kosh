import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  ShieldCheck,
  Building,
  CreditCard,
  MessageSquare,
  Lock,
  Check,
  RotateCcw,
  Smartphone,
  Eye,
  EyeOff,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { useFund } from '../context/FundContext';
import { useAuth } from '../context/AuthContext';
import { AccessPolicy } from '../types';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    canEdit,
    isReadOnlyMode,
    isOwner,
    toggleReadOnlyMode,
    setAccessPolicy,
  } = useFund();
  const { currentUser, isSuperAdmin } = useAuth();

  const [orgName, setOrgName] = useState(settings.orgName);
  const [currency, setCurrency] = useState(settings.currency);
  const [defaultDailyAmount, setDefaultDailyAmount] = useState(settings.defaultDailyAmount);
  const [bankDetails, setBankDetails] = useState(settings.bankDetails || '');
  const [reminderTemplate, setReminderTemplate] = useState(settings.reminderTemplate || '');
  const [accessPolicy, setAccessPolicyState] = useState<AccessPolicy>(settings.accessPolicy || 'admin_only_edit');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOrgName(settings.orgName);
    setCurrency(settings.currency);
    setDefaultDailyAmount(settings.defaultDailyAmount);
    setBankDetails(settings.bankDetails || '');
    setReminderTemplate(settings.reminderTemplate || '');
    setAccessPolicyState(settings.accessPolicy || 'admin_only_edit');
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setSaving(true);
    try {
      await updateSettings({
        orgName,
        currency,
        defaultDailyAmount: Number(defaultDailyAmount),
        bankDetails,
        reminderTemplate,
        accessPolicy,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Settings save error:', err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePolicyChange = async (newPolicy: AccessPolicy) => {
    setAccessPolicyState(newPolicy);
    if (isOwner) {
      await setAccessPolicy(newPolicy);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-700 gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Settings className="w-6 h-6 text-emerald-600" />
              KUN Samajik Kosh Configuration
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configure access permissions, currency display, bank details, and reminder templates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full animate-in fade-in">
                <Check className="w-3.5 h-3.5" /> Saved & Synced!
              </span>
            )}
          </div>
        </div>

        {/* Access Control & Permissions Section */}
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/30 dark:from-slate-900/60 dark:to-emerald-950/20 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Access Control & Transparency
              </span>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">
                Member Access & Modification Permissions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Control whether regular members can modify data or have view-only access.
              </p>
            </div>

            {/* Test View-Only Toggle */}
            <button
              type="button"
              onClick={toggleReadOnlyMode}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 border ${
                isReadOnlyMode
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {isReadOnlyMode ? (
                <>
                  <Eye className="w-4 h-4 text-amber-600" />
                  <span>Exit View-Only Mode</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-slate-500" />
                  <span>Simulate View-Only Mode</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              onClick={() => isOwner && handlePolicyChange('admin_only_edit')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                accessPolicy === 'admin_only_edit'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Administrator Only (Recommended)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Members can view <strong>everything</strong> (Dashboard, Daily Records, Financial Reports, QR, Statements) but <strong>cannot make any changes</strong>.
              </p>
            </div>

            <div
              onClick={() => isOwner && handlePolicyChange('open_edit')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                accessPolicy === 'open_edit'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Collaborative Editing
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                All signed-in community members are allowed to record daily contributions and edit lists.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Org & Currency Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-600" />
              Organization & Treasury Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fund / Organization Name
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!canEdit}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Default Daily Pledge
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    disabled={!canEdit}
                    value={defaultDailyAmount}
                    onChange={(e) => setDefaultDailyAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 font-bold disabled:opacity-70 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bank Account and Digital Wallet details */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Bank & Mobile Banking Information (Shown on QR Page)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Details, Bank Name, Account Number, eSewa ID
              </label>
              <textarea
                rows={4}
                disabled={!canEdit}
                value={bankDetails}
                onChange={(e) => setBankDetails(e.target.value)}
                placeholder="Bank Name, Account Holder Name, Account Number, Branch, eSewa/Fonepay Mobile..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 leading-relaxed disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Reminder message template */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Automated Reminder Template (WhatsApp / SMS / Push)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Message Content (Placeholders: <code>{'{name}'}</code>, <code>{'{date}'}</code>, <code>{'{amount}'}</code>)
              </label>
              <textarea
                rows={3}
                disabled={!canEdit}
                value={reminderTemplate}
                onChange={(e) => setReminderTemplate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Security & Access Block */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <p className="font-bold">Google Cloud Firestore & Authentication Security</p>
              <p>
                Connected Google Account: <span className="font-mono font-semibold">{currentUser?.email || 'Guest'}</span>.
                Primary Authorized Super Administrator: <span className="font-mono font-semibold">nikeshchaulagain50@gmail.com</span>.
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                Your role: <strong>{isOwner ? 'Administrator / Owner' : 'View-Only Member'}</strong>.
              </p>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
            {!canEdit ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Viewing Settings in View-Only mode. Modifications are restricted to Administrators.
              </p>
            ) : <div />}

            {canEdit && (
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save & Broadcast Settings'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
