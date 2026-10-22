/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BarChart3,
  Download,
  CheckCircle2,
  PieChart,
  Globe,
  Building2,
  FileSpreadsheet,
  Award,
  BookOpen,
} from 'lucide-react';
import { ProcessedStudent, SummaryMetrics } from '../types/student';

interface ReportsAnalyticsViewProps {
  students: ProcessedStudent[];
  metrics: SummaryMetrics;
  onExportCSV: () => void;
}

export const ReportsAnalyticsView: React.FC<ReportsAnalyticsViewProps> = ({
  students,
  metrics,
  onExportCSV,
}) => {
  const complianceRate =
    students.length > 0
      ? Math.round(((students.length - metrics.criticalCases) / students.length) * 100)
      : 100;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D6A52B]">
              Institutional Governance
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-blue-700 font-semibold">Senate & CIA Audit Ready</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Visa Compliance Analytics & Audit Reports
          </h2>
          <p className="text-xs text-gray-500 max-w-2xl">
            Statistical distribution of Student Pass validity across academic faculties, nationalities, and automated WhatsApp delivery performance.
          </p>
        </div>

        <button
          type="button"
          onClick={onExportCSV}
          className="px-4 py-2 text-xs font-bold text-white bg-[#2457A7] hover:bg-[#1E3A5F] rounded-xl flex items-center gap-2 shadow-2xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Full Compliance CSV</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Overall Compliance Rate
          </span>
          <p className="text-3xl font-extrabold text-emerald-700 font-mono">{complianceRate}%</p>
          <p className="text-[11px] text-emerald-900/80">
            {students.length - metrics.criticalCases} out of {students.length} students have valid, non-critical passes.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
            WhatsApp Delivery Rate
          </span>
          <p className="text-3xl font-extrabold text-[#2457A7] font-mono">92%</p>
          <p className="text-[11px] text-blue-900/80">
            Direct-to-handset verification via Twilio WhatsApp Gateway with E.164 verification.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
            Estimated Overstay Penalties Prevented
          </span>
          <p className="text-3xl font-extrabold text-amber-700 font-mono">RM 24,800</p>
          <p className="text-[11px] text-amber-900/80">
            Based on Malaysian Immigration compound range of RM1,100 to RM3,100 per overstay incidence.
          </p>
        </div>
      </div>

      {/* Analytics Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faculty Compliance */}
        <div className="p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Building2 className="w-4 h-4 text-[#2457A7]" />
            <h3 className="font-bold text-gray-900 text-sm">Compliance Rate by Academic Faculty</h3>
          </div>

          <div className="space-y-3.5 text-xs">
            {[
              { faculty: 'Faculty of Islamic Economics & Business', compliant: 88, color: 'bg-emerald-500' },
              { faculty: 'Faculty of Shariah & Law', compliant: 65, color: 'bg-amber-500' },
              { faculty: 'Faculty of Quranic & Islamic Studies', compliant: 92, color: 'bg-emerald-500' },
              { faculty: 'Faculty of Computing & Informatics', compliant: 75, color: 'bg-blue-500' },
              { faculty: 'Faculty of Food Science & Technology', compliant: 100, color: 'bg-emerald-500' },
              { faculty: 'Faculty of Human Sciences', compliant: 80, color: 'bg-emerald-500' },
            ].map((f) => (
              <div key={f.faculty} className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-800">{f.faculty}</span>
                  <span className="font-mono text-gray-900">{f.compliant}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${f.color} rounded-full`} style={{ width: `${f.compliant}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* International Student Country of Origin */}
        <div className="p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Globe className="w-4 h-4 text-[#2457A7]" />
            <h3 className="font-bold text-gray-900 text-sm">International Student Enrolment by Country</h3>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { country: 'Yemen', flag: '🇾🇪', count: 2, pct: '14%' },
              { country: 'Nigeria', flag: '🇳🇬', count: 2, pct: '14%' },
              { country: 'Indonesia', flag: '🇮🇩', count: 2, pct: '14%' },
              { country: 'China', flag: '🇨🇳', count: 1, pct: '7%' },
              { country: 'Egypt', flag: '🇪🇬', count: 1, pct: '7%' },
              { country: 'Pakistan', flag: '🇵🇰', count: 1, pct: '7%' },
              { country: 'Bangladesh', flag: '🇧🇩', count: 1, pct: '7%' },
              { country: 'Algeria', flag: '🇩🇿', count: 1, pct: '7%' },
              { country: 'Kazakhstan', flag: '🇰🇿', count: 1, pct: '7%' },
              { country: 'Sudan', flag: '🇸🇩', count: 1, pct: '7%' },
              { country: 'Saudi Arabia', flag: '🇸🇦', count: 1, pct: '7%' },
              { country: 'Brunei', flag: '🇧🇳', count: 1, pct: '7%' },
            ].map((c) => (
              <div key={c.country} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100">
                <span className="flex items-center gap-2">
                  <span className="text-base">{c.flag}</span>
                  <span className="font-semibold text-gray-800">{c.country}</span>
                </span>
                <span className="font-mono text-gray-600 font-bold">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
