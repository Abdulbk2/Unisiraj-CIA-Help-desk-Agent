/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, CalendarClock, AlertTriangle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { SummaryMetrics } from '../types/student';

interface MetricCardsProps {
  metrics: SummaryMetrics;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  metrics,
  activeFilter,
  onSelectFilter,
}) => {
  const cards = [
    {
      id: 'active',
      title: 'Total Active Visas',
      value: metrics.totalActiveVisas,
      filterKey: 'ALL',
      description: 'Currently valid student visas.',
      icon: ShieldCheck,
      iconBg: 'bg-blue-50 text-blue-700 border-blue-200',
      borderAccent: 'hover:border-blue-300 focus-visible:ring-blue-500',
      highlightBadge: `${metrics.safeVisas} fully safe (>90d)`,
      highlightColor: 'bg-blue-100/70 text-blue-800',
    },
    {
      id: 'expiring90',
      title: 'Action Needed (60–90d)',
      value: metrics.expiringIn90Days,
      filterKey: 'ACTION_NEEDED',
      description: 'Tier 1 renewal planning (60–90 days).',
      icon: CalendarClock,
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
      borderAccent: 'hover:border-amber-300 focus-visible:ring-amber-500',
      highlightBadge: 'Escalation Tier 1',
      highlightColor: 'bg-amber-100/80 text-amber-900',
    },
    {
      id: 'urgent',
      title: 'Urgent Cases (30–59d)',
      value: metrics.urgentCases,
      filterKey: 'URGENT',
      description: 'Tier 2 priority follow-up (30–59 days).',
      icon: AlertTriangle,
      iconBg: 'bg-orange-50 text-orange-700 border-orange-200',
      borderAccent: 'hover:border-orange-300 focus-visible:ring-orange-500',
      highlightBadge: 'Priority Follow-up',
      highlightColor: 'bg-orange-100/80 text-orange-900',
    },
    {
      id: 'critical',
      title: 'Critical Action Needed (<30d)',
      value: metrics.criticalCases,
      filterKey: 'CRITICAL',
      description: 'Immediate review required (<30d & expired).',
      icon: AlertCircle,
      iconBg: 'bg-rose-50 text-rose-700 border-rose-200',
      borderAccent: 'hover:border-rose-300 focus-visible:ring-rose-500',
      highlightBadge: metrics.expiredVisas > 0 ? `${metrics.expiredVisas} expired` : 'Needs Action',
      highlightColor: 'bg-rose-100/90 text-rose-900 font-semibold',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected =
          (card.filterKey === 'ALL' && activeFilter === 'ALL') ||
          (card.filterKey !== 'ALL' && activeFilter === card.filterKey);

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectFilter(card.filterKey)}
            aria-pressed={isSelected}
            className={`text-left relative bg-white p-5 rounded-xl border transition-all duration-150 shadow-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isSelected
                ? 'border-[#2457A7] ring-2 ring-[#2457A7]/30 shadow-md bg-blue-50/20'
                : 'border-[#E4E7EC] hover:shadow-sm'
            } ${card.borderAccent}`}
          >
            <div className="flex items-start justify-between gap-3 mb-3.5">
              <div
                className={`p-3 rounded-xl border ${card.iconBg} flex items-center justify-center shrink-0`}
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
              </div>
              <span
                className={`text-[13px] px-2.5 py-1 rounded-lg font-bold tracking-wide ${card.highlightColor}`}
              >
                {card.highlightBadge}
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="block text-[15px] sm:text-[16px] font-bold text-gray-700 tracking-tight">
                {card.title}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-4xl sm:text-[38px] font-extrabold text-gray-900 tracking-tight leading-none">
                  {card.value}
                </span>
                <span className="text-sm text-blue-700 font-bold flex items-center gap-1 opacity-90 hover:opacity-100">
                  Filter <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <p className="text-[14px] sm:text-[14.5px] text-gray-600 pt-1 leading-relaxed">
                {card.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
