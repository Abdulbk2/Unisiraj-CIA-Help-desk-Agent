/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Student,
  ProcessedStudent,
  StatusCalculationResult,
  SummaryMetrics,
  VisaStatusLevel,
  SortField,
  SortOrder,
} from '../types/student';

/**
 * Calculates local calendar days between referenceDate and targetDateStr (YYYY-MM-DD).
 * Normalizes both dates to local midnight to prevent daylight saving / timezone drift.
 */
export function getCalendarDaysRemaining(
  expiryDateStr: string,
  referenceDate: Date = new Date()
): number {
  const [yearStr, monthStr, dayStr] = expiryDateStr.split('-');
  const expYear = parseInt(yearStr, 10);
  const expMonth = parseInt(monthStr, 10) - 1; // 0-indexed month
  const expDay = parseInt(dayStr, 10);

  const targetMidnight = new Date(expYear, expMonth, expDay, 0, 0, 0, 0);
  const refMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
    0,
    0,
    0,
    0
  );

  const diffMs = targetMidnight.getTime() - refMidnight.getTime();
  const msInDay = 1000 * 60 * 60 * 24;
  return Math.round(diffMs / msInDay);
}

/**
 * Centralized, mutually exclusive status calculation according to university compliance rules:
 * - Critical: Expired (<0) or 0–29 days remaining (0 = expiring today)
 * - Urgent: 30–59 days remaining
 * - Action Needed: 60–90 days remaining
 * - Safe: > 90 days remaining
 */
export function calculateVisaStatus(daysRemaining: number): StatusCalculationResult {
  const isExpired = daysRemaining < 0;
  const isExpiringToday = daysRemaining === 0;

  if (isExpired) {
    const absDays = Math.abs(daysRemaining);
    return {
      status: 'CRITICAL',
      daysRemaining,
      label: 'Critical',
      badgeText: `Expired (${absDays}d ago)`,
      isExpired: true,
      isExpiringToday: false,
      severityColor: 'red',
    };
  }

  if (isExpiringToday) {
    return {
      status: 'CRITICAL',
      daysRemaining: 0,
      label: 'Critical',
      badgeText: 'Expires Today',
      isExpired: false,
      isExpiringToday: true,
      severityColor: 'red',
    };
  }

  if (daysRemaining >= 1 && daysRemaining <= 29) {
    return {
      status: 'CRITICAL',
      daysRemaining,
      label: 'Critical',
      badgeText: `${daysRemaining} days left`,
      isExpired: false,
      isExpiringToday: false,
      severityColor: 'red',
    };
  }

  if (daysRemaining >= 30 && daysRemaining <= 59) {
    return {
      status: 'URGENT',
      daysRemaining,
      label: 'Urgent',
      badgeText: `${daysRemaining} days left`,
      isExpired: false,
      isExpiringToday: false,
      severityColor: 'orange',
    };
  }

  if (daysRemaining >= 60 && daysRemaining <= 90) {
    return {
      status: 'ACTION_NEEDED',
      daysRemaining,
      label: 'Action Needed',
      badgeText: `${daysRemaining} days left`,
      isExpired: false,
      isExpiringToday: false,
      severityColor: 'amber',
    };
  }

  return {
    status: 'SAFE',
    daysRemaining,
    label: 'Safe',
    badgeText: `${daysRemaining} days left`,
    isExpired: false,
    isExpiringToday: false,
    severityColor: 'green',
  };
}

/**
 * Formats ISO date string (YYYY-MM-DD) into readable institutional format: e.g. "14 Oct 2026"
 */
export function formatDateDisplay(dateStr: string): string {
  try {
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    const date = new Date(year, month, day);

    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Sanitizes phone numbers by stripping unwanted trailing decimals (e.g. '.0' from Excel imports)
 * and ensuring clean E.164 / display format.
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone || phone === 'N/A' || phone === 'undefined' || phone === 'null') {
    return 'Not Provided';
  }
  let cleaned = String(phone).trim();
  // Strip trailing .0 or .00
  cleaned = cleaned.replace(/\.0+$/, '').replace(/\.0\b/, '');
  // If scientific notation string e.g. 6.0123e+10
  if (/e\+/i.test(cleaned)) {
    try {
      cleaned = String(Math.round(Number(cleaned)));
    } catch {
      // ignore
    }
  }
  if (!cleaned.startsWith('+') && cleaned.length >= 10 && !cleaned.startsWith('0')) {
    cleaned = `+${cleaned}`;
  }
  return cleaned || 'Not Provided';
}

/**
 * Formats full current date for the dashboard header: e.g. "Wednesday, 14 October 2026"
 */
export function formatFullCurrentDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Processes raw Student records into enriched ProcessedStudent records
 */
export function processStudentRecords(
  students: Student[],
  referenceDate: Date = new Date()
): ProcessedStudent[] {
  const safeList = Array.isArray(students)
    ? students
    : ((students as any)?.data && Array.isArray((students as any).data)
      ? (students as any).data
      : []);

  return safeList.map((student: any) => {
    const expiryDate = student.visaExpiryDate || student.visa_expiry_date || '';
    const daysRemaining = getCalendarDaysRemaining(expiryDate, referenceDate);
    const statusResult = calculateVisaStatus(daysRemaining);

    return {
      ...student,
      id: String(student.id || student.matricId || student.matric_id || Math.random()),
      matricId: student.matricId || student.matric_id || '',
      fullName: student.fullName || student.student_name || '',
      phoneNumber: formatPhoneNumber(student.phoneNumber || student.whatsapp_number),
      passportNumber: student.passportNumber || student.passport_number || '',
      visaExpiryDate: expiryDate,
      program: student.program || '',
      faculty: student.faculty || '',
      nationality: student.nationality || '',
      countryCode: student.countryCode || 'MY',
      email: student.email || '',
      visaCategory: student.visaCategory || 'Student Pass (Degree)',
      emgsStatus: student.emgsStatus || student.emgs_status || 'In Progress',
      daysRemaining,
      status: statusResult.status,
      statusLabel: statusResult.label,
      isExpired: statusResult.isExpired,
      isExpiringToday: statusResult.isExpiringToday,
      formattedExpiryDate: formatDateDisplay(expiryDate),
    };
  });
}

/**
 * Calculates responsive summary metrics from student list:
 * - Total Active Visas: non-expired visas (daysRemaining >= 0)
 * - Expiring Within 90 Days: non-expired visas with 90 or fewer days remaining (0 <= daysRemaining <= 90)
 * - Urgent Cases: non-expired visas with fewer than 60 days remaining (0 <= daysRemaining < 60)
 * - Critical Action Required: expired visas (<0) AND visas with fewer than 30 days remaining (<= 29)
 * - Expired Visas: daysRemaining < 0
 * - Safe Visas: daysRemaining > 90
 */
export function calculateSummaryMetrics(students: ProcessedStudent[]): SummaryMetrics {
  const safeStudents = Array.isArray(students) ? students : [];
  let totalActiveVisas = 0;
  let expiringIn90Days = 0;
  let urgentCases = 0;
  let criticalCases = 0;
  let expiredVisas = 0;
  let safeVisas = 0;

  for (const s of safeStudents) {
    if (s.daysRemaining < 0) {
      expiredVisas++;
      criticalCases++; // Expired visas require critical immediate review
    } else {
      totalActiveVisas++;

      if (s.daysRemaining <= 29) {
        criticalCases++;
      } else if (s.daysRemaining <= 59) {
        urgentCases++;
      } else if (s.daysRemaining <= 90) {
        expiringIn90Days++;
      } else {
        safeVisas++;
      }
    }
  }

  return {
    totalStudents: safeStudents.length,
    totalActiveVisas,
    expiringIn90Days,
    urgentCases,
    criticalCases,
    expiredVisas,
    safeVisas,
  };
}

/**
 * Filter and sort processed student records
 */
export function filterAndSortStudents(
  students: ProcessedStudent[],
  searchQuery: string,
  statusFilter: string,
  sortField: SortField,
  sortOrder: SortOrder
): ProcessedStudent[] {
  const safeStudents = Array.isArray(students) ? students : [];
  const query = (searchQuery || '').trim().toLowerCase();

  const filtered = safeStudents.filter((student) => {
    // Search match (name, matric ID, nationality, passport, email)
    const matchesSearch =
      !query ||
      student.fullName.toLowerCase().includes(query) ||
      student.matricId.toLowerCase().includes(query) ||
      student.nationality.toLowerCase().includes(query) ||
      student.passportNumber.toLowerCase().includes(query) ||
      student.program.toLowerCase().includes(query);

    // Status filter match
    let matchesStatus = true;
    if (statusFilter === 'ALL') {
      matchesStatus = true;
    } else if (statusFilter === 'EXPIRED') {
      matchesStatus = student.isExpired;
    } else {
      matchesStatus = student.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  // Sort
  return filtered.sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case 'expiryDate':
      case 'daysRemaining':
        comparison = a.daysRemaining - b.daysRemaining;
        break;
      case 'fullName':
        comparison = a.fullName.localeCompare(b.fullName);
        break;
      case 'matricId':
        comparison = a.matricId.localeCompare(b.matricId);
        break;
      default:
        comparison = a.daysRemaining - b.daysRemaining;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

/**
 * Verification test helper for boundary test scenarios required by testing checklist
 */
export interface BoundaryTestResult {
  scenario: string;
  daysRemaining: number;
  expectedStatus: VisaStatusLevel;
  actualStatus: VisaStatusLevel;
  expectedExpired: boolean;
  actualExpired: boolean;
  passed: boolean;
  explanation: string;
}

export function runBoundaryVerificationTests(): BoundaryTestResult[] {
  const testCases: Array<{
    scenario: string;
    days: number;
    expectedStatus: VisaStatusLevel;
    expectedExpired: boolean;
    explanation: string;
  }> = [
    {
      scenario: 'Expired visa (-14 days)',
      days: -14,
      expectedStatus: 'CRITICAL',
      expectedExpired: true,
      explanation: 'Visa expired past validity date -> classified as Critical with Expired flag.',
    },
    {
      scenario: 'Visa expiring today (0 days)',
      days: 0,
      expectedStatus: 'CRITICAL',
      expectedExpired: false,
      explanation: '0 days left -> classified as Critical with "Expires Today" indicator.',
    },
    {
      scenario: '29-day boundary',
      days: 29,
      expectedStatus: 'CRITICAL',
      expectedExpired: false,
      explanation: 'Upper boundary for Critical (0–29 days) -> classified as Critical.',
    },
    {
      scenario: '30-day boundary',
      days: 30,
      expectedStatus: 'URGENT',
      expectedExpired: false,
      explanation: 'Lower boundary for Urgent (30–59 days) -> classified as Urgent.',
    },
    {
      scenario: '59-day boundary',
      days: 59,
      expectedStatus: 'URGENT',
      expectedExpired: false,
      explanation: 'Upper boundary for Urgent (30–59 days) -> classified as Urgent.',
    },
    {
      scenario: '60-day boundary',
      days: 60,
      expectedStatus: 'ACTION_NEEDED',
      expectedExpired: false,
      explanation: 'Lower boundary for Action Needed (60–90 days) -> classified as Action Needed.',
    },
    {
      scenario: '90-day boundary',
      days: 90,
      expectedStatus: 'ACTION_NEEDED',
      expectedExpired: false,
      explanation: 'Upper boundary for Action Needed (60–90 days) -> classified as Action Needed.',
    },
    {
      scenario: '91-day boundary',
      days: 91,
      expectedStatus: 'SAFE',
      expectedExpired: false,
      explanation: 'Threshold exceeding 90 days (> 90 days) -> classified as Safe.',
    },
  ];

  return testCases.map((tc) => {
    const res = calculateVisaStatus(tc.days);
    const passed =
      res.status === tc.expectedStatus && res.isExpired === tc.expectedExpired;
    return {
      scenario: tc.scenario,
      daysRemaining: tc.days,
      expectedStatus: tc.expectedStatus,
      actualStatus: res.status,
      expectedExpired: tc.expectedExpired,
      actualExpired: res.isExpired,
      passed,
      explanation: tc.explanation,
    };
  });
}
