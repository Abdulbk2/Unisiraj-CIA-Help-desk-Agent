/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Student,
  ProcessedStudent,
  SortField,
  SortOrder,
} from '../types/student';
import {
  processStudentRecords,
  calculateSummaryMetrics,
  filterAndSortStudents,
} from '../utils/visaRules';
import { Sidebar } from '../components/Sidebar';
import { TopNav } from '../components/TopNav';
import { MetricCards } from '../components/MetricCards';
import { OperationalOverview } from '../components/OperationalOverview';
import { StudentSearch } from '../components/StudentSearch';
import { VisaStatusFilter } from '../components/VisaStatusFilter';
import { StudentVisaTable } from '../components/StudentVisaTable';
import { StudentDetailModal } from '../components/StudentDetailModal';
import { RenewalFollowupModal } from '../components/RenewalFollowupModal';
import { AddStudentModal } from '../components/AddStudentModal';
import { EditStudentModal } from '../components/EditStudentModal';
import { AiAgentWorkspace } from '../components/AiAgentWorkspace';
import { SpreadsheetImportView } from '../components/SpreadsheetImportView';
import { ExcelIntegrationView } from '../components/ExcelIntegrationView';
import { WhatsAppNotificationsView } from '../components/WhatsAppNotificationsView';
import { NotificationHistoryView } from '../components/NotificationHistoryView';
import { VisaMonitoringView } from '../components/VisaMonitoringView';
import { ReportsAnalyticsView } from '../components/ReportsAnalyticsView';
import { AboutView } from '../components/AboutView';
import { IntegrationSettingsView } from '../components/IntegrationSettingsView';
import { apiClient, apiConfig } from '../lib/api/client';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  signInWithDemoAdmin,
  AuthUserProfile,
} from '../lib/firebaseAuth';
import { User } from 'firebase/auth';
import { AlertTriangle, X, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  // Student dataset state
  const [studentsData, setStudentsData] = useState<Student[]>([]);

  // Search, Filter, Sort state for Student records
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('daysRemaining');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Navigation view: dashboard | agent | students | import | monitoring | whatsapp | history | reports | settings | about
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [currentApiMode, setCurrentApiMode] = useState<'LIVE_FASTAPI'>('LIVE_FASTAPI');

  // Modals state
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<ProcessedStudent | null>(null);
  const [selectedStudentForFollowup, setSelectedStudentForFollowup] = useState<ProcessedStudent | null>(null);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<ProcessedStudent | Student | null>(null);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [showAuthDomainModal, setShowAuthDomainModal] = useState(false);
  const [backendConnectionError, setBackendConnectionError] = useState<string | null>(null);

  // Student deletion & Global synchronization states
  const [studentToDelete, setStudentToDelete] = useState<ProcessedStudent | Student | null>(null);
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);
  const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);
  const [syncFeedbackToast, setSyncFeedbackToast] = useState<string | null>(null);

  // Authentication & Google Calendar state
  const [authUser, setAuthUser] = useState<User | AuthUserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);

  // Fetch students from API service
  const loadStudents = useCallback(async () => {
    try {
      setBackendConnectionError(null);
      const res: any = await apiClient.getStudents();
      const list = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
      setStudentsData(list);
    } catch (err: any) {
      console.warn('[UniSIRAJ] Could not connect to live backend on port 8000:', err);
      setBackendConnectionError(err?.message || 'Backend connection refused');
      setStudentsData([]);
    }
  }, []);

  // Global Refresh & Sync Handler
  const handleRefreshAllData = useCallback(async () => {
    setIsSyncingGlobal(true);
    try {
      await apiClient.triggerDailySync();
      await loadStudents();
      await apiClient.getIntegrationStatus();
      setSyncFeedbackToast('Database sync complete: international student records and compliance tiers are up to date.');
      setTimeout(() => setSyncFeedbackToast(null), 3500);
    } catch (err: any) {
      console.error('Failed to sync all data:', err);
      await loadStudents();
      setSyncFeedbackToast('Student records refreshed from live database.');
      setTimeout(() => setSyncFeedbackToast(null), 3500);
    } finally {
      setIsSyncingGlobal(false);
    }
  }, [loadStudents]);

  // Student Deletion Handlers
  const handleDeleteStudent = (student: ProcessedStudent | Student) => {
    setStudentToDelete(student);
  };

  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeletingStudent(true);
    try {
      const identifier = studentToDelete.id || studentToDelete.matricId;
      await apiClient.deleteStudent(identifier);
      setStudentToDelete(null);
      if (
        selectedStudentForDetail &&
        (selectedStudentForDetail.matricId === studentToDelete.matricId ||
          selectedStudentForDetail.id === studentToDelete.id)
      ) {
        setSelectedStudentForDetail(null);
      }
      await loadStudents();
      setSyncFeedbackToast(`Student ${studentToDelete.fullName} (${studentToDelete.matricId}) permanently erased from database.`);
      setTimeout(() => setSyncFeedbackToast(null), 3500);
    } catch (err: any) {
      console.error('Failed to delete student:', err);
      alert(`Failed to delete student: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDeletingStudent(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setAuthUser(user);
        setAccessToken(token);
      },
      () => {
        setAuthUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleSignInGoogle = async () => {
    try {
      setIsConnectingGoogle(true);
      const res = await googleSignIn();
      if (res) {
        setAuthUser(res.user);
        setAccessToken(res.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      if (
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('unauthorized-domain') ||
        err?.message?.includes('unauthorized')
      ) {
        setShowAuthDomainModal(true);
      }
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleSignInDemoAdmin = () => {
    const res = signInWithDemoAdmin();
    setAuthUser(res.user);
    setAccessToken(res.accessToken);
    setShowAuthDomainModal(false);
  };

  const handleSignOutGoogle = async () => {
    await logout();
    setAuthUser(null);
    setAccessToken(null);
  };

  // Dynamically calculate processed students and summary metrics
  const processedStudents = useMemo(() => {
    return processStudentRecords(studentsData);
  }, [studentsData]);

  const summaryMetrics = useMemo(() => {
    return calculateSummaryMetrics(processedStudents);
  }, [processedStudents]);

  const filteredAndSortedStudents = useMemo(() => {
    return filterAndSortStudents(
      processedStudents,
      searchQuery,
      statusFilter,
      sortField,
      sortOrder
    );
  }, [processedStudents, searchQuery, statusFilter, sortField, sortOrder]);

  // Add student handler
  const handleAddNewStudent = async (newStudent: Student) => {
    try {
      const saved = await apiClient.saveStudent(newStudent);
      await loadStudents();
      if (saved) {
        setStudentsData((prev) => {
          const exists = prev.some(
            (s) => s.matricId === (saved.matricId || (saved as any).matric_id || newStudent.matricId)
          );
          return exists ? prev : [saved, ...prev];
        });
      }
    } catch (err) {
      console.error('Failed to save student via API, updating local state:', err);
      setStudentsData((prev) => [newStudent, ...prev]);
    }
  };

  // Edit student handlers
  const handleOpenEditModal = (student: ProcessedStudent | Student) => {
    setSelectedStudentForEdit(student);
    setIsEditStudentModalOpen(true);
  };

  const handleSaveEditedStudent = async (updatedStudent: Student) => {
    try {
      await apiClient.updateStudent(updatedStudent);
      await loadStudents();
    } catch (err) {
      console.error('Failed to update student via API, updating local state:', err);
      setStudentsData((prev) =>
        prev.map((s) =>
          (s.id && s.id === updatedStudent.id) || (s.matricId === updatedStudent.matricId)
            ? { ...s, ...updatedStudent }
            : s
        )
      );
    }
    // Update detail modal in-place if open for this student
    setSelectedStudentForDetail((prev) => {
      if (prev && ((prev.id && prev.id === updatedStudent.id) || prev.matricId === updatedStudent.matricId)) {
        return {
          ...prev,
          ...updatedStudent,
        };
      }
      return prev;
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Matric ID',
      'Student Name',
      'Nationality',
      'Passport Number',
      'Visa Category',
      'Expiry Date',
      'Days Remaining',
      'Status',
      'EMGS Stage',
      'Faculty',
    ];

    const rows = processedStudents.map((s) => [
      `"${s.matricId}"`,
      `"${s.fullName}"`,
      `"${s.nationality}"`,
      `"${s.passportNumber}"`,
      `"${s.visaCategory}"`,
      `"${s.visaExpiryDate}"`,
      s.daysRemaining,
      `"${s.statusLabel}"`,
      `"${s.emgsStatus}"`,
      `"${s.faculty}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UniSIRAJ_Visa_Compliance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#F5F6F8] flex flex-col font-sans text-[#182230] antialiased">
      <div className="flex flex-1 h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={(view) => setCurrentView(view)}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
          isCalendarConnected={!!accessToken}
          onConnectCalendar={handleSignInGoogle}
          userEmail={authUser?.email}
          studentCount={studentsData.length}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          {/* Top Navigation */}
          <TopNav
            currentView={currentView}
            onToggleSidebar={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
            urgentCount={summaryMetrics.urgentCases}
            criticalCount={summaryMetrics.criticalCases}
            user={authUser}
            onSignInGoogle={handleSignInGoogle}
            onSignOutGoogle={handleSignOutGoogle}
            isConnectingGoogle={isConnectingGoogle}
            currentMode={currentApiMode}
            onNavigateSettings={() => setCurrentView('settings')}
            onRefreshAllData={handleRefreshAllData}
            isRefreshing={isSyncingGlobal}
          />

          {/* Sync Success Feedback Toast */}
          {syncFeedbackToast && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between gap-3 text-xs text-emerald-900 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{syncFeedbackToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setSyncFeedbackToast(null)}
                className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Backend Connection Notice Banner */}
          {backendConnectionError && currentApiMode === 'LIVE_FASTAPI' && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>FastAPI Backend Notice:</strong> Cannot connect to local backend at <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-950">http://127.0.0.1:8000</code>. Please ensure the backend server is running.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadStudents()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Connection
                </button>
              </div>
            </div>
          )}

          {/* Main Dashboard Body */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
            {/* VIEW 1: Dashboard (Overview Command Center) */}
            {currentView === 'dashboard' && (
              <>
                {/* 1. Summary Metric Cards */}
                <section aria-labelledby="metrics-heading">
                  <div className="flex items-center justify-between mb-3">
                    <h2
                      id="metrics-heading"
                      className="text-sm font-bold uppercase tracking-wider text-gray-500"
                    >
                      Real-Time Compliance Metrics
                    </h2>
                    <span className="text-sm text-gray-500 font-medium">
                      Calculated dynamically • 90/60/30 Escalation Tiers
                    </span>
                  </div>
                  <MetricCards
                    metrics={summaryMetrics}
                    activeFilter={statusFilter}
                    onSelectFilter={(filterKey) => setStatusFilter(filterKey)}
                  />
                </section>

                {/* 2. Operational Overview Banner */}
                <OperationalOverview
                  metrics={summaryMetrics}
                  onFilterExpired={() => setStatusFilter('EXPIRED')}
                  onFilterCritical={() => setStatusFilter('CRITICAL')}
                  onExportCSV={handleExportCSV}
                  onAddNewStudent={() => setIsAddStudentModalOpen(true)}
                />

                {/* 3. Primary Content Section: Student Visa Records Table */}
                <section
                  aria-labelledby="student-records-title"
                  className="bg-white rounded-2xl border border-[#E4E7EC] p-6 shadow-xs space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-gray-100">
                    <div>
                      <h2
                        id="student-records-title"
                        className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight"
                      >
                        Student Visa Records
                      </h2>
                      <p className="text-[15px] sm:text-base text-gray-600 mt-1">
                        Monitor visa validity, identify upcoming expirations, and prioritize renewal actions.
                      </p>
                    </div>

                    <div className="w-full sm:w-80">
                      <StudentSearch
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search by student name or matric ID..."
                      />
                    </div>
                  </div>

                  <VisaStatusFilter
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortField(field);
                      setSortOrder(order);
                    }}
                    totalCount={processedStudents.length}
                    filteredCount={filteredAndSortedStudents.length}
                    onResetFilters={() => {
                      setStatusFilter('ALL');
                      setSearchQuery('');
                    }}
                  />

                  <StudentVisaTable
                    students={filteredAndSortedStudents}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSortChange={(field, order) => {
                      setSortField(field);
                      setSortOrder(order);
                    }}
                    onViewDetails={(student) => setSelectedStudentForDetail(student)}
                    onReviewVisa={(student) => setSelectedStudentForDetail(student)}
                    onInitiateFollowup={(student) => setSelectedStudentForFollowup(student)}
                    onScheduleCalendar={(student) => setSelectedStudentForFollowup(student)}
                    onEditStudent={handleOpenEditModal}
                    onResetFilters={() => {
                      setStatusFilter('ALL');
                      setSearchQuery('');
                    }}
                  />
                </section>
              </>
            )}

            {/* VIEW 2: AI Agent Workspace (Pillar 4) */}
            {currentView === 'agent' && (
              <AiAgentWorkspace
                onSelectStudent={(st) => setSelectedStudentForDetail(st)}
                onInitiateFollowup={(st) => setSelectedStudentForFollowup(st)}
                onScheduleCalendar={(st) => setSelectedStudentForFollowup(st)}
                allStudents={processedStudents}
              />
            )}

            {/* VIEW 3: Student Records Directory */}
            {currentView === 'students' && (
              <div className="bg-white rounded-2xl border border-[#E4E7EC] p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
                      Master International Student Directory
                    </h2>
                    <p className="text-[15px] sm:text-base text-gray-600 mt-1">
                      Complete institutional registry of active student passes at UniSIRAJ.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="px-4 py-2 text-[14.5px] sm:text-[15px] font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl shadow-2xs cursor-pointer"
                    >
                      Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddStudentModalOpen(true)}
                      className="px-4 py-2 text-[14.5px] sm:text-[15px] font-bold text-white bg-[#2457A7] hover:bg-[#1E3A5F] rounded-xl shadow-2xs cursor-pointer"
                    >
                      + Register Student
                    </button>
                  </div>
                </div>

                <div className="w-full sm:w-96">
                  <StudentSearch
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by student name, matric ID, passport..."
                  />
                </div>

                <VisaStatusFilter
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSortChange={(field, order) => {
                    setSortField(field);
                    setSortOrder(order);
                  }}
                  totalCount={processedStudents.length}
                  filteredCount={filteredAndSortedStudents.length}
                  onResetFilters={() => {
                    setStatusFilter('ALL');
                    setSearchQuery('');
                  }}
                />

                <StudentVisaTable
                  students={filteredAndSortedStudents}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSortChange={(f, o) => {
                    setSortField(f);
                    setSortOrder(o);
                  }}
                  onViewDetails={(s) => setSelectedStudentForDetail(s)}
                  onReviewVisa={(s) => setSelectedStudentForDetail(s)}
                  onInitiateFollowup={(s) => setSelectedStudentForFollowup(s)}
                  onScheduleCalendar={(s) => setSelectedStudentForFollowup(s)}
                  onEditStudent={handleOpenEditModal}
                  onDeleteStudent={handleDeleteStudent}
                  onResetFilters={() => {
                    setStatusFilter('ALL');
                    setSearchQuery('');
                  }}
                />
              </div>
            )}

            {/* VIEW 4: Spreadsheet Import (Pillar 1) */}
            {currentView === 'import' && (
              <SpreadsheetImportView
                onImportComplete={loadStudents}
                onNavigateStudents={() => setCurrentView('students')}
              />
            )}

            {/* VIEW 4.5: Microsoft Excel Live Integration */}
            {currentView === 'excel' && (
              <ExcelIntegrationView />
            )}

            {/* VIEW 5: Visa Monitoring (Pillar 2) */}
            {currentView === 'monitoring' && (
              <VisaMonitoringView
                students={processedStudents}
                metrics={summaryMetrics}
                onViewStudent={(s) => setSelectedStudentForDetail(s)}
                onInitiateFollowup={(s) => setSelectedStudentForFollowup(s)}
                onScheduleCalendar={(s) => setSelectedStudentForFollowup(s)}
                onEditStudent={handleOpenEditModal}
                onRefreshData={loadStudents}
              />
            )}

            {/* VIEW 7: WhatsApp Notifications (Pillar 3) */}
            {currentView === 'whatsapp' && (
              <WhatsAppNotificationsView
                onNavigateHistory={() => setCurrentView('history')}
              />
            )}

            {/* VIEW 8: Notification History */}
            {currentView === 'history' && <NotificationHistoryView />}

            {/* VIEW 9: Reports & Analytics */}
            {currentView === 'reports' && (
              <ReportsAnalyticsView
                students={processedStudents}
                metrics={summaryMetrics}
                onExportCSV={handleExportCSV}
              />
            )}

            {/* VIEW 10: Integration Settings */}
            {currentView === 'settings' && (
              <IntegrationSettingsView
                onModeChanged={(mode) => setCurrentApiMode(mode)}
                isCalendarConnected={!!accessToken}
                onConnectCalendar={handleSignInGoogle}
                onDisconnectCalendar={handleSignOutGoogle}
              />
            )}

            {/* VIEW 11: About & FAQs */}
            {currentView === 'about' && (
              <AboutView />
            )}
          </main>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudentForDetail}
        onClose={() => setSelectedStudentForDetail(null)}
        onInitiateFollowup={(student) => {
          setSelectedStudentForDetail(null);
          setSelectedStudentForFollowup(student);
        }}
        onScheduleCalendar={(student) => {
          setSelectedStudentForDetail(null);
          setSelectedStudentForFollowup(student);
        }}
        onEditStudent={(student) => {
          handleOpenEditModal(student);
        }}
        onDeleteStudent={handleDeleteStudent}
      />

      {/* 2. Renewal Follow-up Modal (with Google Calendar Scheduling) */}
      <RenewalFollowupModal
        student={selectedStudentForFollowup}
        onClose={() => setSelectedStudentForFollowup(null)}
        accessToken={accessToken}
        onConnectGoogle={handleSignInGoogle}
        isConnectingGoogle={isConnectingGoogle}
      />

      {/* 3. Add Student Modal */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onAddStudent={handleAddNewStudent}
      />

      {/* 5. Edit Student Modal */}
      <EditStudentModal
        isOpen={isEditStudentModalOpen}
        onClose={() => {
          setIsEditStudentModalOpen(false);
          setSelectedStudentForEdit(null);
        }}
        student={selectedStudentForEdit}
        onSaveStudent={handleSaveEditedStudent}
      />

      {/* 5b. Permanent Student Delete Confirmation Modal */}
      {studentToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">Permanently Delete Student Record?</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Are you sure you want to permanently erase the record for{' '}
                  <strong className="text-gray-900">{studentToDelete.fullName}</strong> (
                  <span className="font-mono text-gray-700">{studentToDelete.matricId}</span>) from the database?
                  This action is irreversible and cascades to all related notification audit logs.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                disabled={isDeletingStudent}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteStudent}
                disabled={isDeletingStudent}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingStudent ? 'Erasing...' : 'Yes, Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Firebase Authorized Domain & Local Sign-In Helper Modal */}
      {showAuthDomainModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-domain-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 id="auth-domain-title" className="text-base font-bold text-gray-900">
                  Firebase Authorized Domain Notice
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Google OAuth (<code className="font-mono text-rose-600 font-semibold">auth/unauthorized-domain</code>)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthDomainModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 leading-relaxed space-y-2">
              <p>
                Firebase blocked the Google OAuth popup because domain <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-amber-950">localhost</code> is not yet added to the Authorized Domains list in Firebase project <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-950">gen-lang-client-0042976831</code>.
              </p>
              <div className="text-[11.5px] text-amber-900/90 space-y-1">
                <p className="font-semibold text-gray-800">To authorize localhost in production Firebase:</p>
                <ol className="list-decimal list-inside pl-1 space-y-0.5 text-gray-700">
                  <li>Open <strong>Firebase Console &rarr; Authentication &rarr; Settings</strong></li>
                  <li>Click the <strong>Authorized domains</strong> tab</li>
                  <li>Add <span className="font-mono bg-white px-1 border border-gray-200 rounded">localhost</span> and <span className="font-mono bg-white px-1 border border-gray-200 rounded">127.0.0.1</span></li>
                </ol>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleSignInDemoAdmin}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2457A7] hover:bg-[#1E3A5F] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sign In as Demo Admin (Simulated Calendar)
              </button>
              <button
                type="button"
                onClick={() => setShowAuthDomainModal(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
