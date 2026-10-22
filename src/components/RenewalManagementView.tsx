/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  RefreshCw,
  FileCheck2,
  Fingerprint,
  Calendar,
  AlertTriangle,
  Clock,
  Download,
  Send,
  Building,
} from 'lucide-react';
import { ProcessedStudent } from '../types/student';
import { StudentVisaTable } from './StudentVisaTable';

interface RenewalManagementViewProps {
  students: ProcessedStudent[];
  onViewStudent: (student: ProcessedStudent) => void;
  onInitiateFollowup: (student: ProcessedStudent) => void;
  onScheduleCalendar: (student: ProcessedStudent) => void;
  onExportCSV: () => void;
  onEditStudent?: (student: ProcessedStudent) => void;
}

export const RenewalManagementView: React.FC<RenewalManagementViewProps> = ({
  students,
  onViewStudent,
  onInitiateFollowup,
  onScheduleCalendar,
  onExportCSV,
  onEditStudent,
}) => {
  const [selectedStage, setSelectedStage] = useState<string>('ALL');

  const renewalQueue = students.filter(
    (s) => s.status === 'CRITICAL' || s.status === 'URGENT' || s.status === 'ACTION_NEEDED'
  );

  const filteredQueue = renewalQueue.filter((s) => {
    if (selectedStage === 'ALL') return true;
    return s.emgsStatus === selectedStage;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D6A52B]">
              EMGS & Immigration Liaison
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-blue-700 font-semibold">Active Renewal Cohort</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Student Pass Renewal & EMGS Milestone Pipeline
          </h2>
          <p className="text-xs text-gray-500 max-w-2xl">
            Track EMGS submission percentages, medical clearance status, passport endorsement appointments, and group renewal clinics.
          </p>
        </div>

        <button
          type="button"
          onClick={onExportCSV}
          className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl flex items-center gap-2 shadow-2xs"
        >
          <Download className="w-4 h-4 text-gray-500" />
          <span>Export Renewal Manifest</span>
        </button>
      </div>

      {/* Stage Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            stage: 'ALL',
            label: 'Total Renewal Queue',
            count: renewalQueue.length,
            desc: 'Passes expiring within 90 days',
            color: 'border-l-blue-600',
          },
          {
            stage: 'Requires Biometrics',
            label: 'Biometrics Pending',
            count: renewalQueue.filter((s) => s.emgsStatus === 'Requires Biometrics').length,
            desc: 'State immigration fingerprinting',
            color: 'border-l-rose-500',
          },
          {
            stage: 'Pending Documents',
            label: 'Document Rectification',
            count: renewalQueue.filter((s) => s.emgsStatus === 'Pending Documents').length,
            desc: 'Results slips, attendance records',
            color: 'border-l-amber-500',
          },
          {
            stage: 'In Progress',
            label: 'EMGS Processing (35-70%)',
            count: renewalQueue.filter((s) => s.emgsStatus === 'In Progress').length,
            desc: 'Under active EMGS review',
            color: 'border-l-emerald-500',
          },
        ].map((item) => (
          <button
            key={item.stage}
            type="button"
            onClick={() => setSelectedStage(item.stage)}
            className={`p-4 rounded-xl border bg-white text-left transition-all shadow-xs border-l-4 ${item.color} ${
              selectedStage === item.stage ? 'ring-2 ring-blue-500 shadow-md' : 'border-gray-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-gray-700">{item.label}</span>
              <span className="font-mono font-extrabold text-xl text-gray-900">{item.count}</span>
            </div>
            <p className="text-[11px] text-gray-500">{item.desc}</p>
          </button>
        ))}
      </div>

      {/* Renewal Queue Table */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC]">
          <div>
            <h3 className="font-bold text-gray-900 text-base">
              Renewal Pipeline Records ({filteredQueue.length})
            </h3>
            <p className="text-xs text-gray-500">
              Students prioritized by nearest visa expiry date.
            </p>
          </div>
          <span className="text-xs text-gray-500">
            Filter: <strong>{selectedStage === 'ALL' ? 'All Renewal Stages' : selectedStage}</strong>
          </span>
        </div>

        <StudentVisaTable
          students={filteredQueue}
          sortField="daysRemaining"
          sortOrder="asc"
          onSortChange={() => {}}
          onViewDetails={onViewStudent}
          onReviewVisa={onViewStudent}
          onInitiateFollowup={onInitiateFollowup}
          onScheduleCalendar={onScheduleCalendar}
          onResetFilters={() => setSelectedStage('ALL')}
          onEditStudent={onEditStudent}
        />
      </div>
    </div>
  );
};
