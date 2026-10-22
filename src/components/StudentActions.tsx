/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, FileText, Send, CalendarPlus, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { ProcessedStudent } from '../types/student';

interface StudentActionsProps {
  student: ProcessedStudent;
  onViewDetails: (student: ProcessedStudent) => void;
  onReviewVisa: (student: ProcessedStudent) => void;
  onInitiateFollowup: (student: ProcessedStudent) => void;
  onScheduleCalendar: (student: ProcessedStudent) => void;
  onEditStudent?: (student: ProcessedStudent) => void;
  onDeleteStudent?: (student: ProcessedStudent) => void;
}

export const StudentActions: React.FC<StudentActionsProps> = ({
  student,
  onViewDetails,
  onReviewVisa,
  onInitiateFollowup,
  onScheduleCalendar,
  onEditStudent,
  onDeleteStudent,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Esc
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center gap-2" ref={menuRef}>
      {/* Primary fast action for urgent/critical cases */}
      <button
        type="button"
        onClick={() => onInitiateFollowup(student)}
        className={`px-3.5 py-1.5 text-[13.5px] sm:text-[14px] font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
          student.status === 'CRITICAL'
            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
            : student.status === 'URGENT'
            ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-2xs'
            : 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-200'
        }`}
        title="Initiate renewal follow-up protocols"
      >
        <Send className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Follow-up</span>
      </button>

      {/* Overflow action menu */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Actions for ${student.fullName}`}
        className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-30 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Student Actions
            </p>
            <p className="text-sm font-bold text-gray-900 truncate">{student.fullName}</p>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onViewDetails(student);
            }}
            className="w-full px-4 py-2.5 text-left text-[14px] text-gray-800 font-medium hover:bg-gray-50 flex items-center gap-2.5"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>View Student Details</span>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </button>

          {onEditStudent && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onEditStudent(student);
              }}
              className="w-full px-4 py-2.5 text-left text-[14px] text-gray-800 font-medium hover:bg-gray-50 flex items-center gap-2.5"
            >
              <Pencil className="w-4 h-4 text-emerald-600" />
              <span>Edit Student Information</span>
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onReviewVisa(student);
            }}
            className="w-full px-4 py-2.5 text-left text-[14px] text-gray-800 font-medium hover:bg-gray-50 flex items-center gap-2.5"
          >
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Review Visa Information</span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onInitiateFollowup(student);
            }}
            className="w-full px-4 py-2.5 text-left text-[14px] text-gray-800 font-medium hover:bg-gray-50 flex items-center gap-2.5"
          >
            <Send className="w-4 h-4 text-amber-600" />
            <span>Initiate Renewal Follow-up</span>
          </button>

          <div className="my-1.5 border-t border-gray-100" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onScheduleCalendar(student);
            }}
            className="w-full px-4 py-2.5 text-left text-[14px] text-blue-700 font-bold hover:bg-blue-50 flex items-center gap-2.5"
          >
            <CalendarPlus className="w-4 h-4 text-blue-600" />
            <span>Sync to Google Calendar</span>
          </button>

          {onDeleteStudent && (
            <>
              <div className="my-1.5 border-t border-rose-100" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  onDeleteStudent(student);
                }}
                className="w-full px-4 py-2.5 text-left text-[14px] text-rose-600 font-bold hover:bg-rose-50 flex items-center gap-2.5"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete Student Record</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
