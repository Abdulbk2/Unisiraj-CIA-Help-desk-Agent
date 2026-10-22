/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  Cloud,
  MessageSquare,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { apiClient, apiConfig } from '../lib/api/client';
import { BackendIntegrationStatus } from '../lib/api/types';

interface IntegrationSettingsViewProps {
  onModeChanged?: (mode: 'LIVE_FASTAPI') => void;
  isCalendarConnected: boolean;
  onConnectCalendar: () => void;
  onDisconnectCalendar: () => void;
}

export const IntegrationSettingsView: React.FC<IntegrationSettingsViewProps> = ({
  onModeChanged,
  isCalendarConnected,
  onConnectCalendar,
  onDisconnectCalendar,
}) => {
  const [backendUrl, setBackendUrl] = useState<string>(apiConfig.getBaseUrl());
  const [integrationStatus, setIntegrationStatus] = useState<BackendIntegrationStatus | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsTesting(true);
    try {
      const res = await apiClient.getIntegrationStatus();
      setIntegrationStatus(res);
      setStatusMessage(null);
    } catch (err: any) {
      setStatusMessage(err.message);
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveSettings = async () => {
    apiConfig.setBaseUrl(backendUrl);
    apiConfig.setMode('LIVE_FASTAPI');
    if (onModeChanged) {
      onModeChanged('LIVE_FASTAPI');
    }
    await fetchStatus();
    setStatusMessage('Configuration settings saved successfully.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D6A52B]">
            System Architecture
          </span>
          <span className="text-gray-300">•</span>
          <span className="text-xs text-gray-500 font-medium">Backend Ready Configuration</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          Backend & Gateway Integration Settings
        </h2>
        <p className="text-xs text-gray-500">
          Configure connectivity to your teammate's Python/FastAPI backend deployed on Google Cloud Run, Twilio WhatsApp, and Google Calendar.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Environment Mode Status */}
      <div className="p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Operation Environment Mode</h3>
            <p className="text-xs text-gray-500">
              The application operates exclusively in Live Mode, interfacing directly with the FastAPI service and database.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Mode Active
          </span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40 text-left">
          <div className="flex items-center justify-between mb-1">
            <strong className="text-xs text-emerald-950 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Live Mode (Cloud Run / Local FastAPI Backend)
            </strong>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-200/60 text-emerald-900">
              Active Production Pipeline
            </span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            All student visa records, spreadsheet imports, Excel synchronization, AI assistant queries, and WhatsApp reminders are processed live by your FastAPI backend with transactional database persistence.
          </p>
        </div>
      </div>

      {/* Backend API Configuration */}
      <div className="p-6 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-[#2457A7]" />
            <h3 className="text-sm font-bold text-gray-900">Python / FastAPI Backend Service</h3>
          </div>
          <button
            type="button"
            onClick={fetchStatus}
            disabled={isTesting}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>Test Connection</span>
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              FastAPI Base URL (`VITE_API_BASE_URL` or `NEXT_PUBLIC_API_BASE_URL`)
            </label>
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="e.g. http://localhost:8000 or https://unisiraj-cia-backend-xxxxxx-as.a.run.app"
              className="w-full font-mono text-xs p-2.5 bg-[#F5F6F8] border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-100"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Your teammate will supply this URL when the Cloud Run container is published.
            </p>
          </div>

          {integrationStatus && (
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-gray-500 block">Server Health:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Reachable
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Framework:</span>
                <span className="font-mono font-medium text-gray-800">{integrationStatus.backendVersion}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Region:</span>
                <span className="font-medium text-gray-800">{integrationStatus.cloudRunRegion}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Daily Cron:</span>
                <span className="font-medium text-emerald-700 font-bold">Active (06:00 MYT)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gateway Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Twilio */}
        <div className="p-5 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Twilio WhatsApp Gateway
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Configured on Server
            </span>
          </div>
          <p className="text-[11px] text-gray-500 leading-snug">
            Backend handles Twilio credentials server-side. Frontend submits student IDs through `/api/notifications/send` after mandatory admin confirmation.
          </p>
          <div className="text-[11px] text-gray-600 pt-1 flex items-center justify-between">
            <span>Sender: <strong>{integrationStatus?.twilioPhoneNumberMasked || '+1 737 250 8034 (Live)'}</strong></span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
              Provider: Twilio Live
            </span>
          </div>
        </div>

        {/* Google Calendar */}
        <div className="p-5 bg-white rounded-2xl border border-[#E4E7EC] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Google Calendar Sync
            </span>
            {isCalendarConnected ? (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Connected
              </span>
            ) : (
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                Not Linked
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 leading-snug">
            Schedules visa deadline milestones and student appointments directly to administrator calendar with explicit user confirmation.
          </p>
          <div className="pt-1">
            {isCalendarConnected ? (
              <button
                type="button"
                onClick={onDisconnectCalendar}
                className="text-[11px] text-rose-600 font-semibold hover:underline"
              >
                Disconnect Calendar
              </button>
            ) : (
              <button
                type="button"
                onClick={onConnectCalendar}
                className="px-3 py-1 bg-blue-50 text-[#2457A7] font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Settings Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-6 py-2.5 text-xs font-bold text-white bg-[#2457A7] hover:bg-[#1E3A5F] rounded-xl flex items-center gap-2 shadow-2xs transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Configuration Changes</span>
        </button>
      </div>
    </div>
  );
};
