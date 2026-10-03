import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  PieChart,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useFund } from '../context/FundContext';
import { useAuth } from '../context/AuthContext';
import {
  getCurrentMonthKey,
  getDaysInMonth,
  formatMonthReadable,
  formatCurrency,
  calculateMonthlyStats,
} from '../utils/calculations';

export const MonthlyReportView: React.FC = () => {
  const { members, contributions, settings } = useFund();
  const { currentUser, isAdmin } = useAuth();

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(getCurrentMonthKey());
  const [maskPhoneNumbers, setMaskPhoneNumbers] = useState<boolean>(false);
  const [printPreviewMode, setPrintPreviewMode] = useState<boolean>(false);

  const [yearStr, monthStr] = selectedMonthKey.split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;
  const daysInMonth = getDaysInMonth(year, month);

  // Calculate monthly stats
  const memberStats = calculateMonthlyStats(members, contributions, selectedMonthKey);

  // Month-wide totals
  const totalCollected = memberStats.reduce((sum, s) => sum + s.totalDonated, 0);
  const totalExpected = memberStats.reduce((sum, s) => sum + s.expectedAmount, 0);
  const overallFulfillmentRate =
    totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  // Contributions in this month
  const monthContribs = contributions.filter(
    (c) => (c.monthKey === selectedMonthKey || c.date?.startsWith(selectedMonthKey)) && c.hasDonated
  );

  // Payment method breakdown
  const paymentBreakdown = monthContribs.reduce(
    (acc, curr) => {
      const method = curr.paymentMethod || 'cash';
      acc[method] = (acc[method] || 0) + (curr.amount || 0);
      return acc;
    },
    { cash: 0, qr_code: 0, bank_transfer: 0, other: 0 } as Record<string, number>
  );

  const handlePrint = () => {
    window.print();
  };

  // Generate list of previous 12 months for selector
  const monthOptions = [];
  const currentDate = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthOptions.push({
      key,
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Controls Bar (Hidden during print) */}
      <div className="no-print bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            Monthly Financial Statement & Audit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent breakdown of daily donations, collection metrics, and PDF reporting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <select
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="text-xs sm:text-sm font-semibold bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.key} value={opt.key} className="bg-white dark:bg-slate-800">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy Toggle */}
          <button
            onClick={() => setMaskPhoneNumbers(!maskPhoneNumbers)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Mask phone numbers for public transparency sharing"
          >
            {maskPhoneNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {maskPhoneNumbers ? 'Phones Masked' : 'Show Phones'}
          </button>

          {/* Print / Save PDF Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold rounded-xl text-xs shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Export / Print PDF
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div id="printable-report" className="bg-white text-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
        {/* Official Header */}
        <div className="border-b-2 border-emerald-600 pb-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Community Welfare Fund Audit
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {settings.orgName}
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                Official Monthly Contribution & Daily Ledger Statement
              </p>
            </div>

            <div className="text-center sm:text-right text-xs text-slate-600 space-y-1">
              <p>
                <strong>Report Month:</strong>{' '}
                <span className="text-emerald-700 font-bold text-sm">
                  {formatMonthReadable(selectedMonthKey)}
                </span>
              </p>
              <p>
                <strong>Days in Month:</strong> {daysInMonth} Days
              </p>
              <p>
                <strong>Generated On:</strong> {new Date().toLocaleDateString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              <p>
                <strong>Auditor/Admin:</strong> {currentUser?.email || 'Authorized Official'}
              </p>
            </div>
          </div>
        </div>

        {/* Financial Highlights KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200">
            <p className="text-xs text-emerald-800 font-semibold">Total Funds Collected</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {formatCurrency(totalCollected, settings.currency)}
            </p>
            <p className="text-[11px] text-emerald-600 mt-0.5">
              Across {monthContribs.length} successful entries
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-600 font-semibold">Monthly Expected Target</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {formatCurrency(totalExpected, settings.currency)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Based on {members.length} registered members
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-600 font-semibold">Fund Fulfillment Rate</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {overallFulfillmentRate}%
            </p>
            <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, overallFulfillmentRate)}%` }}
              />
            </div>
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
            <p className="text-xs text-amber-800 font-semibold">Pending / Deficit</p>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {formatCurrency(Math.max(0, totalExpected - totalCollected), settings.currency)}
            </p>
            <p className="text-[11px] text-amber-600 mt-0.5">
              {Math.max(0, 100 - overallFulfillmentRate)}% remaining to reach target
            </p>
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider">
            Payment Channels:
          </span>
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-slate-500">QR Code (Fonepay/eSewa): </span>
              <strong className="text-slate-900 font-bold">
                {formatCurrency(paymentBreakdown.qr_code, settings.currency)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Cash (हस्ते नगद): </span>
              <strong className="text-slate-900 font-bold">
                {formatCurrency(paymentBreakdown.cash, settings.currency)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500">Bank Transfer: </span>
              <strong className="text-slate-900 font-bold">
                {formatCurrency(paymentBreakdown.bank_transfer, settings.currency)}
              </strong>
            </div>
          </div>
        </div>

        {/* Member Breakdown Detailed Table */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
            Member-Wise Contribution Audit Sheet
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Member Name</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3 text-center">Daily Pledge</th>
                  <th className="py-3 px-3 text-center">Days Donated</th>
                  <th className="py-3 px-3 text-right">Total Donated</th>
                  <th className="py-3 px-3 text-right">Target</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberStats.map((stat, idx) => {
                  const phoneDisplay = maskPhoneNumbers
                    ? stat.member.phone.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2')
                    : stat.member.phone;

                  const isComplete = stat.fulfillmentRate >= 100;
                  const isPartial = stat.fulfillmentRate > 0 && stat.fulfillmentRate < 100;

                  return (
                    <tr
                      key={stat.member.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {stat.member.fullName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">{phoneDisplay}</td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        {formatCurrency(stat.member.defaultDailyAmount, settings.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                        {stat.daysDonated} / {daysInMonth}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(stat.totalDonated, settings.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                        {formatCurrency(stat.expectedAmount, settings.currency)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isComplete
                              ? 'bg-emerald-100 text-emerald-800'
                              : isPartial
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {stat.fulfillmentRate}% {isComplete ? 'Paid' : isPartial ? 'Partial' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-3 text-right uppercase">
                    Grand Total:
                  </td>
                  <td className="py-3 px-3 text-center">-</td>
                  <td className="py-3 px-3 text-center">
                    {memberStats.reduce((sum, s) => sum + s.daysDonated, 0)} days
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-800 text-sm">
                    {formatCurrency(totalCollected, settings.currency)}
                  </td>
                  <td className="py-3 px-3 text-right text-sm">
                    {formatCurrency(totalExpected, settings.currency)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {overallFulfillmentRate}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Signature & Official Verification Block for Audit */}
        <div className="pt-8 border-t-2 border-dashed border-slate-200 grid grid-cols-3 gap-6 text-center text-xs text-slate-600 mt-10">
          <div className="space-y-12">
            <div className="h-10 border-b border-slate-400 mx-6"></div>
            <p className="font-semibold text-slate-800">Prepared By (Recorder)</p>
          </div>

          <div className="space-y-12">
            <div className="h-10 border-b border-slate-400 mx-6 flex items-center justify-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">[ Official Stamp ]</span>
            </div>
            <p className="font-semibold text-slate-800">KUN Samajik Kosh Seal</p>
          </div>

          <div className="space-y-12">
            <div className="h-10 border-b border-slate-400 mx-6"></div>
            <p className="font-semibold text-slate-800">Verified By (Treasurer / President)</p>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 mt-8">
          This document is generated from real-time synchronized cloud records of KUN Samajik Kosh.
          Protected by Google Firebase Authentication & Zero-Trust database rules.
        </p>
      </div>
    </div>
  );
};
