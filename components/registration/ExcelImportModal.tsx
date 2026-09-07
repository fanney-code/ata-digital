import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import type { ExcelStudentImportRow } from '@/lib/api/supabase-service';
// Batch import now goes through /api/registrations/batch-import BFF route
import { useAuth } from '@/lib/context/AuthContext';
import { isAadharMatch } from '@/lib/utils/aadhar';
import {
  parseExcelWorkbook,
  WorkbookParseResult,
  ParsedSheetInfo,
} from '@/lib/utils/excel-parser';
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
  Building2,
  Calendar,
  GraduationCap,
  Layers,
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
  const { user } = useAuth();
  // NOTE: actorContext is no longer built from user here.
  // Institution isolation is enforced by the BFF using the server session cookie.

  const [file, setFile] = useState<File | null>(null);
  const [workbookResult, setWorkbookResult] = useState<WorkbookParseResult | null>(null);
  const [selectedSheetKey, setSelectedSheetKey] = useState<string>('ALL');
  const [existingStudents, setExistingStudents] = useState<any[]>([]);
  const [parsedRows, setParsedRows] = useState<
    (ExcelStudentImportRow & { isDuplicate?: boolean; existingUid?: string })[]
  >([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Pre-load existing database students for instant duplicate matching
  useEffect(() => {
    if (isOpen) {
      // Pre-load students through BFF for duplicate detection (institution-scoped)
      fetch('/api/students', { credentials: 'include' })
        .then((r) => r.json())
        .then((data) => setExistingStudents(data.students || []))
        .catch(() => setExistingStudents([]));
    } else {
      setFile(null);
      setWorkbookResult(null);
      setParsedRows([]);
      setStatusMessage(null);
      setSelectedSheetKey('ALL');
    }
  }, [isOpen]);

  // Re-run duplicate detection whenever the active sheet selection or workbook changes
  useEffect(() => {
    if (!workbookResult) {
      setParsedRows([]);
      return;
    }

    let sourceRows: ExcelStudentImportRow[] = [];
    if (selectedSheetKey === 'ALL') {
      sourceRows = workbookResult.allStudentRows;
    } else {
      const foundSheet = workbookResult.sheets.find((s) => s.sheetName === selectedSheetKey);
      sourceRows = foundSheet ? foundSheet.rows : workbookResult.allStudentRows;
    }

    const decorated = sourceRows.map((row) => {
      const incomingAadhar = row.aadhar_number;
      const matchedStu = existingStudents.find((s: any) => {
        if (
          row.permanent_uid &&
          s.permanent_uid &&
          s.permanent_uid.toLowerCase() === row.permanent_uid.trim().toLowerCase()
        ) {
          return true;
        }
        const sameEmail = row.email && s.email && s.email.toLowerCase() === row.email.toLowerCase();
        const sameName =
          row.first_name &&
          row.last_name &&
          s.first_name.toLowerCase() === row.first_name.toLowerCase() &&
          s.last_name.toLowerCase() === row.last_name.toLowerCase();
        const sameAadhar = incomingAadhar && isAadharMatch(incomingAadhar, s.national_id || s.aadhar_number);
        return sameEmail || sameName || sameAadhar;
      });

      return {
        ...row,
        isDuplicate: !!matchedStu,
        existingUid: matchedStu?.permanent_uid || row.permanent_uid,
      };
    });

    setParsedRows(decorated);
  }, [workbookResult, selectedSheetKey, existingStudents]);

  if (!isOpen) return null;

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

        // Parse workbook across all sheets with smart header and metadata detection
        const result = parseExcelWorkbook(workbook, selectedFile.name);

        if (result.allStudentRows.length === 0) {
          setStatusMessage({
            type: 'error',
            text: 'Could not find any student records in the selected file. Please ensure the file has student names and registration columns.',
          });
          setWorkbookResult(null);
          return;
        }

        setWorkbookResult(result);
        setSelectedSheetKey(result.sheets.length > 1 ? 'ALL' : result.sheets[0]?.sheetName || 'ALL');
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: `Failed to read Excel file: ${err.message}`,
        });
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  // Download Sample Excel Template
  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Permanent UID': 'STU-2026-00421',
        'First Name': 'Sophia',
        'Last Name': 'Chen',
        Email: 'sophia.chen@student.edu',
        Phone: '+91 98765 43210',
        'Date of Birth': '2002-05-15',
        Gender: 'Female',
        State: 'Karnataka',
        Address: '12 Mission Road, Shanthi Nagar',
        City: 'Bangalore',
        District: 'Bangalore Urban',
        Pincode: '560027',
        'Aadhar Number': '482910394821',
        'Highest Qualification': 'Higher Secondary (10+2)',
        'Previous Institution': 'St. Joseph Pre-University',
        'Year of Completion': '2022',
        Institution: 'New India Bible Seminary',
        Department: 'Department of Theology & Biblical Studies',
        Program: 'Bachelor of Theology',
        'Academic Year': '2026-2027',
        'Registration Type': 'INITIAL_REGISTRATION',
        'Previous Registration Number': '',
        'Registration ID': '',
      },
      {
        'Permanent UID': 'STU-2026-00892',
        'First Name': 'Marcus',
        'Last Name': 'Vance',
        Email: 'marcus.vance@student.edu',
        Phone: '+91 98765 67890',
        'Date of Birth': '1998-11-20',
        Gender: 'Male',
        State: 'Kerala',
        Address: 'College Road, Manakala',
        City: 'Adoor',
        District: 'Pathanamthitta',
        Pincode: '691551',
        'Aadhar Number': '',
        'Highest Qualification': 'Bachelor of Theology',
        'Previous Institution': 'Southern Asia Bible College',
        'Year of Completion': '2025',
        Institution: 'Southern Asia Bible College',
        Department: 'Department of Theology & Biblical Studies',
        Program: 'Master of Divinity',
        'Academic Year': '2026-2027',
        'Registration Type': 'PROGRAM_PROGRESSION',
        'Previous Registration Number': 'SABC/BTH/2022/15',
        'Registration ID': '',
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
      // Send parsed rows to the BFF — actor is resolved server-side from session cookie.
      // This ensures institution isolation is enforced on the server, not in the browser.
      const bffRes = await fetch('/api/registrations/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedRows }),
        credentials: 'include',
      });
      if (!bffRes.ok) {
        const errData = await bffRes.json();
        throw new Error(errData.error || 'Batch import failed');
      }
      const res = await bffRes.json();

      if (res.successCount > 0) {
        setStatusMessage({
          type: 'success',
          text: `Successfully imported ${res.successCount} student registrations into the real-time database!`,
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setStatusMessage({
          type: 'error',
          text: `Import failed: ${(res.errors || []).slice(0, 3).join('; ')}`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-800/80 dark:to-slate-900/80 border-b border-blue-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Import Student Registrations from Excel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seamlessly extracts student profiles, qualifications, and registration numbers from official ATA spreadsheets.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`p-4 text-xs font-semibold flex items-center gap-2.5 border-b shrink-0 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Body Area */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Top File Upload Box */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/10">
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Select Excel File (.xlsx, .xls, .csv)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {file ? file.name : 'Choose a file to extract student registrations.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <label className="flex-1 sm:flex-none cursor-pointer inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors">
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors shrink-0 shadow-2xs"
                title="Download formatted sample Excel sheet"
              >
                <Download className="h-3.5 w-3.5" />
                Sample Template
              </button>
            </div>
          </div>

          {/* Metadata Recognition Badges */}
          {workbookResult && (
            <div className="flex flex-wrap items-center gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
              {workbookResult.detectedInstitution && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100/70 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-medium">
                  <Building2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{workbookResult.detectedInstitution}</span>
                </div>
              )}
              {workbookResult.detectedAcademicYear && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>AY: {workbookResult.detectedAcademicYear}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold ml-auto">
                <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Total Candidates: {parsedRows.length}</span>
              </div>
            </div>
          )}

          {/* Multi-Sheet Selector Tabs */}
          {workbookResult && workbookResult.sheets.length > 1 && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Select Academic Program / Sheet to Preview
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSheetKey('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    selectedSheetKey === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All Program Sheets ({workbookResult.allStudentRows.length} Students)
                </button>
                {workbookResult.sheets.map((s) => (
                  <button
                    key={s.sheetName}
                    type="button"
                    onClick={() => setSelectedSheetKey(s.sheetName)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      selectedSheetKey === s.sheetName
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {s.detectedProgram || s.sheetName} ({s.studentCount})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extracted Data Table Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Extracted Candidate Records ({parsedRows.length} Students)
                  </h4>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
                  Parsed & Verified
                </span>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold text-[11px] sticky top-0 z-10">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Gender & State</th>
                      <th className="py-2.5 px-3">Program & Qualification</th>
                      <th className="py-2.5 px-3">Registration ID</th>
                      <th className="py-2.5 px-3">Email & Contact</th>
                      <th className="py-2.5 px-3">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                          row.isDuplicate ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          <div className="flex flex-col">
                            <span className="font-bold">
                              {row.first_name} {row.last_name}
                            </span>
                            {row.isDuplicate && (
                              <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400">
                                <AlertCircle className="h-2.5 w-2.5" />
                                Existing Candidate ({row.existingUid})
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          <div>{row.gender || '—'}</div>
                          <div className="text-[10px] text-slate-400 font-medium">{row.state || '—'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200">
                          <div className="font-semibold text-blue-600 dark:text-blue-400">
                            {row.program_name || '—'}
                          </div>
                          {row.highest_qualification && (
                            <div className="text-[10px] text-slate-400 line-clamp-1" title={row.highest_qualification}>
                              {row.highest_qualification}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                          {row.registration_number ? (
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {row.registration_number}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Auto-generate</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          <div>{row.email}</div>
                          {row.phone && <div className="text-slate-400">{row.phone}</div>}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              row.isDuplicate
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                : row.registration_type === 'TRANSFER'
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300'
                                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                            }`}
                          >
                            {row.isDuplicate ? 'REUSE UID' : row.registration_type}
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
        <div className="flex items-center justify-between p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0 || isProcessing}
            onClick={handleProcessImport}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <span>
              {isProcessing
                ? 'Pushing Records to Database...'
                : `Confirm & Push ${parsedRows.length} Registrations to Database`}
            </span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
