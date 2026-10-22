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
  FileCheck,
  ArrowRight,
  RefreshCw,
  X,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { ImportsApi } from '../lib/api/imports';
import {
  SpreadsheetPreviewResponse,
  SpreadsheetValidationResponse,
  SpreadsheetConfirmResponse,
  ColumnMappingConfig,
} from '../lib/api/types';

interface SpreadsheetImportViewProps {
  onImportComplete: () => void;
  isDemoMode: boolean;
}

export const SpreadsheetImportView: React.FC<SpreadsheetImportViewProps> = ({
  onImportComplete,
  isDemoMode,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const [previewData, setPreviewData] = useState<SpreadsheetPreviewResponse | null>(null);
  const [mappingConfig, setMappingConfig] = useState<ColumnMappingConfig>({
    matricId: 'Matric No / ID',
    fullName: 'Full Name',
    nationality: 'Country / Nationality',
    phoneNumber: 'Mobile WhatsApp',
    visaExpiryDate: 'Pass Expiry Date',
    faculty: 'Kulliyyah / Faculty',
    program: 'Study Program',
  });
  const [validationResult, setValidationResult] = useState<SpreadsheetValidationResponse | null>(null);
  const [importResult, setImportResult] = useState<SpreadsheetConfirmResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File selection
  const processSelectedFile = async (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setIsPreviewing(true);

    try {
      const preview = await ImportsApi.previewFile(file);
      setPreviewData(preview);
      setCurrentStep(2); // Advance to preview & mapping
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse uploaded spreadsheet file.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleValidate = async () => {
    if (!previewData) return;
    setIsValidating(true);
    setErrorMessage(null);

    try {
      const res = await ImportsApi.validateRecords(mappingConfig, previewData.previewRows);
      setValidationResult(res);
      setCurrentStep(3); // Advance to validation results
    } catch (err: any) {
      setErrorMessage(err.message || 'Validation failed on server.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationResult) return;
    setIsConfirming(true);
    setErrorMessage(null);

    try {
      const res = await ImportsApi.confirmImport(validationResult);
      setImportResult(res);
      setCurrentStep(5); // Show results
      onImportComplete();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to finalize spreadsheet import on backend.');
    } finally {
      setIsConfirming(false);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setPreviewData(null);
    setValidationResult(null);
    setImportResult(null);
    setErrorMessage(null);
    setCurrentStep(1);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E4E7EC] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-[#142B4A]">
              Pillar 1: Data Ingestion
            </span>
            <span className="text-xs text-[#667085]">• Active CIA Spreadsheet Audit Hub</span>
          </div>
          <h2 className="text-xl font-bold text-[#142B4A] tracking-tight mt-1">
            Student Visa Spreadsheet Ingestion & Validation
          </h2>
          <p className="text-xs text-[#667085] mt-1 max-w-2xl leading-relaxed">
            Eliminates manual row-by-row scanning. Upload the CIA international student registry (XLSX/CSV) to automatically parse, validate phone numbers, compute pass expiry days, and map data into the compliance engine.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const dummyFile = new File(['mock content'], 'UniSIRAJ_International_Visa_Registry_Oct2026.xlsx', {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            processSelectedFile(dummyFile);
          }}
          className="px-3.5 py-2 text-xs font-bold text-[#2457A7] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shrink-0 self-start md:self-center cursor-pointer"
        >
          Load Demo Registry File
        </button>
      </div>

      {/* Progress Steps Header */}
      <div className="bg-white rounded-xl border border-[#E4E7EC] p-4 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-medium">
          {[
            { step: 1, label: '1. Upload File' },
            { step: 2, label: '2. Column Mapping' },
            { step: 3, label: '3. Data Validation' },
            { step: 4, label: '4. Review & Confirm' },
            { step: 5, label: '5. Ingestion Results' },
          ].map((item) => (
            <div
              key={item.step}
              className={`p-2 rounded-lg border text-center transition-all ${
                currentStep === item.step
                  ? 'bg-[#142B4A] text-white border-[#142B4A] font-bold shadow-2xs'
                  : currentStep > item.step
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-gray-50 text-gray-400 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                {currentStep > item.step ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : null}
                <span>{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-900 font-bold cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 1: UPLOAD */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-[#E4E7EC] p-8 shadow-xs text-center space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                processSelectedFile(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-[#E4E7EC] hover:border-[#2457A7] rounded-2xl p-10 transition-colors bg-[#F5F6F8]/60 flex flex-col items-center justify-center space-y-3 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2457A7]">
              {isPreviewing ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <UploadCloud className="w-7 h-7" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm text-[#142B4A]">
                Drag and drop your Student Visa Spreadsheet here
              </p>
              <p className="text-xs text-[#667085] mt-1">
                Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
              </p>
            </div>

            <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#2457A7] hover:bg-[#1e4685] rounded-lg transition-colors cursor-pointer shadow-2xs">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Browse Local Files</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* STEP 2: PREVIEW & COLUMN MAPPING */}
      {currentStep === 2 && previewData && (
        <div className="bg-white rounded-xl border border-[#E4E7EC] p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC]">
            <div>
              <h3 className="font-bold text-sm text-[#142B4A]">
                Step 2: Column Mapping & Field Verification
              </h3>
              <p className="text-xs text-[#667085]">
                Verify headers in <strong className="text-[#142B4A]">{previewData.fileName}</strong> correspond to primary student compliance attributes.
              </p>
            </div>
            <button
              type="button"
              onClick={resetImport}
              className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
            >
              Choose different file
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold uppercase text-[#667085] block">Student Name</span>
              <span className="font-semibold text-[#142B4A] mt-1 block">Mapped to: {mappingConfig.fullName}</span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold uppercase text-[#667085] block">Matriculation ID</span>
              <span className="font-semibold text-[#142B4A] mt-1 block">Mapped to: {mappingConfig.matricId}</span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold uppercase text-[#667085] block">Pass Expiry Date</span>
              <span className="font-semibold text-[#142B4A] mt-1 block">Mapped to: {mappingConfig.visaExpiryDate}</span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold uppercase text-[#667085] block">WhatsApp Mobile</span>
              <span className="font-semibold text-[#142B4A] mt-1 block">Mapped to: {mappingConfig.phoneNumber}</span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold uppercase text-[#667085] block">Country / Nationality</span>
              <span className="font-semibold text-[#142B4A] mt-1 block">Mapped to: {mappingConfig.nationality}</span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <span className="text-[10px] font-bold uppercase text-[#667085] block">Kulliyyah / Faculty</span>
              <span className="font-semibold text-[#142B4A] mt-1 block">Mapped to: {mappingConfig.faculty}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleValidate}
              disabled={isValidating}
              className="px-4 py-2 text-xs font-bold text-white bg-[#2457A7] hover:bg-[#1e4685] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Auditing Records...</span>
                </>
              ) : (
                <>
                  <span>Proceed to Validation Audit</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: VALIDATION RESULTS AUDIT */}
      {currentStep === 3 && validationResult && (
        <div className="bg-white rounded-xl border border-[#E4E7EC] p-6 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-sm text-[#142B4A]">
              Step 3: Automated Quality & Integrity Audit
            </h3>
            <p className="text-xs text-[#667085]">
              Cloud Run validation engine scanned {validationResult.totalRows} records against Malaysian immigration requirements.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">Valid Records</span>
              <span className="text-2xl font-extrabold text-emerald-700 mt-1 block font-mono">
                {validationResult.validRowsCount}
              </span>
              <span className="text-[10px] text-emerald-600">Ready for automated ingestion</span>
            </div>

            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50">
              <span className="text-[10px] font-bold uppercase text-rose-800 block">Invalid Records</span>
              <span className="text-2xl font-extrabold text-rose-700 mt-1 block font-mono">
                {validationResult.invalidRowsCount}
              </span>
              <span className="text-[10px] text-rose-600">Requires administrative fix</span>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
              <span className="text-[10px] font-bold uppercase text-amber-800 block">Duplicate Rows</span>
              <span className="text-2xl font-extrabold text-amber-700 mt-1 block font-mono">
                {validationResult.duplicateRowsCount}
              </span>
              <span className="text-[10px] text-amber-600">Will update existing profile</span>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50">
              <span className="text-[10px] font-bold uppercase text-blue-800 block">Total Audited</span>
              <span className="text-2xl font-extrabold text-blue-700 mt-1 block font-mono">
                {validationResult.totalRows}
              </span>
              <span className="text-[10px] text-blue-600">Full cohort batch</span>
            </div>
          </div>

          {validationResult.errors.length > 0 && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2 text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Validation Warnings & Detected Flaws ({validationResult.errors.length}):
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {validationResult.errors.map((err, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white border border-amber-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-[#142B4A]">Row {err.rowNumber}:</span>{' '}
                      <span className="font-semibold text-gray-700">[{err.field}]</span>{' '}
                      <span className="text-[#667085]">{err.reason || err.message}</span>
                    </div>
                    <span className="font-mono text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      Rejected
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="text-xs text-gray-600 hover:text-gray-900 font-semibold cursor-pointer"
            >
              &larr; Back to Mapping
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 text-xs font-bold text-white bg-[#2457A7] hover:bg-[#1e4685] rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Review Ingestion Proposal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & CONFIRM */}
      {currentStep === 4 && validationResult && (
        <div className="bg-white rounded-xl border border-[#E4E7EC] p-6 shadow-xs space-y-5">
          <div>
            <h3 className="font-bold text-sm text-[#142B4A]">Step 4: Review Proposed Ingestion Batch</h3>
            <p className="text-xs text-[#667085]">
              Verify database modifications before committing records to the authoritative registry.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 text-xs space-y-2 text-[#182230]">
            <p className="font-bold text-[#142B4A]">Proposed Changes to UniSIRAJ Registry:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#667085]">
              <li>
                <strong className="text-[#142B4A]">{validationResult.validRowsCount} new students</strong> will be added to the active visa monitoring pipeline.
              </li>
              <li>
                <strong className="text-[#142B4A]">{validationResult.proposedUpdates.length} existing student records</strong> will have their pass expiry dates updated.
              </li>
              <li>
                <strong className="text-rose-700">{validationResult.invalidRowsCount} invalid rows</strong> will be omitted and written to the quarantine audit log.
              </li>
            </ul>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="text-xs text-gray-600 hover:text-gray-900 font-semibold cursor-pointer"
            >
              &larr; Back to Validation
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isConfirming}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              {isConfirming ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Ingesting into Registry...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Confirm & Commit Ingestion</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: RESULTS */}
      {currentStep === 5 && importResult && (
        <div className="bg-white rounded-xl border border-[#E4E7EC] p-8 shadow-xs text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#142B4A]">
              Spreadsheet Ingestion Completed Successfully!
            </h3>
            <p className="text-xs text-[#667085] mt-1">
              Batch Reference: <span className="font-mono font-bold text-[#142B4A]">{importResult.batchId}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-xs">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">Created</span>
              <span className="text-xl font-bold text-emerald-700 font-mono">{importResult.recordsCreated}</span>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <span className="text-[10px] font-bold uppercase text-blue-800 block">Updated</span>
              <span className="text-xl font-bold text-blue-700 font-mono">{importResult.recordsUpdated}</span>
            </div>
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
              <span className="text-[10px] font-bold uppercase text-rose-800 block">Rejected</span>
              <span className="text-xl font-bold text-rose-700 font-mono">{importResult.recordsRejected}</span>
            </div>
          </div>

          <div className="pt-3 flex justify-center gap-3">
            <button
              type="button"
              onClick={resetImport}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg cursor-pointer"
            >
              Import Another File
            </button>
            <button
              type="button"
              onClick={() => onImportComplete()}
              className="px-4 py-2 text-xs font-bold text-white bg-[#2457A7] hover:bg-[#1e4685] rounded-lg shadow-2xs cursor-pointer"
            >
              View Updated Dashboard &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
