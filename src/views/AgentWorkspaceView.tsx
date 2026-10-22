/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Database,
  ArrowRight,
  Clock,
  User,
  RefreshCw,
} from 'lucide-react';
import { AgentApi } from '../lib/api/agent';
import { AgentQueryResponse, ProcessedStudent } from '../lib/api/types';
import { VisaStatusBadge } from '../components/VisaStatusBadge';

interface AgentWorkspaceViewProps {
  onSelectStudent: (student: ProcessedStudent) => void;
  isDemoMode: boolean;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  structuredData?: AgentQueryResponse;
  timestamp: string;
}

export const AgentWorkspaceView: React.FC<AgentWorkspaceViewProps> = ({
  onSelectStudent,
  isDemoMode,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: `### 🎓 Assalamu'alaikum & Welcome to the UniSIRAJ CIA Agent Workspace
I am your administrative assistant for international student visa compliance at **Universiti Islam Antarabangsa Tuanku Syed Sirajuddin**.

I can answer compliance questions, retrieve authorized student pass records, evaluate renewal windows, and summarize WhatsApp reminder delivery statuses without requiring complex database queries.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const suggestedQuestions = [
    "Which students' visas expire within 30 days?",
    "Which students need a renewal reminder?",
    "How many expired visas are in the system?",
    "Which student records have invalid phone numbers?",
    "Show yesterday's failed WhatsApp notifications.",
    "Summarize the latest synchronization results.",
  ];

  const handleSendQuery = async (queryToSend?: string) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || isLoading) return;

    const userMessage: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await AgentApi.queryAgent({ query: text });

      const agentMessage: MessageItem = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: response.answer,
        structuredData: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'agent',
          text: `⚠️ Connection Notice: ${err.message || 'Unable to retrieve answer from agent endpoint.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workspace Header Banner */}
      <div className="bg-gradient-to-r from-[#142B4A] to-[#1E3A5F] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-white/10 rounded-xl border border-white/20 text-[#D6A52B] shrink-0">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">AI Agent Workspace</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#D6A52B] text-[#142B4A]">
                Pillar 4: NLP Retrieval
              </span>
            </div>
            <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
              Natural-language query assistant for university international office staff. Ask everyday administrative questions to retrieve student pass records, check overstay risks, and verify WhatsApp alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
          <span
            className={`text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 border ${
              isDemoMode
                ? 'bg-amber-400/20 text-amber-200 border-amber-400/30'
                : 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            {isDemoMode ? 'Demo Mode (Mock Service)' : 'Live Mode (Cloud Run FastAPI)'}
          </span>
        </div>
      </div>

      {/* Suggested Questions Quick Grid */}
      <div className="bg-white rounded-xl border border-[#E4E7EC] p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between text-xs text-[#667085]">
          <span className="font-bold uppercase tracking-wider text-[11px] text-[#142B4A] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D6A52B]" /> Recommended Administrative Inquiries
          </span>
          <span className="hidden sm:inline">Click any prompt to submit immediately</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendQuery(q)}
              disabled={isLoading}
              className="text-left p-2.5 rounded-lg border border-[#E4E7EC] hover:border-[#2457A7] bg-[#F5F6F8] hover:bg-white text-xs font-medium text-[#182230] transition-all flex items-center justify-between group cursor-pointer"
            >
              <span className="truncate pr-2">"{q}"</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#667085] group-hover:text-[#2457A7] shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Conversational Stream */}
      <div className="bg-white rounded-xl border border-[#E4E7EC] shadow-xs flex flex-col h-[520px]">
        {/* Messages scroll area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-4xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === 'user'
                    ? 'bg-[#2457A7] text-white'
                    : 'bg-[#142B4A] text-[#D6A52B] border border-[#D6A52B]/40'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content */}
              <div
                className={`rounded-xl p-4 text-xs leading-relaxed space-y-3 ${
                  msg.sender === 'user'
                    ? 'bg-[#2457A7] text-white rounded-tr-none'
                    : 'bg-[#F5F6F8] text-[#182230] border border-[#E4E7EC] rounded-tl-none shadow-2xs'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                {/* Structured Student Records Table if returned */}
                {msg.structuredData?.matchedStudents && msg.structuredData.matchedStudents.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#E4E7EC] space-y-2">
                    <span className="font-bold text-[11px] text-[#142B4A] block uppercase tracking-wider">
                      Matching Authorized Records ({msg.structuredData.matchedStudents.length}):
                    </span>
                    <div className="rounded-lg border border-[#E4E7EC] bg-white overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-[#E4E7EC] text-[10px] font-bold uppercase text-[#667085]">
                            <th className="py-2 px-3">Student Name</th>
                            <th className="py-2 px-3">Matric ID</th>
                            <th className="py-2 px-3">Nationality</th>
                            <th className="py-2 px-3">Expiry Date</th>
                            <th className="py-2 px-3 text-center">Status</th>
                            <th className="py-2 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E4E7EC]">
                          {msg.structuredData.matchedStudents.map((st: ProcessedStudent) => (
                            <tr key={st.id} className="hover:bg-blue-50/40">
                              <td className="py-2 px-3 font-semibold text-[#182230]">{st.fullName}</td>
                              <td className="py-2 px-3 font-mono text-[11px] text-[#667085]">{st.matricId}</td>
                              <td className="py-2 px-3">{st.nationality}</td>
                              <td className="py-2 px-3 font-medium">{st.formattedExpiryDate}</td>
                              <td className="py-2 px-3 text-center">
                                <VisaStatusBadge
                                  status={st.status}
                                  daysRemaining={st.daysRemaining}
                                  isExpired={st.isExpired}
                                  isExpiringToday={st.isExpiringToday}
                                  size="sm"
                                  showSublabel={false}
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => onSelectStudent(st)}
                                  className="text-[11px] font-bold text-[#2457A7] hover:underline cursor-pointer"
                                >
                                  View &rarr;
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Data freshness & suggested follow-ups */}
                {msg.structuredData && (
                  <div className="pt-2 text-[10px] text-[#667085] flex flex-wrap items-center justify-between gap-2 border-t border-gray-200/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {msg.structuredData.dataFreshness}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 max-w-md items-center text-xs text-[#667085] p-3 rounded-xl bg-gray-50 border border-[#E4E7EC]">
              <RefreshCw className="w-4 h-4 text-[#2457A7] animate-spin shrink-0" />
              <span>Querying UniSIRAJ International Student Compliance Registry...</span>
            </div>
          )}
        </div>

        {/* Query Input Bar */}
        <div className="p-3.5 bg-gray-50 border-t border-[#E4E7EC]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask an administrative question (e.g. Which students' passes expire next month?)..."
              disabled={isLoading}
              className="flex-1 bg-white border border-[#E4E7EC] rounded-lg px-3.5 py-2.5 text-xs text-[#182230] placeholder-gray-400 focus:outline-hidden focus:border-[#2457A7] focus:ring-2 focus:ring-blue-100 shadow-2xs font-medium"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="px-4 py-2.5 font-bold text-xs text-white bg-[#2457A7] hover:bg-[#1e4685] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Ask Agent</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
