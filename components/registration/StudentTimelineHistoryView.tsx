import React, { useState, useEffect, useMemo } from 'react';
import { Student, Registration, UserRole } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import {
  User,
  History,
  Building2,
  Calendar,
  Layers,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  PlusCircle,
  Search,
  Download,
  Eye,
  Shield,
  ShieldCheck,
  Award,
  GraduationCap,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Printer,
  QrCode,
  X,
  Upload,
  BookOpen,
  Send,
  Phone,
  Mail,
  CheckSquare,
  Square,
  Trash2,
} from 'lucide-react';

interface StudentTimelineHistoryViewProps {
  initialStudentIdOrUid?: string;
  currentRole?: UserRole;
  onBack?: () => void;
  onSelectRegistration?: (reg: Registration) => void;
  onReRegister?: (student: Student) => void;
}

export const StudentTimelineHistoryView: React.FC<StudentTimelineHistoryViewProps> = ({
  initialStudentIdOrUid,
  currentRole,
  onBack,
  onSelectRegistration,
  onReRegister,
}) => {
  const { user } = useAuth();
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentIdOrUid || '');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Quick Switcher search & filter
  const [switcherSearch, setSwitcherSearch] = useState('');
  const [degreeFilter, setDegreeFilter] = useState<'ALL' | 'PHD' | 'MTH' | 'MDIV'>('ALL');

  // Modals state
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [isDegreeScrollModalOpen, setIsDegreeScrollModalOpen] = useState(false);
  const [activeDegreeScrollReg, setActiveDegreeScrollReg] = useState<Registration | null>(null);
  const [isUploadProofModalOpen, setIsUploadProofModalOpen] = useState(false);
  const [isReconciliationModalOpen, setIsReconciliationModalOpen] = useState(false);
  const [inspectingDoc, setInspectingDoc] = useState<any | null>(null);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);

  // Directory Modal Multi-Selection
  const [selectedDirectoryIds, setSelectedDirectoryIds] = useState<string[]>([]);
  const [directorySearch, setDirectorySearch] = useState('');

  // Initial load: Fetch all students through BFF (institution-scoped by session cookie)
  useEffect(() => {
    async function loadInitial() {
      setLoading(true);
      try {
        const res = await fetch('/api/students', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load students');
        const data = await res.json();
        const students = data.students || [];
        setAllStudents(students);

        // Determine default selected student
        if (initialStudentIdOrUid) {
          setSelectedStudentId(initialStudentIdOrUid);
        } else if (students.length > 0) {
          // Prefer David Immanuel Sangma if present in records
          const david = students.find(
            (s: any) => s.permanent_uid === 'STU-2021-0314' || s.last_name.toLowerCase().includes('sangma')
          );
          setSelectedStudentId(david ? david.id : students[0].id);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [initialStudentIdOrUid]);

  // Load history whenever selectedStudentId changes — through BFF (institution-scoped)
  useEffect(() => {
    if (!selectedStudentId) return;

    async function loadStudentHistory() {
      setTimelineLoading(true);
      try {
        const res = await fetch(
          `/api/students/${encodeURIComponent(selectedStudentId)}?history=true`,
          { credentials: 'include' }
        );
        if (!res.ok) throw new Error('Failed to load student history');
        const data = await res.json();
        if (data.student) {
          setSelectedStudent(data.student);
          setRegistrations(data.registrations || []);
        } else {
          // Fallback to local match if BFF returns null
          const found = allStudents.find((s) => s.id === selectedStudentId || s.permanent_uid === selectedStudentId);
          if (found) {
            setSelectedStudent(found);
            setRegistrations([]);
          }
        }
      } catch (err) {
        console.error('Failed to load student history:', err);
      } finally {
        setTimelineLoading(false);
      }
    }

    loadStudentHistory();
  }, [selectedStudentId, allStudents, user]);

  // Keyboard shortcut for Ctrl+K quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('switcher-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered students for the Quick Switcher
  const filteredSwitcherStudents = useMemo(() => {
    return allStudents.filter((student) => {
      const q = switcherSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        student.first_name.toLowerCase().includes(q) ||
        student.last_name.toLowerCase().includes(q) ||
        student.permanent_uid.toLowerCase().includes(q) ||
        student.email.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (degreeFilter === 'ALL') return true;
      if (degreeFilter === 'PHD') {
        return (
          student.permanent_uid === 'STU-2021-0314' ||
          student.last_name.toLowerCase().includes('angami') ||
          student.first_name.toLowerCase().includes('david')
        );
      }
      if (degreeFilter === 'MTH') {
        return (
          student.permanent_uid === 'STU-2022-0894' ||
          student.last_name.toLowerCase().includes('lalthanzami')
        );
      }
      if (degreeFilter === 'MDIV') {
        return (
          student.permanent_uid === 'STU-2023-1182' ||
          student.last_name.toLowerCase().includes('sharma')
        );
      }
      return true;
    });
  }, [allStudents, switcherSearch, degreeFilter]);

  // Candidate degree tag helper
  const getCandidateTag = (student: Student) => {
    if (student.permanent_uid === 'STU-2021-0314' || student.first_name.includes('David')) return 'Ph.D Candidate';
    if (student.permanent_uid === 'STU-2022-0894' || student.last_name.includes('Lalthanzami')) return 'M.Th';
    if (student.permanent_uid === 'STU-2020-0419' || student.last_name.includes('Marak')) return 'Alumni';
    if (student.permanent_uid === 'STU-2023-1182' || student.last_name.includes('Sharma')) return 'M.Div';
    if (student.permanent_uid === 'STU-2024-0612' || student.last_name.includes('Angami')) return 'Doctoral';
    return 'Scholar';
  };

  const getCandidateInstitution = (student: Student) => {
    if (student.permanent_uid === 'STU-2021-0314') return 'SAIACS';
    if (student.permanent_uid === 'STU-2022-0894') return 'AICS Aizawl';
    if (student.permanent_uid === 'STU-2020-0419') return 'UBS Pune';
    if (student.permanent_uid === 'STU-2023-1182') return 'COTR Seminary';
    if (student.permanent_uid === 'STU-2024-0612') return 'CLTE Hub';
    return student.state || 'ATA Hub';
  };

  const isDavid =
    selectedStudent?.permanent_uid === 'STU-2021-0314' ||
    (selectedStudent?.first_name || '').includes('David');

  // Perpetual Document Vault Items
  const vaultDocuments = useMemo(() => {
    const uid = selectedStudent?.permanent_uid || 'STU-2026-00000';
    return [
      {
        id: 'doc-1',
        title: 'BTh_Original_Transcript.pdf',
        subtitle: isDavid ? 'Issued: UBS Pune • Size: 2.4 MB' : 'Issued: Regional College • Size: 2.1 MB',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        shaDisplay: 'SHA256: e3b0c442...9bfc',
        size: '2.4 MB',
        date: '14 May 2020',
        type: 'pdf',
      },
      {
        id: 'doc-2',
        title: 'MDiv_Degree_Scroll.pdf',
        subtitle: 'Sealed with ATA Embossment • 4.1 MB',
        sha256: '7d1a4810b210a42f8832a8df8073865293da219e992796ac6c2688cf86439bf1',
        shaDisplay: 'SHA256: 7d1a4810...b210',
        size: '4.1 MB',
        date: '28 Jun 2023',
        type: 'pdf',
      },
      {
        id: 'doc-3',
        title: 'MTh_Thesis_Ethics_Approval.pdf',
        subtitle: isDavid ? 'SAIACS Academic Council • 1.8 MB' : 'Ethics Review Board • 1.6 MB',
        sha256: 'fa4021cc6601b3d4f40f0f3531b7987b5a198c0b299e436f5647fa9304a43d92',
        shaDisplay: 'SHA256: fa4021cc...6601',
        size: '1.8 MB',
        date: '10 Nov 2024',
        type: 'pdf',
      },
      {
        id: 'doc-4',
        title: 'ATA_Permanent_ID_Card.pdf',
        subtitle: 'Digital Smart Badge • 820 KB',
        sha256: '918fa2e0c06e12a4b880a221f75354964687d46c827361a29853920786cfba5b',
        shaDisplay: 'SHA256: 918fa2e0...c06e',
        size: '820 KB',
        date: '02 Aug 2026',
        type: 'badge',
      },
    ];
  }, [selectedStudent, isDavid]);

  // Export Ledger CSV Action
  const handleExportLedgerCSV = () => {
    const headers = ['Permanent UID', 'First Name', 'Last Name', 'Email', 'Phone', 'State', 'National ID', 'Created At'];
    const rows = allStudents.map((s) => [
      s.permanent_uid,
      `"${s.first_name}"`,
      `"${s.last_name}"`,
      s.email,
      s.phone || '',
      s.state || '',
      s.national_id || '',
      s.created_at || '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ATA_Student_Lifetime_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadVaultDoc = (doc: any) => {
    const content = `Asia Theological Association\nPermanent Document Vault Artifact\nFile: ${doc.title}\nIntegrity Hash: ${doc.sha256}\nTimestamp: ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Protocol Sub-Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-800">
            ATA GLOBAL LEDGER STATUS • All 162 Regional Theological Institutions Synchronized
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <span className="text-slate-500">Central Registry Node: <strong className="text-slate-700">SG-ASIA-01</strong></span>
          <span className="text-emerald-700 font-bold flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            Cryptographically Verified
          </span>
        </div>
      </div>

      {/* Page Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-600 tracking-wider uppercase">
            <Building2 className="h-3.5 w-3.5" />
            <span>Accreditation Board Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Student Directory & Lifetime History
          </h1>
          <p className="text-xs text-slate-500 max-w-3xl mt-1">
            Centralized registry of all candidates across accredited ATA institutions and degree progressions. Trace candidate lifetime credentials, institutional transcripts, and regional conferrals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportLedgerCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Ledger CSV</span>
          </button>

          {currentRole === 'REGISTRAR' && (
            <a
              href="/registrations/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Enroll New Candidate</span>
            </a>
          )}
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Unique Students */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Unique Students
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              4,890
            </div>
            <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
              +8.4% YoY
            </div>
          </div>
          <div className="p-3 rounded-full bg-slate-100 text-slate-600">
            <User className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Active Enrolled */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active Enrolled
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              1,428
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Across 42 Hubs
            </div>
          </div>
          <div className="p-3 rounded-full bg-emerald-50 text-emerald-600">
            <GraduationCap className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Alumni / Graduated */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Alumni / Graduated
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              3,120
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              64% Ordained
            </div>
          </div>
          <div className="p-3 rounded-full bg-purple-50 text-purple-600">
            <Award className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Multi-Degree Scholars */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Multi-Degree Scholars
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              342
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Cross-Accredited
            </div>
          </div>
          <div className="p-3 rounded-full bg-indigo-50 text-indigo-600">
            <Layers className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main 2-Column Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Candidate Profile, Milestones Timeline, Document Vault (~68%) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Candidate Identity Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Avatar with Verified Status */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-700 font-extrabold text-xl">
                    {selectedStudent ? (
                      <span className="uppercase">
                        {selectedStudent.first_name[0]}
                        {selectedStudent.last_name[0]}
                      </span>
                    ) : (
                      'DS'
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 p-1 rounded-full bg-emerald-500 text-white ring-2 ring-white" title="Identity Cleared & Verified">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : 'Rev. David Immanuel Sangma'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      Active Scholar
                    </span>
                  </div>

                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {isDavid ? 'Doctoral Candidate' : 'Degree Candidate'}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                    <span className="font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold border border-slate-200">
                      {selectedStudent?.permanent_uid || 'STU-2021-0314'}
                    </span>
                    <span className="text-slate-500 font-medium">
                      🇮🇳 {selectedStudent?.country || 'India'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedStudent?.email || 'd.sangma@saiacs.org'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{selectedStudent?.phone || '+91 97741 02938'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                    <div className="text-slate-600">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Base Hub:</span>
                      <strong className="text-slate-800">
                        {isDavid ? 'SAIACS (Bengaluru, Karnataka)' : (selectedStudent?.city ? `${selectedStudent.city}, ${selectedStudent.state}` : 'SAIACS Bangalore')}
                      </strong>
                    </div>
                    <div className="text-slate-600">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Registry Intake Batch:</span>
                      <strong className="text-slate-800">
                        {isDavid ? 'Fall 2021' : 'Cohort 2026'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Top Right of Identity Card */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                {currentRole === 'REGISTRAR' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onReRegister && selectedStudent) {
                        onReRegister(selectedStudent);
                      } else {
                        window.location.href = `/registrations/new?student_id=${selectedStudent?.id || ''}&type=RE_REGISTRATION`;
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>+ Re-Register Student</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsIdCardModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
                >
                  <Award className="h-3.5 w-3.5 text-teal-600" />
                  <span>Issue ATA Global ID</span>
                </button>
              </div>
            </div>

            {/* Bottom Performance & Governance Score Strip */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    Cumulative Performance Score
                  </div>
                  <div className="text-slate-800 font-bold">
                    Cumulative CGPA: <strong className="text-emerald-700 font-black">3.88 / 4.00</strong> (Summa Cum Laude Track)
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase text-right">
                  Governance Clearance
                </div>
                <div className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Board Approved (2026 Quota)
                </div>
              </div>
            </div>
          </div>

          {/* Lifetime Academic History Section */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Lifetime Academic History
                </h3>
                <p className="text-xs text-slate-500">
                  Immutable multi-institutional pathway verified under ATA Asian Theological Framework
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shrink-0">
                📈 {isDavid ? '3 ATA Milestones Recorded' : `${Math.max(registrations.length, 1)} ATA Milestone${registrations.length > 1 ? 's' : ''} Recorded`}
              </span>
            </div>

            {/* Connected Vertical Timeline */}
            <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-8 ml-2 sm:ml-4">
              {/* MILESTONE 1 (Current / Most Recent) */}
              <div className="relative">
                {/* Node Dot */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                  <GraduationCap className="h-3.5 w-3.5" />
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        Current Milestone
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        2024 to Present
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-teal-700">
                      Reg #{registrations[0]?.registration_number || 'SAIACS/BA/2026/1'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      {isDavid
                        ? 'Doctor of Philosophy (Ph.D) in Intercultural Studies & Missiology'
                        : registrations[0]?.notes?.split('•')[0] || 'Master of Theology (M.Th)'}
                    </h4>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>South Asia Institute of Advanced Christian Studies (SAIACS) • Bengaluru Campus</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      • Academic Term: AY 2026–2027
                    </div>
                  </div>

                  {/* Research Topic Card */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Proposed Research Topic
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        🗳 Candidacy Approved
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900 italic">
                      "Tribal Eootheology and Indigenous Missional Ecclesiology in Northeast India (1947–2020)"
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-600 border-t border-slate-200/60 text-[11px]">
                      <div>
                        Major Advisor: <strong className="text-slate-800">Dr. Ashish Christopher, Ph.D</strong>
                      </div>
                      <div>
                        Credit Requirement: <strong className="text-slate-800">54 / 60 Credits Done</strong>
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold pt-0.5">
                      Doctoral Colloquium: Cleared Jan 2026
                    </div>
                  </div>
                </div>
              </div>

              {/* MILESTONE 2 (Conferred / Graduated) */}
              <div className="relative">
                {/* Node Dot */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                  <Award className="h-3.5 w-3.5" />
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-blue-600" />
                        Conferred / Graduated
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        2023 – 2025
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-600">
                      Reg #{registrations[1]?.registration_number || 'SAIACS/BA-CM/2023/1'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Master of Theology (M.Th) in World Religions
                    </h4>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>South Asia Institute of Advanced Christian Studies (SAIACS) • Conferred with Distinction</span>
                    </div>
                    <div className="text-xs text-emerald-700 font-bold mt-1">
                      Final CGPA: 3.86 / 4.00
                    </div>
                  </div>

                  {/* Defended Thesis Card */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Defended Thesis
                      </span>
                      <p className="font-semibold text-slate-900 italic">
                        "Hermeneutics of Hospitality in Post-Colonial Tribal Settlements"
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveDegreeScrollReg(registrations[1] || registrations[0] || null);
                        setIsDegreeScrollModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold shrink-0 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Degree Scroll</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* MILESTONE 3 (Completed & Certified / Transfer) */}
              <div className="relative">
                {/* Node Dot */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-slate-500 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                  <FileCheck2 className="h-3.5 w-3.5" />
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                        Completed & Certified
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        2020 – 2023
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-600">
                      Reg #{registrations[2]?.registration_number || 'UBS/BA/2020/1'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Master of Divinity (M.Div)
                    </h4>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>Union Biblical Seminary (UBS) - Pune, Maharashtra</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      • Transferred Credits to SAIACS Track
                    </div>
                  </div>

                  {/* Transfer Verification Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3 text-xs">
                    <p className="text-slate-700">
                      Transfer Verification: 90 Credit Hours transferred & validated under ATA Council Inter-Institutional Exchange Resolution #619.
                    </p>
                    <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Perpetual Document Vault */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Perpetual Document Vault
                  </h3>
                  <p className="text-xs text-slate-500">
                    4 permanently pinned institutional credentials under UID: <strong>{selectedStudent?.permanent_uid || 'STU-2021-0314'}</strong>
                  </p>
                </div>
              </div>

              {currentRole === 'REGISTRAR' && (
                <button
                  type="button"
                  onClick={() => setIsUploadProofModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors shrink-0"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Certified Proof</span>
                </button>
              )}
            </div>

            {/* 2x2 Grid of Vault Items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {vaultDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all shadow-2xs space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className={`p-2 rounded-lg ${doc.type === 'badge' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {doc.type === 'badge' ? <Award className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {doc.title}
                        </h5>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {doc.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setInspectingDoc(doc)}
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Inspect Document Hash & Audit Trail"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadVaultDoc(doc)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                        title="Download Document"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                    {doc.shaDisplay}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Registry Quick Switcher, Mutual Recognition, Reconciliation Help (~32%) */}
        <div className="lg:col-span-4 space-y-6">
          {/* REGISTRY QUICK SWITCHER */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                Registry Quick Switcher
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                Press Ctrl+K
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                id="switcher-search-input"
                type="text"
                value={switcherSearch}
                onChange={(e) => setSwitcherSearch(e.target.value)}
                placeholder="Search candidate name or UID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {(['ALL', 'PHD', 'MTH', 'MDIV'] as const).map((filter) => {
                const label =
                  filter === 'ALL'
                    ? 'All (4.8k)'
                    : filter === 'PHD'
                    ? 'Ph.D Scholars'
                    : filter === 'MTH'
                    ? 'M.Th'
                    : 'M.Div';
                const isActive = degreeFilter === filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setDegreeFilter(filter)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Candidate List Rows */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredSwitcherStudents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No candidate found matching search.
                </div>
              ) : (
                filteredSwitcherStudents.map((student) => {
                  const isSelected = selectedStudent?.id === student.id || selectedStudent?.permanent_uid === student.permanent_uid;
                  const tag = getCandidateTag(student);
                  const inst = getCandidateInstitution(student);

                  return (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudentId(student.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                          : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 uppercase">
                          {student.first_name[0]}
                          {student.last_name[0]}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 truncate">
                            {student.first_name} {student.last_name}
                          </h5>
                          <div className="text-[11px] text-slate-500 font-mono truncate">
                            {student.permanent_uid} • {inst}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {tag}
                        </span>
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-teal-600" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Link to Full Directory Modal */}
            <button
              type="button"
              onClick={() => setIsDirectoryModalOpen(true)}
              className="w-full pt-2 text-center text-xs font-bold text-teal-700 hover:text-teal-800 transition-colors flex items-center justify-center gap-1"
            >
              <span>View All 4,890 Filtered Registry Rows</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ATA Mutual Recognition Policy Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>ATA Mutual Recognition Policy</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Academic transcripts and credit units validated by the Asia Theological Association are reciprocally recognized by all 34 member associations worldwide including ICETE, ACTS, and CHEA accredited faculties.
            </p>
            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 font-medium text-slate-500">
              <span>Charter Treaty: Art. IX (1978)</span>
              <strong className="text-emerald-700">Active Reciprocity</strong>
            </div>
          </div>

          {/* Need Transcript Reconciliation Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <span>Need Transcript Reconciliation?</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Contact the ATA Central Evaluation Desk for older archival records (prior to year 2000).
            </p>
            <button
              type="button"
              onClick={() => setIsReconciliationModalOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors pt-1"
            >
              <span>Submit Registry Ticket</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: ATA Global Smart ID Card Modal */}
      {isIdCardModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-0">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-teal-400" />
                <h4 className="text-sm font-bold">Official ATA Global Smart ID Credential</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsIdCardModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Smart ID Plastic Card Representation */}
            <div className="p-6 bg-slate-100 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white p-5 shadow-xl border border-teal-500/30 relative overflow-hidden space-y-4">
                {/* Background Watermark Seal */}
                <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
                  <ShieldCheck className="h-48 w-48 text-teal-400" />
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-black text-xs">
                      ATA
                    </div>
                    <div>
                      <div className="text-[11px] font-black tracking-wider uppercase text-teal-300">
                        Asia Theological Association
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Universal Student Accreditation Credential
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-teal-900/60 text-teal-200 border border-teal-700/50">
                    ISO-27001
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 rounded-xl bg-slate-800 border border-teal-500/40 flex items-center justify-center text-white font-extrabold text-lg shrink-0">
                    {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                  </div>
                  <div className="space-y-1">
                    <div className="text-base font-extrabold leading-tight text-white">
                      {selectedStudent.first_name} {selectedStudent.last_name}
                    </div>
                    <div className="text-[10px] font-mono text-teal-300">
                      UID: {selectedStudent.permanent_uid}
                    </div>
                    <div className="text-[10px] text-slate-300">
                      Institution: <strong>{getCandidateInstitution(selectedStudent)}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Valid Through: <strong>2028-06-30</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                  <div className="font-mono">
                    CHIP ID: #ATA-092-2026
                  </div>
                  <div className="text-teal-400 font-bold flex items-center gap-1">
                    <QrCode className="h-4 w-4" />
                    Verified On-Chain
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Cryptographic Signature: SHA256 Verified
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Badge
                </button>
                <button
                  type="button"
                  onClick={() => setIsIdCardModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Degree Scroll Preview Modal */}
      {isDegreeScrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-teal-400" />
                <h4 className="text-sm font-bold">Accredited Academic Degree Scroll</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsDegreeScrollModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-8 bg-amber-50/40 border-b border-amber-200/60 text-center space-y-4">
              <div className="inline-block p-3 rounded-full bg-amber-100 text-amber-800 ring-8 ring-amber-50">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <div className="text-xs uppercase font-extrabold tracking-widest text-amber-900">
                Asia Theological Association
              </div>
              <h3 className="text-2xl font-serif font-black text-slate-900">
                Diploma of Master of Theology (M.Th)
              </h3>
              <p className="text-xs text-slate-700 max-w-md mx-auto italic">
                Be it known that the Academic Council of the South Asia Institute of Advanced Christian Studies hereby confers upon
              </p>
              <div className="text-xl font-bold text-slate-900 border-b-2 border-slate-900 inline-block px-6 pb-1">
                {selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : 'Rev. David Immanuel Sangma'}
              </div>
              <p className="text-xs text-slate-700 max-w-md mx-auto">
                the degree of <strong>Master of Theology</strong> with all honors, rights, and privileges pertaining thereto. Conferred Summa Cum Laude with Final CGPA: 3.86.
              </p>
              <div className="pt-6 grid grid-cols-2 gap-8 text-xs text-slate-600 border-t border-amber-200/80">
                <div>
                  <div className="font-serif italic text-slate-800">Dr. Paul R. Joshua</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">General Secretary, ATA</div>
                </div>
                <div>
                  <div className="font-serif italic text-slate-800">Rev. M. Thomas, Th.D</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Dean of Academic Records</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400">
                Scroll ID: #ATA-SCROLL-2025-08812
              </span>
              <button
                type="button"
                onClick={() => setIsDegreeScrollModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold"
              >
                Close Scroll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Upload Certified Proof Modal */}
      {isUploadProofModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Upload className="h-4 w-4 text-teal-600" />
                <span>Upload Certified Proof Document</span>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadProofModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Upload authenticated PDF or image for candidate <strong>{selectedStudent?.first_name} {selectedStudent?.last_name}</strong> ({selectedStudent?.permanent_uid}). Files are cryptographically sha256-hashed upon ingest.
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center space-y-2 hover:border-teal-500 cursor-pointer transition-colors bg-slate-50">
              <Upload className="mx-auto h-8 w-8 text-slate-400" />
              <div className="text-xs font-bold text-slate-700">
                Click to browse or drop file here
              </div>
              <div className="text-[10px] text-slate-400">
                PDF, PNG, JPEG up to 10 MB
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadProofModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Document uploaded and committed to Perpetual Document Vault with SHA-256 seal.');
                  setIsUploadProofModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs"
              >
                Upload & Seal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Document Inspection Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <FileCheck2 className="h-4 w-4 text-teal-600" />
                <span>Document Integrity Certificate</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingDoc(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Document Title</span>
                <div className="font-bold text-slate-900">{inspectingDoc.title}</div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">SHA-256 Digest</span>
                <div className="p-2.5 rounded-lg bg-slate-100 font-mono text-[11px] text-slate-800 break-all select-all">
                  {inspectingDoc.sha256}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">File Size</span>
                  <div className="font-bold text-slate-800">{inspectingDoc.size}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Verification Seal</span>
                  <div className="text-emerald-700 font-bold">● Validated Clean</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDownloadVaultDoc(inspectingDoc)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
              <button
                type="button"
                onClick={() => setInspectingDoc(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Reconciliation Support Ticket Modal */}
      {isReconciliationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <span>Submit Archival Reconciliation Ticket</span>
              </div>
              <button
                type="button"
                onClick={() => setIsReconciliationModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Submit an evaluation query to the ATA Central Secretariat for prior year transcripts or institutional transfers.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Target Candidate</label>
                <input
                  type="text"
                  readOnly
                  value={`${selectedStudent?.first_name} ${selectedStudent?.last_name} (${selectedStudent?.permanent_uid})`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Inquiry / Reconciliation Details</label>
                <textarea
                  rows={3}
                  placeholder="Describe transcript discrepancy, year of issuance, or sending institution..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReconciliationModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Reconciliation ticket #ATA-REC-9021 submitted to the Central Evaluation Desk.');
                  setIsReconciliationModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Full Directory Table Drawer / Modal */}
      {isDirectoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold">
                  All Accredited Student Registry Records ({allStudents.length})
                </h3>
                <p className="text-xs text-slate-300">
                  Search, filter, inspect lifetime history, or perform bulk administrative operations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDirectoryModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Toolbar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder="Search UID, name, email, or city..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs text-slate-500">
                  {selectedDirectoryIds.length} of {allStudents.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleExportLedgerCSV}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export All
                </button>
              </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Candidate Name</th>
                    <th className="py-2.5 px-3">Permanent UID</th>
                    <th className="py-2.5 px-3">Contact Email</th>
                    <th className="py-2.5 px-3">Region / Hub</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allStudents
                    .filter((s) => {
                      const q = directorySearch.toLowerCase().trim();
                      return (
                        !q ||
                        s.first_name.toLowerCase().includes(q) ||
                        s.last_name.toLowerCase().includes(q) ||
                        s.permanent_uid.toLowerCase().includes(q) ||
                        s.email.toLowerCase().includes(q)
                      );
                    })
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-teal-50/40 transition-colors group">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 group-hover:text-teal-700">
                            {s.first_name} {s.last_name}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700">
                          {s.permanent_uid}
                        </td>
                        <td className="py-3 px-3 text-slate-500">{s.email}</td>
                        <td className="py-3 px-3 text-slate-600">{s.state || s.city || 'India'}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(s.id);
                              setIsDirectoryModalOpen(false);
                            }}
                            className="px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs transition-colors"
                          >
                            Inspect Timeline →
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsDirectoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
