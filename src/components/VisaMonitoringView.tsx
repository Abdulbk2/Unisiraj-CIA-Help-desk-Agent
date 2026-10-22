/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  RefreshCw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { ProcessedStudent } from '../types/student';
import { SummaryMetrics } from '../types/student';
import { StudentVisaTable } from './StudentVisaTable';
import { apiClient } from '../lib/api/client';

interface VisaMonitoringViewProps {
  students: ProcessedStudent[];
  metrics: SummaryMetrics;
  onViewStudent: (student: ProcessedStudent) => void;
  onEditStudent?: (student: ProcessedStudent) => void;
  onInitiateFollowup: (student: ProcessedStudent) => void;
  onScheduleCalendar: (student: ProcessedStudent) => void;
  onRefreshData: () => void;
}

export const VisaMonitoringView: React.FC<VisaMonitoringViewProps> = ({
  students,
  metrics,
  onViewStudent,
  onEditStudent,
  onInitiateFollowup,
  onScheduleCalendar,
  onRefreshData,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await apiClient.triggerDailySync();
      setSyncMessage(res.message);
      onRefreshData();
    } catch (err: any) {
      setSyncMessage(err.message || 'Sync execution failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pillar 2 Scheduled Synchronization Banner */}
      <div className="p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D6A52B]">
              Pillar 2: Automated Monitoring
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Daily Cloud Run Cron Job Active
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Daily Student Pass Expiry Synchronisation
          </h2>
          <p className="text-xs text-gray-500 max-w-2xl">
            Calculates exact calendar days remaining for every international student against midnight local time. Assigns compliance tiers and schedules automated WhatsApp reminders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={isSyncing}
            className="px-4 py-2 text-xs font-bold text-white bg-[#2457A7] hover:bg-[#1E3A5F] rounded-xl flex items-center gap-2 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronising Passes...' : 'Trigger Manual Sync Now'}</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* 90-60-30 Escalation Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/40 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Critical & Overstay
            </span>
            <span className="p-1 rounded bg-rose-200/60 text-rose-800 font-mono text-xs font-bold">
              &lt; 30d
            </span>
          </div>
          <p className="text-3xl font-extrabold text-rose-700 font-mono">
            {metrics.criticalCases}
          </p>
          <p className="text-xs text-rose-900/80 leading-snug">
            Immediate action: {metrics.expiredVisas} expired passes. Tier 3 WhatsApp notice and Putrajaya Special Pass liaison.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-orange-200 bg-orange-50/40 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800">
              Urgent Follow-up
            </span>
            <span className="p-1 rounded bg-orange-200/60 text-orange-800 font-mono text-xs font-bold">
              30–59d
            </span>
          </div>
          <p className="text-3xl font-extrabold text-orange-700 font-mono">
            {metrics.urgentCases}
          </p>
          <p className="text-xs text-orange-900/80 leading-snug">
            Tier 2 WhatsApp notice: Required submission of academic transcript and EMGS medical screening results.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Renewal Window Opened
            </span>
            <span className="p-1 rounded bg-amber-200/60 text-amber-800 font-mono text-xs font-bold">
              60–90d
            </span>
          </div>
          <p className="text-3xl font-extrabold text-amber-700 font-mono">
            {metrics.expiringIn90Days}
          </p>
          <p className="text-xs text-amber-900/80 leading-snug">
            Tier 1 WhatsApp notice: Advise passport renewal if validity is under 18 months. Initial document checklist.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Fully Compliant
            </span>
            <span className="p-1 rounded bg-emerald-200/60 text-emerald-800 font-mono text-xs font-bold">
              &gt; 90d
            </span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-700 font-mono">
            {metrics.safeVisas}
          </p>
          <p className="text-xs text-emerald-900/80 leading-snug">
            Regular student pass status. Next automated audit milestone queued for the 90-day threshold.
          </p>
        </div>
      </div>

      {/* Critical Watchlist Table */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC]">
          <div>
            <h3 className="font-bold text-gray-900 text-base">
              Priority Compliance Watchlist (Critical & Urgent Cases)
            </h3>
            <p className="text-xs text-gray-500">
              Filtered for students with less than 60 days remaining or expired passes.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
            {students.filter((s) => s.daysRemaining < 60).length} Cases
          </span>
        </div>

        <StudentVisaTable
          students={students.filter((s) => s.daysRemaining < 60)}
          sortField="daysRemaining"
          sortOrder="asc"
          onSortChange={() => {}}
          onViewDetails={onViewStudent}
          onReviewVisa={onViewStudent}
          onInitiateFollowup={onInitiateFollowup}
          onScheduleCalendar={onScheduleCalendar}
          onEditStudent={onEditStudent}
          onResetFilters={() => {}}
        />
      </div>
    </div>
  );
};
