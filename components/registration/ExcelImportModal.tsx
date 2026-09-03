import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  batchImportStudentRegistrations,
  fetchStudents,
  ExcelStudentImportRow,
} from '@/lib/api/supabase-service';
import { RegistrationType } from '@/lib/types';
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  ArrowRight,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<(ExcelStudentImportRow & { isDuplicate?: boolean; existingUid?: string })[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  // Helper to extract field value dynamically from Excel row regardless of header casing
  const getFieldValue = (row: any, keys: string[]): string => {
    const rowKeys = Object.keys(row);
    for (const key of keys) {
      const foundKey = rowKeys.find(
        (k) => k.trim().toLowerCase() === key.trim().toLowerCase()
      );
      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
        const val = String(row[foundKey]).trim();
        if (val) return val;
      }
    }
    return '';
  };

  // Handle Excel file selection & parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStatusMessage(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        // Fetch existing database students to flag duplicate matches during staging
        const existingStudents = await fetchStudents();

        const mapped = rawJson.map((row, idx) => {
          let firstName = getFieldValue(row, [
            'first name',
            'firstname',
            'first_name',
            'given name',
            'given_name',
            'fname',
            'candidate first name',
            'student first name'
          ]);
          let lastName = getFieldValue(row, [
            'last name',
            'lastname',
            'last_name',
            'surname',
            'family name',
            'family_name',
            'lname',
            'candidate last name',
            'student last name'
          ]);
          const fullName = getFieldValue(row, [
            'name',
            'student name',
            'full name',
            'student_name',
            'fullname',
            'candidate name',
            'candidate_name',
            'student'
          ]);

          if ((!firstName || !lastName) && fullName) {
            const parts = fullName.trim().split(/\s+/);
            if (parts.length === 1) {
              firstName = parts[0];
              lastName = '';
            } else if (parts.length > 1) {
              firstName = parts[0];
              lastName = parts.slice(1).join(' ');
            }
          }

          // Fallback only if no valid name or full name exists in the Excel row
          if (!firstName && !lastName) {
            firstName = `Student`;
            lastName = `${idx + 1}`;
          } else if (!firstName && lastName) {
            firstName = lastName;
            lastName = '';
          }

          const extractedEmail = getFieldValue(row, [
            'email',
            'email address',
            'email_address',
            'mail',
            'e-mail',
            'student email',
            'contact email'
          ]);
          const cleanFirst = (firstName || 'student').toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanLast = (lastName || 'record').toLowerCase().replace(/[^a-z0-9]/g, '');
          const email = extractedEmail || `${cleanFirst}${cleanLast ? '.' + cleanLast : ''}_${idx + 1}@student.edu`;

          const phone = getFieldValue(row, ['phone', 'phone number', 'contact', 'mobile', 'mobile number', 'phone_number']);
          const instName = getFieldValue(row, ['institution', 'institution name', 'institution_name', 'college', 'school', 'university', 'institute']);
          const deptName = getFieldValue(row, ['department', 'department name', 'department_name', 'dept', 'branch', 'stream']);
          const progName = getFieldValue(row, ['program', 'program name', 'program_name', 'course', 'degree', 'programme']);
          const academicYear = getFieldValue(row, ['academic year', 'academic_year', 'year', 'session', 'batch']) || '2026-2027';
          
          let regTypeRaw = getFieldValue(row, ['registration type', 'registration_type', 'type', 'reg_type', 'mode']);
          let regType: RegistrationType = 'INITIAL_REGISTRATION';
          if (regTypeRaw) {
            const normalized = regTypeRaw.toUpperCase().replace(/\s+/g, '_');
            if (normalized.includes('RE') || normalized.includes('RE_REGISTRATION')) regType = 'RE_REGISTRATION';
            else if (normalized.includes('TRANSFER')) regType = 'TRANSFER';
            else if (normalized.includes('PROGRESSION')) regType = 'PROGRAM_PROGRESSION';
          }

          // Staging Duplicate Check Logic
          const matchedStu = existingStudents.find((s: any) => {
            const sameEmail = email && s.email.toLowerCase() === email.toLowerCase();
            const sameName =
              s.first_name.toLowerCase() === firstName.toLowerCase() &&
              s.last_name.toLowerCase() === lastName.toLowerCase();
            return sameEmail || sameName;
          });

          return {
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            academic_year: academicYear,
            registration_type: regType,
            institution_name: instName,
            department_name: deptName,
            program_name: progName,
            isDuplicate: !!matchedStu,
            existingUid: matchedStu?.permanent_uid,
          };
        });

        setParsedRows(mapped);
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: `Failed to read Excel sheet: ${err.message}`,
        });
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  // Download Sample Excel Template
  const handleDownloadSample = () => {
    const sampleData = [
      {
        'First Name': 'Sophia',
        'Last Name': 'Chen',
        Email: 'sophia.chen@student.edu',
        Phone: '+1 (555) 234-5678',
        Institution: 'Institute of Technology & Engineering',
        Department: 'Computer Science & Software',
        Program: 'B.Sc. Software Engineering',
        'Academic Year': '2026-2027',
        'Registration Type': 'INITIAL_REGISTRATION',
      },
      {
        'First Name': 'Marcus',
        'Last Name': 'Vance',
        Email: 'marcus.vance@student.edu',
        Phone: '+1 (555) 345-6789',
        Institution: 'College of Business & Public Policy',
        Department: 'Business Administration',
        Program: 'Bachelor of Business Administration',
        'Academic Year': '2026-2027',
        'Registration Type': 'RE_REGISTRATION',
      },
      {
        'First Name': 'Elena',
        'Last Name': 'Rostova',
        Email: 'elena.rostova@student.edu',
        Phone: '+1 (555) 456-7890',
        Institution: 'Academy of Health & Medical Sciences',
        Department: 'Clinical Medicine',
        Program: 'Doctor of Medicine (MD)',
        'Academic Year': '2026-2027',
        'Registration Type': 'TRANSFER',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Registrations');
    XLSX.writeFile(wb, 'ATA_Student_Registration_Template.xlsx');
  };

  // Process Batch Import to Supabase Database
  const handleProcessImport = async () => {
    if (parsedRows.length === 0) return;

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      const res = await batchImportStudentRegistrations(parsedRows);

      if (res.successCount > 0) {
        setStatusMessage({
          type: 'success',
          text: `Successfully created ${res.successCount} student registrations in real-time database!`,
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setStatusMessage({
          type: 'error',
          text: `Import failed: ${res.errors.join('; ')}`,
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: `Error processing import: ${err.message}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-blue-50/70 border-b border-blue-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Import Student Registrations from Excel
              </h3>
              <p className="text-xs text-slate-500">
                Upload `.xlsx`, `.xls` or `.csv` files to create student records automatically.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-4 text-xs font-semibold flex items-center gap-2 border-b shrink-0 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Body Area */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Top File Upload Box */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30">
            <div className="flex items-center gap-3">
              <Upload className="h-6 w-6 text-blue-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Select Excel File (.xlsx, .xls, .csv)
                </h4>
                <p className="text-[11px] text-slate-500">
                  {file ? file.name : 'No file selected yet.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="flex-1 sm:flex-none cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors">
                <span>Browse File</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleDownloadSample}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shrink-0"
                title="Download formatted sample Excel sheet"
              >
                <Download className="h-3.5 w-3.5" />
                Sample Template
              </button>
            </div>
          </div>

          {/* Parsed Preview Section with Actual Extracted Fields */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-600" />
                  <h4 className="text-xs font-bold text-slate-900">
                    Extracted Excel Student Preview ({parsedRows.length} Records)
                  </h4>
                </div>
                <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  Parsed & Verified
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold text-[11px] sticky top-0">
                      <th className="py-2.5 px-4">#</th>
                      <th className="py-2.5 px-4">Student Name</th>
                      <th className="py-2.5 px-4">Email</th>
                      <th className="py-2.5 px-4">Institution / Department</th>
                      <th className="py-2.5 px-4">Academic Year</th>
                      <th className="py-2.5 px-4">Status / Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={`hover:bg-slate-50/60 ${row.isDuplicate ? 'bg-amber-50/50' : ''}`}>
                        <td className="py-2.5 px-4 text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 font-sans">
                          <div className="flex items-center gap-1.5">
                            <span>{row.first_name} {row.last_name}</span>
                            {row.isDuplicate && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3 text-amber-600" />
                                Existing Candidate ({row.existingUid})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{row.email}</td>
                        <td className="py-2.5 px-4 text-slate-600 font-sans text-[10px]">
                          <div>{row.institution_name || 'Default Institution'}</div>
                          <div className="text-slate-400 text-[9px]">{row.department_name || 'Default Department'}</div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{row.academic_year}</td>
                        <td className="py-2.5 px-4 font-semibold font-sans text-[10px]">
                          <span className={row.isDuplicate ? 'text-amber-700 font-bold' : 'text-blue-600'}>
                            {row.isDuplicate ? 'Reuse Existing UID' : row.registration_type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Confirmation */}
        <div className="flex items-center justify-between p-5 border-t border-slate-100 bg-slate-50/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0 || isProcessing}
            onClick={handleProcessImport}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-40"
          >
            <span>{isProcessing ? 'Pushing Records to Database...' : `Confirm & Push ${parsedRows.length} Registrations to Database`}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
