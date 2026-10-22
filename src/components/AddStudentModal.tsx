/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, UserPlus, Calendar } from 'lucide-react';
import { Student, VisaCategory, EMGSStatus } from '../types/student';
import { formatPhoneNumber } from '../utils/visaRules';

const getDefaultExpiryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 45);
  return d.toISOString().split('T')[0];
};

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudent: (student: Student) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  onAddStudent,
}) => {
  const [fullName, setFullName] = useState('');
  const [matricId, setMatricId] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [nationality, setNationality] = useState('Indonesia');
  const [countryCode, setCountryCode] = useState('ID');
  const [passportNumber, setPassportNumber] = useState('');
  const [program, setProgram] = useState('Bachelor of Islamic Finance (Hons)');
  const [faculty, setFaculty] = useState('Faculty of Islamic Economics & Business');
  const [visaCategory, setVisaCategory] = useState<VisaCategory>('Student Pass (Degree)');
  const [visaExpiryDate, setVisaExpiryDate] = useState(getDefaultExpiryDate());
  const [emgsStatus, setEmgsStatus] = useState<EMGSStatus>('In Progress');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !matricId || !visaExpiryDate) return;

    const newStudent: Student = {
      id: `stu-${Date.now()}`,
      matricId: matricId.trim(),
      fullName: fullName.trim(),
      email: email.trim() || `${matricId.toLowerCase()}@student.unisiraj.edu.my`,
      phoneNumber: formatPhoneNumber(phoneNumber.trim()) || '+60123456789',
      nationality,
      countryCode,
      passportNumber: passportNumber.trim() || `P${Math.floor(1000000 + Math.random() * 9000000)}`,
      program,
      faculty,
      visaCategory,
      visaExpiryDate,
      emgsStatus,
      notes: notes.trim() || 'New student record added via CIA Helpdesk portal.',
      advisorName: 'Dr. International Coordinator',
      sponsorType: 'Self-Funded',
    };

    onAddStudent(newStudent);
    setFullName('');
    setMatricId('');
    setEmail('');
    setPhoneNumber('');
    setPassportNumber('');
    setNotes('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-student-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0D2040] to-[#1E3A5F] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-amber-300" />
            <h2 id="add-student-title" className="text-base font-bold">
              Add International Student Record
            </h2>
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
                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-100"
              />
            </div>
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
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
            >
              Add Student Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
