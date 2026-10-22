/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileCheck,
  Download,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '../lib/api/client';
import {
  SpreadsheetPreviewResponse,
  ColumnMappingConfig,
  SpreadsheetValidationResponse,
  SpreadsheetValidationError,
  SpreadsheetConfirmResponse,
} from '../lib/api/types';

interface SpreadsheetImportViewProps {
  onImportComplete: () => void;
  onNavigateStudents: () => void;
}

type ImportStep = 1 | 2 | 3 | 4 | 5;

export const SpreadsheetImportView: React.FC<SpreadsheetImportViewProps> = ({
  onImportComplete,
  onNavigateStudents,
}) => {
  const [currentStep, setCurrentStep] = useState<ImportStep>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Step 2 preview data
  const [previewData, setPreviewData] = useState<SpreadsheetPreviewResponse | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMappingConfig>({
    matricId: 'Matric ID',
    fullName: 'Student Name',
    nationality: 'Nationality',
    phoneNumber: 'Phone Number',
    visaExpiryDate: 'Visa Expiry Date',
    faculty: 'Faculty',
    program: 'Program',
  });

  // Step 3 validation results
  const [validationResult, setValidationResult] = useState<SpreadsheetValidationResponse | null>(null);

  // Step 5 commit results
  const [commitResult, setCommitResult] = useState<SpreadsheetConfirmResponse | null>(null);

  // Handlers
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setErrorNotice(null);
    setIsUploading(true);

    try {
      const preview = await apiClient.previewSpreadsheet(file);
      setPreviewData(preview);

      if (preview.suggestedMapping) {
        setColumnMapping(preview.suggestedMapping);
      } else {
        const headers = preview.detectedHeaders || [];
        const findHeader = (synonyms: string[]) =>
          headers.find((h) => synonyms.some((s) => h.trim().toLowerCase() === s.toLowerCase())) ||
          headers.find((h) => synonyms.some((s) => h.toLowerCase().includes(s.toLowerCase()))) ||
          '';

        setColumnMapping({
          matricId: findHeader(['Matric ID', 'Matric No', 'Student ID', 'Matric']) || headers[0] || 'Matric ID',
          fullName: findHeader(['Student Name', 'Full Name', 'Name', 'Student']) || headers[1] || 'Student Name',
          visaExpiryDate: findHeader(['Visa Expiry Date', 'Expiry Date', 'Visa Expiry', 'Pass Expiry Date', 'Expiry']) || 'Visa Expiry Date',
          phoneNumber: findHeader(['Phone Number', 'WhatsApp Number', 'Phone', 'WhatsApp', 'Contact', 'Mobile']) || '',
          nationality: findHeader(['Nationality', 'Country', 'Citizen']) || '',
          faculty: findHeader(['Faculty', 'School', 'Department', 'Dept']) || '',
          program: findHeader(['Program', 'Programme', 'Course', 'Degree']) || '',
        });
      }

      setCurrentStep(2);
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to parse spreadsheet file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunValidation = async () => {
    if (!previewData) return;
    setIsValidating(true);
    setErrorNotice(null);

    try {
      const rowsToValidate =
        previewData.allRows && previewData.allRows.length > 0
          ? previewData.allRows
          : previewData.previewRows;
      const res = await apiClient.validateSpreadsheet(columnMapping, rowsToValidate);
      setValidationResult(res);
      setCurrentStep(3);
    } catch (err: any) {
      setErrorNotice(err.message || 'Validation request failed.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmCommit = async () => {
    if (!validationResult) return;
    setIsCommitting(true);
    setErrorNotice(null);

    try {
      const result = await apiClient.confirmSpreadsheetImport(validationResult);
      setCommitResult(result);
      setCurrentStep(5);
      onImportComplete();
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to commit import records.');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleDownloadErrorReport = () => {
    if (!validationResult) return;
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        'Row Number,Matric ID,Field,Value,Error Reason,Severity',
        ...validationResult.errors.map(
          (e: SpreadsheetValidationError) => `"${e.rowNumber}","${e.matricId || ''}","${e.field}","${e.value}","${e.reason || e.message || ''}","${e.severity}"`
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UniSIRAJ_Spreadsheet_Validation_Errors_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-xs overflow-hidden">
      {/* Wizard Progress Stepper */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#142B4A] to-[#1E3A5F] text-white">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D6A52B]">
              Pillar 1: Data Ingestion
            </span>
            <h2 className="text-base font-bold text-white">
              Student Visa Spreadsheet Ingestion & Validation
            </h2>
          </div>
          <span className="text-xs bg-white/10 px-3 py-1 rounded-full text-blue-100 font-medium">
            Step {currentStep} of 5
          </span>
        </div>

        {/* Stepper nodes */}
        <div className="grid grid-cols-5 gap-2 text-xs">
          {[
            { step: 1, label: 'Upload File' },
            { step: 2, label: 'Preview & Map' },
            { step: 3, label: 'Validation' },
            { step: 4, label: 'Review' },
            { step: 5, label: 'Results' },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center text-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 transition-colors ${
                  currentStep === item.step
                    ? 'bg-[#D6A52B] text-[#142B4A] shadow-xs'
                    : currentStep > item.step
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/20 text-white/70'
                }`}
              >
                {currentStep > item.step ? '✓' : item.step}
              </div>
              <span
                className={`text-[10px] font-semibold hidden sm:inline ${
                  currentStep === item.step ? 'text-white' : 'text-white/60'
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error alert banner */}
      {errorNotice && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button type="button" onClick={() => setErrorNotice(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step Content */}
      <div className="p-6 text-sm">
        {/* STEP 1: Upload */}
        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto space-y-6 py-4">
            <div className="text-center space-y-1">
              <h3 className="font-bold text-gray-900 text-base">Select or Drop Spreadsheet File</h3>
              <p className="text-xs text-gray-500">
                Upload your active CIA student pass spreadsheet (.XLSX, .XLS, or .CSV) for automated ingestion.
              </p>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              className="border-2 border-dashed border-[#E4E7EC] hover:border-[#2457A7] rounded-2xl p-8 text-center bg-[#F5F6F8]/60 hover:bg-blue-50/20 transition-all cursor-pointer"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-100/70 text-[#2457A7] flex items-center justify-center mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>
              <p className="font-bold text-gray-800 text-sm mb-1">
                Drag and drop your spreadsheet here, or browse files
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv) up to 15MB
              </p>

              <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#2457A7] hover:bg-[#1E3A5F] rounded-xl transition-colors shadow-2xs cursor-pointer">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Browse Local Computer</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          </div>
        )}

        {/* STEP 2: Preview & Column Mapping */}
        {currentStep === 2 && previewData && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4E7EC]">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Spreadsheet Preview & Header Mapping</h3>
                <p className="text-xs text-gray-500">
                  File: <strong className="text-gray-800">{previewData.fileName}</strong> ({previewData.totalRows} records detected)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-gray-500 hover:text-gray-800 underline"
              >
                Choose another file
              </button>
            </div>

            {/* Mapping Selectors */}
            <div className="p-4 rounded-xl border border-[#E4E7EC] bg-gray-50/60 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Confirm Database Column Alignments
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Matriculation ID *</label>
                  <select
                    value={columnMapping.matricId}
                    onChange={(e) => setColumnMapping({ ...columnMapping, matricId: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs"
                  >
                    {columnMapping.matricId && !previewData.detectedHeaders.includes(columnMapping.matricId) && (
                      <option value={columnMapping.matricId}>{columnMapping.matricId} (Auto)</option>
                    )}
                    {previewData.detectedHeaders.map((h: string) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Student Full Name *</label>
                  <select
                    value={columnMapping.fullName}
                    onChange={(e) => setColumnMapping({ ...columnMapping, fullName: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs"
                  >
                    {columnMapping.fullName && !previewData.detectedHeaders.includes(columnMapping.fullName) && (
                      <option value={columnMapping.fullName}>{columnMapping.fullName} (Auto)</option>
                    )}
                    {previewData.detectedHeaders.map((h: string) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Student Pass Expiry Date *</label>
                  <select
                    value={columnMapping.visaExpiryDate}
                    onChange={(e) => setColumnMapping({ ...columnMapping, visaExpiryDate: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs"
                  >
                    {columnMapping.visaExpiryDate && !previewData.detectedHeaders.includes(columnMapping.visaExpiryDate) && (
                      <option value={columnMapping.visaExpiryDate}>{columnMapping.visaExpiryDate} (Auto)</option>
                    )}
                    {previewData.detectedHeaders.map((h: string) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Phone Number (WhatsApp)</label>
                  <select
                    value={columnMapping.phoneNumber}
                    onChange={(e) => setColumnMapping({ ...columnMapping, phoneNumber: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs"
                  >
                    <option value="">-- Not in Spreadsheet (Optional) --</option>
                    {columnMapping.phoneNumber && !previewData.detectedHeaders.includes(columnMapping.phoneNumber) && (
                      <option value={columnMapping.phoneNumber}>{columnMapping.phoneNumber} (Auto)</option>
                    )}
                    {previewData.detectedHeaders.map((h: string) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Nationality</label>
                  <select
                    value={columnMapping.nationality}
                    onChange={(e) => setColumnMapping({ ...columnMapping, nationality: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs"
                  >
                    <option value="">-- Not in Spreadsheet (Optional) --</option>
                    {columnMapping.nationality && !previewData.detectedHeaders.includes(columnMapping.nationality) && (
                      <option value={columnMapping.nationality}>{columnMapping.nationality} (Auto)</option>
                    )}
                    {previewData.detectedHeaders.map((h: string) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Faculty</label>
                  <select
                    value={columnMapping.faculty || ''}
                    onChange={(e) => setColumnMapping({ ...columnMapping, faculty: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs"
                  >
                    <option value="">-- Not in Spreadsheet (Optional) --</option>
                    {columnMapping.faculty && !previewData.detectedHeaders.includes(columnMapping.faculty) && (
                      <option value={columnMapping.faculty}>{columnMapping.faculty} (Auto)</option>
                    )}
                    {previewData.detectedHeaders.map((h: string) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table preview */}
            <div className="rounded-xl border border-[#E4E7EC] overflow-x-auto min-w-full">
              <table className="w-full text-left text-xs border-collapse" aria-label="Spreadsheet Ingestion Preview">
                <thead className="bg-[#F8F9FA] border-b border-[#E4E7EC] text-[11px] uppercase font-bold tracking-wider text-gray-700">
                  <tr>
                    <th scope="col" className="py-2.5 px-3 text-center w-12 font-mono">No.</th>
                    {previewData.detectedHeaders.map((h: string) => (
                      <th key={h} scope="col" className="py-2.5 px-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewData.previewRows.map((row: Record<string, string>, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50/70">
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] font-bold text-gray-500">
                        {idx + 1}
                      </td>
                      {previewData.detectedHeaders.map((h: string) => (
                        <td key={h} className="py-2.5 px-3 font-medium text-gray-800 whitespace-nowrap">
                          {row[h] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleRunValidation}
                disabled={isValidating}
                className="px-5 py-2 text-xs font-bold text-white bg-[#2457A7] hover:bg-[#1E3A5F] rounded-xl flex items-center gap-1.5 shadow-2xs"
              >
                {isValidating ? 'Validating Records...' : 'Execute Validation Engine'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Validation Results */}
        {currentStep === 3 && validationResult && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC]">
              <div>
                <h3 className="font-bold text-gray-900 text-base">Validation Outcome & Anomaly Audit</h3>
                <p className="text-xs text-gray-500">
                  Verified against mandatory Student Pass formats, duplicate matric IDs, and E.164 phone standards.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadErrorReport}
                className="px-3.5 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                <span>Export Audit CSV</span>
              </button>
            </div>

            {/* Validation Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50/70">
                <span className="text-gray-500 block">Total Ingested Rows</span>
                <strong className="text-xl font-bold text-gray-900 font-mono">{validationResult.totalRows}</strong>
              </div>
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <span className="text-emerald-800 block">Valid Records</span>
                <strong className="text-xl font-bold text-emerald-700 font-mono">{validationResult.validRowsCount}</strong>
              </div>
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
                <span className="text-amber-800 block">Duplicate Records</span>
                <strong className="text-xl font-bold text-amber-700 font-mono">{validationResult.duplicateRowsCount}</strong>
              </div>
              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50">
                <span className="text-rose-800 block">Rejected / Critical</span>
                <strong className="text-xl font-bold text-rose-700 font-mono">{validationResult.invalidRowsCount}</strong>
              </div>
            </div>

            {/* Errors / Warnings List */}
            {validationResult.errors.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Format Anomalies & Warnings ({validationResult.errors.length})
                </h4>
                <div className="divide-y divide-amber-200/60 text-xs">
                  {validationResult.errors.map((err: SpreadsheetValidationError, idx: number) => (
                    <div key={idx} className="py-2 flex items-start justify-between gap-3">
                      <div>
                        <span className="font-mono font-bold text-gray-800 mr-2">Row #{err.rowNumber}</span>
                        {err.matricId && (
                          <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200 mr-2">
                            {err.matricId}
                          </span>
                        )}
                        <span className="text-gray-700 font-medium">{err.field}:</span>{' '}
                        <span className="text-amber-900 font-semibold">"{err.value}"</span>
                        <p className="text-[11px] text-gray-500 mt-0.5">{err.reason || err.message}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 shrink-0">
                        {err.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Back to Mapping
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#2457A7] hover:bg-[#1E3A5F] rounded-xl flex items-center gap-1.5 shadow-2xs"
              >
                Review & Confirm Additions
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review and Confirm */}
        {currentStep === 4 && validationResult && (
          <div className="space-y-6">
            <div className="border-b border-[#E4E7EC] pb-3">
              <h3 className="font-bold text-gray-900 text-base">Proposed Additions & Database Mutations</h3>
              <p className="text-xs text-gray-500">
                Please review proposed record commits. Once submitted, records will be enrolled into the automated daily synchroniser.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
                <h4 className="font-bold text-blue-950 text-xs mb-2">
                  New Student Pass Records to be Created ({validationResult.proposedAdditions.length})
                </h4>
                <div className="divide-y divide-blue-200/50 text-xs">
                  {validationResult.proposedAdditions.map((p: any, idx: number) => (
                    <div key={idx} className="py-2 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-gray-900">{p.fullName}</span>{' '}
                        <span className="font-mono text-gray-500">({p.matricId})</span>
                        <span className="block text-[11px] text-gray-500">
                          {p.nationality} • Expiry: <strong>{p.visaExpiryDate}</strong> • Phone: {p.phoneNumber}
                        </span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                        New Record
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {validationResult.proposedUpdates.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                  <h4 className="font-bold text-amber-950 text-xs mb-2">
                    Existing Records Overwritten / Updated ({validationResult.proposedUpdates.length})
                  </h4>
                  <div className="divide-y divide-amber-200/50 text-xs">
                    {validationResult.proposedUpdates.map((u: any, idx: number) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-gray-900">{u.existingRecord.fullName}</span>{' '}
                          <span className="font-mono text-gray-500">({u.existingRecord.matricId})</span>
                          <span className="block text-[11px] text-gray-500">
                            Updating fields: {u.changedFields.join(', ')}
                          </span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold">
                          Update Overwrite
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Back to Validation
              </button>
              <button
                type="button"
                onClick={handleConfirmCommit}
                disabled={isCommitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-2xs"
              >
                {isCommitting ? 'Committing Ingestion...' : 'Confirm & Ingest Spreadsheet'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Results */}
        {currentStep === 5 && commitResult && (
          <div className="max-w-xl mx-auto py-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900">Spreadsheet Ingestion Complete!</h3>
              <p className="text-xs text-gray-500">
                Batch Reference: <strong className="font-mono text-gray-800">{commitResult.batchId}</strong> • Timestamp: {commitResult.completionTimestamp}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs text-left p-4 rounded-2xl bg-gray-50 border border-[#E4E7EC]">
              <div>
                <span className="text-gray-500 block">Records Created</span>
                <strong className="text-lg font-bold text-emerald-700">{commitResult.recordsCreated}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Records Updated</span>
                <strong className="text-lg font-bold text-blue-700">{commitResult.recordsUpdated}</strong>
              </div>
              <div>
                <span className="text-gray-500 block">Rejected / Failed</span>
                <strong className="text-lg font-bold text-gray-400">{commitResult.recordsRejected}</strong>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewData(null);
                  setValidationResult(null);
                  setCurrentStep(1);
                }}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl"
              >
                Upload Another File
              </button>
              <button
                type="button"
                onClick={onNavigateStudents}
                className="px-5 py-2 text-xs font-bold text-white bg-[#2457A7] hover:bg-[#1E3A5F] rounded-xl flex items-center gap-1.5 shadow-2xs"
              >
                View Student Records
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
