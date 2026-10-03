import React, { useState } from 'react';
import {
  Building2,
  Plus,
  KeyRound,
  Check,
  Copy,
  ExternalLink,
  Users,
  Shield,
  ArrowRight,
  Share2,
  X,
  Sparkles,
} from 'lucide-react';
import { useFund } from '../context/FundContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/calculations';

interface FundSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FundSwitcherModal: React.FC<FundSwitcherModalProps> = ({ isOpen, onClose }) => {
  const { currentFund, allPublicFunds, userMemberships, switchFund, joinFundByCode, createFund } = useFund();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'my_funds' | 'join' | 'create'>('my_funds');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  // New fund form
  const [newFundName, setNewFundName] = useState('');
  const [newFundCode, setNewFundCode] = useState('');
  const [newDailyAmount, setNewDailyAmount] = useState(10);
  const [newCurrency, setNewCurrency] = useState('रू');
  const [creating, setCreating] = useState(false);

  // Copy state
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleCopyCurrentInvite = () => {
    const inviteText = `Join my Samajik Kosh "${currentFund.name}"! Use Join Code: ${currentFund.code}\nApp link: ${window.location.origin}?join=${currentFund.code}`;
    navigator.clipboard.writeText(inviteText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setJoining(true);
    setJoinError(null);
    setJoinSuccess(null);

    const result = await joinFundByCode(joinCodeInput);
    setJoining(false);

    if (result.success) {
      setJoinSuccess(result.message);
      setJoinCodeInput('');
      setTimeout(() => {
        setJoinSuccess(null);
        onClose();
      }, 1500);
    } else {
      setJoinError(result.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFundName.trim()) return;

    setCreating(true);
    try {
      await createFund(newFundName, newFundCode || undefined, '', Number(newDailyAmount), newCurrency);
      setNewFundName('');
      setNewFundCode('');
      onClose();
    } catch (err) {
      console.error('Error creating fund:', err);
      alert('Could not create fund. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                Samajik Kosh Workspace
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Join or switch between multiple community funds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Fund Banner */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Active Fund
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {currentFund.name}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Code: <strong className="text-emerald-600 dark:text-emerald-400">{currentFund.code}</strong>
            </p>
          </div>

          <button
            onClick={handleCopyCurrentInvite}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer shrink-0"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? 'Copied!' : 'Share Code'}
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('my_funds')}
            className={`flex-1 py-2.5 text-center border-b-2 transition cursor-pointer ${
              activeTab === 'my_funds'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Switch Kosh ({allPublicFunds.length})
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2.5 text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'join'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Join via Code
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2.5 text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Create New
          </button>
        </div>

        {/* TAB 1: Available & Joined Funds */}
        {activeTab === 'my_funds' && (
          <div className="space-y-2.5">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Select any Samajik Kosh to switch your active records and attendance sheet:
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {allPublicFunds.map((fund) => {
                const isSelected = fund.id === currentFund.id;
                return (
                  <div
                    key={fund.id}
                    onClick={() => {
                      switchFund(fund.id);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                          {fund.name}
                        </h4>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Code: <strong>{fund.code}</strong> • Daily: {formatCurrency(fund.defaultDailyAmount, fund.currency)}
                      </p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: Join by Code */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Enter Samajik Kosh Join Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. KUN-2026 or TOL-8491"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-mono uppercase font-bold text-center tracking-widest text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 text-center">
                Ask the Samajik Kosh administrator for their 6 to 8 character Invite Code.
              </p>
            </div>

            {joinError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs rounded-xl">
                {joinError}
              </div>
            )}

            {joinSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-1.5 font-semibold">
                <Check className="w-4 h-4" /> {joinSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={joining || !joinCodeInput.trim()}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              {joining ? 'Verifying Code...' : 'Join Samajik Kosh'}
            </button>
          </form>
        )}

        {/* TAB 3: Create New Samajik Kosh */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kosh / Organization Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ward 4 Tol Bikas Samajik Kosh"
                value={newFundName}
                onChange={(e) => setNewFundName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TOL-2026"
                  value={newFundCode}
                  onChange={(e) => setNewFundCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono uppercase text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Daily Pledge
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newDailyAmount}
                  onChange={(e) => setNewDailyAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating || !newFundName.trim()}
              className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              {creating ? 'Creating Kosh...' : 'Create & Switch to New Kosh'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
