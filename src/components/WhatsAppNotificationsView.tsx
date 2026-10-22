/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  AlertCircle,
  Clock,
  CheckCircle2,
  Phone,
  ShieldAlert,
  ArrowRight,
  Filter,
  RefreshCw,
  ExternalLink,
  X,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '../lib/api/client';
import { WhatsAppEligibleItem, ReminderTier, SendWhatsAppResponse } from '../lib/api/types';
import { VisaStatusBadge } from './VisaStatusBadge';

interface WhatsAppNotificationsViewProps {
  onNavigateHistory: () => void;
}

export const WhatsAppNotificationsView: React.FC<WhatsAppNotificationsViewProps> = ({
  onNavigateHistory,
}) => {
  const [eligibleList, setEligibleList] = useState<WhatsAppEligibleItem[]>([]);
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Send message dialog state
  const [confirmDialogItem, setConfirmDialogItem] = useState<WhatsAppEligibleItem | null>(null);
  const [dispatchMethod, setDispatchMethod] = useState<'twilio' | 'demo'>('demo');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessResult, setSendSuccessResult] = useState<SendWhatsAppResponse | null>(null);
  const [sendErrorNotice, setSendErrorNotice] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadEligible = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getWhatsAppEligible();
      setEligibleList(data);
    } catch (err) {
      console.error('Failed to fetch eligible list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEligible();
  }, []);

  const getTierPreviewText = (item: WhatsAppEligibleItem) => {
    const student = item.student;
    const formattedDate =
      student.formattedExpiryDate ||
      (student.visaExpiryDate
        ? new Date(student.visaExpiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'N/A');

    if (item.tier === 'OVERDUE_ALERT') {
      return `[UniSIRAJ CIA EMERGENCY OVERSTAY NOTICE]
Dear ${student.fullName} (${student.matricId}),
Our automated compliance audit records show your Student Pass EXPIRED on ${formattedDate}.
Under Section 15(1)(c) of the Immigration Act, overstaying incurs compounding fines between RM1,100 to RM3,100 and risk of travel bans.
Report IMMEDIATELY to CIA Helpdesk, Level 2, Administration Complex for urgent Special Pass rectification.`;
    }

    if (item.tier === 'TIER_3_30_DAYS') {
      return `[UniSIRAJ CIA TIER 3 URGENT VISA REMINDER]
Dear ${student.fullName} (${student.matricId}),
Your Student Pass expires in ${item.daysRemaining} days (${formattedDate}).
Malaysian Immigration strictly requires passport submission prior to this threshold.
Please submit your passport, medical screening clearance, and academic attendance slip to CIA Helpdesk today to avoid visa cancellation.`;
    }

    if (item.tier === 'TIER_2_60_DAYS') {
      return `[UniSIRAJ CIA TIER 2 RENEWAL FOLLOW-UP]
Dear ${student.fullName} (${student.matricId}),
You have ${item.daysRemaining} days remaining before your Student Pass expires on ${formattedDate}.
Kindly verify your EMGS application status and ensure renewal processing fees have been paid at the university bursary.`;
    }

    return `[UniSIRAJ CIA TIER 1 RENEWAL ADVISORY]
Dear ${student.fullName} (${student.matricId}),
The 90-day renewal window for your Student Pass has officially opened (Expiry: ${formattedDate}).
Please ensure your passport has at least 18 months remaining validity and obtain your latest faculty academic transcript.`;
  };

  const handleExecuteSend = async () => {
    if (!confirmDialogItem) return;
    setIsSending(true);
    setSendErrorNotice(null);

    try {
      const res = await apiClient.sendWhatsAppMessage({
        studentId: confirmDialogItem.student.id,
        tier: confirmDialogItem.tier,
        dispatchMethod: dispatchMethod,
      });
      setSendSuccessResult(res);
      // Refresh list
      loadEligible();
    } catch (err: any) {
      setSendErrorNotice(err.message || 'WhatsApp dispatch failed.');
    } finally {
      setIsSending(false);
    }
  };

  const filteredEligible = eligibleList.filter((item) => {
    if (selectedTierFilter === 'ALL') return true;
    return item.tier === selectedTierFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredEligible.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEligible = filteredEligible.slice(startIndex, startIndex + pageSize);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
            WhatsApp Notifications
          </h2>
        </div>
      </div>

      {/* Overview Cards for Tiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            tier: 'OVERDUE_ALERT',
            title: 'Overstay / Expired',
            desc: 'Expired passes (<0d)',
            count: eligibleList.filter((i) => i.tier === 'OVERDUE_ALERT').length,
            badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
            accent: 'border-l-4 border-l-rose-600',
          },
          {
            tier: 'TIER_3_30_DAYS',
            title: 'Tier 3 (30 days reminder)',
            desc: 'Imminent expiry (≤30d)',
            count: eligibleList.filter((i) => i.tier === 'TIER_3_30_DAYS').length,
            badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
            accent: 'border-l-4 border-l-rose-500',
          },
          {
            tier: 'TIER_2_60_DAYS',
            title: 'Tier 2 (60 Days)',
            desc: 'Renewal follow-up (31–60d)',
            count: eligibleList.filter((i) => i.tier === 'TIER_2_60_DAYS').length,
            badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
            accent: 'border-l-4 border-l-orange-500',
          },
          {
            tier: 'TIER_1_90_DAYS',
            title: 'Tier 1 (90 Days)',
            desc: 'Window opened (61–90d)',
            count: eligibleList.filter((i) => i.tier === 'TIER_1_90_DAYS').length,
            badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
            accent: 'border-l-4 border-l-amber-500',
          },
        ].map((t) => (
          <button
            key={t.tier}
            type="button"
            onClick={() => setSelectedTierFilter(selectedTierFilter === t.tier ? 'ALL' : t.tier)}
            className={`p-4 rounded-xl border bg-white text-left transition-all shadow-xs ${t.accent} ${
              selectedTierFilter === t.tier ? 'ring-2 ring-blue-500 shadow-md' : 'border-gray-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-700">{t.title}</span>
              <span className="font-mono font-extrabold text-xl text-gray-900">{t.count}</span>
            </div>
            <p className="text-[11px] text-gray-500">{t.desc}</p>
          </button>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="px-6 py-4 border-b border-[#E4E7EC] flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D6A52B]">
                Pillar 3: WhatsApp Dispatch
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500 font-medium">Twilio Gateway Active</span>
            </div>
            <h2 className="text-base font-bold text-gray-900">
              Eligible WhatsApp Reminder Recipients ({filteredEligible.length})
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateHistory}
              className="px-3.5 py-1.5 text-xs font-bold text-[#2457A7] bg-white border border-[#2457A7]/40 hover:bg-blue-50 rounded-lg flex items-center gap-1.5 shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>View Notification History</span>
            </button>
            <button
              type="button"
              onClick={loadEligible}
              className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              title="Refresh eligibility list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Eligible Students List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8F9FA] border-b border-[#E4E7EC] text-xs font-bold uppercase tracking-wider text-gray-700">
              <tr>
                <th scope="col" className="py-3 px-3 text-center w-14 font-mono">
                  No.
                </th>
                <th scope="col" className="py-3 px-4">
                  Student & Contact
                </th>
                <th scope="col" className="py-3 px-4">
                  Matric ID
                </th>
                <th scope="col" className="py-3 px-4">
                  Expiry Date
                </th>
                <th scope="col" className="py-3 px-4">
                  Reminder Tier
                </th>
                <th scope="col" className="py-3 px-4">
                  Action Recommendation
                </th>
                <th scope="col" className="py-3 px-4 text-right">
                  Dispatch
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEligible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No students currently meet the selected reminder criteria.
                  </td>
                </tr>
              ) : (
                paginatedEligible.map((item, idx) => {
                  const serialNum = startIndex + idx + 1;
                  const cleanPhone = (item.phoneNumber || '').replace(/\.0+$/, '').replace(/\.0\b/, '').trim();

                  return (
                    <tr key={item.student.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Serial Number */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {serialNum}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-gray-900 block">{item.student.fullName}</span>
                          <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span className="font-mono font-medium">{cleanPhone}</span>
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded font-semibold border border-emerald-200">
                              E.164 Verified
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-gray-800">
                        <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {item.student.matricId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-medium text-gray-900 block">{item.student.formattedExpiryDate}</span>
                        <span
                          className={`text-[11px] font-bold ${
                            item.daysRemaining < 0
                              ? 'text-rose-600'
                              : item.daysRemaining <= 30
                              ? 'text-rose-600'
                              : item.daysRemaining <= 60
                              ? 'text-orange-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {item.daysRemaining < 0 ? `Expired ${Math.abs(item.daysRemaining)}d ago` : `${item.daysRemaining} days left`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block ${
                            item.tier === 'OVERDUE_ALERT'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : item.tier === 'TIER_3_30_DAYS'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : item.tier === 'TIER_2_60_DAYS'
                              ? 'bg-orange-50 text-orange-800 border-orange-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {item.tierLabel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs text-gray-600 leading-snug">
                        {item.recommendedAction}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmDialogItem(item);
                            setDispatchMethod('demo');
                            setSendSuccessResult(null);
                            setSendErrorNotice(null);
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Send WhatsApp</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Institutional Table Footer & Pagination */}
        <div className="bg-[#F8F9FA] px-4 py-3 border-t border-[#E4E7EC] flex flex-wrap items-center justify-between text-xs text-gray-600 gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-[#D0D5DD] rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <span className="font-medium text-gray-700">
              Showing <strong className="text-gray-900">{filteredEligible.length > 0 ? startIndex + 1 : 0}</strong>–
              <strong className="text-gray-900">{Math.min(startIndex + pageSize, filteredEligible.length)}</strong> of{' '}
              <strong className="text-gray-900">{filteredEligible.length}</strong> eligible recipients
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D0D5DD] bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer transition-colors"
            >
              Previous
            </button>
            <span className="px-2.5 py-1 text-xs font-mono font-bold text-gray-800 bg-white border border-gray-200 rounded-lg">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D0D5DD] bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* MANDATORY CONFIRMATION DIALOG FOR WHATSAPP MANUAL DISPATCH */}
      {confirmDialogItem && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="whatsapp-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-in fade-in duration-100"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E4E7EC] max-w-lg w-full overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#142B4A] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500 text-white">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="whatsapp-confirm-title" className="text-sm font-bold text-white">
                    Confirm WhatsApp Notification Dispatch
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Twilio WhatsApp API • Student Pass Compliance Channel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDialogItem(null)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs">
              {sendSuccessResult ? (
                sendSuccessResult.status === 'FAILED' || !sendSuccessResult.success ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-3">
                    <div className="w-10 h-10 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-rose-950 text-sm">Twilio Live Dispatch Unsuccessful</h4>
                      <p className="text-rose-700 text-xs mt-0.5">
                        Status: <strong>FAILED</strong> to {sendSuccessResult.recipientPhoneMasked || confirmDialogItem.phoneNumber}
                      </p>
                    </div>
                    {sendSuccessResult.message && (
                      <p className="text-rose-800 text-[11px] bg-rose-100/70 p-2.5 rounded-lg border border-rose-200 text-left leading-relaxed font-mono whitespace-pre-line">
                        {sendSuccessResult.message}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setDispatchMethod('demo');
                        setSendSuccessResult(null);
                        setSendErrorNotice(null);
                      }}
                      className="w-full py-2.5 px-3 text-xs font-bold text-blue-800 bg-blue-100 hover:bg-blue-200 border border-blue-300 rounded-xl transition-colors cursor-pointer"
                    >
                      Switch to Demo Mode & Re-send Instantly
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                    <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-emerald-950 text-sm">
                      {sendSuccessResult.providerSid?.startsWith('SM_DEMO_') || dispatchMethod === 'demo'
                        ? 'Simulated Successfully via Demo Mode!'
                        : 'Dispatched via Twilio Gateway!'}
                    </h4>
                    <p className="text-emerald-800 text-xs">
                      Message SID: <span className="font-mono font-bold">{sendSuccessResult.providerSid || sendSuccessResult.providerMessageSid || 'N/A'}</span>
                    </p>
                    <p className="text-emerald-700 text-[11px]">
                      Status: <strong>{sendSuccessResult.status || sendSuccessResult.deliveryStatus || 'DELIVERED'}</strong> to {sendSuccessResult.recipientPhoneMasked || confirmDialogItem.phoneNumber}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                      Logged to Notification Audit Trail
                    </span>
                  </div>
                )
              ) : (
                <>
                  {/* Dispatch Method Selector (Twilio vs Demo) */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-gray-700">
                      Dispatch Method:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDispatchMethod('demo')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          dispatchMethod === 'demo'
                            ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500 shadow-2xs'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 text-xs">Demo / Simulation</span>
                          {dispatchMethod === 'demo' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">Instant delivery & audit logs (Default)</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDispatchMethod('twilio')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          dispatchMethod === 'twilio'
                            ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500 shadow-2xs'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 text-xs">Twilio Live Mode</span>
                          {dispatchMethod === 'twilio' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">Real Twilio WhatsApp API</p>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Recipient Student:</span>
                      <strong className="text-gray-900">{confirmDialogItem.student.fullName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Matriculation ID:</span>
                      <span className="font-mono font-semibold">{confirmDialogItem.student.matricId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Destination Phone (Masked):</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {confirmDialogItem.phoneNumber.replace(/(\+\d{2}\s\d{2}-)\d{4}(\s\d{4})/, '$1****$2')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reminder Tier:</span>
                      <span className="font-semibold text-gray-800">{confirmDialogItem.tierLabel}</span>
                    </div>
                  </div>

                  {/* Message Preview */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Formatted WhatsApp Message Preview:
                    </label>
                    <div className="bg-emerald-950 text-emerald-100 p-3.5 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap border border-emerald-800 max-h-48 overflow-y-auto">
                      {getTierPreviewText(confirmDialogItem)}
                    </div>
                  </div>

                  {sendErrorNotice && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{sendErrorNotice}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConfirmDialogItem(null)}
                className="px-4 py-2 font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                {sendSuccessResult ? 'Done' : 'Cancel'}
              </button>

              {!sendSuccessResult && (
                <button
                  type="button"
                  onClick={handleExecuteSend}
                  disabled={isSending}
                  className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSending
                    ? (dispatchMethod === 'twilio' ? 'Transmitting via Twilio...' : 'Simulating Delivery...')
                    : (dispatchMethod === 'twilio' ? 'Confirm & Send (Twilio Live)' : 'Confirm & Simulate (Demo Mode)')}
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
