/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VisaStatusLevel = 'CRITICAL' | 'URGENT' | 'ACTION_NEEDED' | 'SAFE';

export type EMGSStatus = 
  | 'Approved' 
  | 'In Progress' 
  | 'Pending Documents' 
  | 'Requires Biometrics' 
  | 'Not Started';

export type VisaCategory = 
  | 'Student Pass (Degree)' 
  | 'Student Pass (Postgraduate)' 
  | 'Student Pass (Foundation)' 
  | 'Student Pass (Research)' 
  | 'Dependent Pass';

export interface Student {
  id: string;
  matricId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nationality: string;
  countryCode: string;
  passportNumber: string;
  program: string;
  faculty: string;
  visaCategory: VisaCategory;
  visaExpiryDate: string; // ISO YYYY-MM-DD
  lastRenewalDate?: string;
  emgsStatus: EMGSStatus;
  notes?: string;
  advisorName?: string;
  sponsorType?: 'Self-Funded' | 'University Scholarship' | 'Government Sponsored' | 'MoHE Grant';
}

export interface StatusCalculationResult {
  status: VisaStatusLevel;
  daysRemaining: number;
  label: string;
  badgeText: string;
  isExpired: boolean;
  isExpiringToday: boolean;
  severityColor: 'red' | 'orange' | 'amber' | 'green';
}

export interface ProcessedStudent extends Student {
  daysRemaining: number;
  status: VisaStatusLevel;
  statusLabel: string;
  isExpired: boolean;
  isExpiringToday: boolean;
  formattedExpiryDate: string;
}

export interface SummaryMetrics {
  totalStudents: number;
  totalActiveVisas: number;
  expiringIn90Days: number; // <= 90 days & not expired
  urgentCases: number;      // < 60 days & not expired
  criticalCases: number;    // < 30 days OR expired
  expiredVisas: number;     // < 0 days
  safeVisas: number;        // > 90 days
}

export type SortField = 'expiryDate' | 'daysRemaining' | 'fullName' | 'matricId';
export type SortOrder = 'asc' | 'desc';

export interface CalendarEventPayload {
  summary: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  studentName: string;
  matricId: string;
  actionRequired: string;
}
