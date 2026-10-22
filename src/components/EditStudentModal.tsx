/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, AlertCircle } from 'lucide-react';
import { Student, VisaCategory, EMGSStatus, ProcessedStudent } from '../types/student';
import { formatPhoneNumber } from '../utils/visaRules';

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: ProcessedStudent | Student | null;
  onSaveStudent: (updatedStudent: Student) => Promise<void> | void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onSaveStudent,
}) => {
  const [fullName, setFullName] = useState('');
  const [matricId, setMatricId] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nationality, setNationality] = useState('Indonesia');
  const [countryCode, setCountryCode] = useState('ID');
  const [passportNumber, setPassportNumber] = useState('');
  const [program, setProgram] = useState('');
  const [faculty, setFaculty] = useState('');
  const [visaCategory, setVisaCategory] = useState<VisaCategory>('Student Pass (Degree)');
  const [visaExpiryDate, setVisaExpiryDate] = useState('');
  const [emgsStatus, setEmgsStatus] = useState<EMGSStatus>('In Progress');
  const [notes, setNotes] = useState('');
  const [advisorName, setAdvisorName] = useState('');
  const [sponsorType, setSponsorType] = useState<'Self-Funded' | 'University Scholarship' | 'Government Sponsored' | 'MoHE Grant'>('Self-Funded');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever selected student changes or modal opens
  useEffect(() => {
    if (student) {
      setFullName(student.fullName || '');
      setMatricId(student.matricId || '');
      setEmail(student.email || '');
      setPhoneNumber(formatPhoneNumber(student.phoneNumber || (student as any).whatsapp_number || '') || '');
      setNationality(student.nationality || 'Indonesia');
      setCountryCode(student.countryCode || 'ID');
      setPassportNumber(student.passportNumber || '');
      setProgram(student.program || '');
      setFaculty(student.faculty || '');
      setVisaCategory(student.visaCategory || 'Student Pass (Degree)');
      setVisaExpiryDate(student.visaExpiryDate || '');
      setEmgsStatus(student.emgsStatus || 'In Progress');
      setNotes(student.notes || '');
      setAdvisorName(student.advisorName || '');
      setSponsorType(student.sponsorType || 'Self-Funded');
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !matricId || !visaExpiryDate) return;

    setIsSubmitting(true);
    try {
      const updatedStudent: Student = {
        ...student,
        id: student.id,
        matricId: matricId.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        nationality,
        countryCode,
        passportNumber: passportNumber.trim(),
        program: program.trim(),
        faculty: faculty.trim(),
        visaCategory,
        visaExpiryDate,
        emgsStatus,
        notes: notes.trim(),
        advisorName: advisorName.trim(),
        sponsorType,
      };

      await onSaveStudent(updatedStudent);
      onClose();
    } catch (err) {
      console.error('Failed to update student:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-student-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0D2040] to-[#1E3A5F] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Edit3 className="w-5 h-5 text-amber-300" />
            <div>
              <h2 id="edit-student-title" className="text-base font-bold">
                Edit Student Information
              </h2>
              <p className="text-xs text-blue-200 font-mono">
                {student.matricId} — {student.fullName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Salim Al-Jabari"
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Matriculation ID *
              </label>
              <input
                type="text"
                required
                value={matricId}
                onChange={(e) => setMatricId(e.target.value)}
                placeholder="e.g. UIS-2024-INT402"
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                WhatsApp Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. +60 12-345 6789"
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Student Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@student.unisiraj.edu.my"
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Nationality & Country
              </label>
              <select
                value={`${nationality}|${countryCode}`}
                onChange={(e) => {
                  const [n, c] = e.target.value.split('|');
                  setNationality(n);
                  setCountryCode(c);
                }}
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100"
              >
                <option value="Indonesia|ID">Indonesia (ID)</option>
                <option value="Yemen|YE">Yemen (YE)</option>
                <option value="Nigeria|NG">Nigeria (NG)</option>
                <option value="China|CN">China (CN)</option>
                <option value="Egypt|EG">Egypt (EG)</option>
                <option value="Pakistan|PK">Pakistan (PK)</option>
                <option value="Bangladesh|BD">Bangladesh (BD)</option>
                <option value="Saudi Arabia|SA">Saudi Arabia (SA)</option>
                <option value="Sudan|SD">Sudan (SD)</option>
                <option value="Algeria|DZ">Algeria (DZ)</option>
                <option value="Kazakhstan|KZ">Kazakhstan (KZ)</option>
                <option value="Brunei|BN">Brunei (BN)</option>
                <option value="Somalia|SO">Somalia (SO)</option>
                <option value="Syria|SY">Syria (SY)</option>
                <option value="Turkey|TR">Turkey (TR)</option>
                <option value="Gambia|GM">Gambia (GM)</option>
                <option value="Guinea|GN">Guinea (GN)</option>
                <option value="Jordan|JO">Jordan (JO)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Passport Number
              </label>
              <input
                type="text"
                value={passportNumber}
                onChange={(e) => setPassportNumber(e.target.value)}
                placeholder="e.g. A9283741"
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-mono focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Visa Expiry Date *
              </label>
              <input
                type="date"
                required
                value={visaExpiryDate}
                onChange={(e) => setVisaExpiryDate(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Pass Category
              </label>
              <select
                value={visaCategory}
                onChange={(e: any) => setVisaCategory(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100"
              >
                <option value="Student Pass (Degree)">Student Pass (Degree)</option>
                <option value="Student Pass (Postgraduate)">Student Pass (Postgraduate)</option>
                <option value="Student Pass (Foundation)">Student Pass (Foundation)</option>
                <option value="Student Pass (Research)">Student Pass (Research)</option>
                <option value="Dependent Pass">Dependent Pass</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                EMGS Workflow Stage
              </label>
              <select
                value={emgsStatus}
                onChange={(e: any) => setEmgsStatus(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100"
              >
                <option value="In Progress">In Progress</option>
                <option value="Pending Documents">Pending Documents</option>
                <option value="Requires Biometrics">Requires Biometrics</option>
                <option value="Approved">Approved</option>
                <option value="Not Started">Not Started</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Sponsor Type
              </label>
              <select
                value={sponsorType}
                onChange={(e: any) => setSponsorType(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100"
              >
                <option value="Self-Funded">Self-Funded</option>
                <option value="University Scholarship">University Scholarship</option>
                <option value="Government Sponsored">Government Sponsored</option>
                <option value="MoHE Grant">MoHE Grant</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Faculty
              </label>
              <input
                type="text"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                placeholder="e.g. Faculty of Islamic Economics & Business"
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Program
              </label>
              <input
                type="text"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                placeholder="e.g. Bachelor of Islamic Finance (Hons)"
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Academic Advisor
            </label>
            <input
              type="text"
              value={advisorName}
              onChange={(e) => setAdvisorName(e.target.value)}
              placeholder="e.g. Prof. Dr. Ahmad Al-Farooqi"
              className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Internal Compliance Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Renewal submitted to EMGS portal; passport validity verified."
              className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
