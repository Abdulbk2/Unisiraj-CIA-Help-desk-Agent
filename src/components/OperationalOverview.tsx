/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, Clock, Database, Download, Plus, CheckCircle2 } from 'lucide-react';
import { SummaryMetrics } from '../types/student';

interface OperationalOverviewProps {
  metrics: SummaryMetrics;
  onFilterExpired: () => void;
  onFilterCritical: () => void;
  onExportCSV: () => void;
  onAddNewStudent: () => void;
}

export const OperationalOverview: React.FC<OperationalOverviewProps> = ({
  metrics,
  onFilterExpired,
  onFilterCritical,
  onExportCSV,
  onAddNewStudent,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E4E7EC] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
      {/* Operational Highlights */}
      <div className="flex flex-wrap items-center gap-5 sm:gap-8">
        {/* Expired Visas Count */}
        <button
          type="button"
          onClick={onFilterExpired}
          className="flex items-center gap-3 group text-left cursor-pointer"
          title="Click to view expired student visas"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 group-hover:bg-rose-100 transition-colors shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[#667085] block text-[13px] font-semibold">Expired Visas</span>
            <span className="text-[17px] sm:text-lg font-extrabold text-rose-700 leading-tight">
              {metrics.expiredVisas} {metrics.expiredVisas === 1 ? 'Record' : 'Records'}
            </span>
          </div>
        </button>

        <div className="hidden sm:block h-8 w-[1px] bg-[#E4E7EC]" />

        {/* Expiring in 30 Days Count */}
        <button
          type="button"
          onClick={onFilterCritical}
          className="flex items-center gap-3 group text-left cursor-pointer"
          title="Click to view visas expiring in 30 days"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:bg-amber-100 transition-colors shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[#667085] block text-[13px] font-semibold">Expiring ≤ 30 Days</span>
            <span className="text-[17px] sm:text-lg font-extrabold text-[#182230] leading-tight">
              {metrics.criticalCases} Active Cases
            </span>
          </div>
        </button>

        <div className="hidden sm:block h-8 w-[1px] bg-[#E4E7EC]" />

        {/* Dataset Freshness indicator */}
        <div className="flex items-center gap-3 text-[#667085]">
          <Database className="w-5 h-5 text-[#2457A7] shrink-0" />
          <div>
            <span className="text-[13px] block font-semibold text-gray-500">Dataset State</span>
            <span className="text-[15px] font-bold text-[#182230] inline-flex items-center gap-1.5 leading-tight">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Institutional Registry
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action buttons */}
      <div className="flex items-center gap-3 ml-auto">
        <button
          type="button"
          onClick={onExportCSV}
          className="px-4 py-2 text-[14.5px] sm:text-[15px] font-semibold text-[#182230] bg-white border border-[#E4E7EC] hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#667085]" />
          <span>Export CSV</span>
        </button>
        <button
          type="button"
          onClick={onAddNewStudent}
          className="px-4 py-2 text-[14.5px] sm:text-[15px] font-bold text-white bg-[#2457A7] hover:bg-[#1e4685] rounded-xl transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Student</span>
        </button>
      </div>
    </div>
  );
};
