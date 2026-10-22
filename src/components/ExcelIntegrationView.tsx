/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Download,
  Upload,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ArrowRightLeft,
  Sparkles,
  Clock,
  Database,
  Filter,
  Layers,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { apiClient } from '../lib/api/client';
import {
  ExcelStatusResponse,
  ExcelFetchResponse,
  ExcelStudentItem,
  ExcelAnalysisResponse,
  DiscrepancyItem,
  ExcelSyncResponse,
} from '../lib/api/types';
import { VisaStatusBadge } from './VisaStatusBadge';
import { formatPhoneNumber } from '../utils/visaRules';

export const ExcelIntegrationView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'grid' | 'discrepancies' | 'audit' | 'agent'>('grid');
  const [status, setStatus] = useState<ExcelStatusResponse | null>(null);
  const [recordsData, setRecordsData] = useState<ExcelFetchResponse | null>(null);
  const [analysis, setAnalysis] = useState<ExcelAnalysisResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ExcelStudentItem[] | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  const loadStatus = useCallback(async () => {
    try {
      setIsLoadingStatus(true);
      const res = await apiClient.getExcelStatus();
      setStatus(res);
    } catch (err: any) {
      console.error('Failed to load Excel status:', err);
      showNotification('error', 'Could not retrieve Excel master workbook status.');
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  const loadRecords = useCallback(async () => {
    try {
      setIsLoadingRecords(true);
      const res = await apiClient.getExcelRecords(page, pageSize);
      setRecordsData(res);
      setSearchResults(null);
    } catch (err: any) {
      console.error('Failed to load Excel records:', err);
      showNotification('error', 'Failed to read records from Excel spreadsheet.');
    } finally {
      setIsLoadingRecords(false);
    }
  }, [page, pageSize]);

  const runAnalysis = useCallback(async () => {
    try {
      setIsLoadingAnalysis(true);
      const res = await apiClient.analyzeExcel();
      setAnalysis(res);
      showNotification(
        'info',
        `Analysis complete: ${res.total_discrepancies} discrepancies detected between Excel and database.`
      );
    } catch (err: any) {
      console.error('Failed to analyze Excel:', err);
      showNotification('error', 'Failed to run spreadsheet analysis.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    loadRecords();
  }, [loadStatus, loadRecords]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      loadRecords();
      return;
    }
    try {
      setIsLoadingRecords(true);
      const res = await apiClient.searchExcel(searchQuery.trim());
      setSearchResults(res.matches);
      showNotification('info', `Found ${res.total_matches} matching student records in Excel.`);
    } catch (err: any) {
      console.error('Failed to search Excel:', err);
      showNotification('error', 'Search failed in Excel spreadsheet.');
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
    loadRecords();
  };

  const handleSync = async (direction: 'excel_to_db' | 'db_to_excel') => {
    const confirmMsg =
      direction === 'excel_to_db'
        ? 'Synchronize external Excel master file into the active database? This will upsert student records and update visa statuses.'
        : 'Export live database student records to the external Excel master file?';
    if (!window.confirm(confirmMsg)) return;

    try {
      setIsSyncing(true);
      const res: ExcelSyncResponse = await apiClient.syncExcel({ direction });
      showNotification('success', res.message);
      await loadStatus();
      await loadRecords();
      if (analysis) {
        await runAnalysis();
      }
    } catch (err: any) {
      console.error('Sync failed:', err);
      showNotification('error', err?.message || 'Synchronization failed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showNotification('error', 'Please select a valid Microsoft Excel workbook (.xlsx or .xls).');
      return;
    }

    try {
      setIsUploading(true);
      const res = await apiClient.uploadExcel(file);
      showNotification('success', `Master workbook updated: ${res.filename} (${res.total_rows} rows).`);
      setStatus(res);
      setPage(1);
      await loadRecords();
      if (analysis) {
        await runAnalysis();
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      showNotification('error', err?.message || 'Failed to upload Excel spreadsheet.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const displayedRecords = searchResults !== null ? searchResults : recordsData?.data || [];
  const totalDisplayRows = searchResults !== null ? searchResults.length : recordsData?.total_rows || 0;
  const totalPages = searchResults !== null ? 1 : recordsData?.total_pages || 1;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border shadow-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-center space-x-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : notification.type === 'error' ? (
              <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-700 text-sm font-bold ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header and Master File Info Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0D2040] via-[#153360] to-[#0D2040] p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Excel and DB Live Integration</h1>
              <p className="text-xs text-gray-300 mt-1">
                Bi-directional sync, real-time data grid, discrepancy reconciliation, and AI agent grounding with{' '}
                <span className="font-mono text-emerald-200">{status?.filename || 'unisiraj_students_master.xlsx'}</span>
              </p>
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSync('excel_to_db')}
                disabled={isSyncing}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-2 transition shadow-sm disabled:opacity-50"
                title="Upsert students from Excel into Database"
              >
                <ArrowRightLeft className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Excel &rarr; DB</span>
              </button>

              <button
                onClick={() => handleSync('db_to_excel')}
                disabled={isSyncing}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-2 transition shadow-sm disabled:opacity-50"
                title="Export database records to Excel master file"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Sync DB &rarr; Excel</span>
              </button>

              <button
                onClick={runAnalysis}
                disabled={isLoadingAnalysis}
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold flex items-center space-x-2 transition shadow-sm disabled:opacity-50"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${isLoadingAnalysis ? 'animate-spin' : ''}`} />
                <span>Audit & Analyze</span>
              </button>

              <a
                href={apiClient.getExcelDownloadUrl()}
                download
                className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center space-x-2 border border-white/20 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .xlsx</span>
              </a>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center space-x-2 border border-white/20 transition disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Replace File'}</span>
              </button>

              <button
                onClick={() => {
                  loadStatus();
                  loadRecords();
                }}
                disabled={isLoadingStatus || isLoadingRecords}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-50"
                title="Refresh Excel State"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingStatus || isLoadingRecords ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 divide-x divide-y md:divide-y-0 divide-gray-100 bg-gray-50 border-t border-gray-200">
          <div className="p-3.5">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</div>
            <div className="mt-1 flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-gray-900">Connected</span>
            </div>
          </div>

          <div className="p-3.5">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Master File</div>
            <div className="mt-1 text-xs font-bold text-gray-900 truncate" title={status?.filename}>
              {status?.filename || 'Loading...'}
            </div>
          </div>

          <div className="p-3.5">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Total Rows</div>
            <div className="mt-1 text-xs font-bold text-emerald-700">
              {status?.total_rows ?? '—'} student records
            </div>
          </div>

          <div className="p-3.5">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Active Sheet</div>
            <div className="mt-1 text-xs font-semibold text-gray-700 truncate" title={status?.active_sheet}>
              {status?.active_sheet || 'Sheet1'}
            </div>
          </div>

          <div className="p-3.5">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">File Size</div>
            <div className="mt-1 text-xs font-semibold text-gray-700">
              {status?.file_size_bytes ? `${Math.round(status.file_size_bytes / 1024)} KB` : '—'}
            </div>
          </div>

          <div className="p-3.5">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Discrepancies</div>
            <div className="mt-1 flex items-center space-x-1">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  (analysis?.total_discrepancies || 0) > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {analysis?.total_discrepancies ?? 'Not run'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('grid')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'grid'
              ? 'border-emerald-600 text-emerald-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Live Data Grid</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {totalDisplayRows}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('discrepancies');
            if (!analysis) runAnalysis();
          }}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'discrepancies'
              ? 'border-emerald-600 text-emerald-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Discrepancy Inspector</span>
          {analysis && analysis.total_discrepancies > 0 && (
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {analysis.total_discrepancies}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('audit');
            if (!analysis) runAnalysis();
          }}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'audit'
              ? 'border-emerald-600 text-emerald-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Data Quality Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('agent')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition ${
            activeTab === 'agent'
              ? 'border-emerald-600 text-emerald-900 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>AI Agent Excel Tools</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
            5 Grounded Tools
          </span>
        </button>
      </div>

      {/* TAB 1: Live Data Grid */}
      {activeTab === 'grid' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <form onSubmit={handleSearch} className="flex-1 max-w-lg relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Excel records by name, matric ID, passport, phone, or faculty..."
                className="w-full pl-9 pr-20 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
              />
              <div className="absolute right-1.5 top-1.5 flex items-center space-x-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-800"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="flex items-center space-x-3 text-xs text-gray-600">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-gray-200 rounded-lg px-2 py-1 bg-white text-xs focus:ring-2 focus:ring-emerald-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left border-collapse text-xs" aria-label="Excel and DB Student Records">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#E4E7EC] text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                  <th scope="col" className="py-3 px-3.5 text-center w-12 font-mono">No.</th>
                  <th scope="col" className="py-3 px-3.5">Matric ID</th>
                  <th scope="col" className="py-3 px-3.5">Student Name</th>
                  <th scope="col" className="py-3 px-3.5">Nationality</th>
                  <th scope="col" className="py-3 px-3.5">Passport</th>
                  <th scope="col" className="py-3 px-3.5">Visa Expiry</th>
                  <th scope="col" className="py-3 px-3.5">Status</th>
                  <th scope="col" className="py-3 px-3.5">WhatsApp</th>
                  <th scope="col" className="py-3 px-3.5">Faculty</th>
                  <th scope="col" className="py-3 px-3.5">EMGS Stage</th>
                  <th scope="col" className="py-3 px-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoadingRecords ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                      Loading records from Microsoft Excel master sheet...
                    </td>
                  </tr>
                ) : displayedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-gray-500">
                      No student records found matching query in Excel sheet.
                    </td>
                  </tr>
                ) : (
                  displayedRecords.map((item, idx) => (
                    <tr key={item.matric_id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3.5 text-center text-gray-500 font-mono text-[11px] font-bold">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-slate-800">
                        {item.matric_id}
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-gray-900">
                        {item.student_name}
                      </td>
                      <td className="py-2.5 px-3.5 text-gray-600">
                        {item.nationality || '—'}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-gray-700">
                        {item.passport_number || '—'}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-gray-800 font-medium">
                        {item.visa_expiry_date || '—'}
                      </td>
                      <td className="py-2.5 px-3.5">
                        {item.status ? (
                          <VisaStatusBadge
                            status={item.status === 'EXPIRED' ? 'CRITICAL' : ((item.status as any) || 'SAFE')}
                            daysRemaining={item.days_remaining ?? 0}
                            isExpired={item.status === 'EXPIRED' || (item.days_remaining !== undefined && item.days_remaining < 0)}
                            size="sm"
                            showSublabel={false}
                          />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-gray-700">
                        {formatPhoneNumber(item.whatsapp_number || '') || '—'}
                      </td>
                      <td className="py-2.5 px-3.5 text-gray-600 max-w-[180px] truncate" title={item.faculty}>
                        {item.faculty || '—'}
                      </td>
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                          {item.emgs_status || 'In Progress'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-gray-500 italic max-w-[200px] truncate" title={item.notes}>
                        {item.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {searchResults === null && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs text-gray-600">
              <div>
                Showing page <span className="font-bold text-gray-900">{page}</span> of{' '}
                <span className="font-bold text-gray-900">{totalPages}</span> ({totalDisplayRows} total rows)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoadingRecords}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 flex items-center space-x-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoadingRecords}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Discrepancy Inspector */}
      {activeTab === 'discrepancies' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Database vs. Microsoft Excel Discrepancy Inspector</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Detects students who exist exclusively in Excel, missing in the active database, or have conflicting phone numbers and visa expiry dates.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={runAnalysis}
                disabled={isLoadingAnalysis}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAnalysis ? 'animate-spin' : ''}`} />
                <span>Re-Audit Now</span>
              </button>
              <button
                onClick={() => handleSync('excel_to_db')}
                disabled={isSyncing}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Resolve via Sync</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {isLoadingAnalysis ? (
              <div className="py-16 text-center text-gray-500">
                <RefreshCw className="w-7 h-7 animate-spin mx-auto text-emerald-600 mb-3" />
                Comparing Excel workbook against live database tables...
              </div>
            ) : !analysis || analysis.discrepancies.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">Zero Discrepancies Detected</h3>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                  The active database and Microsoft Excel master workbook are fully synchronized with matching student profiles.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {analysis.discrepancies.map((d, idx) => (
                  <div key={idx} className="p-4 hover:bg-gray-50 flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {d.discrepancy_type === 'MISSING_IN_DB' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Missing in DB
                          </span>
                        ) : d.discrepancy_type === 'MISSING_IN_EXCEL' ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                            Missing in Excel
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                            Field Conflict
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-900">
                          {d.student_name} <span className="font-mono text-gray-500">({d.matric_id})</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{d.description}</p>
                        {d.field_name && (
                          <div className="mt-1 flex items-center space-x-4 text-[11px] font-mono">
                            <span className="text-emerald-700">Excel: {String(d.excel_value)}</span>
                            <span className="text-blue-700">Database: {String(d.db_value)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSync('excel_to_db')}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center space-x-1"
                    >
                      <span>Sync</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Data Quality Audit */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-xs font-medium text-gray-500">Missing Expiry Dates</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {analysis?.quality_metrics.missing_dates ?? 0}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Requires urgent date entry</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-xs font-medium text-gray-500">Missing Phone Numbers</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {analysis?.quality_metrics.missing_phones ?? 0}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Cannot dispatch WhatsApp notices</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-xs font-medium text-gray-500">Missing Passports</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {analysis?.quality_metrics.missing_passports ?? 0}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Immigration validation blocked</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-xs font-medium text-gray-500">Invalid Date Formats</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {analysis?.quality_metrics.invalid_dates ?? 0}
              </div>
              <div className="text-[11px] text-gray-400 mt-1">Non-standard date strings</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Visa Compliance Status Distribution in Excel</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(analysis?.visa_status_distribution || {}).map(([key, val]) => (
                <div key={key} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="text-[11px] font-semibold text-gray-600">{key}</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI Agent Excel Assistant */}
      {activeTab === 'agent' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-gray-900">UniSIRAJ CIA Agent — Microsoft Excel Tools</h2>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              The AI Agent has native registered tools providing grounded read, search, discrepancy analysis, and synchronization access to the Microsoft Excel file.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-gray-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-mono font-bold text-slate-800">excel_search_students(query)</span>
              </div>
              <p className="text-xs text-gray-600">
                Full-text search in Excel across Matric ID, Name, Passport, Phone, Faculty, and Notes.
              </p>
              <div className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Example prompt: "Search for Tariq Al-Mansoor in Excel master file"
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-mono font-bold text-slate-800">excel_analyze_sheet()</span>
              </div>
              <p className="text-xs text-gray-600">
                Audits Excel for discrepancies with the active database, checking for missing students or field mismatches.
              </p>
              <div className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Example prompt: "Analyze the Excel spreadsheet for discrepancies"
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-mono font-bold text-slate-800">excel_get_status()</span>
              </div>
              <p className="text-xs text-gray-600">
                Returns connection status, file size, total row count, active sheet, and synchronization timestamp.
              </p>
              <div className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Example prompt: "What is the status of the external Excel file?"
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-mono font-bold text-slate-800">excel_sync_records(direction)</span>
              </div>
              <p className="text-xs text-gray-600">
                Bidirectional synchronization between the external Excel master file and the database.
              </p>
              <div className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                Example prompt: "Sync Excel student records into the database"
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
