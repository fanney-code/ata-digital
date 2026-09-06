import * as XLSX from 'xlsx';
import { ExcelStudentImportRow } from '../api/supabase-service';
import { RegistrationType } from '../types';

export interface ParsedSheetInfo {
  sheetName: string;
  isStudentSheet: boolean;
  studentCount: number;
  detectedInstitution?: string;
  detectedProgram?: string;
  detectedAcademicYear?: string;
  rows: ExcelStudentImportRow[];
}

export interface WorkbookParseResult {
  fileName?: string;
  detectedInstitution?: string;
  detectedAcademicYear?: string;
  sheets: ParsedSheetInfo[];
  allStudentRows: ExcelStudentImportRow[];
}

function toTitleCase(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/(?:^|\s|\/|-)\S/g, (char) => char.toUpperCase())
    .trim();
}

/**
 * Normalizes Indian state names extracted from Excel sheets
 */
function cleanStateName(raw?: string | null): string {
  if (!raw) return '';
  const clean = raw.trim().toUpperCase();
  const stateMap: Record<string, string> = {
    'WEST BENGAL': 'West Bengal',
    'BIHAR': 'Bihar',
    'TAMIL NADU': 'Tamil Nadu',
    'TAMILNADU': 'Tamil Nadu',
    'TELANGANA': 'Telangana',
    'TRIPURA': 'Tripura',
    'ARUNACHAL PRADESH': 'Arunachal Pradesh',
    'NEPAL': 'Nepal',
    'ANDHRA PRADESH': 'Andhra Pradesh',
    'DELHI': 'Delhi',
    'UTTER PRADESH': 'Uttar Pradesh',
    'UTTAR PRADESH': 'Uttar Pradesh',
    'ODISHA': 'Odisha',
    'ORISSA': 'Odisha',
    'PUNJAB': 'Punjab',
    'MANIPUR': 'Manipur',
    'MIZORAM': 'Mizoram',
    'MANDHYA PRADESH': 'Madhya Pradesh',
    'MADHYA PRADESH': 'Madhya Pradesh',
    'KARNATAKA': 'Karnataka',
    'KERALA': 'Kerala',
    'MAHARASHTRA': 'Maharashtra',
    'ASSAM': 'Assam',
    'NAGALAND': 'Nagaland',
    'MEGHALAYA': 'Meghalaya',
  };
  return stateMap[clean] || toTitleCase(raw);
}

/**
 * Parses an individual worksheet supporting both:
 * 1. Standard flat template sheets (headers on row 0)
 * 2. Official institutional ATA registration sheets (banners on rows 0-3, headers on row 4+, multi-row subheaders)
 */
export function parseWorksheet(sheet: XLSX.WorkSheet, sheetName: string): ParsedSheetInfo {
  const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!rawRows || rawRows.length === 0) {
    return {
      sheetName,
      isStudentSheet: false,
      studentCount: 0,
      rows: [],
    };
  }

  // 1. Detect Sheet Metadata from Top Banners (rows 0 to 4)
  let detectedInstitution = '';
  let detectedAcademicYear = '';
  let detectedProgram = sheetName.trim();

  for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
    const line = rawRows[r].map((c) => String(c).trim()).filter(Boolean).join(' ');
    if (!line) continue;

    // Institution banner detection
    if (line.toUpperCase().includes('THEOLOGICAL') || line.toUpperCase().includes('COLLEGE') || line.toUpperCase().includes('SEMINARY') || line.toUpperCase().includes('INSTITUTE')) {
      const parts = line.split(/[,–-]/);
      detectedInstitution = toTitleCase(parts[0].trim());
    }

    // Academic year detection (e.g. "REGISTRATION OF STUDENTS - 2024" or "AY 2024-25")
    const yearMatch = line.match(/(20\d{2})/);
    if (yearMatch && !detectedAcademicYear) {
      const startYear = parseInt(yearMatch[1], 10);
      detectedAcademicYear = `${startYear}-${startYear + 1}`;
    }

    // Program detection from banner if present
    const upperLine = line.toUpperCase();
    if (upperLine.includes('DIPLOMA IN THEOLOGY') || upperLine.includes('DIP.TH') || upperLine.includes('DIP. TH')) {
      detectedProgram = 'Diploma in Theology';
    } else if (upperLine.includes('BACHELOR OF THEOLOGY') || upperLine.includes('B.TH') || upperLine.includes('BTH')) {
      detectedProgram = 'Bachelor of Theology';
    } else if (upperLine.includes('MASTER OF DIVINITY') || upperLine.includes('M.DIV') || upperLine.includes('MDIV')) {
      detectedProgram = 'Master of Divinity';
    } else if (upperLine.includes('MASTER OF THEOLOGY') || upperLine.includes('M.TH') || upperLine.includes('MTH')) {
      detectedProgram = 'Master of Theology';
    }
  }

  // Clean program name if sheetName was used
  const cleanProgName = detectedProgram.toUpperCase();
  if (cleanProgName.includes('DIPLOMA')) detectedProgram = 'Diploma in Theology';
  else if (cleanProgName.includes('BACHELOR')) detectedProgram = 'Bachelor of Theology';
  else if (cleanProgName.includes('DIVINITY')) detectedProgram = 'Master of Divinity';
  else if (cleanProgName.includes('MASTER OF THEOLOGY')) detectedProgram = 'Master of Theology';
  else detectedProgram = toTitleCase(detectedProgram);

  // 2. Locate Table Header Row (scan rows 0 to 12)
  let headerRowIdx = -1;
  for (let r = 0; r < Math.min(rawRows.length, 12); r++) {
    const line = rawRows[r].map((c) => String(c).trim().toUpperCase());
    const hasName = line.some((c) => c === 'NAME' || c.includes('STUDENT NAME') || c.includes('CANDIDATE NAME') || c === 'FIRST NAME');
    const hasOtherCols = line.some((c) => c.includes('SER #') || c.includes('SL #') || c.includes('S.NO') || c.includes('GENDER') || c.includes('STATE') || c.includes('QUALIFICATION') || c.includes('EMAIL'));

    if (hasName || (hasOtherCols && line.includes('STATE'))) {
      headerRowIdx = r;
      break;
    }
  }

  // If no table header is found, this sheet does not contain student records (e.g. fee summary sheet)
  if (headerRowIdx === -1) {
    return {
      sheetName,
      isStudentSheet: false,
      studentCount: 0,
      detectedInstitution,
      detectedProgram,
      detectedAcademicYear,
      rows: [],
    };
  }

  // 3. Header Merging with Subheader Rows (if subheaders exist)
  const hRow = rawRows[headerRowIdx];
  const nextRow = rawRows[headerRowIdx + 1] || [];
  const nextNextRow = rawRows[headerRowIdx + 2] || [];

  const isNextSubheader = nextRow.some((c) => {
    const s = String(c).toUpperCase();
    return s.includes('ADMISSION') || s.includes('SECULAR') || s.includes('VERIFIED') || s.includes('YES/NO') || s.includes('GRADE') || s.includes('THEOLOGICAL') || s.includes('GHTI/') || s.includes('REG');
  });

  const isNextNextSubheader = isNextSubheader && nextNextRow.some((c) => {
    const s = String(c).toUpperCase();
    return s.includes('SECONDARY') || s.includes('HIGHER') || s.includes('SER/ATA') || s.includes('DEGREE');
  });

  let startDataRow = headerRowIdx + 1;
  if (isNextSubheader) startDataRow = headerRowIdx + 2;
  if (isNextNextSubheader) startDataRow = headerRowIdx + 3;

  // Build combined composite header names
  const maxCols = Math.max(hRow.length, nextRow.length, nextNextRow.length);
  const colHeaders: string[] = [];
  let detectedRegNumPrefix = '';

  for (let c = 0; c < maxCols; c++) {
    const top = String(hRow[c] || '').trim();
    const sub1 = isNextSubheader ? String(nextRow[c] || '').trim() : '';
    const sub2 = isNextNextSubheader ? String(nextNextRow[c] || '').trim() : '';

    const parts = [top, sub1, sub2].filter(Boolean);
    const combined = parts.join(' ').replace(/\s+/g, ' ').trim();
    colHeaders.push(combined);

    // Look for registration prefix in headers (e.g. "GHTI/DIP.TH/2024/" or "GHTI/BTH/2024/")
    const prefixMatch = combined.match(/([A-Z0-9-]+\/[A-Z0-9.-]+\/20\d{2}\/)/i);
    if (prefixMatch && !detectedRegNumPrefix) {
      detectedRegNumPrefix = prefixMatch[1].toUpperCase();
    }
  }

  // 4. Extract Data Rows
  const parsedRows: ExcelStudentImportRow[] = [];

  for (let r = startDataRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // Helper to extract value by candidate column patterns
    const getVal = (patterns: string[]): string => {
      for (let c = 0; c < colHeaders.length; c++) {
        const h = colHeaders[c].toLowerCase();
        for (const p of patterns) {
          if (h.includes(p.toLowerCase())) {
            const val = String(row[c] || '').trim();
            if (val) return val;
          }
        }
      }
      return '';
    };

    // Name handling: check explicit first and last name columns first
    const explicitFirst = getVal(['first name', 'firstname', 'first_name', 'given name']);
    const explicitLast = getVal(['last name', 'lastname', 'last_name', 'surname']);
    const fullNameRaw = getVal(['full name', 'fullname', 'student name', 'candidate name', 'name']);

    let firstName = '';
    let lastName = '';

    if (explicitFirst) {
      firstName = toTitleCase(explicitFirst);
      lastName = toTitleCase(explicitLast);
    } else if (fullNameRaw) {
      const upperName = fullNameRaw.toUpperCase();
      if (
        upperName.includes('TOTAL') ||
        upperName.includes('STUDENTS REGISTERED') ||
        upperName.includes('PAID ON') ||
        upperName.includes('ADMISSION ON') ||
        upperName.includes('NOTE:')
      ) {
        continue;
      }
      const nameClean = fullNameRaw.replace(/\s+/g, ' ').trim();
      const nameParts = nameClean.split(' ');
      if (nameParts.length === 1) {
        firstName = toTitleCase(nameParts[0]);
        lastName = '';
      } else {
        firstName = toTitleCase(nameParts[0]);
        lastName = toTitleCase(nameParts.slice(1).join(' '));
      }
    } else {
      continue; // Skip empty rows
    }

    // Gender
    const rawGender = getVal(['gender', 'sex']).toUpperCase();
    let gender: string | undefined = undefined;
    if (rawGender.startsWith('M') || rawGender === 'MALE') gender = 'Male';
    else if (rawGender.startsWith('F') || rawGender === 'FEMALE') gender = 'Female';

    // Age / Date of Birth
    const rawAge = getVal(['age']);
    const rawDob = getVal(['date of birth', 'date_of_birth', 'dob', 'birth date']);
    let dateOfBirth: string | undefined = rawDob || undefined;
    if (!dateOfBirth && rawAge && /^\d{1,2}$/.test(rawAge)) {
      const ageNum = parseInt(rawAge, 10);
      const intakeYear = detectedAcademicYear ? parseInt(detectedAcademicYear.split('-')[0], 10) : new Date().getFullYear();
      dateOfBirth = `${intakeYear - ageNum}-01-01`;
    }

    // State
    const rawState = getVal(['state', 'state of residence', 'province', 'region']);
    const state = cleanStateName(rawState);

    // Entrance Qualifications (Secular, Higher, Theological)
    const secularQual = getVal(['secular', 'entrance qualification', 'secondary', 'qualification', 'highest qualification']);
    const higherQual = getVal(['higher', 'equivalent', '12th', 'degree']);
    const theolQual = getVal(['theol', 'theological']);
    const qualParts = [secularQual, higherQual, theolQual].filter(Boolean);
    const highestQualification = qualParts.length > 0
      ? qualParts.join(' • ').replace(/\s+/g, ' ').trim()
      : undefined;

    // Registration Number & Sequence
    const regSeqOrFull = getVal(['ata reg', 'reg.#', 'reg #', 'reg no', 'registration number', 'registration id']);
    let registrationNumber: string | undefined = undefined;
    if (regSeqOrFull) {
      if (regSeqOrFull.includes('/')) {
        registrationNumber = regSeqOrFull.trim();
      } else if (detectedRegNumPrefix && /^\d+$/.test(regSeqOrFull)) {
        registrationNumber = `${detectedRegNumPrefix}${regSeqOrFull}`;
      }
    }

    // Check for Transfer / Previous Registration in comments or theological column
    const comments = getVal(['comment', 'comments', 'remarks', 'note']);
    let registrationType: RegistrationType = 'INITIAL_REGISTRATION';
    let previousRegistrationNumber: string | undefined = undefined;

    const transferText = `${comments} ${theolQual}`.toUpperCase();
    if (transferText.includes('TRANSFER') || transferText.includes('TRANSFERRED') || transferText.includes('PREVIOUS')) {
      registrationType = 'TRANSFER';
      const prevMatch = transferText.match(/([A-Z0-9-]+\/[A-Z0-9.-]+\/20\d{2}\/\d+)/);
      if (prevMatch) {
        previousRegistrationNumber = prevMatch[1];
      }
    }

    // Clean institutional email generation if omitted
    const explicitEmail = getVal(['email', 'email address', 'mail']);
    let email = explicitEmail;
    if (!email) {
      const firstSlug = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const lastSlug = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const instDomain = detectedInstitution
        ? detectedInstitution
            .split(' ')
            .map((w) => w[0]?.toLowerCase())
            .join('')
        : 'student';
      email = `${firstSlug}${lastSlug ? '.' + lastSlug : ''}@${instDomain || 'student'}.edu`;
    }

    // Phone / Contact
    const phone = getVal(['phone', 'mobile', 'contact']) || undefined;

    // Aadhar Number / National ID
    const aadharNumber = getVal(['aadhar', 'aadhar number', 'national_id', 'aadhaar', 'national id']) || undefined;

    parsedRows.push({
      first_name: firstName,
      last_name: lastName,
      gender,
      date_of_birth: dateOfBirth,
      state: state || undefined,
      email,
      phone,
      aadhar_number: aadharNumber,
      institution_name: detectedInstitution || undefined,
      department_name: 'Department of Theology & Biblical Studies',
      program_name: detectedProgram || undefined,
      academic_year: detectedAcademicYear || undefined,
      registration_type: registrationType,
      registration_number: registrationNumber,
      highest_qualification: highestQualification,
      previous_registration_number: previousRegistrationNumber,
      country: 'India',
    });
  }

  return {
    sheetName,
    isStudentSheet: parsedRows.length > 0,
    studentCount: parsedRows.length,
    detectedInstitution: detectedInstitution || undefined,
    detectedProgram: detectedProgram || undefined,
    detectedAcademicYear: detectedAcademicYear || undefined,
    rows: parsedRows,
  };
}

/**
 * Parses an entire Excel workbook across all sheets
 */
export function parseExcelWorkbook(workbook: XLSX.WorkBook, fileName?: string): WorkbookParseResult {
  const sheets: ParsedSheetInfo[] = [];
  let detectedInstitution: string | undefined = undefined;
  let detectedAcademicYear: string | undefined = undefined;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const parsed = parseWorksheet(sheet, sheetName);
    if (parsed.isStudentSheet) {
      sheets.push(parsed);
      if (!detectedInstitution && parsed.detectedInstitution) {
        detectedInstitution = parsed.detectedInstitution;
      }
      if (!detectedAcademicYear && parsed.detectedAcademicYear) {
        detectedAcademicYear = parsed.detectedAcademicYear;
      }
    }
  }

  // Combine rows across all valid student sheets
  const allStudentRows = sheets.flatMap((s) => s.rows);

  return {
    fileName,
    detectedInstitution,
    detectedAcademicYear,
    sheets,
    allStudentRows,
  };
}
