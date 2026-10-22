/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  CalendarPlus,
  Mail,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  Calendar,
  Send,
} from 'lucide-react';
import { ProcessedStudent } from '../types/student';
import { createVisaRenewalCalendarEvent } from '../lib/calendarApi';
import { apiClient } from '../lib/api/client';

interface RenewalFollowupModalProps {
  student: ProcessedStudent | null;
  onClose: () => void;
  accessToken: string | null;
  onConnectGoogle: () => Promise<void>;
  isConnectingGoogle: boolean;
}

type TabType = 'calendar' | 'email' | 'notice';

export const RenewalFollowupModal: React.FC<RenewalFollowupModalProps> = ({
  student,
  onClose,
  accessToken,
  onConnectGoogle,
  isConnectingGoogle,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [appointmentType, setAppointmentType] = useState<
    'renewal_deadline' | 'student_consultation' | 'emgs_submission'
  >('renewal_deadline');
  const [daysAhead, setDaysAhead] = useState<number>(3);
  const [customNotes, setCustomNotes] = useState<string>('');
  
  // Confirmation state for Google Calendar event creation (Mandatory per Workspace Skill guidelines!)
  const [showCalendarConfirmDialog, setShowCalendarConfirmDialog] = useState<boolean>(false);
  const [isSubmittingCalendar, setIsSubmittingCalendar] = useState<boolean>(false);
  const [calendarSuccessMsg, setCalendarSuccessMsg] = useState<string | null>(null);
  const [calendarErrorMsg, setCalendarErrorMsg] = useState<string | null>(null);

  // Email copy state
  const [emailCopied, setEmailCopied] = useState<boolean>(false);

  // Email dispatch state (Live Real-Time SMTP Service)
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [showEmailConfirmDialog, setShowEmailConfirmDialog] = useState<boolean>(false);
  const [emailDispatchMethod] = useState<'smtp'>('smtp');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<{ sid: string; status: string; method: string } | null>(null);
  const [emailErrorMsg, setEmailErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (student) {
      const email = (student as any).email;
      if (email && email !== 'N/A' && email.includes('@')) {
        setRecipientEmail(email);
      } else {
        setRecipientEmail('muhammadmataxu@gmail.com');
      }
    }
  }, [student]);

  if (!student) return null;

  const safeStudent: ProcessedStudent = {
    id: student.id || (student as any).matric_id || 'temp-id',
    matricId: student.matricId || (student as any).matric_id || 'N/A',
    fullName: student.fullName || (student as any).student_name || 'Student Record',
    nationality: student.nationality || 'International',
    countryCode: student.countryCode || 'INT',
    passportNumber: student.passportNumber || (student as any).passport_number || 'N/A',
    email: student.email || 'N/A',
    phoneNumber: student.phoneNumber || (student as any).phone_number || (student as any).whatsapp_number || 'N/A',
    faculty: student.faculty || 'General Studies',
    program: student.program || 'Academic Program',
    advisorName: student.advisorName || (student as any).advisor || 'Not Assigned',
    sponsorType: student.sponsorType || (student as any).sponsor || 'Self-Funded',
    visaCategory: student.visaCategory || (student as any).visa_category || 'Student Pass (Multiple Entry)',
    visaExpiryDate: student.visaExpiryDate || (student as any).visa_expiry_date || new Date().toISOString(),
    formattedExpiryDate: student.formattedExpiryDate || (student as any).visa_expiry_date || 'N/A',
    daysRemaining: student.daysRemaining ?? (student as any).days_remaining ?? 0,
    status: student.status || (student as any).risk_category || 'VALID',
    statusLabel: student.statusLabel || (student as any).status || 'Action Needed',
    isExpired: student.isExpired ?? ((student.daysRemaining ?? (student as any).days_remaining ?? 0) < 0),
    isExpiringToday: student.isExpiringToday ?? ((student.daysRemaining ?? (student as any).days_remaining ?? 0) === 0),
    emgsStatus: student.emgsStatus || (student as any).emgs_status || 'VERIFIED',
    notes: student.notes || (student as any).notes || '',
    lastRenewalDate: student.lastRenewalDate || (student as any).lastRenewalDate || 'Initial enrollment',
  };

  const handleOpenConfirmCalendar = (e: React.FormEvent) => {
    e.preventDefault();
    setCalendarErrorMsg(null);
    setCalendarSuccessMsg(null);
    setShowCalendarConfirmDialog(true);
  };

  const handleExecuteCalendarCreation = async () => {
    if (!accessToken) {
      setCalendarErrorMsg('Please connect your Google Workspace account first.');
      setShowCalendarConfirmDialog(false);
      return;
    }

    try {
      setIsSubmittingCalendar(true);
      setCalendarErrorMsg(null);

      const createdEvent = await createVisaRenewalCalendarEvent(accessToken, safeStudent, {
        appointmentType,
        daysAhead,
        customNotes,
      });

      setShowCalendarConfirmDialog(false);
      setCalendarSuccessMsg(
        `Successfully scheduled event "${createdEvent.summary}" in Google Calendar!`
      );
    } catch (err: any) {
      console.error('Error creating calendar event:', err);
      setShowCalendarConfirmDialog(false);
      setCalendarErrorMsg(
        err.message || 'Failed to create Google Calendar event. Please check permissions.'
      );
    } finally {
      setIsSubmittingCalendar(false);
    }
  };

  const emailBody = `Dear ${safeStudent.fullName} (Matric ID: ${safeStudent.matricId}),

Assalamu'alaikum wa rahmatullahi wa barakatuh,

This is an official visa compliance notice from the UniSIRAJ Centre for International Affairs (CIA) Helpdesk regarding your ${safeStudent.visaCategory}.

COMPLIANCE SUMMARY:
• Passport Number: ${safeStudent.passportNumber}
• Nationality: ${safeStudent.nationality}
• Current Visa Expiry Date: ${safeStudent.formattedExpiryDate}
• Days Remaining: ${safeStudent.daysRemaining} days (${(safeStudent.statusLabel || 'Action Needed').toUpperCase()})
• Current EMGS Progress: ${safeStudent.emgsStatus}

${
  safeStudent.daysRemaining <= 0
    ? 'URGENT: Your student pass has expired. Malaysian Immigration regulations require immediate rectification to prevent overstay penalties or compounding fees.'
    : safeStudent.daysRemaining <= 30
    ? 'CRITICAL NOTICE: In accordance with Malaysian Immigration and EMGS procedures, student pass renewals must be processed at least 3 months in advance. Your window has entered the critical phase.'
    : 'ACTION REQUIRED: Please prepare and submit the necessary renewal documentation.'
}

REQUIRED DOCUMENTS FOR IMMEDIATE SUBMISSION:
1. Original Passport (minimum 18 months validity)
2. Certified Academic Results Slip & Attendance Record (minimum 80% requirement)
3. Latest EMGS Medical Examination Clearance Form
4. UniSIRAJ Visa Renewal Processing Fee Receipt

Please visit the CIA International Student Helpdesk at Level 2, Tuanku Syed Sirajuddin Administration Complex, or reply to this notice.

Best regards,

UniSIRAJ Centre for International Affairs (CIA) Helpdesk
Universiti Islam Antarabangsa Tuanku Syed Sirajuddin
Email: cia.helpdesk@unisiraj.edu.my | Tel: +60 4-979 0000`;

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText(emailBody);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2500);
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    setEmailErrorMsg(null);
    try {
      const targetEmail = recipientEmail.trim() || (safeStudent.email && safeStudent.email !== 'N/A' ? safeStudent.email : 'muhammadmataxu@gmail.com');
      const res = await apiClient.sendEmailMessage({
        studentId: String(safeStudent.id),
        toEmail: targetEmail,
        subject: `[UniSIRAJ CIA Official Notice] Student Visa Compliance Notice - ${safeStudent.fullName} (${safeStudent.matricId})`,
        messageBody: emailBody,
        dispatchMethod: 'smtp',
      });

      if (res.success) {
        setEmailSuccessMsg({
          sid: res.providerSid || 'SMTP_DELIVERED',
          status: res.status || 'DELIVERED',
          method: 'Live Real-Time SMTP',
        });
        setShowEmailConfirmDialog(false);
      } else {
        setEmailErrorMsg(res.message || 'SMTP email dispatch failed.');
      }
    } catch (err: any) {
      setEmailErrorMsg(err.message || 'Failed to dispatch email via SMTP.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="renewal-followup-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-[#0D2040] to-[#1E3A5F] text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-mono">
                  ACTION WORKFLOW
                </span>
                <span className="text-xs text-blue-200">• Matric: {safeStudent.matricId}</span>
              </div>
              <h2 id="renewal-followup-title" className="text-lg font-bold text-white mt-1">
                Initiate Renewal Follow-up: {safeStudent.fullName}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50/90 px-6 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'calendar'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Google Calendar Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'email'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Official Notice Email</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notice')}
              className={`pb-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === 'notice'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Printable Compliance Slip</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto space-y-5 text-sm flex-1">
            {/* TAB 1: Google Calendar Scheduling */}
            {activeTab === 'calendar' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-blue-900">
                      Sync Visa Expiry & Follow-up into Google Calendar
                    </p>
                    <p className="text-blue-700 leading-relaxed">
                      Schedules an international office reminder event with pre-filled student details,
                      passport information, and EMGS submission milestones directly on your linked Google Calendar.
                    </p>
                  </div>
                </div>

                {!accessToken ? (
                  <div className="p-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center space-y-3">
                    <p className="text-xs font-medium text-gray-700">
                      Connect your Google Account to enable calendar scheduling with authorized permissions.
                    </p>
                    <button
                      type="button"
                      onClick={onConnectGoogle}
                      disabled={isConnectingGoogle}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-800 bg-white border border-gray-300 rounded-lg shadow-2xs hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                      {isConnectingGoogle ? 'Connecting...' : 'Sign in with Google'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleOpenConfirmCalendar} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Appointment / Action Type
                        </label>
                        <select
                          value={appointmentType}
                          onChange={(e: any) => setAppointmentType(e.target.value)}
                          className="w-full text-xs bg-white border border-gray-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="renewal_deadline">Final Passport Expiry Deadline</option>
                          <option value="student_consultation">Student In-Person Consultation</option>
                          <option value="emgs_submission">EMGS Renewal Submission Milestone</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Schedule In Advance
                        </label>
                        <select
                          value={daysAhead}
                          onChange={(e) => setDaysAhead(Number(e.target.value))}
                          className="w-full text-xs bg-white border border-gray-300 rounded-lg p-2 font-medium focus:ring-2 focus:ring-blue-100"
                        >
                          <option value={1}>Tomorrow (1 day)</option>
                          <option value={3}>In 3 Days</option>
                          <option value={7}>In 1 Week (7 days)</option>
                          <option value={14}>In 2 Weeks (14 days)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Specific Internal Directives / Notes
                      </label>
                      <textarea
                        rows={3}
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        placeholder={`e.g. Advise ${student.fullName} to bring certified passport photocopy and latest CGPA slip...`}
                        className="w-full text-xs bg-white border border-gray-300 rounded-lg p-2.5 placeholder-gray-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {calendarSuccessMsg && (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{calendarSuccessMsg}</span>
                      </div>
                    )}

                    {calendarErrorMsg && (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{calendarErrorMsg}</span>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        Schedule to Google Calendar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: Official Notice Email */}
            {activeTab === 'email' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-gray-600">
                    Pre-generated institutional email notice formatted for immediate transmission or student portal messaging.
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={copyEmailToClipboard}
                      className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {emailCopied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5 text-gray-600" />
                          Copy Draft
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailSuccessMsg(null);
                        setEmailErrorMsg(null);
                        setShowEmailConfirmDialog(true);
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Official Email</span>
                    </button>
                  </div>
                </div>

                {/* Recipient Email Address Input */}
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-1">
                    <label htmlFor="recipient-email-input" className="text-xs font-bold text-gray-800 shrink-0">
                      Recipient Email:
                    </label>
                    <input
                      id="recipient-email-input"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="student@unisiraj.edu.my"
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg font-mono bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-sm shadow-2xs"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live SMTP Gateway Active</span>
                  </div>
                </div>

                {emailSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-emerald-950">Official Notice Email Dispatched Successfully!</p>
                      <p className="text-[11px] text-emerald-800">
                        Recipient: <strong className="font-mono">{recipientEmail || safeStudent.email || 'muhammadmataxu@gmail.com'}</strong> • Status: <strong>{emailSuccessMsg.status}</strong> • Method: <strong>{emailSuccessMsg.method}</strong>
                      </p>
                      <p className="font-mono text-[10px] text-emerald-700">
                        Provider Message SID: {emailSuccessMsg.sid} • Recorded in Notification Audit Trail
                      </p>
                    </div>
                  </div>
                )}

                {emailErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{emailErrorMsg}</span>
                  </div>
                )}

                <div className="bg-gray-900 text-gray-100 rounded-xl p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto border border-gray-800 selection:bg-blue-500 selection:text-white">
                  {emailBody}
                </div>
              </div>
            )}

            {/* TAB 3: Printable Compliance Slip */}
            {activeTab === 'notice' && (
              <div className="space-y-4">
                <div className="p-5 border-2 border-dashed border-gray-300 rounded-xl bg-white space-y-4">
                  <div className="border-b border-gray-200 pb-3 flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base text-[#0D2040]">UniSIRAJ CIA HELPDESK</h4>
                      <p className="text-[11px] text-gray-500 uppercase tracking-wider">
                        Visa Compliance & International Student Tracking Slip
                      </p>
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      REF: UIS-VMS-{student.matricId.replace(/[^a-zA-Z0-9]/g, '')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Student:</span>{' '}
                      <span className="font-semibold text-gray-900">{student.fullName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Matric ID:</span>{' '}
                      <span className="font-mono font-semibold">{student.matricId}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Passport No:</span>{' '}
                      <span className="font-mono font-semibold">{student.passportNumber}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Nationality:</span>{' '}
                      <span className="font-semibold">{student.nationality}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Visa Expiry:</span>{' '}
                      <span className="font-semibold text-rose-700">{student.formattedExpiryDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Days Remaining:</span>{' '}
                      <span className="font-bold">{student.daysRemaining} days</span>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-200">
                    <p className="font-semibold text-gray-800 mb-1">Administrative Action:</p>
                    <p>
                      Present this compliance slip along with your original passport to the International
                      Office, Ground Floor, Administration Complex before visa expiry to avoid compounding fines.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Print Compliance Slip
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs">
            <span className="text-gray-500">
              UniSIRAJ International Office Protocol • Version 2026.2
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* MANDATORY USER CONFIRMATION DIALOG FOR WORKSPACE API ACTIONS */}
      {showCalendarConfirmDialog && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs animate-in fade-in duration-100"
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
                <CalendarPlus className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 id="confirm-dialog-title" className="text-sm font-bold text-gray-900">
                  Confirm Google Calendar Event Creation
                </h3>
                <p id="confirm-dialog-desc" className="text-xs text-gray-600 leading-relaxed">
                  Are you sure you want to add a visa compliance reminder to your Google Calendar for{' '}
                  <strong className="text-gray-900">{student.fullName}</strong>?
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1 text-gray-600 border border-gray-200">
              <p>
                <strong className="text-gray-800">Event Title:</strong> [UniSIRAJ Visa Action]{' '}
                {student.fullName} ({student.matricId})
              </p>
              <p>
                <strong className="text-gray-800">Expiry Date:</strong> {student.formattedExpiryDate}
              </p>
              <p>
                <strong className="text-gray-800">Action Type:</strong>{' '}
                {appointmentType.replace('_', ' ').toUpperCase()}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCalendarConfirmDialog(false)}
                disabled={isSubmittingCalendar}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteCalendarCreation}
                disabled={isSubmittingCalendar}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {isSubmittingCalendar ? 'Creating Event...' : 'Confirm & Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL CONFIRMATION DIALOG */}
      {showEmailConfirmDialog && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="email-confirm-title"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs animate-in fade-in duration-100"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 id="email-confirm-title" className="text-sm font-bold text-gray-900">
                  Send Official Institutional Email
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Dispatch official visa compliance notice to{' '}
                  <strong className="text-gray-900">{safeStudent.fullName}</strong>.
                </p>
              </div>
            </div>

            {/* Live SMTP Dispatch Information */}
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Real-Time SMTP Transmission
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  SMTP Live
                </span>
              </div>
              <p className="text-[11px] text-blue-900 leading-relaxed">
                Official institutional compliance notice is dispatched in real time directly to the student's email address via the UniSIRAJ SMTP gateway.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5 text-gray-600 border border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-500">Sender Gateway:</span>
                <span className="font-mono font-semibold text-gray-900">cia.helpdesk@unisiraj.edu.my</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Destination Email:</span>
                <span className="font-mono font-semibold text-gray-900">
                  {recipientEmail || (safeStudent.email && safeStudent.email !== 'N/A' ? safeStudent.email : 'muhammadmataxu@gmail.com')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Subject:</span>
                <span className="font-medium text-gray-800 truncate max-w-[240px]">
                  [UniSIRAJ CIA Official Notice] Student Visa Compliance Notice
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Audit Channel:</span>
                <span className="font-semibold text-blue-700">email (Notification History)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowEmailConfirmDialog(false)}
                disabled={isSendingEmail}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSendingEmail}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>{isSendingEmail ? 'Dispatching via SMTP...' : 'Confirm & Send Live Email'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
