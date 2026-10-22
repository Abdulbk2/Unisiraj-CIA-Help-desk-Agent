/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  ProcessedStudent,
  SortField,
  SortOrder,
} from '../types/student';
import { VisaStatusBadge } from './VisaStatusBadge';
import { StudentActions } from './StudentActions';
import { ArrowUp, ArrowDown, SearchX, AlertCircle } from 'lucide-react';

interface StudentVisaTableProps {
  students: ProcessedStudent[];
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  onViewDetails: (student: ProcessedStudent) => void;
  onReviewVisa: (student: ProcessedStudent) => void;
  onInitiateFollowup: (student: ProcessedStudent) => void;
  onScheduleCalendar: (student: ProcessedStudent) => void;
  onResetFilters: () => void;
  onEditStudent?: (student: ProcessedStudent) => void;
  onDeleteStudent?: (student: ProcessedStudent) => void;
}

// Map country codes removed per user specification (icons removed)

export const StudentVisaTable: React.FC<StudentVisaTableProps> = ({
  students,
  sortField,
  sortOrder,
  onSortChange,
  onViewDetails,
  onReviewVisa,
  onInitiateFollowup,
  onScheduleCalendar,
  onResetFilters,
  onEditStudent,
  onDeleteStudent,
}) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Reset to page 1 on filter or sort change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [students.length, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedStudents = students.slice(startIndex, startIndex + pageSize);

  const handleSortHeader = (field: SortField) => {
    if (sortField === field) {
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'asc');
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 inline-block ml-1 text-blue-600" aria-label="Sorted ascending" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 inline-block ml-1 text-blue-600" aria-label="Sorted descending" />
    );
  };

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      {/* Table responsive container */}
      <div className="overflow-x-auto min-w-full">
        <table className="w-full text-left border-collapse" aria-label="International Student Visa Records">
          <thead>
            <tr className="bg-[#F8F9FA] border-b border-[#E4E7EC] text-xs font-bold uppercase tracking-wider text-gray-700">
              <th scope="col" className="py-3.5 px-3 text-center w-14 font-mono">
                No.
              </th>
              <th scope="col" className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => handleSortHeader('fullName')}
                  className="flex items-center gap-1.5 hover:text-blue-700 focus:outline-hidden cursor-pointer"
                >
                  Student Name
                  {renderSortIndicator('fullName')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => handleSortHeader('matricId')}
                  className="flex items-center gap-1.5 hover:text-blue-700 focus:outline-hidden cursor-pointer"
                >
                  Matric ID
                  {renderSortIndicator('matricId')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4">
                Nationality
              </th>
              <th scope="col" className="py-3.5 px-4">
                <button
                  type="button"
                  onClick={() => handleSortHeader('expiryDate')}
                  className="flex items-center gap-1.5 hover:text-blue-700 focus:outline-hidden cursor-pointer"
                >
                  Visa Expiry Date
                  {renderSortIndicator('expiryDate')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-center">
                <button
                  type="button"
                  onClick={() => handleSortHeader('daysRemaining')}
                  className="inline-flex items-center gap-1.5 hover:text-blue-700 focus:outline-hidden cursor-pointer"
                >
                  Days Remaining
                  {renderSortIndicator('daysRemaining')}
                </button>
              </th>
              <th scope="col" className="py-3.5 px-4 text-center">
                Visa Status
              </th>
              <th scope="col" className="py-3.5 px-4 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 px-5 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                      <SearchX className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-gray-900 text-lg">No student records found</p>
                      <p className="text-[14.5px] text-gray-500">
                        No students match your active search terms or visa status filter.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="mt-2 px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student, idx) => {
                const serialNumber = startIndex + idx + 1;
                const isOverdue = student.daysRemaining < 0;

                return (
                  <tr
                    key={student.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      student.status === 'CRITICAL' ? 'bg-rose-50/15' : ''
                    }`}
                  >
                    {/* Dedicated Serial Number Column */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {serialNumber}
                      </span>
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-4">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onViewDetails(student)}
                          className="font-bold text-gray-900 hover:text-blue-700 hover:underline text-left block truncate max-w-[240px] text-sm cursor-pointer"
                        >
                          {student.fullName}
                        </button>
                        <span className="text-xs text-gray-500 block truncate max-w-[240px]">
                          {student.program}
                        </span>
                      </div>
                    </td>

                    {/* Matric ID */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {student.matricId}
                      </span>
                    </td>

                    {/* Nationality */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-gray-900 font-medium text-xs sm:text-sm">
                        {student.nationality}
                      </span>
                    </td>

                    {/* Visa Expiry Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm">
                          {student.formattedExpiryDate}
                        </span>
                        <span className="text-[11px] text-gray-500 font-medium">
                          {student.visaCategory.split(' ')[0]}
                        </span>
                      </div>
                    </td>

                    {/* Days Remaining */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`font-mono font-bold text-xs px-2.5 py-0.5 rounded-md ${
                            isOverdue
                              ? 'text-rose-700 bg-rose-100 border border-rose-300'
                              : student.daysRemaining === 0
                              ? 'text-rose-700 bg-rose-100 font-extrabold border border-rose-300'
                              : student.daysRemaining <= 29
                              ? 'text-rose-700 bg-rose-50 border border-rose-200'
                              : student.daysRemaining <= 59
                              ? 'text-orange-700 bg-orange-50 border border-orange-200'
                              : student.daysRemaining <= 90
                              ? 'text-amber-800 bg-amber-50 border border-amber-200'
                              : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                          }`}
                        >
                          {isOverdue
                            ? `${student.daysRemaining}d`
                            : student.daysRemaining === 0
                            ? 'Today'
                            : `+${student.daysRemaining}d`}
                        </span>
                      </div>
                    </td>

                    {/* Visa Status Badge */}
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <VisaStatusBadge
                        status={student.status}
                        daysRemaining={student.daysRemaining}
                        isExpired={student.isExpired}
                        isExpiringToday={student.isExpiringToday}
                        size="sm"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <StudentActions
                        student={student}
                        onViewDetails={onViewDetails}
                        onReviewVisa={onReviewVisa}
                        onInitiateFollowup={onInitiateFollowup}
                        onScheduleCalendar={onScheduleCalendar}
                        onEditStudent={onEditStudent}
                        onDeleteStudent={onDeleteStudent}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Institutional Table Footer with Pagination Controls and 5, 10, 20, 50, 100 Rows Dropdown */}
      <div className="bg-[#F8F9FA] px-4 py-3 border-t border-[#E4E7EC] flex flex-wrap items-center justify-between text-xs text-gray-600 gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-[#D0D5DD] rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-2xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <span className="font-medium text-gray-700">
            Showing <strong className="text-gray-900">{students.length > 0 ? startIndex + 1 : 0}</strong>–
            <strong className="text-gray-900">{Math.min(startIndex + pageSize, students.length)}</strong> of{' '}
            <strong className="text-gray-900">{students.length}</strong> students
          </span>
        </div>

        {/* Pagination Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D0D5DD] bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer transition-colors"
          >
            Previous
          </button>
          <span className="px-2.5 py-1 text-xs font-mono font-bold text-gray-800 bg-white border border-gray-200 rounded-lg">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#D0D5DD] bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs cursor-pointer transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
