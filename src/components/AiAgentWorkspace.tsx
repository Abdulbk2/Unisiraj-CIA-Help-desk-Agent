/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Database,
  ArrowRight,
  ShieldCheck,
  Search,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '../lib/api/client';
import { AgentQueryResponse } from '../lib/api/types';
import { ProcessedStudent } from '../types/student';
import { VisaStatusBadge } from './VisaStatusBadge';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  data?: AgentQueryResponse;
  isLoading?: boolean;
}

interface AiAgentWorkspaceProps {
  onSelectStudent: (student: ProcessedStudent) => void;
  onInitiateFollowup: (student: ProcessedStudent) => void;
  onScheduleCalendar: (student: ProcessedStudent) => void;
  allStudents?: ProcessedStudent[];
}

export const AiAgentWorkspace: React.FC<AiAgentWorkspaceProps> = ({
  onSelectStudent,
  onInitiateFollowup,
  onScheduleCalendar,
  allStudents,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const currentMode = apiClient.config.getMode();

  const suggestedQuestions = [
    "Analyze the Excel spreadsheet for discrepancies",
    "Search for Tariq in Excel master file",
    "Which students' visas expire within 30 days?",
    "How many expired visas are in the system?",
    "Sync external Excel records into database",
    "Show yesterday's failed WhatsApp notifications.",
  ];

  const initialWelcomeMessage: Message = {
    id: 'welcome-msg',
    sender: 'agent',
    text: "Assalamu'alaikum. I am the UniSIRAJ CIA Helpdesk Agent. You can query me in natural language to audit international student visa compliance, check 90/60/30-day renewal tiers, inspect WhatsApp delivery statuses, or retrieve student records instantly.",
    timestamp: 'Just now',
    data: {
      answer: "Ready to assist international office administrators at Universiti Islam Antarabangsa Tuanku Syed Sirajuddin.",
      intent: 'GENERAL_COMPLIANCE',
      confidence: 1.0,
      dataFreshness: 'Synchronised at 06:00 MYT today',
      suggestedFollowups: [
        "Which students' visas expire within 30 days?",
        "How many expired visas are in the system?",
        "Which students need a renewal reminder?",
      ],
      executionTimeMs: 12,
      dataSource: currentMode,
    },
  };

  const [messages, setMessages] = useState<Message[]>([initialWelcomeMessage]);

  const handleResetChat = () => {
    setMessages([
      {
        ...initialWelcomeMessage,
        id: `welcome-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputQuery('');
  };

  const toSafeStudent = (st: any): ProcessedStudent => {
    // If we have a full student in allStudents, use that
    const matric = st.matricId || st.matric_id;
    if (allStudents && matric) {
      const match = allStudents.find((s) => s.matricId === matric);
      if (match) return match;
    }

    const days = st.daysRemaining ?? st.days_remaining ?? 0;
    const isExpired = days < 0;
    const isExpiringToday = days === 0;

    return {
      id: String(st.id || matric || 'temp-id'),
      matricId: matric || 'N/A',
      fullName: st.fullName || st.student_name || 'Student Record',
      nationality: st.nationality || 'International',
      countryCode: st.countryCode || 'INT',
      passportNumber: st.passportNumber || st.passport_number || 'N/A',
      email: st.email || 'N/A',
      phoneNumber: st.phoneNumber || st.phone_number || st.whatsapp_number || 'N/A',
      faculty: st.faculty || 'General Studies',
      program: st.program || 'Academic Program',
      advisorName: st.advisorName || st.advisor || 'Not Assigned',
      sponsorType: st.sponsorType || st.sponsor || 'Self-Funded',
      visaCategory: st.visaCategory || st.visa_category || 'Student Pass (Multiple Entry)',
      visaExpiryDate: st.visaExpiryDate || st.visa_expiry_date || new Date().toISOString(),
      formattedExpiryDate: st.formattedExpiryDate || st.visa_expiry_date || 'N/A',
      daysRemaining: days,
      status: st.status || (isExpired ? 'EXPIRED' : days <= 30 ? 'CRITICAL' : days <= 60 ? 'URGENT' : days <= 90 ? 'ACTION_NEEDED' : 'VALID'),
      statusLabel: isExpired ? 'Expired' : days <= 30 ? 'Action needed' : days <= 60 ? 'Urgent renewal' : days <= 90 ? 'Action needed' : 'Valid',
      isExpired,
      isExpiringToday,
      emgsStatus: st.emgsStatus || st.emgs_status || 'VERIFIED',
      notes: st.notes || '',
      lastRenewalDate: st.lastRenewalDate || 'Initial enrollment',
    };
  };

  const handleSendQuery = async (queryText?: string) => {
    const q = (queryText || inputQuery).trim();
    if (!q || isProcessing) return;

    const userMsgId = `user-${Date.now()}`;
    const agentMsgId = `agent-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: q,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      {
        id: agentMsgId,
        sender: 'agent',
        text: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLoading: true,
      },
    ]);

    setInputQuery('');
    setIsProcessing(true);

    try {
      // Ensure at least 5 seconds of loading time for realistic agent processing
      const [response] = await Promise.all([
        apiClient.queryAgent(q),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ]);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? {
                ...msg,
                text: response.answer,
                data: response,
                isLoading: false,
              }
            : msg
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? {
                ...msg,
                text: `Agent query could not be completed: ${err.message}`,
                isLoading: false,
              }
            : msg
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] min-h-[580px] bg-white rounded-2xl border border-[#E4E7EC] shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="px-6 py-3.5 bg-gradient-to-r from-[#142B4A] via-[#1E3A5F] to-[#2457A7] text-white flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E7EC]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-[#D6A52B]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                UniSIRAJ CIA Conversational Compliance Agent
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D6A52B] text-[#142B4A]">
                P4: NLP
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-blue-100">
              Natural-language query engine evaluating active student records against Malaysian Student Pass renewal rules
            </p>
          </div>
        </div>

        {/* Action Controls & Mode Badges */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetChat}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Refresh the CIA Agent conversation"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
            <span>Refresh Agent</span>
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Excel Grounded Tool Active
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Mode
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#F5F6F8]/40">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3.5 max-w-4xl ${
              message.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                message.sender === 'user'
                  ? 'bg-[#2457A7] text-white'
                  : 'bg-[#142B4A] text-[#D6A52B] border border-[#D6A52B]/30'
              }`}
            >
              {message.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-6 h-6" />}
            </div>

            {/* Bubble Content */}
            <div
              className={`space-y-3 rounded-2xl p-4 sm:p-5 shadow-xs text-sm ${
                message.sender === 'user'
                  ? 'bg-[#2457A7] text-white rounded-tr-none'
                  : 'bg-white border border-[#E4E7EC] text-[#182230] rounded-tl-none'
              }`}
            >
              {message.isLoading ? (
                <div className="flex items-center gap-3 py-3 px-1 text-blue-900">
                  <div className="w-5 h-5 border-2 border-[#2457A7] border-t-transparent rounded-full animate-spin shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-gray-800">
                      UniSIRAJ CIA Agent is analyzing visa compliance &amp; student records...
                    </p>
                    <p className="text-xs text-gray-500">
                      Evaluating 90/60/30-day tiers against active database records. Please wait a moment.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-2 text-xs text-gray-400">
                    <span className="font-bold text-gray-700">
                      {message.sender === 'user' ? 'Administrator' : 'CIA Helpdesk Agent'}
                    </span>
                    <span>{message.timestamp}</span>
                  </div>

                  {/* Main text answer */}
                  <p className="text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap font-medium">
                    {message.text}
                  </p>

                  {/* Structured Match Table if returned */}
                  {message.data?.matchedStudents && message.data.matchedStudents.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
                        <span>
                          Relevant Student Records ({message.data.matchedStudents.length} matches)
                        </span>
                        <span className="text-gray-400 font-normal">
                          Execution: {message.data.executionTimeMs}ms • Confidence: {(((message.data.confidence ?? 0.95)) * 100).toFixed(0)}%
                        </span>
                      </div>

                      <div className="rounded-xl border border-[#E4E7EC] overflow-hidden bg-white">
                        <table className="w-full text-left text-xs border-collapse" aria-label="Matched Student Records">
                          <thead className="bg-[#F8F9FA] border-b border-[#E4E7EC] text-[10px] uppercase font-bold tracking-wider text-gray-700">
                            <tr>
                              <th scope="col" className="py-2 px-2.5 text-center w-10 font-mono">No.</th>
                              <th scope="col" className="py-2 px-3">Student</th>
                              <th scope="col" className="py-2 px-3">Matric ID</th>
                              <th scope="col" className="py-2 px-3">Expiry Date</th>
                              <th scope="col" className="py-2 px-3 text-center">Status</th>
                              <th scope="col" className="py-2 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {message.data.matchedStudents.map((st, idx) => {
                              const safe = toSafeStudent(st);
                              return (
                                <tr key={safe.id || idx} className="hover:bg-blue-50/50">
                                  <td className="py-2 px-2.5 text-center font-mono text-[11px] font-bold text-gray-500">
                                    {idx + 1}
                                  </td>
                                  <td className="py-2 px-3 font-semibold text-gray-900">
                                    {safe.fullName}
                                    <span className="block text-[10px] text-gray-400 font-normal">
                                      {safe.nationality} • {safe.program}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 font-mono font-medium text-gray-700">
                                    {safe.matricId}
                                  </td>
                                  <td className="py-2 px-3 font-medium text-gray-900">
                                    {safe.formattedExpiryDate}
                                    <span className="block text-[10px] text-gray-400">
                                      ({safe.daysRemaining}d left)
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <VisaStatusBadge
                                      status={safe.status}
                                      daysRemaining={safe.daysRemaining}
                                      isExpired={safe.isExpired}
                                      isExpiringToday={safe.isExpiringToday}
                                      size="sm"
                                      showSublabel={false}
                                    />
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <div className="inline-flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => onSelectStudent(safe)}
                                        className="px-2.5 py-1 text-[11px] font-semibold text-[#2457A7] bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                                      >
                                        View
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onInitiateFollowup(safe)}
                                        className="px-2.5 py-1 text-[11px] font-semibold text-white bg-[#2457A7] hover:bg-[#1E3A5F] rounded-md transition-colors cursor-pointer shadow-2xs"
                                      >
                                        Follow-up
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Follow-up Prompts */}
                  {message.data?.suggestedFollowups && message.data.suggestedFollowups.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {message.data.suggestedFollowups.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendQuery(sug)}
                          className="px-2.5 py-1 text-[11px] font-medium text-[#2457A7] bg-blue-50/80 hover:bg-blue-100/80 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                        >
                          <span>{sug}</span>
                          <ArrowRight className="w-3 h-3 text-[#2457A7]" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Freshness & Metadata */}
                  {message.data?.dataFreshness && (
                    <div className="pt-1 flex items-center gap-2 text-[10px] text-gray-400">
                      <Database className="w-3 h-3 text-gray-400" />
                      <span>{message.data.dataFreshness}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Suggested Questions Quick Tray */}
      <div className="px-6 py-3 bg-gray-50 border-t border-[#E4E7EC] flex items-center gap-2.5 overflow-x-auto scrollbar-none text-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 shrink-0 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-[#2457A7]" /> Quick Prompts:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendQuery(q)}
            className="px-3.5 py-1.5 bg-white hover:bg-blue-50 text-gray-800 hover:text-[#2457A7] border border-[#E4E7EC] rounded-xl text-[13px] sm:text-[13.5px] whitespace-nowrap transition-colors shrink-0 font-semibold shadow-2xs cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 sm:p-5 bg-white border-t border-[#E4E7EC]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask the CIA Agent e.g., 'Which students need a renewal reminder?' or 'Show expired passes'..."
              disabled={isProcessing}
              className="w-full pl-4 pr-12 py-3.5 text-[15px] sm:text-base bg-[#F5F6F8] border border-[#E4E7EC] rounded-xl placeholder-gray-400 focus:outline-hidden focus:border-[#2457A7] focus:ring-2 focus:ring-blue-100 transition-colors"
            />
            <span className="absolute right-3.5 top-3.5 text-xs font-mono font-bold text-gray-400 uppercase hidden sm:inline">
              Return ↵
            </span>
          </div>

          <button
            type="submit"
            disabled={!inputQuery.trim() || isProcessing}
            className="px-6 py-3.5 text-sm sm:text-[15px] font-bold text-white bg-[#2457A7] hover:bg-[#1E3A5F] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-2 shadow-2xs shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask Agent</span>
          </button>
        </form>
      </div>
    </div>
  );
};
