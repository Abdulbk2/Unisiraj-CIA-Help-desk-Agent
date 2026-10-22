/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Student,
  ProcessedStudent,
  VisaStatusLevel,
  SummaryMetrics,
  EMGSStatus,
  VisaCategory,
} from '../../types/student';

// Re-export core student types
export type { Student, ProcessedStudent, VisaStatusLevel, SummaryMetrics, EMGSStatus, VisaCategory };

// Reminder Tiers (Aligns with Table 1 of UniSID 2026 paper)
export type ReminderTier = 'TIER_1_90_DAYS' | 'TIER_2_60_DAYS' | 'TIER_3_30_DAYS' | 'OVERDUE_ALERT';
export type WhatsAppTier = ReminderTier;

export type WhatsAppDeliveryStatus = 'DELIVERED' | 'SENT' | 'QUEUED' | 'FAILED' | 'UNDELIVERED' | 'NOT_SENT';

export interface ExtendedStudent extends Student {
  lastNotificationTier?: ReminderTier | null;
  lastNotificationDate?: string | null;
  whatsappDeliveryStatus?: WhatsAppDeliveryStatus;
  contactValidationStatus?: 'VALID' | 'INVALID_FORMAT' | 'UNREACHABLE';
}

// Backend Health & Status
export interface BackendHealthResponse {
  status: 'ok' | 'error' | 'degraded';
  version: string;
  uptimeSeconds?: number;
  environment?: 'development' | 'production';
  timestamp: string;
  databaseConnected?: boolean;
  twilioConfigured?: boolean;
  cloudRunRegion?: string;
}

export interface BackendIntegrationStatus {
  backendReachable: boolean;
  backendBaseUrl: string;
  backendVersion: string;
  cloudRunRegion: string;
  twilioConfigured: boolean;
  twilioProvider?: string;
  twilioPhoneNumberMasked?: string;
  dailySyncScheduler: {
    enabled: boolean;
    frequency: string;
    lastExecuted: string;
    nextExecution: string;
    status: 'ACTIVE' | 'PAUSED' | 'ERROR';
  };
  googleCalendarConfigured: boolean;
  environmentMode: 'DEMO_MOCK' | 'LIVE_FASTAPI';
}
export type IntegrationStatusResponse = BackendIntegrationStatus;

// Dashboard Summary Response
export interface DashboardSummaryResponse {
  metrics: SummaryMetrics;
  lastSyncTimestamp: string;
  nextScheduledSync: string;
  syncJobStatus: 'SUCCESS' | 'IN_PROGRESS' | 'SCHEDULED' | 'FAILED';
  whatsappDeliverySummary: {
    totalDispatched: number;
    deliveredCount: number;
    pendingCount: number;
    failedCount: number;
    deliveryRatePercentage: number;
  };
  recentActivities: Array<{
    id: string;
    timestamp: string;
    type: 'SYNC' | 'WHATSAPP' | 'IMPORT' | 'AGENT_QUERY' | 'CALENDAR';
    description: string;
    actor: string;
    status: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  }>;
  dataSource: 'DEMO_MOCK' | 'LIVE_FASTAPI';
}

// Spreadsheet Ingestion & Validation
export interface SpreadsheetRowPreview {
  rowIndex: number;
  studentName: string;
  matricId: string;
  nationality: string;
  phoneNumber: string;
  visaExpiryDate: string;
  program?: string;
  faculty?: string;
  passportNumber?: string;
}

export interface SpreadsheetPreviewResponse {
  fileName: string;
  fileSize: number;
  detectedHeaders: string[];
  totalRows: number;
  previewRows: Array<Record<string, string>>;
  allRows?: Array<Record<string, string>>;
  suggestedMapping?: ColumnMappingConfig;
  importJobId?: string;
}

export interface ColumnMappingConfig {
  matricId: string;
  fullName: string;
  nationality: string;
  phoneNumber: string;
  visaExpiryDate: string;
  email?: string;
  passportNumber?: string;
  faculty?: string;
  program?: string;
}

export interface SpreadsheetValidationError {
  rowNumber: number;
  matricId?: string;
  field: string;
  value: string;
  reason?: string;
  message?: string;
  severity: 'CRITICAL' | 'WARNING';
}
export type SpreadsheetValidationFeedback = SpreadsheetValidationError;

export interface SpreadsheetValidationResponse {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  duplicateRowsCount: number;
  errors: SpreadsheetValidationError[];
  proposedAdditions: Array<Partial<Student>>;
  proposedUpdates: Array<{
    existingRecord: Partial<Student>;
    incomingRecord: Partial<Student>;
    changedFields: string[];
  }>;
}

export interface SpreadsheetConfirmResponse {
  status?: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  success?: boolean;
  recordsCreated: number;
  recordsUpdated: number;
  recordsRejected: number;
  warnings: string[];
  batchId?: string;
  importJobId?: string;
  completionTimestamp?: string;
  importedAt?: string;
}
export type SpreadsheetImportConfirmResponse = SpreadsheetConfirmResponse;

// Natural Language AI Agent Workspace (Pillar 4)
export interface AgentQueryRequest {
  query: string;
  sessionId?: string;
  includeStudentData?: boolean;
  includeStudentRecords?: boolean;
  filterByFaculty?: string;
  filterByTier?: string;
}

export interface AgentQueryResponse {
  answer: string;
  query?: string;
  responseMarkdown?: string;
  intent: string;
  confidence?: number;
  dataFreshness: string;
  matchedStudents?: ProcessedStudent[];
  relevantStudents?: ProcessedStudent[];
  suggestedFollowups?: string[];
  executionTimeMs?: number;
  dataSource: 'DEMO_MOCK' | 'LIVE_FASTAPI';
}
export type AgentStructuredResponse = AgentQueryResponse;

// WhatsApp Notifications & History (Pillar 3)
export interface WhatsAppEligibleItem {
  student: ProcessedStudent;
  tier: ReminderTier;
  tierLabel: string;
  recommendedAction: string;
  daysRemaining: number;
  phoneNumber: string;
  canSend: boolean;
  contactValidationStatus: 'VALID' | 'INVALID_FORMAT' | 'UNREACHABLE';
}

export interface NotificationLogItem {
  id: string;
  studentId: string;
  studentName: string;
  matricId: string;
  recipientPhoneMasked?: string;
  destinationPhone?: string;
  channel?: 'whatsapp' | 'email' | string;
  tier: ReminderTier;
  tierLabel: string;
  messageContent: string;
  sentAt?: string;
  scheduledAt?: string;
  providerSid?: string;
  providerMessageSid?: string;
  status: WhatsAppDeliveryStatus;
  deliveryStatus?: WhatsAppDeliveryStatus;
  errorMessage?: string;
  daysBeforeExpiry?: number;
  visaExpiryDate?: string;
  dispatchMethod?: 'twilio' | 'demo' | string;
}
export type WhatsAppNotificationRecord = NotificationLogItem;

export interface SendWhatsAppPayload {
  studentId: string;
  tier: ReminderTier;
  customNote?: string;
  matricId?: string;
  studentName?: string;
  destinationPhone?: string;
  customMessage?: string;
  dispatchMethod?: 'twilio' | 'demo';
}
export type SendWhatsAppRequest = SendWhatsAppPayload;

export interface SendWhatsAppResponse {
  success: boolean;
  messageId?: string;
  notificationId?: string;
  providerSid?: string;
  providerMessageSid?: string;
  status?: WhatsAppDeliveryStatus;
  deliveryStatus?: WhatsAppDeliveryStatus;
  recipientPhoneMasked?: string;
  sentAt?: string;
  dispatchedAt?: string;
  message?: string;
  tier?: ReminderTier;
  dispatchMethod?: string;
}

export interface SendEmailPayload {
  studentId?: string;
  student_id?: number;
  toEmail: string;
  subject: string;
  messageBody: string;
  dispatchMethod?: 'smtp' | 'twilio' | 'demo';
}

export interface SendEmailResponse {
  success: boolean;
  notificationId?: string;
  providerSid?: string;
  status?: string;
  recipientEmail?: string;
  sentAt?: string;
  message?: string;
  dispatchMethod?: string;
}

// Reports & Compliance Analytics
export interface ComplianceAnalyticsReport {
  generatedAt: string;
  totalStudents: number;
  overallComplianceRate: number;
  visaTierDistribution: {
    safeCount: number;
    actionNeededCount: number;
    urgentCount: number;
    criticalCount: number;
    expiredCount: number;
  };
  whatsAppDeliveryMetrics: {
    totalSentThisMonth: number;
    deliveredCount: number;
    failedCount: number;
    deliveryRatePercent: number;
  };
  facultyCompliance: Array<{
    facultyName: string;
    totalStudents: number;
    compliantCount: number;
    nonCompliantCount: number;
    complianceRate: number;
  }>;
  nationalityDistribution: Array<{
    country: string;
    countryCode: string;
    studentCount: number;
    flag: string;
  }>;
  overstayRiskIncidentsPrevented: number;
}

// Microsoft Excel Live Integration (Pillar 5)
export interface ExcelStatusResponse {
  is_connected: boolean;
  filename: string;
  filepath: string;
  file_size_bytes: number;
  sheet_names: string[];
  active_sheet: string;
  total_rows: number;
  last_modified?: string;
  last_sync_timestamp?: string;
  sync_status: string;
}

export interface ExcelStudentItem {
  row_index: number;
  matric_id: string;
  student_name: string;
  nationality?: string;
  passport_number?: string;
  visa_expiry_date?: string;
  whatsapp_number?: string;
  faculty?: string;
  program?: string;
  emgs_status?: string;
  days_remaining?: number;
  status?: string;
  notes?: string;
}

export interface ExcelFetchResponse {
  sheet_name: string;
  total_rows: number;
  page: number;
  page_size: number;
  total_pages: number;
  data: ExcelStudentItem[];
}

export interface ExcelSearchResponse {
  query: string;
  total_matches: number;
  matches: ExcelStudentItem[];
}

export interface DiscrepancyItem {
  matric_id: string;
  student_name: string;
  discrepancy_type: 'MISSING_IN_DB' | 'MISSING_IN_EXCEL' | 'FIELD_MISMATCH' | string;
  field_name?: string;
  excel_value?: any;
  db_value?: any;
  description: string;
}

export interface ExcelAnalysisResponse {
  filename: string;
  active_sheet: string;
  total_records: number;
  quality_metrics: {
    missing_dates: number;
    missing_phones: number;
    missing_passports: number;
    invalid_dates: number;
    [key: string]: number;
  };
  visa_status_distribution: {
    SAFE: number;
    ACTION_NEEDED: number;
    URGENT: number;
    CRITICAL: number;
    EXPIRED: number;
    REVIEW_REQUIRED: number;
    [key: string]: number;
  };
  discrepancies: DiscrepancyItem[];
  total_discrepancies: number;
  analyzed_at: string;
}

export interface ExcelSyncRequest {
  direction: 'excel_to_db' | 'db_to_excel';
  sheet_name?: string;
}

export interface ExcelSyncResponse {
  direction: string;
  records_updated: number;
  records_created: number;
  conflicts_resolved: number;
  total_processed: number;
  message: string;
  synced_at: string;
  status: string;
}
