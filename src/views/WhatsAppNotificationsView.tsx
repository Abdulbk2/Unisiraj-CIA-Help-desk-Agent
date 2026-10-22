/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Phone,
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { ProcessedStudent, ReminderTier, SendWhatsAppPayload } from '../lib/api/types';
import { NotificationsApi } from '../lib/api/notifications';

interface WhatsAppNotificationsViewProps {
  students: ProcessedStudent[];
  onSelectStudent: (student: ProcessedStudent) => void;
  onRefreshHistory: () => void;
  isDemoMode: boolean;
}

export const WhatsAppNotificationsView: React.FC<WhatsAppNotificationsViewProps> = ({
  students,
  onSelectStudent,
  onRefreshHistory,
  isDemoMode,
}) => {
  const [selectedTierFilter, setSelectedTierFilter] = useState<'ALL' | 'TIER_1' | 'TIER_2' | 'TIER_3'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation Dialog state (Mandatory per Section 10)
  const [studentToMessage, setStudentToMessage] = useState<ProcessedStudent | null>(null);
  const [selectedTier, setSelectedTier] = useState<ReminderTier>('TIER_3_30_DAYS');
  const [customDraft, setCustomDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);

  // Eligible students categorized into tiers (within 90 days)
  const eligibleStudents = students.filter((s) => {
    if (s.daysRemaining > 90) return false;

    if (selectedTierFilter === 'TIER_1') return s.daysRemaining >= 61 && s.daysRemaining <= 90;
    if (selectedTierFilter === 'TIER_2') return s.daysRemaining >= 31 && s.daysRemaining <= 60;
    if (selectedTierFilter === 'TIER_3') return s.daysRemaining <= 30;

    return true;
  }).filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.matricId.toLowerCase().includes(q);
  });

  const getTierForStudent = (daysRemaining: number): { tier: ReminderTier; label: string; desc: string; badgeColor: string } => {
    if (daysRemaining <= 30) {
      return {
        tier: 'TIER_3_30_DAYS',
        label: 'Tier 3 (1 Month / Urgent)',
        desc: 'Overstay risk warning & RM1,100–RM3,100 compound caution',
        badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      };
    }
    if (daysRemaining <= 60) {
      return {
        tier: 'TIER_2_60_DAYS',
        label: 'Tier 2 (2 Months / Follow-up)',
        desc: 'Submit EMGS application & academic results without delay',
        badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
      };
    }
    return {
      tier: 'TIER_1_90_DAYS',
      label: 'Tier 1 (3 Months / Window Open)',
      desc: 'Early renewal advisory & document preparation checklist',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  };

  const openSendModal = (student: ProcessedStudent) => {
    const tierInfo = getTierForStudent(student.daysRemaining);
    setStudentToMessage(student);
    setSelectedTier(tierInfo.tier);
    setSendSuccessMessage(null);
    setSendErrorMessage(null);

    const template =
      tierInfo.tier === 'TIER_3_30_DAYS'
        ? `[UniSIRAJ CIA URGENT ALERT]
Dear ${student.fullName} (${student.matricId}),
Your Malaysian Student Pass expires in ${student.daysRemaining} days (${student.formattedExpiryDate}).
Malaysian Immigration regulations impose strict compound penalties of RM1,100 to RM3,100 for overstaying, with compulsory court/immigration appearances and exit bans.
Please attend the CIA Helpdesk (Level 2, Tuanku Syed Sirajuddin Administration Complex) immediately.`
        : tierInfo.tier === 'TIER_2_60_DAYS'
        ? `[UniSIRAJ CIA Follow-up Reminder]
Dear ${student.fullName} (${student.matricId}),
Your Student Pass expires in ${student.daysRemaining} days (${student.formattedExpiryDate}).
Please complete and submit your EMGS renewal documents (certified results slip, passport copy, medical clearance) to the International Office without further delay.`
        : `[UniSIRAJ CIA Early Advisory]
Dear ${student.fullName} (${student.matricId}),
Your 3-month renewal window has officially opened. Your pass expires on ${student.formattedExpiryDate} (${student.daysRemaining} days).
Please verify your passport validity exceeds 18 months and begin preparing renewal documentation.`;

    setCustomDraft(template);
  };

  const handleExecuteSend = async () => {
    if (!studentToMessage) return;

    setIsSending(true);
    setSendErrorMessage(null);
    setSendSuccessMessage(null);

    const payload: SendWhatsAppPayload = {
      studentId: studentToMessage.id,
      tier: selectedTier,
      customNote: customDraft,
    };

    try {
      const res = await NotificationsApi.sendWhatsApp(payload);
      setSendSuccessMessage(
        `Dispatched via Twilio WhatsApp Gateway! Provider SID: ${res.providerSid || 'SM-Live-Acknowledged'}`
      );
      onRefreshHistory();
      setTimeout(() => {
        setStudentToMessage(null);
        setSendSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      setSendErrorMessage(err.message || 'Failed to dispatch WhatsApp message via backend API.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pillar 3 Header */}
      <div className="bg-white rounded-xl border border-[#E4E7EC] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
              Pillar 3: Tiered WhatsApp Reminders
            </span>
            <span className="text-xs text-[#667085]">• Recommended 90-Day Renewal Window</span>
          </div>
          <h2 className="text-xl font-bold text-[#142B4A] tracking-tight mt-1">
            WhatsApp Notifications
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            Twilio Gateway Ready
          </span>
        </div>
      </div>

      {/* 3 Tier Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-amber-900 tracking-wider">
              Tier 1: 3 Months (≤ 90 Days)
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xs text-amber-950 font-semibold">Early Window Advisory</p>
          <p className="text-[11px] text-amber-800/90 leading-snug">
            Notifies student that the renewal window has opened. Advises document preparation and passport validity checks.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-orange-900 tracking-wider">
              Tier 2: 2 Months (≤ 60 Days)
            </span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-xs text-orange-950 font-semibold">Renewal Follow-up</p>
          <p className="text-[11px] text-orange-800/90 leading-snug">
            Follow-up reminder to complete and submit renewal application through EMGS without further delay.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-rose-900 tracking-wider">
              Tier 3 (30 days reminder)
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xs text-rose-950 font-semibold">Final Reminder</p>
          <p className="text-[11px] text-rose-800/90 leading-snug">
            Warning highlighting imminent expiry, immigration compounding fines (RM1,100–RM3,100), and exit restrictions.
          </p>
        </div>
      </div>

      {/* Eligible Students Table */}
      <div className="bg-white rounded-xl border border-[#E4E7EC] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E4E7EC]">
          <div>
            <h3 className="font-bold text-sm text-[#142B4A]">
              Active Notification Pipeline ({eligibleStudents.length} Eligible Students)
            </h3>
            <p className="text-xs text-[#667085]">
              Students within the 90-day compliance window eligible for automated or authorized manual WhatsApp dispatch.
            </p>
          </div>

          <div className="w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student or matric..."
              className="w-full bg-[#F5F6F8] border border-[#E4E7EC] rounded-lg px-3 py-1.5 text-xs text-[#182230] focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Tier filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
          <span className="font-semibold text-[#667085] mr-1">Filter by Tier:</span>
          {[
            { key: 'ALL', label: 'All Active Tiers' },
            { key: 'TIER_3', label: 'Tier 3 (30 days reminder)' },
            { key: 'TIER_2', label: 'Tier 2 (31–60 Days)' },
            { key: 'TIER_1', label: 'Tier 1 (61–90 Days)' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedTierFilter(tab.key as any)}
              className={`px-3 py-1 rounded-lg font-medium border transition-colors cursor-pointer ${
                selectedTierFilter === tab.key
                  ? 'bg-[#142B4A] text-white border-[#142B4A] font-bold shadow-2xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-lg border border-[#E4E7EC] overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#E4E7EC] text-[10px] font-bold uppercase text-[#667085]">
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Matric ID</th>
                <th className="py-3 px-3">Destination WhatsApp</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3 text-center">Assigned Tier</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {eligibleStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No students currently match the selected reminder tier.
                  </td>
                </tr>
              ) : (
                eligibleStudents.map((st) => {
                  const tier = getTierForStudent(st.daysRemaining);
                  return (
                    <tr key={st.id} className="hover:bg-blue-50/30">
                      <td className="py-3 px-3 font-semibold text-[#182230]">
                        <button
                          type="button"
                          onClick={() => onSelectStudent(st)}
                          className="hover:text-[#2457A7] hover:underline text-left cursor-pointer"
                        >
                          {st.fullName}
                        </button>
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-[#667085]">{st.matricId}</td>
                      <td className="py-3 px-3 font-mono text-gray-800 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{st.phoneNumber}</span>
                      </td>
                      <td className="py-3 px-3 font-medium">
                        {st.formattedExpiryDate} ({st.daysRemaining}d)
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${tier.badgeColor}`}
                        >
                          {tier.label.split('/')[0]}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => openSendModal(st)}
                          className="px-3 py-1 font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Dispatch Alert</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog before sending */}
      {studentToMessage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-whatsapp-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs animate-in fade-in duration-100"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-700">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="confirm-whatsapp-title" className="text-sm font-bold text-[#142B4A]">
                    Confirm WhatsApp Notification Dispatch
                  </h3>
                  <p className="text-xs text-[#667085]">
                    Authorized transmission via Twilio WhatsApp Gateway
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStudentToMessage(null)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#F5F6F8] rounded-xl p-3.5 text-xs space-y-1.5 border border-[#E4E7EC]">
              <div className="flex justify-between">
                <span className="text-[#667085]">Student Name:</span>
                <strong className="text-[#142B4A]">{studentToMessage.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Matriculation ID:</span>
                <strong className="font-mono text-[#142B4A]">{studentToMessage.matricId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Destination Phone:</span>
                <strong className="font-mono text-emerald-700">{studentToMessage.phoneNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Assigned Reminder Tier:</span>
                <strong className="text-[#142B4A]">
                  {selectedTier === 'TIER_1_90_DAYS'
                    ? 'Tier 1 (90-Day Early Window)'
                    : selectedTier === 'TIER_2_60_DAYS'
                    ? 'Tier 2 (60-Day Renewal Window)'
                    : 'Tier 3 (30-Day Urgent Window)'}
                </strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#142B4A]">
                Message Preview (Editable Template):
              </label>
              <textarea
                rows={5}
                value={customDraft}
                onChange={(e) => setCustomDraft(e.target.value)}
                className="w-full p-3 rounded-lg border border-[#E4E7EC] bg-white font-mono text-xs text-[#182230] leading-relaxed focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {sendSuccessMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{sendSuccessMessage}</span>
              </div>
            )}

            {sendErrorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{sendErrorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStudentToMessage(null)}
                disabled={isSending}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSend}
                disabled={isSending}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting to Twilio...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Send Alert</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
