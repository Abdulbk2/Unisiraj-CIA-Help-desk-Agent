/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bell,
  Menu,
  Calendar,
  LogOut,
  ChevronDown,
  AlertCircle,
  FlaskConical,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { UniSirajLogo } from './UniSirajLogo';
import { formatFullCurrentDate } from '../utils/visaRules';
import { User } from 'firebase/auth';
import { AuthUserProfile } from '../lib/firebaseAuth';

interface TopNavProps {
  currentView: string;
  onToggleSidebar: () => void;
  urgentCount: number;
  criticalCount: number;
  user: User | AuthUserProfile | null;
  onSignInGoogle: () => void;
  onSignOutGoogle: () => void;
  isConnectingGoogle: boolean;
  onOpenTestModal?: () => void;
  currentMode?: 'LIVE_FASTAPI' | string;
  onNavigateSettings: () => void;
  onRefreshAllData?: () => void;
  isRefreshing?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentView,
  onToggleSidebar,
  urgentCount,
  criticalCount,
  user,
  onSignInGoogle,
  onSignOutGoogle,
  isConnectingGoogle,
  onOpenTestModal,
  currentMode,
  onNavigateSettings,
  onRefreshAllData,
  isRefreshing = false,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const totalNotifications = urgentCount + criticalCount;
  const readableDate = formatFullCurrentDate();

  // Dynamic titles and breadcrumbs depending on selected view
  const viewMeta: Record<string, { title: string; breadcrumb: string; desc: string }> = {
    dashboard: {
      title: 'Visa Compliance Dashboard',
      breadcrumb: 'Dashboard / Overview',
      desc: "Monitor international students' visa compliance, track upcoming expiration milestones, and prioritize renewal interventions.",
    },
    agent: {
      title: 'AI Agent Workspace',
      breadcrumb: 'Dashboard / Conversational Assistant (Pillar 4)',
      desc: 'Ask natural-language questions to query student visa compliance, detect expiring passes, and verify WhatsApp dispatch status.',
    },
    students: {
      title: 'International Student Records',
      breadcrumb: 'Dashboard / Student Records',
      desc: 'Master directory of international students enrolled at Universiti Islam Antarabangsa Tuanku Syed Sirajuddin.',
    },
    import: {
      title: 'Spreadsheet Ingestion & Validation',
      breadcrumb: 'Dashboard / Ingestion Pipeline (Pillar 1)',
      desc: 'Upload XLSX/CSV spreadsheets, verify column mappings, audit data anomalies, and import student pass records.',
    },
    monitoring: {
      title: 'Pass Expiry & Scheduled Monitoring',
      breadcrumb: 'Dashboard / Automated Monitoring (Pillar 2)',
      desc: 'Daily Cloud Run cron synchronisation, 90/60/30-day escalation timelines, and overstay prevention metrics.',
    },
    renewals: {
      title: 'Renewal & EMGS Management',
      breadcrumb: 'Dashboard / Renewal Pipeline',
      desc: 'Track EMGS application approval stages, biometric appointments, and immigration liaison workflows.',
    },
    whatsapp: {
      title: 'WhatsApp Notifications',
      breadcrumb: 'Dashboard / Proactive Messaging (Pillar 3)',
      desc: '',
    },
    history: {
      title: 'Notification Audit Trail',
      breadcrumb: 'Dashboard / Dispatch History',
      desc: 'Immutable audit log of all dispatched WhatsApp and email compliance communications with delivery statuses.',
    },
    reports: {
      title: 'Reports & Compliance Analytics',
      breadcrumb: 'Dashboard / Institutional Analytics',
      desc: 'Faculty compliance distribution, nationality breakdown, overstay penalty avoidance, and Sunnah/SDG alignment.',
    },
    settings: {
      title: 'Integration & Gateway Settings',
      breadcrumb: 'Dashboard / Backend Architecture',
      desc: 'Configure connection parameters for the Python/FastAPI backend on Google Cloud Run, Twilio WhatsApp, and Google Calendar.',
    },
    about: {
      title: 'About System & FAQs',
      breadcrumb: 'Dashboard / About & FAQs',
      desc: 'System architecture, institutional alignment, and frequently asked questions for international office staff.',
    },
  };

  const currentMeta = viewMeta[currentView] || viewMeta.dashboard;

  return (
    <>
      {/* Top Header: Static/Sticky at top with CIA Agent Logo on the left and Controls on the right */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#E4E7EC] shadow-2xs">
        <div className="px-4 sm:px-6 py-2.5 bg-white flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & CIA Agent Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <UniSirajLogo variant="header" className="py-0.5" />
          </div>

          {/* Right header controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Global Synchronise & Refresh Button */}
            {onRefreshAllData && (
              <button
                type="button"
                onClick={onRefreshAllData}
                disabled={isRefreshing}
                title="Sync and refresh all student records and compliance data from live database"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#2457A7] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync & Refresh'}</span>
              </button>
            )}

            {/* Mode Pill Indicator */}
            <button
              type="button"
              onClick={onNavigateSettings}
              title="FastAPI Backend Connected"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border transition-colors shadow-2xs bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Mode (Cloud Run / Local)</span>
            </button>

            {/* Notifications bell (comes BEFORE login profile) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label={`Compliance notifications: ${totalNotifications} actionable items`}
                className="relative p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Bell className="w-5 h-5" />
                {totalNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {totalNotifications}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-[#E4E7EC] py-2 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-800">
                      Compliance Alerts ({totalNotifications})
                    </span>
                    <span className="text-[10px] text-gray-400">Daily Cron</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 text-xs">
                    {criticalCount > 0 && (
                      <div className="p-3 hover:bg-rose-50/50 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-rose-900">
                            {criticalCount} Critical Passes Require Action
                          </p>
                          <p className="text-gray-500 text-[11px]">
                            Visas expired or expiring in under 30 days. Priority follow-up required.
                          </p>
                        </div>
                      </div>
                    )}
                    {urgentCount > 0 && (
                      <div className="p-3 hover:bg-orange-50/50 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-orange-900">
                            {urgentCount} Urgent Cases (30–59 Days)
                          </p>
                          <p className="text-gray-500 text-[11px]">
                            Tier 2 WhatsApp notice & biometric clearance required.
                          </p>
                        </div>
                      </div>
                    )}
                    {totalNotifications === 0 && (
                      <div className="p-6 text-center text-gray-500">
                        No urgent compliance notifications at this time.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Google Calendar Auth / Profile Status */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors"
                  title={user.email || 'Administrator Profile'}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Account Avatar"
                      className="w-8 h-8 rounded-full object-cover border border-[#2457A7]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#142B4A] text-[#D6A52B] font-bold text-sm flex items-center justify-center shadow-xs">
                      {(user.displayName || user.email || 'A')[0].toUpperCase()}
                    </div>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-[#E4E7EC] py-1.5 z-40">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900">{user.displayName || 'Admin'}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Google Calendar Linked
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOutGoogle();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignInGoogle}
                disabled={isConnectingGoogle}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-2xs transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {isConnectingGoogle ? 'Signing in...' : 'Sign in with Google'}
                </span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sub Header: Page Title, Breadcrumbs, Description & Top-Right Date */}
      <div className="px-4 sm:px-6 py-3.5 bg-white border-b border-[#E4E7EC]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <span>{currentMeta.breadcrumb.split('/')[0]}</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-semibold">{currentMeta.breadcrumb.split('/')[1]}</span>
            </nav>
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#182230] tracking-tight leading-tight">
                {currentMeta.title}
              </h1>
            </div>
            {currentMeta.desc && (
              <p className="text-[14px] sm:text-[15px] text-[#667085] max-w-3xl leading-relaxed">
                {currentMeta.desc}
              </p>
            )}
          </div>

          {/* Date Element at Top Right of Sub Header */}
          <div className="flex items-center gap-2 bg-[#F5F6F8] border border-[#E4E7EC] rounded-xl px-3.5 py-2 text-xs sm:text-[13px] text-gray-700 shadow-2xs shrink-0 self-start">
            <Calendar className="w-4 h-4 text-[#2457A7]" aria-hidden="true" />
            <span className="font-semibold text-gray-900 whitespace-nowrap">{readableDate}</span>
          </div>
        </div>
      </div>
    </>
  );
};
