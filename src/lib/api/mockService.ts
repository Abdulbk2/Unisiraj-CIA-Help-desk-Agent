/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, ProcessedStudent } from '../../types/student';
import {
  DashboardSummaryResponse,
  SpreadsheetPreviewResponse,
  ColumnMappingConfig,
  SpreadsheetValidationResponse,
  SpreadsheetConfirmResponse,
  AgentQueryResponse,
  WhatsAppEligibleItem,
  NotificationLogItem,
  SendWhatsAppPayload,
  SendWhatsAppResponse,
  BackendIntegrationStatus,
  ReminderTier,
  ExcelStatusResponse,
  ExcelStudentItem,
  ExcelFetchResponse,
  ExcelSearchResponse,
  ExcelAnalysisResponse,
  ExcelSyncResponse,
  DiscrepancyItem,
} from './types';
import { processStudentRecords, calculateSummaryMetrics } from '../../utils/visaRules';
import { INITIAL_MOCK_STUDENTS, getOffsetDateString } from '../../data/mockStudents';

// In-memory persistent state for Demo Mode
let mockStudentsState: Student[] = [...INITIAL_MOCK_STUDENTS];

let mockExcelStudentsState: ExcelStudentItem[] = [
  {
    row_index: 2,
    matric_id: 'UIS-2023-INT084',
    student_name: 'Tariq Al-Mansoor',
    nationality: 'Yemen',
    passport_number: '09482103',
    visa_expiry_date: '2026-10-06',
    whatsapp_number: '+601123456789',
    faculty: 'Faculty of Islamic Economics & Business',
    program: 'Bachelor of Islamic Finance (Hons)',
    emgs_status: 'In Progress',
    days_remaining: -14,
    status: 'EXPIRED',
    notes: 'Urgent passport renewal recommended',
  },
  {
    row_index: 3,
    matric_id: 'UIS-2022-INT192',
    student_name: 'Fatima Al-Zahra',
    nationality: 'Indonesia',
    passport_number: 'ID8492019',
    visa_expiry_date: '2026-10-25',
    whatsapp_number: '+601234567890',
    faculty: 'Faculty of Shariah & Law',
    program: 'Master of Comparative Law',
    emgs_status: 'Approved',
    days_remaining: 5,
    status: 'CRITICAL',
    notes: 'Biometric verification completed',
  },
  {
    row_index: 4,
    matric_id: 'UIS-2023-INT045',
    student_name: 'Amina Zainab Bello',
    nationality: 'Nigeria',
    passport_number: 'A09283411',
    visa_expiry_date: '2026-11-02',
    whatsapp_number: '+601245678901',
    faculty: 'Faculty of Computing & Informatics',
    program: 'Bachelor of Computer Science',
    emgs_status: 'Requires Biometrics',
    days_remaining: 13,
    status: 'CRITICAL',
    notes: 'Awaiting Val extension approval',
  },
  {
    row_index: 5,
    matric_id: 'UIS-2024-INT301',
    student_name: 'Muhammad Bilal Khan',
    nationality: 'Pakistan',
    passport_number: 'PK9102834',
    visa_expiry_date: '2026-11-18',
    whatsapp_number: '+601356789012',
    faculty: 'Faculty of Islamic Economics & Business',
    program: 'Bachelor of Halal Industry Management',
    emgs_status: 'In Progress',
    days_remaining: 29,
    status: 'URGENT',
    notes: 'Document review queued',
  },
  {
    row_index: 6,
    matric_id: 'UIS-2022-INT012',
    student_name: 'Nour Al-Huda Mansouri',
    nationality: 'Syria',
    passport_number: 'N7839201',
    visa_expiry_date: '2026-12-05',
    whatsapp_number: '+601467890123',
    faculty: 'Faculty of Quranic & Sunnah Studies',
    program: 'PhD in Quranic Exegesis',
    emgs_status: 'In Progress',
    days_remaining: 46,
    status: 'URGENT',
    notes: 'Tier 2 notification delivered',
  },
  {
    row_index: 7,
    matric_id: 'UIS-2023-INT119',
    student_name: 'Khaled Omar Al-Sayed',
    nationality: 'Egypt',
    passport_number: 'EG4829103',
    visa_expiry_date: '2026-12-14',
    whatsapp_number: '+601578901234',
    faculty: 'Faculty of Shariah & Law',
    program: 'Bachelor of Islamic Jurisprudence',
    emgs_status: 'Approved',
    days_remaining: 55,
    status: 'ACTION_NEEDED',
    notes: 'Sticker endorsement pending',
  },
  {
    row_index: 8,
    matric_id: 'UIS-2024-INT008',
    student_name: 'Zayd Ibrahim Toure',
    nationality: 'Mali',
    passport_number: 'ML2938471',
    visa_expiry_date: '2026-12-28',
    whatsapp_number: '+601689012345',
    faculty: 'Faculty of Education & Human Sciences',
    program: 'Master of Islamic Education',
    emgs_status: 'Not Started',
    days_remaining: 69,
    status: 'ACTION_NEEDED',
    notes: 'Student advised on fee settlement',
  },
  {
    row_index: 9,
    matric_id: 'UIS-2021-INT099',
    student_name: 'Maryam Hassan Dahir',
    nationality: 'Somalia',
    passport_number: 'SO9384712',
    visa_expiry_date: '2027-01-10',
    whatsapp_number: '+601790123456',
    faculty: 'Faculty of Computing & Informatics',
    program: 'Master of Data Science',
    emgs_status: 'Approved',
    days_remaining: 82,
    status: 'SAFE',
    notes: 'Compliance milestone cleared',
  },
  {
    row_index: 10,
    matric_id: 'UIS-2023-INT204',
    student_name: 'Rashid Ahmed Chowdhury',
    nationality: 'Bangladesh',
    passport_number: 'BD5839201',
    visa_expiry_date: '2027-01-15',
    whatsapp_number: '+601801234567',
    faculty: 'Faculty of Islamic Economics & Business',
    program: 'Bachelor of Islamic Banking',
    emgs_status: 'In Progress',
    days_remaining: 87,
    status: 'SAFE',
    notes: 'Tier 1 advisory dispatched',
  },
  {
    row_index: 11,
    matric_id: 'UIS-2024-INT155',
    student_name: 'Siti Nurul Hidayah',
    nationality: 'Brunei',
    passport_number: 'BN4829104',
    visa_expiry_date: '2027-02-01',
    whatsapp_number: '+601912345678',
    faculty: 'Faculty of Shariah & Law',
    program: 'Bachelor of Fiqh & Fatwa',
    emgs_status: 'Not Started',
    days_remaining: 104,
    status: 'SAFE',
    notes: 'Initial checklist reviewed',
  },
  {
    row_index: 12,
    matric_id: 'UIS-2023-INT067',
    student_name: 'Hamza Mansour Al-Houthi',
    nationality: 'Yemen',
    passport_number: 'YE982341',
    visa_expiry_date: '2026-10-14',
    whatsapp_number: '+601145678901',
    faculty: 'Faculty of Shariah & Law',
    program: 'Bachelor of Fiqh & Usul (Hons)',
    emgs_status: 'Requires Biometrics',
    days_remaining: -6,
    status: 'EXPIRED',
    notes: 'High-priority embassy attestation',
  },
  {
    row_index: 13,
    matric_id: 'UIS-2023-INT502',
    student_name: 'Zulaikha binti Abdul Rahman',
    nationality: 'Indonesia',
    passport_number: 'ID829104',
    visa_expiry_date: '2026-11-20',
    whatsapp_number: '+601789012345',
    faculty: 'Faculty of Islamic Economics & Business',
    program: 'Bachelor of Islamic Finance',
    emgs_status: 'In Progress',
    days_remaining: 31,
    status: 'URGENT',
    notes: 'Renewal follow-up scheduled',
  },
  {
    row_index: 14,
    matric_id: 'UIS-2024-INT503',
    student_name: 'Ibrahim Musa Danjuma',
    nationality: 'Nigeria',
    passport_number: 'NG482910',
    visa_expiry_date: '2026-12-19',
    whatsapp_number: '+601890123456',
    faculty: 'Faculty of Computing & Informatics',
    program: 'Bachelor of Computer Science',
    emgs_status: 'Not Started',
    days_remaining: 60,
    status: 'ACTION_NEEDED',
    notes: 'Notice delivered via WhatsApp',
  },
  {
    row_index: 15,
    matric_id: 'UIS-2024-INT504',
    student_name: 'Aysha Siddiqua',
    nationality: 'Bangladesh',
    passport_number: 'BD729104',
    visa_expiry_date: '2027-02-15',
    whatsapp_number: '+601401234567',
    faculty: 'Faculty of Quranic & Islamic Studies',
    program: 'Master of Sunnah Studies',
    emgs_status: 'Approved',
    days_remaining: 118,
    status: 'SAFE',
    notes: 'Valid student pass in place',
  },
];

let mockNotificationHistory: NotificationLogItem[] = [
  {
    id: 'notif-001',
    studentId: 'stu-001',
    matricId: 'UIS-2023-INT084',
    studentName: 'Tariq Al-Mansoor',
    recipientPhoneMasked: '+60 11-**** 6789',
    tier: 'OVERDUE_ALERT',
    tierLabel: 'Emergency Overstay Notice',
    messageContent:
      'UniSIRAJ CIA URGENT: Tariq Al-Mansoor (UIS-2023-INT084), your Student Pass has EXPIRED. Please report to CIA Helpdesk immediately to avoid compounding fines (RM1,100 - RM3,100).',
    sentAt: '2026-10-14T09:15:22Z',
    providerSid: 'SM9a7b8c6e4f3a2b10987654321fedcba',
    status: 'DELIVERED',
  },
  {
    id: 'notif-002',
    studentId: 'stu-002',
    matricId: 'UIS-2024-INT119',
    studentName: 'Amina Zainab Bello',
    recipientPhoneMasked: '+60 12-**** 4321',
    tier: 'TIER_3_30_DAYS',
    tierLabel: 'Tier 3 (30-Day Critical Reminder)',
    messageContent:
      'UniSIRAJ CIA NOTICE: Amina Zainab Bello, your Student Pass expires TODAY (14 Oct 2026). Special Pass application required at Putrajaya Immigration. CIA agent assigned for walk-in.',
    sentAt: '2026-10-14T08:00:10Z',
    providerSid: 'SM8b7c6d5e4f3a2b10987654321fedcbb',
    status: 'DELIVERED',
  },
  {
    id: 'notif-003',
    studentId: 'stu-003',
    matricId: 'UIS-2023-INT042',
    studentName: 'Fajar Nurul Huda',
    recipientPhoneMasked: '+60 17-**** 7890',
    tier: 'TIER_3_30_DAYS',
    tierLabel: 'Tier 3 (30-Day Critical Reminder)',
    messageContent:
      'UniSIRAJ CIA Reminder: Fajar Nurul Huda (UIS-2023-INT042), 9 days remaining on your Student Pass. Passport endorsement scheduled with state immigration office.',
    sentAt: '2026-10-13T10:30:00Z',
    providerSid: 'SM7c6d5e4f3a2b10987654321fedcbc',
    status: 'DELIVERED',
  },
  {
    id: 'notif-004',
    studentId: 'stu-007',
    matricId: 'UIS-2023-INT156',
    studentName: 'Tanvir Hossain',
    recipientPhoneMasked: '+60 13-**** 1234',
    tier: 'TIER_2_60_DAYS',
    tierLabel: 'Tier 2 (60-Day Renewal Follow-up)',
    messageContent:
      'UniSIRAJ CIA Reminder: Tanvir Hossain, 44 days remaining on your Student Pass. Please complete and submit your EMGS renewal documents without further delay.',
    sentAt: '2026-10-12T14:22:45Z',
    providerSid: 'SM6d5e4f3a2b10987654321fedcbd',
    status: 'DELIVERED',
  },
  {
    id: 'notif-005',
    studentId: 'stu-004',
    matricId: 'UIS-2022-INT008',
    studentName: 'Zhang Wei (Rashid)',
    recipientPhoneMasked: '+60 19-**** 8901',
    tier: 'TIER_3_30_DAYS',
    tierLabel: 'Tier 3 (30-Day Critical Reminder)',
    messageContent:
      'UniSIRAJ CIA Reminder: Zhang Wei (Rashid), 19 days remaining on your Student Pass. Medical screening clearance slip required at CIA.',
    sentAt: '2026-10-11T16:05:12Z',
    providerSid: 'SM5e4f3a2b10987654321fedcbe',
    status: 'FAILED',
    errorMessage: 'Carrier route temporary rejection: Handset unreachable (Error 30008)',
  },
];

let lastSyncTime = '2026-10-14 06:00:00 MYT (UTC+8)';
let nextSyncTime = '2026-10-15 06:00:00 MYT (UTC+8)';

export const mockService = {
  // 1. GET Dashboard Summary
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    await new Promise((r) => setTimeout(r, 180));
    const processed = processStudentRecords(mockStudentsState);
    const metrics = calculateSummaryMetrics(processed);

    const deliveredCount = mockNotificationHistory.filter((n) => n.status === 'DELIVERED').length;
    const failedCount = mockNotificationHistory.filter((n) => n.status === 'FAILED').length;
    const pendingCount = mockNotificationHistory.filter((n) => n.status === 'QUEUED' || n.status === 'SENT').length;
    const total = mockNotificationHistory.length;

    return {
      metrics,
      lastSyncTimestamp: lastSyncTime,
      nextScheduledSync: nextSyncTime,
      syncJobStatus: 'SUCCESS',
      whatsappDeliverySummary: {
        totalDispatched: total,
        deliveredCount,
        pendingCount,
        failedCount,
        deliveryRatePercentage: total > 0 ? Math.round((deliveredCount / total) * 100) : 100,
      },
      recentActivities: [
        {
          id: 'act-1',
          timestamp: 'Today at 06:00 AM',
          type: 'SYNC',
          description: 'Daily automated synchronisation completed (14 records evaluated against Malaysian immigration calendar).',
          actor: 'System Cron (Cloud Run)',
          status: 'SUCCESS',
        },
        {
          id: 'act-2',
          timestamp: 'Today at 08:00 AM',
          type: 'WHATSAPP',
          description: 'Dispatched Tier 3 urgent reminder to Amina Zainab Bello (+60 12-**** 4321).',
          actor: 'Twilio WhatsApp Service',
          status: 'INFO',
        },
        {
          id: 'act-3',
          timestamp: 'Yesterday at 04:15 PM',
          type: 'CALENDAR',
          description: 'Synced visa deadline event for Tariq Al-Mansoor into Google Calendar.',
          actor: 'Admin (abdryahaya019@gmail.com)',
          status: 'SUCCESS',
        },
        {
          id: 'act-4',
          timestamp: 'Yesterday at 02:40 PM',
          type: 'IMPORT',
          description: 'Spreadsheet audit verified: 14 active passes, 0 unmapped headers.',
          actor: 'CIA Admin User',
          status: 'INFO',
        },
      ],
      dataSource: 'DEMO_MOCK',
    };
  },

  // 2. GET Student Records
  async getStudents(): Promise<Student[]> {
    await new Promise((r) => setTimeout(r, 150));
    return [...mockStudentsState];
  },

  // 3. Add or Update Student Record
  async saveStudent(student: Student): Promise<Student> {
    await new Promise((r) => setTimeout(r, 200));
    const idx = mockStudentsState.findIndex(
      (s) => (student.id && s.id === student.id) || (student.matricId && s.matricId === student.matricId)
    );
    if (idx >= 0) {
      mockStudentsState[idx] = { ...mockStudentsState[idx], ...student };
    } else {
      mockStudentsState.unshift(student);
    }
    return student;
  },

  // 4. Ingest & Preview Spreadsheet
  async previewSpreadsheetFile(file: File): Promise<SpreadsheetPreviewResponse> {
    await new Promise((r) => setTimeout(r, 350));
    return {
      fileName: file.name || 'UniSIRAJ_International_Students_2026_Semester1.xlsx',
      fileSize: file.size || 48200,
      detectedHeaders: [
        'Matric ID',
        'Student Name',
        'Nationality',
        'Phone Number',
        'Passport No',
        'Visa Expiry Date',
        'Faculty',
        'Program',
        'EMGS Status',
      ],
      totalRows: 6,
      previewRows: [
        {
          'Matric ID': 'UIS-2024-INT501',
          'Student Name': 'Hamza Mansour Al-Houthi',
          'Nationality': 'Yemen',
          'Phone Number': '+60 11-4567 8901',
          'Passport No': 'YE982341',
          'Visa Expiry Date': getOffsetDateString(25),
          'Faculty': 'Faculty of Shariah & Law',
          'Program': 'Bachelor of Fiqh & Usul (Hons)',
          'EMGS Status': 'Requires Biometrics',
        },
        {
          'Matric ID': 'UIS-2023-INT502',
          'Student Name': 'Zulaikha binti Abdul Rahman',
          'Nationality': 'Indonesia',
          'Phone Number': '+60 17-8901 2345',
          'Passport No': 'ID829104',
          'Visa Expiry Date': getOffsetDateString(55),
          'Faculty': 'Faculty of Islamic Economics & Business',
          'Program': 'Bachelor of Islamic Finance',
          'EMGS Status': 'In Progress',
        },
        {
          'Matric ID': 'UIS-2024-INT503',
          'Student Name': 'Ibrahim Musa Danjuma',
          'Nationality': 'Nigeria',
          'Phone Number': '+60 18-9012 3456',
          'Passport No': 'NG482910',
          'Visa Expiry Date': getOffsetDateString(85),
          'Faculty': 'Faculty of Computing & Informatics',
          'Program': 'Bachelor of Computer Science',
          'EMGS Status': 'Not Started',
        },
        {
          'Matric ID': 'UIS-2024-INT504',
          'Student Name': 'Aysha Siddiqua',
          'Nationality': 'Bangladesh',
          'Phone Number': '+60 14-0123 4567',
          'Passport No': 'BD729104',
          'Visa Expiry Date': getOffsetDateString(120),
          'Faculty': 'Faculty of Quranic & Islamic Studies',
          'Program': 'Master of Sunnah Studies',
          'EMGS Status': 'Approved',
        },
        {
          'Matric ID': 'UIS-2024-INT505',
          'Student Name': 'Chen Xiang (Idris)',
          'Nationality': 'China',
          'Phone Number': '0198887766', // Format without international code for validation demonstration
          'Passport No': 'CN918273',
          'Visa Expiry Date': '2026/11/30', // Non-standard format
          'Faculty': 'Faculty of Food Science & Technology',
          'Program': 'Bachelor of Halal Food Science',
          'EMGS Status': 'Pending Documents',
        },
        {
          'Matric ID': 'UIS-2023-INT084', // Duplicate of existing Tariq Al-Mansoor
          'Student Name': 'Tariq Al-Mansoor',
          'Nationality': 'Yemen',
          'Phone Number': '+60 11-2345 6789',
          'Passport No': '09482103',
          'Visa Expiry Date': getOffsetDateString(-12),
          'Faculty': 'Faculty of Islamic Economics & Business',
          'Program': 'Bachelor of Islamic Finance (Hons)',
          'EMGS Status': 'Requires Biometrics',
        },
      ],
    };
  },

  // 5. Validate Spreadsheet Records
  async validateSpreadsheet(
    mapping: ColumnMappingConfig,
    rows: Array<Record<string, string>>
  ): Promise<SpreadsheetValidationResponse> {
    await new Promise((r) => setTimeout(r, 450));

    const errors: SpreadsheetValidationResponse['errors'] = [
      {
        rowNumber: 5,
        matricId: 'UIS-2024-INT505',
        field: 'Phone Number',
        value: '0198887766',
        reason: 'Missing international dialling code prefix "+60" required for WhatsApp delivery.',
        severity: 'WARNING',
      },
      {
        rowNumber: 5,
        matricId: 'UIS-2024-INT505',
        field: 'Visa Expiry Date',
        value: '2026/11/30',
        reason: 'Non-standard slash delimiter format; normalized automatically to ISO YYYY-MM-DD.',
        severity: 'WARNING',
      },
      {
        rowNumber: 6,
        matricId: 'UIS-2023-INT084',
        field: 'Matriculation ID',
        value: 'UIS-2023-INT084',
        reason: 'Duplicate student record detected in active database (Tariq Al-Mansoor). Will update existing entry.',
        severity: 'WARNING',
      },
    ];

    const proposedAdditions: Partial<Student>[] = [
      {
        matricId: 'UIS-2024-INT501',
        fullName: 'Hamza Mansour Al-Houthi',
        nationality: 'Yemen',
        countryCode: 'YE',
        phoneNumber: '+60 11-4567 8901',
        passportNumber: 'YE982341',
        visaExpiryDate: getOffsetDateString(25),
        faculty: 'Faculty of Shariah & Law',
        program: 'Bachelor of Fiqh & Usul (Hons)',
      },
      {
        matricId: 'UIS-2023-INT502',
        fullName: 'Zulaikha binti Abdul Rahman',
        nationality: 'Indonesia',
        countryCode: 'ID',
        phoneNumber: '+60 17-8901 2345',
        passportNumber: 'ID829104',
        visaExpiryDate: getOffsetDateString(55),
        faculty: 'Faculty of Islamic Economics & Business',
        program: 'Bachelor of Islamic Finance',
      },
      {
        matricId: 'UIS-2024-INT503',
        fullName: 'Ibrahim Musa Danjuma',
        nationality: 'Nigeria',
        countryCode: 'NG',
        phoneNumber: '+60 18-9012 3456',
        passportNumber: 'NG482910',
        visaExpiryDate: getOffsetDateString(85),
        faculty: 'Faculty of Computing & Informatics',
        program: 'Bachelor of Computer Science',
      },
      {
        matricId: 'UIS-2024-INT504',
        fullName: 'Aysha Siddiqua',
        nationality: 'Bangladesh',
        countryCode: 'BD',
        phoneNumber: '+60 14-0123 4567',
        passportNumber: 'BD729104',
        visaExpiryDate: getOffsetDateString(120),
        faculty: 'Faculty of Quranic & Islamic Studies',
        program: 'Master of Sunnah Studies',
      },
      {
        matricId: 'UIS-2024-INT505',
        fullName: 'Chen Xiang (Idris)',
        nationality: 'China',
        countryCode: 'CN',
        phoneNumber: '+60 19-888 7766',
        passportNumber: 'CN918273',
        visaExpiryDate: '2026-11-30',
        faculty: 'Faculty of Food Science & Technology',
        program: 'Bachelor of Halal Food Science',
      },
    ];

    const proposedUpdates = [
      {
        existingRecord: {
          matricId: 'UIS-2023-INT084',
          fullName: 'Tariq Al-Mansoor',
          notes: 'Urgent passport renewal submission required.',
        },
        incomingRecord: {
          matricId: 'UIS-2023-INT084',
          fullName: 'Tariq Al-Mansoor',
          notes: 'EMGS visa renewal halted at 35% stage; re-verified via spreadsheet audit.',
        },
        changedFields: ['EMGS Status', 'Audit Timestamp'],
      },
    ];

    return {
      totalRows: rows.length || 6,
      validRowsCount: 5,
      invalidRowsCount: 0,
      duplicateRowsCount: 1,
      errors,
      proposedAdditions,
      proposedUpdates,
    };
  },

  // 6. Confirm & Commit Spreadsheet Ingestion
  async confirmSpreadsheetImport(
    validated: SpreadsheetValidationResponse
  ): Promise<SpreadsheetConfirmResponse> {
    await new Promise((r) => setTimeout(r, 600));

    // Append proposed additions to mock state
    validated.proposedAdditions.forEach((p: any, idx: number) => {
      const newStudent: Student = {
        id: `stu-import-${Date.now()}-${idx}`,
        matricId: p.matricId || `UIS-2026-INT${idx}`,
        fullName: p.fullName || 'New Imported Student',
        email: `${(p.matricId || 'student').toLowerCase()}@student.unisiraj.edu.my`,
        phoneNumber: p.phoneNumber || '+60 12-0000 000',
        nationality: p.nationality || 'International',
        countryCode: p.countryCode || 'INT',
        passportNumber: p.passportNumber || 'P999999',
        program: p.program || 'General Academic Studies',
        faculty: p.faculty || 'International Centre',
        visaCategory: 'Student Pass (Degree)',
        visaExpiryDate: p.visaExpiryDate || getOffsetDateString(60),
        emgsStatus: 'In Progress',
        notes: 'Ingested via UniSIRAJ automated spreadsheet ingestion pipeline.',
        advisorName: 'Assigned CIA Officer',
        sponsorType: 'Self-Funded',
      };
      mockStudentsState.push(newStudent);
    });

    return {
      status: 'SUCCESS',
      recordsCreated: validated.proposedAdditions.length,
      recordsUpdated: validated.proposedUpdates.length,
      recordsRejected: 0,
      warnings: ['Phone number formatted to E.164 standard for WhatsApp delivery.'],
      batchId: `BATCH-${Date.now().toString().slice(-6)}`,
      completionTimestamp: new Date().toISOString(),
    };
  },

  // 7. Natural Language AI Agent Query
  async queryAiAgent(question: string): Promise<AgentQueryResponse> {
    await new Promise((r) => setTimeout(r, 650));
    const processed = processStudentRecords(mockStudentsState);
    const qLower = question.toLowerCase();

    // Query 1: 30 days
    if (qLower.includes('30') || qLower.includes('month') || qLower.includes('critical')) {
      const matches = processed.filter((s) => s.daysRemaining >= 0 && s.daysRemaining <= 30);
      return {
        answer: `Identified ${matches.length} international student(s) whose Student Passes expire within the critical 30-day window. These students require immediate administrative intervention and Tier 3 WhatsApp notifications to prevent overstay penalties (RM1,100 to RM3,100 compound).`,
        intent: 'EXPIRING_SOON',
        confidence: 0.98,
        dataFreshness: 'Live calculation as of current system time',
        matchedStudents: matches,
        suggestedFollowups: [
          'Send Tier 3 WhatsApp reminder to these students',
          'Sync their expiry deadlines to Google Calendar',
          'Generate official overstay warning letters',
        ],
        executionTimeMs: 142,
        dataSource: 'DEMO_MOCK',
      };
    }

    // Query 2: Renewal reminder
    if (qLower.includes('reminder') || qLower.includes('renewal')) {
      const matches = processed.filter((s) => s.daysRemaining >= 0 && s.daysRemaining <= 90);
      return {
        answer: `There are currently ${matches.length} students within the active 90-day renewal window (Tiers 1, 2, and 3). In accordance with Malaysian Immigration and EMGS regulations, renewal processing should commence 3 months prior to expiry.`,
        intent: 'REMINDER_STATUS',
        confidence: 0.96,
        dataFreshness: 'Synchronised at 06:00 MYT today',
        matchedStudents: matches,
        suggestedFollowups: [
          'Show students needing Tier 1 (90-day) early reminders',
          'Show students needing Tier 2 (60-day) follow-up reminders',
          'Show students needing Tier 3 (30-day) urgent reminders',
        ],
        executionTimeMs: 185,
        dataSource: 'DEMO_MOCK',
      };
    }

    // Query 3: Expired visas
    if (qLower.includes('expired') || qLower.includes('overstay')) {
      const matches = processed.filter((s) => s.daysRemaining < 0);
      return {
        answer: `Alert: Found ${matches.length} student record(s) with EXPIRED Student Passes. These individuals must be referred immediately to the CIA enforcement desk and Putrajaya Immigration for Special Pass regularisation. Compounding charges apply if unaddressed.`,
        intent: 'EXPIRED_QUERY',
        confidence: 0.99,
        dataFreshness: 'Continuous monitoring active',
        matchedStudents: matches,
        suggestedFollowups: [
          'View Tariq Al-Mansoor overstay report',
          'Download immigration enforcement referral dossier',
          'Check WhatsApp overstay dispatch logs',
        ],
        executionTimeMs: 110,
        dataSource: 'DEMO_MOCK',
      };
    }

    // Query 4: Invalid phone numbers
    if (qLower.includes('phone') || qLower.includes('invalid') || qLower.includes('contact')) {
      const matches = processed.filter(
        (s) => !s.phoneNumber.startsWith('+60') && !s.phoneNumber.startsWith('+')
      );
      return {
        answer: `Phone number audit complete: ${
          matches.length > 0
            ? `${matches.length} record(s) flagged with invalid or unstandardized international phone numbers.`
            : 'All 14 active student records contain valid E.164 formatted contact numbers suitable for Twilio WhatsApp delivery.'
        }`,
        intent: 'INVALID_CONTACTS',
        confidence: 0.94,
        dataFreshness: 'Audit verified',
        matchedStudents: matches,
        suggestedFollowups: [
          'Verify WhatsApp opt-in status',
          'Export contact verification checklist',
        ],
        executionTimeMs: 130,
        dataSource: 'DEMO_MOCK',
      };
    }

    // Query 5: Failed notifications
    if (qLower.includes('failed') || qLower.includes('whatsapp') || qLower.includes('delivery')) {
      const failed = mockNotificationHistory.filter((n) => n.status === 'FAILED');
      return {
        answer: `WhatsApp delivery review: Found ${failed.length} failed delivery out of ${mockNotificationHistory.length} total dispatches (90% overall delivery success rate). Failed recipient: Zhang Wei (UIS-2022-INT008) due to temporary carrier handset unreachability (Error 30008).`,
        intent: 'REMINDER_STATUS',
        confidence: 0.97,
        dataFreshness: 'Twilio webhook sync active',
        matchedStudents: processed.filter((s) => s.matricId === 'UIS-2022-INT008'),
        suggestedFollowups: [
          'Retry WhatsApp delivery to Zhang Wei',
          'Send fallback email notification',
          'View full notification history audit log',
        ],
        executionTimeMs: 160,
        dataSource: 'DEMO_MOCK',
      };
    }

    // Default / General compliance query
    const urgentCount = processed.filter((s) => s.status === 'CRITICAL' || s.status === 'URGENT').length;
    return {
      answer: `UniSIRAJ CIA compliance summary: Monitoring ${processed.length} international students across 5 faculties. There are currently ${urgentCount} high-priority cases requiring administrative follow-up. The automated daily expiry synchroniser runs daily at 06:00 MYT on Google Cloud Run.`,
      intent: 'GENERAL_COMPLIANCE',
      confidence: 0.92,
      dataFreshness: 'Daily sync active',
      matchedStudents: processed.slice(0, 5),
      suggestedFollowups: [
        'Which students visas expire within 30 days?',
        'Which students need a renewal reminder?',
        'How many expired visas are in the system?',
      ],
      executionTimeMs: 195,
      dataSource: 'DEMO_MOCK',
    };
  },

  // 8. WhatsApp Eligible List
  async getWhatsAppEligibleList(): Promise<WhatsAppEligibleItem[]> {
    await new Promise((r) => setTimeout(r, 200));
    const processed = processStudentRecords(mockStudentsState);

    const eligible: WhatsAppEligibleItem[] = [];

    processed.forEach((s) => {
      if (s.daysRemaining < 0) {
        eligible.push({
          student: s,
          tier: 'OVERDUE_ALERT',
          tierLabel: 'Expired Pass Overstay Notice',
          recommendedAction: 'Urgent notice: Advise immediate walk-in to prevent compounding penalties.',
          daysRemaining: s.daysRemaining,
          phoneNumber: s.phoneNumber,
          canSend: true,
          contactValidationStatus: 'VALID',
        });
      } else if (s.daysRemaining <= 30) {
        eligible.push({
          student: s,
          tier: 'TIER_3_30_DAYS',
          tierLabel: 'Tier 3 (30-Day Critical Reminder)',
          recommendedAction: 'Final urgent reminder highlighting imminent expiry and consequence of overstaying.',
          daysRemaining: s.daysRemaining,
          phoneNumber: s.phoneNumber,
          canSend: true,
          contactValidationStatus: 'VALID',
        });
      } else if (s.daysRemaining <= 60) {
        eligible.push({
          student: s,
          tier: 'TIER_2_60_DAYS',
          tierLabel: 'Tier 2 (60-Day Renewal Follow-up)',
          recommendedAction: 'Follow-up reminder to complete and submit the renewal application without delay.',
          daysRemaining: s.daysRemaining,
          phoneNumber: s.phoneNumber,
          canSend: true,
          contactValidationStatus: 'VALID',
        });
      } else if (s.daysRemaining <= 90) {
        eligible.push({
          student: s,
          tier: 'TIER_1_90_DAYS',
          tierLabel: 'Tier 1 (90-Day Early Reminder)',
          recommendedAction: 'Early reminder that renewal window has opened; advise document preparation.',
          daysRemaining: s.daysRemaining,
          phoneNumber: s.phoneNumber,
          canSend: true,
          contactValidationStatus: 'VALID',
        });
      }
    });

    return eligible.sort((a, b) => a.daysRemaining - b.daysRemaining);
  },

  // 9. Send WhatsApp Message (Simulated Twilio REST endpoint)
  async sendWhatsAppMessage(payload: SendWhatsAppPayload): Promise<SendWhatsAppResponse> {
    await new Promise((r) => setTimeout(r, 650));
    const student = mockStudentsState.find((s) => s.id === payload.studentId);
    if (!student) {
      throw new Error(`Student with ID ${payload.studentId} not found.`);
    }

    const sid = `SM${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    const phoneMasked = student.phoneNumber.replace(/(\+\d{2}\s\d{2}-)\d{4}(\s\d{4})/, '$1****$2');

    const logEntry: NotificationLogItem = {
      id: `notif-${Date.now()}`,
      studentId: student.id,
      matricId: student.matricId,
      studentName: student.fullName,
      recipientPhoneMasked: phoneMasked,
      tier: payload.tier,
      tierLabel:
        payload.tier === 'OVERDUE_ALERT'
          ? 'Emergency Overstay Notice'
          : payload.tier === 'TIER_3_30_DAYS'
          ? 'Tier 3 (30-Day Critical Reminder)'
          : payload.tier === 'TIER_2_60_DAYS'
          ? 'Tier 2 (60-Day Renewal Follow-up)'
          : 'Tier 1 (90-Day Early Reminder)',
      messageContent: `[UniSIRAJ CIA WhatsApp Bot] Formal Visa Compliance Notice for ${student.fullName} (${student.matricId}). Expiry date: ${student.visaExpiryDate}.`,
      sentAt: new Date().toISOString(),
      providerSid: sid,
      status: 'DELIVERED',
    };

    mockNotificationHistory.unshift(logEntry);

    return {
      success: true,
      messageId: `msg-${Date.now()}`,
      providerSid: sid,
      status: 'DELIVERED',
      recipientPhoneMasked: phoneMasked,
      sentAt: logEntry.sentAt,
      tier: payload.tier,
    };
  },

  // 10. GET Notification History
  async getNotificationHistory(): Promise<NotificationLogItem[]> {
    await new Promise((r) => setTimeout(r, 160));
    return [...mockNotificationHistory];
  },

  // 11. GET Integration Status
  async getIntegrationStatus(): Promise<BackendIntegrationStatus> {
    await new Promise((r) => setTimeout(r, 120));
    return {
      backendReachable: true,
      backendBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      backendVersion: 'FastAPI v0.111.0 (Python 3.11 / Cloud Run)',
      cloudRunRegion: 'asia-southeast1 (Singapore)',
      twilioConfigured: true,
      twilioPhoneNumberMasked: '+1 (415) ***-4886 (WhatsApp Sandbox)',
      dailySyncScheduler: {
        enabled: true,
        frequency: 'Daily at 06:00 MYT (Cron: 0 22 * * *)',
        lastExecuted: lastSyncTime,
        nextExecution: nextSyncTime,
        status: 'ACTIVE',
      },
      googleCalendarConfigured: true,
      environmentMode: 'DEMO_MOCK',
    };
  },

  // 12. Trigger Manual Daily Synchronisation
  async triggerDailySync(): Promise<{ success: boolean; message: string; timestamp: string }> {
    await new Promise((r) => setTimeout(r, 700));
    const now = new Date();
    lastSyncTime = `${now.toISOString().replace('T', ' ').substring(0, 19)} MYT`;
    const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    nextSyncTime = `${nextDay.toISOString().replace('T', ' ').substring(0, 19)} MYT`;

    return {
      success: true,
      message: `Synchronisation completed successfully. Evaluated ${mockStudentsState.length} active international student passes.`,
      timestamp: lastSyncTime,
    };
  },

  // 13. Microsoft Excel Live Integration
  async getExcelStatus(): Promise<ExcelStatusResponse> {
    await new Promise((r) => setTimeout(r, 120));
    return {
      is_connected: true,
      filename: 'unisiraj_students_master.xlsx',
      filepath: 'backend/app/data/unisiraj_students_master.xlsx',
      file_size_bytes: 18450,
      sheet_names: ['UniSIRAJ_International_Students'],
      active_sheet: 'UniSIRAJ_International_Students',
      total_rows: mockExcelStudentsState.length,
      last_modified: new Date().toISOString(),
      last_sync_timestamp: lastSyncTime,
      sync_status: 'SYNCHRONIZED',
    };
  },

  async fetchExcelRecords(page = 1, pageSize = 25, sheet?: string): Promise<ExcelFetchResponse> {
    await new Promise((r) => setTimeout(r, 150));
    const start = (page - 1) * pageSize;
    const paginated = mockExcelStudentsState.slice(start, start + pageSize);
    return {
      sheet_name: sheet || 'UniSIRAJ_International_Students',
      total_rows: mockExcelStudentsState.length,
      page,
      page_size: pageSize,
      total_pages: Math.max(1, Math.ceil(mockExcelStudentsState.length / pageSize)),
      data: paginated,
    };
  },

  async searchExcelRecords(query: string, sheet?: string): Promise<ExcelSearchResponse> {
    await new Promise((r) => setTimeout(r, 150));
    const qLower = query.toLowerCase().trim();
    const tokens = qLower.split(/\s+/).filter((t) => t.length > 2);
    const matches = mockExcelStudentsState.filter((s) => {
      const fullText = `${s.matric_id} ${s.student_name} ${s.passport_number || ''} ${s.nationality || ''} ${s.whatsapp_number || ''} ${s.faculty || ''} ${s.notes || ''}`.toLowerCase();
      if (fullText.includes(qLower)) return true;
      return tokens.some((tok) => fullText.includes(tok));
    });
    return {
      query,
      total_matches: matches.length,
      matches,
    };
  },

  async analyzeExcelSpreadsheet(sheet?: string): Promise<ExcelAnalysisResponse> {
    await new Promise((r) => setTimeout(r, 250));
    const quality_metrics = {
      missing_dates: 0,
      missing_phones: 0,
      missing_passports: 0,
      invalid_dates: 0,
    };
    const visa_status_distribution: Record<string, number> = {
      SAFE: 0,
      ACTION_NEEDED: 0,
      URGENT: 0,
      CRITICAL: 0,
      EXPIRED: 0,
      REVIEW_REQUIRED: 0,
    };

    mockExcelStudentsState.forEach((item) => {
      if (!item.visa_expiry_date) quality_metrics.missing_dates += 1;
      if (!item.whatsapp_number) quality_metrics.missing_phones += 1;
      if (!item.passport_number) quality_metrics.missing_passports += 1;
      const statusKey = item.status || 'SAFE';
      if (visa_status_distribution[statusKey] !== undefined) {
        visa_status_distribution[statusKey] += 1;
      }
    });

    const discrepancies: DiscrepancyItem[] = [];
    const dbMap = new Map(mockStudentsState.map((s) => [s.matricId, s]));
    const excelMap = new Map(mockExcelStudentsState.map((s) => [s.matric_id, s]));

    mockExcelStudentsState.forEach((eItem) => {
      const dbStudent = dbMap.get(eItem.matric_id);
      if (!dbStudent) {
        discrepancies.push({
          matric_id: eItem.matric_id,
          student_name: eItem.student_name,
          discrepancy_type: 'MISSING_IN_DB',
          description: `Student ${eItem.student_name} (${eItem.matric_id}) is present in Excel master file but does not exist in the active database.`,
        });
      } else {
        if (eItem.whatsapp_number && dbStudent.phoneNumber && eItem.whatsapp_number.replace(/\D/g, '') !== dbStudent.phoneNumber.replace(/\D/g, '')) {
          discrepancies.push({
            matric_id: eItem.matric_id,
            student_name: eItem.student_name,
            discrepancy_type: 'FIELD_MISMATCH',
            field_name: 'whatsapp_number',
            excel_value: eItem.whatsapp_number,
            db_value: dbStudent.phoneNumber,
            description: `Contact mismatch for ${eItem.student_name}: Excel='${eItem.whatsapp_number}' vs DB='${dbStudent.phoneNumber}'.`,
          });
        }
      }
    });

    mockStudentsState.forEach((dbItem) => {
      if (!excelMap.has(dbItem.matricId)) {
        discrepancies.push({
          matric_id: dbItem.matricId,
          student_name: dbItem.fullName,
          discrepancy_type: 'MISSING_IN_EXCEL',
          description: `Student ${dbItem.fullName} (${dbItem.matricId}) exists in active database but is missing from Excel master workbook.`,
        });
      }
    });

    return {
      filename: 'unisiraj_students_master.xlsx',
      active_sheet: sheet || 'UniSIRAJ_International_Students',
      total_records: mockExcelStudentsState.length,
      quality_metrics,
      visa_status_distribution: visa_status_distribution as any,
      discrepancies,
      total_discrepancies: discrepancies.length,
      analyzed_at: new Date().toISOString(),
    };
  },

  async syncExcel(direction: 'excel_to_db' | 'db_to_excel', sheet?: string): Promise<ExcelSyncResponse> {
    await new Promise((r) => setTimeout(r, 400));
    let updated = 0;
    let created = 0;

    if (direction === 'excel_to_db') {
      mockExcelStudentsState.forEach((eItem) => {
        const existingIdx = mockStudentsState.findIndex((s) => s.matricId === eItem.matric_id);
        if (existingIdx >= 0) {
          mockStudentsState[existingIdx] = {
            ...mockStudentsState[existingIdx],
            fullName: eItem.student_name,
            nationality: eItem.nationality || mockStudentsState[existingIdx].nationality,
            passportNumber: eItem.passport_number || mockStudentsState[existingIdx].passportNumber,
            visaExpiryDate: eItem.visa_expiry_date || mockStudentsState[existingIdx].visaExpiryDate,
            phoneNumber: eItem.whatsapp_number || mockStudentsState[existingIdx].phoneNumber,
            faculty: eItem.faculty || mockStudentsState[existingIdx].faculty,
          };
          updated++;
        } else {
          mockStudentsState.push({
            id: `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            matricId: eItem.matric_id,
            fullName: eItem.student_name,
            email: `${eItem.matric_id.toLowerCase()}@student.unisiraj.edu.my`,
            nationality: eItem.nationality || 'International',
            countryCode: 'MY',
            passportNumber: eItem.passport_number || '',
            visaExpiryDate: eItem.visa_expiry_date || new Date().toISOString().split('T')[0],
            phoneNumber: eItem.whatsapp_number || '',
            program: eItem.program || 'Undergraduate Degree',
            faculty: eItem.faculty || 'General Studies',
            visaCategory: 'Student Pass (Degree)',
            emgsStatus: (eItem.emgs_status as any) || 'In Progress',
          });
          created++;
        }
      });
      return {
        direction,
        records_updated: updated,
        records_created: created,
        conflicts_resolved: 0,
        total_processed: mockExcelStudentsState.length,
        message: `Successfully synchronized Excel to DB. Created ${created} new students, updated ${updated} existing records.`,
        synced_at: new Date().toISOString(),
        status: 'SUCCESS',
      };
    } else {
      // db_to_excel
      mockExcelStudentsState = mockStudentsState.map((s, idx) => ({
        row_index: idx + 2,
        matric_id: s.matricId,
        student_name: s.fullName,
        nationality: s.nationality,
        passport_number: s.passportNumber,
        visa_expiry_date: s.visaExpiryDate,
        whatsapp_number: s.phoneNumber,
        faculty: s.faculty,
        program: s.program || 'Undergraduate / Postgraduate',
        emgs_status: s.emgsStatus || 'Active',
        status: 'SAFE',
        notes: 'Synced from UniSIRAJ Database',
      }));
      return {
        direction,
        records_updated: mockStudentsState.length,
        records_created: 0,
        conflicts_resolved: 0,
        total_processed: mockStudentsState.length,
        message: `Exported ${mockStudentsState.length} active database records to Microsoft Excel master workbook.`,
        synced_at: new Date().toISOString(),
        status: 'SUCCESS',
      };
    }
  },
};

export const MockApiService = mockService;
