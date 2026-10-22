/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, User, Mail, Phone, Globe, Shield, Calendar, BookOpen, Building2, FileCheck, CalendarPlus, Send, Edit3, Trash2 } from 'lucide-react';
import { ProcessedStudent } from '../types/student';
import { VisaStatusBadge } from './VisaStatusBadge';
import { formatPhoneNumber } from '../utils/visaRules';

interface StudentDetailModalProps {
  student: ProcessedStudent | null;
  onClose: () => void;
  onInitiateFollowup: (student: ProcessedStudent) => void;
  onScheduleCalendar: (student: ProcessedStudent) => void;
  onEditStudent?: (student: ProcessedStudent) => void;
  onDeleteStudent?: (student: ProcessedStudent) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  onInitiateFollowup,
  onScheduleCalendar,
  onEditStudent,
  onDeleteStudent,
}) => {
  if (!student) return null;

  const displayName = student.fullName || (student as any).student_name || 'Student Record';
  const displayMatric = student.matricId || (student as any).matric_id || 'N/A';
  const displayPassport = student.passportNumber || (student as any).passport_number || 'N/A';
  const displayNationality = student.nationality || 'International';
  const displayCountryCode = student.countryCode || 'INT';
  const displayEmail = student.email || 'N/A';
  const rawPhone = student.phoneNumber || (student as any).whatsapp_number || 'N/A';
  const displayPhone = formatPhoneNumber(rawPhone) || rawPhone;
  const displayFaculty = student.faculty || 'General Studies';
  const displayProgram = student.program || 'Academic Program';
  const displayExpiryDate = student.formattedExpiryDate || (student as any).visa_expiry_date || 'N/A';
  const displayDays = student.daysRemaining ?? (student as any).days_remaining ?? 0;
  const displayStatus = student.status || (student as any).risk_category || ((student as any).status) || 'VALID';
  const displayEmgs = student.emgsStatus || (student as any).emgs_status || 'VERIFIED';
  const displayAdvisor = student.advisorName || (student as any).advisor || 'Not Assigned';
  const displaySponsor = student.sponsorType || (student as any).sponsor || 'Self-Funded';
  const displayNotes = student.notes || (student as any).notes || 'No specialized compliance annotations recorded for this student.';
  const displayLastRenewal = student.lastRenewalDate || 'Initial enrollment';
  const displayVisaCategory = student.visaCategory || 'Student Pass (Multiple Entry)';

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n: string) => n[0])
      .join('') || 'ST';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0D2040] to-[#17325F] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-sm text-amber-300">
              {initials}
            </div>
            <div>
              <h2 id="student-details-title" className="text-xl sm:text-2xl font-bold leading-tight">
                {displayName}
              </h2>
              <p className="text-sm text-blue-200 mt-0.5">
                Matriculation ID: <span className="font-mono font-bold text-white">{displayMatric}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEditStudent && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditStudent(student);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Edit student record"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Edit Details</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 text-[15px]">
          {/* Status Banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="space-y-1">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                Compliance Status
              </span>
              <div className="flex items-center gap-2.5">
                <VisaStatusBadge
                  status={displayStatus as any}
                  daysRemaining={displayDays}
                  isExpired={student.isExpired ?? (displayDays < 0)}
                  isExpiringToday={student.isExpiringToday ?? (displayDays === 0)}
                  size="md"
                />
                <span className="text-sm text-gray-600">
                  (Expires on <strong className="text-gray-900">{displayExpiryDate}</strong>)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                EMGS Workflow
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                <FileCheck className="w-4 h-4 text-blue-600" />
                {displayEmgs}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Identity & Contact */}
            <div className="p-5 rounded-xl border border-gray-200 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" /> Student Profile
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-gray-400" /> Nationality:
                  </span>
                  <span className="font-semibold text-gray-900">{displayNationality} ({displayCountryCode})</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-gray-400" /> Passport No:
                  </span>
                  <span className="font-mono font-bold text-gray-900">{displayPassport}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" /> Email:
                  </span>
                  <span className="font-medium text-blue-700 truncate max-w-[200px]">{displayEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone:
                  </span>
                  <span className="font-semibold text-gray-900">{displayPhone}</span>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="p-5 rounded-xl border border-gray-200 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" /> Academic & Sponsorship
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" /> Faculty:
                  </span>
                  <span className="font-semibold text-gray-900 text-right truncate max-w-[180px]">{displayFaculty}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Program:</span>
                  <span className="font-semibold text-gray-900 text-right truncate max-w-[190px]">{displayProgram}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-500">Academic Advisor:</span>
                  <span className="font-medium text-gray-900">{displayAdvisor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sponsor:</span>
                  <span className="font-semibold text-gray-900">{displaySponsor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visa History & Compliance Notes */}
          <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" /> CIA Helpdesk Internal Notes
            </h3>
            <p className="text-[14px] text-gray-700 bg-white p-3.5 rounded-xl border border-gray-200 leading-relaxed font-medium">
              {displayNotes}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span>Last renewal logged: <strong className="text-gray-700">{displayLastRenewal}</strong></span>
              <span>Pass category: <strong className="text-gray-800">{displayVisaCategory}</strong></span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            {onDeleteStudent && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeleteStudent(student);
                }}
                className="px-4 py-2.5 text-sm font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                title="Permanently erase this student record from the database"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">Delete Record</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onEditStudent && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditStudent(student);
                }}
                className="px-4 py-2.5 text-sm font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-4 h-4 text-emerald-600" />
                Edit Information
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                onScheduleCalendar(student);
              }}
              className="px-4 py-2.5 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CalendarPlus className="w-4 h-4" />
              Sync to Google Calendar
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onInitiateFollowup(student);
              }}
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#2457A7] hover:bg-[#1E3A5F] rounded-xl transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Initiate Renewal Follow-up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
