/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Bot,
  Users,
  FileSpreadsheet,
  RefreshCw,
  MessageSquare,
  History,
  BarChart3,
  Settings,
  Calendar,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { UniSirajLogo } from './UniSirajLogo';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCalendarConnected: boolean;
  onConnectCalendar: () => void;
  userEmail?: string | null;
  onOpenTestModal?: () => void;
  studentCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isOpenMobile,
  onCloseMobile,
  isCalendarConnected,
  onConnectCalendar,
  userEmail,
  studentCount = 14,
}) => {
  const primaryNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'agent',
      label: 'AI Agent Workspace',
      icon: Bot,
      badge: 'P4',
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
    },
    {
      id: 'students',
      label: 'Student Records',
      icon: Users,
      badge: String(studentCount),
      badgeColor: 'bg-gray-100 text-gray-700 border border-gray-200',
    },
    {
      id: 'import',
      label: 'Spreadsheet Import',
      icon: FileSpreadsheet,
      badge: 'P1',
      badgeColor: 'bg-blue-100 text-blue-900 border border-blue-200 font-bold',
    },
    {
      id: 'excel',
      label: 'DB and Excel',
      icon: FileSpreadsheet,
    },
    {
      id: 'monitoring',
      label: 'Visa Monitoring',
      icon: RefreshCw,
      badge: 'P2',
      badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp Notifications',
      icon: MessageSquare,
      badge: 'P3',
      badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold',
    },
    { id: 'history', label: 'Notification History', icon: History },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Integration Settings', icon: Settings },
    { id: 'about', label: 'About & FAQs', icon: Info },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-gray-900/40 z-40 lg:hidden backdrop-blur-2xs"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-[#E4E7EC] flex flex-col z-40 transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header: Official UniSIRAJ University Logo */}
        <div className="p-4 border-b border-[#E4E7EC] bg-white">
          <UniSirajLogo variant="sidebar" />
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto" aria-label="Main Navigation">
          <div className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-gray-500">
            System Modules (UniSID 2026)
          </div>

          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[15px] transition-colors ${
                  isActive
                    ? 'bg-[#142B4A] text-white shadow-2xs font-bold'
                    : 'text-[#667085] font-medium hover:bg-gray-100 hover:text-[#182230]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-[#D6A52B]' : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-auto font-bold tracking-tight ${
                      isActive
                        ? 'bg-white/20 text-[#D6A52B]'
                        : item.badgeColor || 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Integration status widget */}
        <div className="p-3.5 border-t border-[#E4E7EC] bg-[#F5F6F8]/60 space-y-2.5">
          <div className="p-3.5 bg-white rounded-xl border border-[#E4E7EC] shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                <Calendar className="w-4 h-4 text-[#2457A7]" />
                <span>Google Calendar</span>
              </div>
              {isCalendarConnected ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Linked
                </span>
              ) : (
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                  Ready
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              {isCalendarConnected
                ? `Authorized for ${userEmail || 'Admin'}`
                : 'Connect to auto-schedule student renewal milestones.'}
            </p>

            {!isCalendarConnected && (
              <button
                type="button"
                onClick={onConnectCalendar}
                className="w-full mt-1 py-1.5 px-3 text-xs font-bold text-[#2457A7] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors text-center"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
          <span className="font-medium">UniSIRAJ CIA • UniSID 2026</span>
          <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Backend Ready
          </span>
        </div>
      </aside>
    </>
  );
};
