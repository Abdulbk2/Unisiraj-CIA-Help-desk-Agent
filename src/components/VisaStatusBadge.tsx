/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Clock, AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react';
import { VisaStatusLevel } from '../types/student';

interface VisaStatusBadgeProps {
  status: VisaStatusLevel;
  daysRemaining: number;
  isExpired?: boolean;
  isExpiringToday?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showSublabel?: boolean;
}

export const VisaStatusBadge: React.FC<VisaStatusBadgeProps> = ({
  status,
  daysRemaining,
  isExpired = false,
  isExpiringToday = false,
  size = 'md',
  showSublabel = true,
}) => {
  let config: {
    bg: string;
    text: string;
    border: string;
    icon: React.ReactNode;
    primaryLabel: string;
    sublabel: string;
    accessibleDesc: string;
  };

  if (isExpired) {
    const daysAgo = Math.abs(daysRemaining);
    config = {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-300',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
      primaryLabel: 'Action needed',
      sublabel: `Expired ${daysAgo}d ago`,
      accessibleDesc: `Action needed: Student visa expired ${daysAgo} days ago`,
    };
  } else if (isExpiringToday) {
    config = {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-300',
      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 animate-pulse" />,
      primaryLabel: 'Action needed',
      sublabel: 'Expires Today',
      accessibleDesc: 'Action needed: Student visa expires today',
    };
  } else {
    switch (status) {
      case 'CRITICAL':
        config = {
          bg: 'bg-rose-50',
          text: 'text-rose-800',
          border: 'border-rose-200',
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
          primaryLabel: 'Action needed',
          sublabel: `${daysRemaining}d remaining`,
          accessibleDesc: `Action needed: ${daysRemaining} days remaining (fewer than 30 days)`,
        };
        break;
      case 'URGENT':
        config = {
          bg: 'bg-orange-50',
          text: 'text-orange-900',
          border: 'border-orange-200',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />,
          primaryLabel: 'Urgent',
          sublabel: `${daysRemaining}d remaining`,
          accessibleDesc: `Urgent status: ${daysRemaining} days remaining (30 to 59 days)`,
        };
        break;
      case 'ACTION_NEEDED':
        config = {
          bg: 'bg-amber-50',
          text: 'text-amber-900',
          border: 'border-amber-200',
          icon: <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
          primaryLabel: 'Action Needed',
          sublabel: `${daysRemaining}d remaining`,
          accessibleDesc: `Action Needed status: ${daysRemaining} days remaining (60 to 90 days)`,
        };
        break;
      case 'SAFE':
      default:
        config = {
          bg: 'bg-emerald-50',
          text: 'text-emerald-800',
          border: 'border-emerald-200',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
          primaryLabel: 'Safe',
          sublabel: `${daysRemaining}d remaining`,
          accessibleDesc: `Safe status: ${daysRemaining} days remaining (more than 90 days)`,
        };
        break;
    }
  }

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-[13px] gap-1.5',
    md: 'px-3 py-1.5 text-[13.5px] sm:text-[14px] gap-2',
    lg: 'px-4 py-2 text-[14.5px] sm:text-[15px] gap-2.5',
  }[size];

  return (
    <span
      role="status"
      aria-label={config.accessibleDesc}
      className={`inline-flex items-center font-bold rounded-full border shadow-2xs ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {config.icon}
      <span>{config.primaryLabel}</span>
      {showSublabel && (
        <>
          <span className="text-gray-300 select-none">•</span>
          <span className="text-[12.5px] sm:text-[13px] opacity-90 font-medium">{config.sublabel}</span>
        </>
      )}
    </span>
  );
};
