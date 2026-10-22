/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Info,
  Shield,
  Award,
  BookOpen,
  Globe,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckCircle2,
  FileSpreadsheet,
  Clock,
  MessageSquare,
  Bot,
  ExternalLink,
  Building,
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'Compliance' | 'WhatsApp' | 'Integration' | 'Security';
}

export const AboutView: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      category: 'Compliance',
      question: 'What is the purpose of the UniSIRAJ CIA Helpdesk Agent?',
      answer:
        'The UniSIRAJ Centre for International Affairs (CIA) Helpdesk Agent is an institutional compliance monitoring platform designed to eliminate overstay risks, automate student pass renewal workflows, and keep international students informed via direct WhatsApp notifications and natural language administrative auditing.',
    },
    {
      category: 'Compliance',
      question: 'How does the 90 / 60 / 30 day escalation milestone schedule work?',
      answer:
        'Under Malaysian Immigration regulations, student pass renewals must be initiated 3 months before expiry. The platform dynamically categorizes students into 3 escalation tiers based on exact calendar days remaining at local midnight: Tier 1 (90 days, renewal window opens), Tier 2 (60 days, follow-up for missing EMGS medical or transcripts), and Tier 3 (30 days, urgent final reminder before compounded penalty fees apply). Any student with <0 days is marked as Overdue / Action Needed.',
    },
    {
      category: 'WhatsApp',
      question: 'How are WhatsApp notifications delivered to international students?',
      answer:
        'Reminders are dispatched via Twilio WhatsApp API using registered E.164 phone numbers. The system supports automated daily synchronization runs as well as authorized one-click manual dispatches with full audit trail logging and delivery verification receipts.',
    },
    {
      category: 'Integration',
      question: 'How does the DB and Microsoft Excel live integration operate?',
      answer:
        'Administrators can upload or sync master XLSX/CSV spreadsheets with the SQLite / PostgreSQL database. The built-in data validation engine checks matriculation formats, passport uniqueness, and E.164 phone formats to ensure 100% data integrity before persisting records.',
    },
    {
      category: 'Security',
      question: 'How is student data protected and compliant with Malaysian PDPA?',
      answer:
        'Student records are strictly protected with role-based access control, cryptographic session handling, masked phone numbers in audit logs, and complete audit logging of every administrative action, inspection, and message dispatch.',
    },
    {
      category: 'Compliance',
      question: 'Can administrators schedule renewal consultations in Google Calendar?',
      answer:
        'Yes. With Google Workspace Calendar OAuth integration, administrators can sync renewal deadlines, student consultation sessions, or EMGS document submission appointments directly into their Google Calendar with automatic reminder alerts.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#142B4A] via-[#1E3A5F] to-[#2457A7] rounded-2xl p-6 sm:p-8 text-white shadow-xs">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-amber-300">
            <Info className="w-3.5 h-3.5" />
            <span>Institutional Compliance &amp; Innovation System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            UniSIRAJ CIA Helpdesk Agent
          </h1>
          <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
            Centre for International Affairs (CIA), Universiti Islam Antarabangsa Tuanku Syed Sirajuddin.
            Empowering institutional visa compliance monitoring, proactive student communication, and auditable immigration alignment.
          </p>
        </div>
      </div>

      {/* 4 Architectural Pillars Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#2457A7]" />
          System Architectural Pillars
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E4E7EC] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2457A7] flex items-center justify-center font-bold text-sm">
              P1
            </div>
            <h3 className="font-bold text-sm text-gray-900">Spreadsheet Ingestion</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Automated ingestion, deduplication, and schema validation of university master Excel spreadsheets.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E4E7EC] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
              P2
            </div>
            <h3 className="font-bold text-sm text-gray-900">Automated Monitoring</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Real-time calendar calculations against Malaysian Student Pass renewal rules (90/60/30-day tiers).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E4E7EC] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
              P3
            </div>
            <h3 className="font-bold text-sm text-gray-900">WhatsApp Notification</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Automated and authorized manual direct-to-student WhatsApp reminder messaging via Twilio API.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E4E7EC] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
              P4
            </div>
            <h3 className="font-bold text-sm text-gray-900">Conversational AI Agent</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Natural language compliance assistant grounded strictly in active database records with zero hallucination.
            </p>
          </div>
        </div>
      </div>

      {/* Academic Innovation & SDG / Sunnah Alignment (Moved from Reports) */}
      <div className="p-6 bg-gradient-to-r from-[#142B4A] to-[#1E3A5F] rounded-2xl text-white shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#D6A52B]" />
          <h3 className="text-base sm:text-lg font-bold text-white">
            UniSID 2026 Academic Innovation &amp; Institutional Values Alignment
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="p-4 rounded-xl bg-white/10 border border-white/10 space-y-2">
            <h4 className="font-bold text-[#D6A52B] flex items-center gap-1.5 text-sm">
              <BookOpen className="w-4 h-4" /> Alignment with Sunnah
            </h4>
            <ul className="space-y-2 text-blue-100 leading-relaxed text-xs">
              <li>
                <strong>Amanah (Trustworthiness):</strong> Fulfilling institutional duty to safeguard students under university care (Qur'an 4:58).
              </li>
              <li>
                <strong>Itqan (Excellence in work):</strong> Eliminating manual auditing errors through automated, continuous verification (al-Bayhaqi).
              </li>
              <li>
                <strong>Prophetic Facilitation:</strong> "Make things easy and do not make them difficult" (Sahih al-Bukhari 69) by timely proactive alerts.
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-white/10 border border-white/10 space-y-2">
            <h4 className="font-bold text-[#D6A52B] flex items-center gap-1.5 text-sm">
              <Globe className="w-4 h-4" /> United Nations Sustainable Development Goals (SDGs)
            </h4>
            <ul className="space-y-2 text-blue-100 leading-relaxed text-xs">
              <li>
                <strong>SDG 4 (Quality Education, 4.3):</strong> Safeguarding legal residency so international students complete studies uninterrupted.
              </li>
              <li>
                <strong>SDG 8 (Decent Work, 8.2):</strong> Upgrading administrative efficiency through serverless automation on Google Cloud Run.
              </li>
              <li>
                <strong>SDG 16 (Peace, Justice &amp; Strong Institutions, 16.6):</strong> Transparent, auditable compliance tracking with full message logs.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions (FAQs) Section */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <HelpCircle className="w-5 h-5 text-[#2457A7]" />
          <div>
            <h3 className="font-bold text-gray-900 text-base">Frequently Asked Questions (FAQs)</h3>
            <p className="text-xs text-gray-500">
              Guidance and operational principles for the UniSIRAJ CIA International Student Helpdesk.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 overflow-hidden transition-all bg-gray-50/40"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 font-semibold text-sm text-gray-900 hover:bg-gray-100/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0 font-mono">
                      {faq.category}
                    </span>
                    <span>{faq.question}</span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-gray-600 leading-relaxed border-t border-gray-100 bg-white">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
