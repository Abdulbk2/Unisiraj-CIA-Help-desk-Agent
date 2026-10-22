/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  XCircle,
  Trash2,
  Mail,
} from 'lucide-react';
import { apiClient } from '../lib/api/client';
import { NotificationLogItem, WhatsAppDeliveryStatus } from '../lib/api/types';
import { formatPhoneNumber } from '../utils/visaRules';

export const NotificationHistoryView: React.FC = () => {
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmLog, setDeleteConfirmLog] = useState<NotificationLogItem | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getNotificationHistory();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load notification history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    try {
      await apiClient.retryNotification(logId);
      await loadHistory();
    } catch (err: any) {
      alert(`Retry failed: ${err.message || 'Error occurred'}`);
    } finally {
      setRetryingId(null);
    }
  };

  const handleDeleteNotification = async (logId: string) => {
    setDeletingId(logId);
    try {
      await apiClient.deleteNotification(logId);
      setDeleteConfirmLog(null);
      await loadHistory();
    } catch (err: any) {
      alert(`Failed to delete notification: ${err.message || 'Error occurred'}`);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.studentName.toLowerCase().includes(q) ||
      log.matricId.toLowerCase().includes(q) ||
      (log.providerSid && log.providerSid.toLowerCase().includes(q)) ||
      (log.providerMessageSid && log.providerMessageSid.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + pageSize);

  const getStatusBadge = (status: WhatsAppDeliveryStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Delivered
          </span>
        );
      case 'SENT':
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-blue-600" />
            {status}
          </span>
        );
      case 'FAILED':
      case 'UNDELIVERED':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
            <XCircle className="w-3 h-3 text-rose-600" />
            Failed
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-xs overflow-hidden space-y-4">
      {/* Header */}
      <div className="p-6 border-b border-[#E4E7EC] bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D6A52B]">
              Audit Trail
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-xs text-gray-500 font-medium">Twilio Webhook Synchronization</span>
          </div>
          <h2 className="text-base font-bold text-gray-900">
            WhatsApp Delivery & Compliance Dispatch Log
          </h2>
        </div>

        <button
          type="button"
          onClick={loadHistory}
          className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="px-6 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="font-semibold text-gray-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['ALL', 'DELIVERED', 'SENT', 'FAILED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg border font-medium ${
                statusFilter === st
                  ? 'bg-[#2457A7] text-white border-[#2457A7]'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student, matric, SID..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto min-w-full">
        <table className="w-full text-left text-xs border-collapse" aria-label="Notification Delivery Audit Trail">
          <thead className="bg-[#F8F9FA] border-y border-[#E4E7EC] text-[11px] uppercase font-bold tracking-wider text-gray-700">
            <tr>
              <th scope="col" className="py-3 px-3 text-center w-12 font-mono">
                No.
              </th>
              <th scope="col" className="py-3 px-4">Student &amp; Matric ID</th>
              <th scope="col" className="py-3 px-4">Destination</th>
              <th scope="col" className="py-3 px-4">Reminder Tier</th>
              <th scope="col" className="py-3 px-4">Dispatched At</th>
              <th scope="col" className="py-3 px-4">Provider Message SID</th>
              <th scope="col" className="py-3 px-4 text-center">Status</th>
              <th scope="col" className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  No notification logs found matching your criteria.
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log, idx) => (
                <tr key={log.id} className="hover:bg-gray-50/70">
                  <td className="py-3 px-3 text-center font-mono text-[11px] font-bold text-gray-500">
                    {startIndex + idx + 1}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-gray-900 block">{log.studentName}</span>
                    <span className="font-mono text-[11px] text-gray-500">{log.matricId}</span>
                  </td>

                  <td className="py-3 px-4 font-mono text-gray-700 font-medium">
                    <div className="flex items-center gap-1.5">
                      {log.channel === 'email' ? (
                        <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                      <span>
                        {formatPhoneNumber(log.recipientPhoneMasked || log.destinationPhone || '')}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-800 block">{log.tierLabel}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-mono tracking-tight">
                      {log.channel === 'email' ? 'SMTP Official Notice' : 'WhatsApp'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-gray-500">
                    {log.sentAt
                      ? new Date(log.sentAt).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Scheduled'}
                  </td>

                  <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                      {log.providerSid || log.providerMessageSid || 'N/A'}
                    </span>
                    {log.errorMessage && (
                      <p className="text-[10px] text-rose-600 mt-1">{log.errorMessage}</p>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {getStatusBadge(log.status)}
                    {log.status === 'FAILED' && (
                      <button
                        type="button"
                        onClick={() => handleRetry(log.id)}
                        disabled={retryingId === log.id}
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 font-semibold bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded transition shadow-2xs cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                        <span>{retryingId === log.id ? 'Retrying...' : 'Retry'}</span>
                      </button>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmLog(log)}
                      disabled={deletingId === log.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete this notification log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-3.5 bg-gray-50/80 border-t border-[#E4E7EC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
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
            Showing <strong className="text-gray-900">{filteredLogs.length > 0 ? startIndex + 1 : 0}</strong>–
            <strong className="text-gray-900">{Math.min(startIndex + pageSize, filteredLogs.length)}</strong> of{' '}
            <strong className="text-gray-900">{filteredLogs.length}</strong> audit records
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

      {/* Delete Confirmation Dialog */}
      {deleteConfirmLog && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-in fade-in duration-100"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">Delete Notification Audit Log?</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Are you sure you want to permanently erase the dispatch record for{' '}
                  <strong className="text-gray-900">{deleteConfirmLog.studentName}</strong> (
                  <span className="font-mono text-gray-700">{deleteConfirmLog.matricId}</span>)?
                  This removes the record from the compliance audit trail.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmLog(null)}
                disabled={!!deletingId}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteNotification(deleteConfirmLog.id)}
                disabled={!!deletingId}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deletingId ? 'Deleting...' : 'Yes, Delete Log'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
