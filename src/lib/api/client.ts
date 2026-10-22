/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  SendEmailPayload,
  SendEmailResponse,
  BackendIntegrationStatus,
  ExcelStatusResponse,
  ExcelFetchResponse,
  ExcelSearchResponse,
  ExcelAnalysisResponse,
  ExcelSyncRequest,
  ExcelSyncResponse,
} from './types';
import { Student } from '../../types/student';

// Configuration management - Strictly Live FastAPI Backend
class ApiConfigManager {
  private mode: 'LIVE_FASTAPI' = 'LIVE_FASTAPI';
  private baseUrl: string =
    import.meta.env.VITE_API_BASE_URL !== undefined
      ? import.meta.env.VITE_API_BASE_URL
      : (import.meta.env.DEV ? 'http://localhost:8000' : '');
  private authToken: string | null = null;

  constructor() {
    this.mode = 'LIVE_FASTAPI';
    if (typeof window !== 'undefined') {
      localStorage.setItem('UNISIRAJ_API_MODE', 'LIVE_FASTAPI');
    }

    const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('UNISIRAJ_API_BASE_URL') : null;
    if (savedUrl) {
      if (import.meta.env.PROD && savedUrl.includes('localhost:8000')) {
        localStorage.removeItem('UNISIRAJ_API_BASE_URL');
      } else {
        this.baseUrl = savedUrl;
      }
    }
  }

  getMode(): 'LIVE_FASTAPI' {
    return 'LIVE_FASTAPI';
  }

  setMode(_mode: string) {
    this.mode = 'LIVE_FASTAPI';
    if (typeof window !== 'undefined') {
      localStorage.setItem('UNISIRAJ_API_MODE', 'LIVE_FASTAPI');
    }
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
    if (typeof window !== 'undefined') {
      localStorage.setItem('UNISIRAJ_API_BASE_URL', this.baseUrl);
    }
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }
}

export const apiConfig = new ApiConfigManager();

export class ApiClientError extends Error {
  public statusCode?: number;
  public endpoint: string;

  constructor(message: string, endpoint: string, statusCode?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.endpoint = endpoint;
    this.statusCode = statusCode;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${apiConfig.getBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const errJson = await res.json();
        if (errJson && errJson.detail) {
          detail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        // fallback to statusText
      }
      throw new ApiClientError(`Backend returned ${res.status}: ${detail}`, endpoint, res.status);
    }
    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiClientError) {
      throw err;
    }
    throw new ApiClientError(
      `Cannot connect to backend server at ${url}. Ensure FastAPI is running on port 8000: ${err?.message || 'Connection refused'}`,
      endpoint
    );
  }
}

/**
 * Universal API Client operating strictly against the Live FastAPI backend
 */
export const apiClient = {
  config: apiConfig,
  apiRequest,

  // 1. Dashboard Summary
  async getDashboardSummary(): Promise<DashboardSummaryResponse> {
    return apiRequest<DashboardSummaryResponse>(
      '/api/dashboard/summary',
      { headers: getAuthHeaders() }
    );
  },

  // 2. Student Records
  async getStudents(): Promise<Student[]> {
    const res = await apiRequest<any>(
      '/api/students?page=1&page_size=100',
      { headers: getAuthHeaders() }
    );
    if (Array.isArray(res)) {
      return res;
    }
    if (res && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  // 3. Save Student (Create)
  async saveStudent(student: Student): Promise<Student> {
    const payload = {
      matric_id: student.matricId,
      student_name: student.fullName,
      email: student.email,
      whatsapp_number: student.phoneNumber,
      passport_number: student.passportNumber,
      nationality: student.nationality,
      faculty: student.faculty,
      program: student.program,
      visa_expiry_date: student.visaExpiryDate,
      matricId: student.matricId,
      fullName: student.fullName,
      phoneNumber: student.phoneNumber,
      passportNumber: student.passportNumber,
      visaExpiryDate: student.visaExpiryDate,
    };
    return apiRequest<Student>(
      '/api/students',
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      }
    );
  },

  // 3b. Update Student Record
  async updateStudent(student: Student): Promise<Student> {
    const payload = {
      matric_id: student.matricId,
      student_name: student.fullName,
      email: student.email,
      whatsapp_number: student.phoneNumber,
      passport_number: student.passportNumber,
      nationality: student.nationality,
      faculty: student.faculty,
      program: student.program,
      visa_expiry_date: student.visaExpiryDate,
      matricId: student.matricId,
      fullName: student.fullName,
      phoneNumber: student.phoneNumber,
      passportNumber: student.passportNumber,
      visaExpiryDate: student.visaExpiryDate,
    };
    const studentIdentifier = student.id || student.matricId;
    return apiRequest<Student>(
      `/api/students/${encodeURIComponent(studentIdentifier)}`,
      {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      }
    );
  },

  // 3c. Delete Student Record Permanently
  async deleteStudent(studentIdentifier: string | number): Promise<{ success: boolean; message: string }> {
    return apiRequest<{ success: boolean; message: string }>(
      `/api/students/${encodeURIComponent(String(studentIdentifier))}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );
  },

  // 4. Ingest & Preview Spreadsheet
  async previewSpreadsheet(file: File): Promise<SpreadsheetPreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<SpreadsheetPreviewResponse>(
      '/api/imports/preview',
      {
        method: 'POST',
        body: formData,
      }
    );
  },

  // 5. Validate Spreadsheet Records
  async validateSpreadsheet(
    mapping: ColumnMappingConfig,
    rows: Array<Record<string, string>>
  ): Promise<SpreadsheetValidationResponse> {
    return apiRequest<SpreadsheetValidationResponse>(
      '/api/imports/validate',
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ mapping, rows }),
      }
    );
  },

  // 6. Confirm Spreadsheet Import
  async confirmSpreadsheetImport(
    validated: SpreadsheetValidationResponse
  ): Promise<SpreadsheetConfirmResponse> {
    return apiRequest<SpreadsheetConfirmResponse>(
      '/api/imports/confirm',
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
      }
    );
  },

  // 7. AI Agent Natural Language Query
  async queryAgent(question: string): Promise<AgentQueryResponse> {
    return apiRequest<AgentQueryResponse>(
      '/api/agent/query',
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ query: question }),
      }
    );
  },

  // 8. WhatsApp Eligible List
  async getWhatsAppEligible(): Promise<WhatsAppEligibleItem[]> {
    return apiRequest<WhatsAppEligibleItem[]>(
      '/api/notifications/eligible',
      {
        headers: getAuthHeaders(),
      }
    );
  },

  // 9. Send WhatsApp Message (Twilio or Demo Mode)
  async sendWhatsAppMessage(payload: SendWhatsAppPayload): Promise<SendWhatsAppResponse> {
    return apiRequest<SendWhatsAppResponse>(
      '/api/notifications/send',
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      }
    );
  },

  // 9b. Send Official Institutional Email (Twilio / SendGrid or Demo Mode)
  async sendEmailMessage(payload: SendEmailPayload): Promise<SendEmailResponse> {
    return apiRequest<SendEmailResponse>(
      '/api/notifications/send-email',
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      }
    );
  },

  // 10. Notification History
  async getNotificationHistory(): Promise<NotificationLogItem[]> {
    return apiRequest<NotificationLogItem[]>(
      '/api/notifications/history',
      {
        headers: getAuthHeaders(),
      }
    );
  },

  async retryNotification(notificationId: string | number): Promise<{ success: boolean; message: string; status: string }> {
    const numericId = String(notificationId).replace(/^notif-/, '');
    return apiRequest<{ success: boolean; message: string; status: string }>(
      `/api/notifications/${numericId}/retry`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );
  },

  async deleteNotification(notificationId: string | number): Promise<{ success: boolean; message: string }> {
    const numericId = String(notificationId).replace(/^notif-/, '');
    return apiRequest<{ success: boolean; message: string }>(
      `/api/notifications/${numericId}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }
    );
  },

  // 11. Backend Integration Status
  async getIntegrationStatus(): Promise<BackendIntegrationStatus> {
    try {
      return await apiRequest<BackendIntegrationStatus>(
        '/api/integrations/status',
        {
          headers: getAuthHeaders(),
        }
      );
    } catch {
      return {
        backendReachable: false,
        backendBaseUrl: apiConfig.getBaseUrl(),
        backendVersion: 'Unreachable',
        cloudRunRegion: 'Unknown',
        twilioConfigured: false,
        dailySyncScheduler: {
          enabled: false,
          frequency: 'N/A',
          lastExecuted: 'N/A',
          nextExecution: 'N/A',
          status: 'ERROR',
        },
        googleCalendarConfigured: false,
        environmentMode: 'LIVE_FASTAPI',
      };
    }
  },

  // 12. Trigger Manual Daily Synchronisation
  async triggerDailySync(): Promise<{ success: boolean; message: string; timestamp: string }> {
    return apiRequest<{ success: boolean; message: string; timestamp: string }>(
      '/api/monitoring/sync',
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    );
  },

  // 13. Microsoft Excel Live Integration
  async getExcelStatus(): Promise<ExcelStatusResponse> {
    return apiRequest<ExcelStatusResponse>(
      '/api/excel/status',
      {
        headers: getAuthHeaders(),
      }
    );
  },

  async getExcelRecords(page = 1, pageSize = 25, sheet?: string): Promise<ExcelFetchResponse> {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    if (sheet) params.append('sheet', sheet);
    return apiRequest<ExcelFetchResponse>(
      `/api/excel/records?${params.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    );
  },

  async searchExcel(query: string, sheet?: string): Promise<ExcelSearchResponse> {
    const params = new URLSearchParams({ q: query });
    if (sheet) params.append('sheet', sheet);
    return apiRequest<ExcelSearchResponse>(
      `/api/excel/search?${params.toString()}`,
      {
        headers: getAuthHeaders(),
      }
    );
  },

  async analyzeExcel(sheet?: string): Promise<ExcelAnalysisResponse> {
    const path = sheet ? `/api/excel/analyze?sheet=${encodeURIComponent(sheet)}` : '/api/excel/analyze';
    return apiRequest<ExcelAnalysisResponse>(
      path,
      {
        headers: getAuthHeaders(),
      }
    );
  },

  async syncExcel(payload: ExcelSyncRequest): Promise<ExcelSyncResponse> {
    return apiRequest<ExcelSyncResponse>(
      '/api/excel/sync',
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      }
    );
  },

  async uploadExcel(file: File): Promise<ExcelStatusResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    const token = apiConfig.getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${apiConfig.getBaseUrl()}/api/excel/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      throw new Error(`Upload failed with status ${res.status}`);
    }
    return res.json();
  },

  getExcelDownloadUrl(): string {
    return `${apiConfig.getBaseUrl()}/api/excel/download`;
  },
};

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = apiConfig.getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}
