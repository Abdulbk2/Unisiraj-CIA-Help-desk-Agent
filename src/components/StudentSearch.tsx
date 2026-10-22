/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, X } from 'lucide-react';

interface StudentSearchProps {
  value: string;
  onChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export const StudentSearch: React.FC<StudentSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by student name or matric ID...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        className="absolute left-3.5 w-5 h-5 text-gray-400 pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search student records"
        className="w-full pl-11 pr-10 py-2.5 text-[15px] sm:text-base text-gray-900 bg-white border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-colors shadow-2xs"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search query"
          className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
