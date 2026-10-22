/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Filter, ArrowUpDown } from 'lucide-react';
import { SortField, SortOrder } from '../types/student';

interface VisaStatusFilterProps {
  statusFilter: string;
  onStatusChange: (status: string) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  totalCount: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export const VisaStatusFilter: React.FC<VisaStatusFilterProps> = ({
  statusFilter,
  onStatusChange,
  sortField,
  sortOrder,
  onSortChange,
  totalCount,
  filteredCount,
  onResetFilters,
}) => {
  const isFiltered = statusFilter !== 'ALL';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      {/* Status pills or dropdown */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <span className="text-sm font-bold text-gray-600 mr-1 flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-[#2457A7]" /> Filter:
        </span>

        {[
          { key: 'ALL', label: 'All Statuses' },
          { key: 'CRITICAL', label: 'Critical' },
          { key: 'URGENT', label: 'Urgent' },
          { key: 'ACTION_NEEDED', label: 'Action Needed' },
          { key: 'SAFE', label: 'Safe' },
          { key: 'EXPIRED', label: 'Expired Only' },
        ].map((item) => {
          const active = statusFilter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onStatusChange(item.key)}
              className={`px-3.5 py-1.5 text-[13.5px] sm:text-[14px] font-bold rounded-xl transition-colors border whitespace-nowrap shadow-2xs ${
                active
                  ? 'bg-[#2457A7] text-white border-[#2457A7]'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Sort and Count */}
      <div className="flex items-center gap-3.5 ml-auto text-sm">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-2xs">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <label htmlFor="sortSelect" className="text-gray-500 font-medium text-sm">
            Sort:
          </label>
          <select
            id="sortSelect"
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [f, o] = e.target.value.split('-') as [SortField, SortOrder];
              onSortChange(f, o);
            }}
            className="bg-transparent text-gray-900 font-bold text-sm focus:outline-hidden cursor-pointer"
          >
            <option value="daysRemaining-asc">Most Urgent (Days Remaining Asc)</option>
            <option value="daysRemaining-desc">Least Urgent (Days Remaining Desc)</option>
            <option value="expiryDate-asc">Expiry Date (Earliest First)</option>
            <option value="expiryDate-desc">Expiry Date (Latest First)</option>
            <option value="fullName-asc">Student Name (A to Z)</option>
            <option value="fullName-desc">Student Name (Z to A)</option>
          </select>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-sm text-blue-700 hover:text-blue-900 font-semibold underline underline-offset-2"
          >
            Reset filter
          </button>
        )}

        <span className="text-gray-600 font-medium hidden sm:inline text-sm">
          Showing <span className="font-extrabold text-gray-900">{filteredCount}</span> of{' '}
          <span className="font-extrabold text-gray-900">{totalCount}</span>
        </span>
      </div>
    </div>
  );
};
