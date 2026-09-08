/**
 * Authoritative ID Generation & Validation Utilities for ATA Digital
 *
 * Implements:
 * 1. Permanent Student UID: STU-YYYY-XXXXX (deterministic, sequential, collision-safe)
 * 2. Registration ID: [INSTITUTION_CODE]/[PROGRAM_CODE]/[YEAR]/[SEQUENCE] (scoped by institution, program, and year)
 */

export interface MasterDataHierarchyParams {
  institutionId?: string;
  departmentId?: string;
  programId?: string;
  academicYear?: string;
}

/**
 * Extracts 4-digit intake/academic year from an academic year string (e.g., '2026-2027' -> 2026, '2027' -> 2027).
 * Defaults to current system year if not provided or unparseable.
 */
export function extractYear(academicYear?: string): number {
  if (academicYear && typeof academicYear === 'string') {
    const match = academicYear.match(/\b(20\d\d)\b/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return new Date().getFullYear();
}

/**
 * Normalizes an academic or institution code according to ATA Digital standards:
 * 1. ALL codes must be UPPERCASE.
 * 2. NEVER use periods ('.') inside codes.
 * 3. If a separator is required, use a hyphen ('-').
 * 4. Do not introduce spaces into codes.
 * 5. Converts abbreviation dots in traditional degree initialisms (e.g. B.Th. -> BTH, M.Th. -> MTH, D.Min. -> DMIN, Ph.D. -> PHD).
 * 6. Converts dot separators in compound codes (e.g. CERT.MIN -> CERT-MIN).
 */
export function normalizeAcademicCode(code: string): string {
  if (!code) return '';
  let normalized = code.trim().toUpperCase().replace(/\s+/g, '');

  const standardAbbreviations: Record<string, string> = {
    'CERT.MIN': 'CERT-MIN',
    'B.TH.': 'BTH',
    'B.TH': 'BTH',
    'M.TH.': 'MTH',
    'M.TH': 'MTH',
    'M.DIV.': 'MDIV',
    'M.DIV': 'MDIV',
    'D.MIN.': 'DMIN',
    'D.MIN': 'DMIN',
    'PH.D.': 'PHD',
    'PH.D': 'PHD',
    'DIP.TH.': 'DIPTH',
    'DIP.TH': 'DIPTH',
    'C.TH.': 'CTH',
    'C.TH': 'CTH',
  };

  if (standardAbbreviations[normalized]) {
    return standardAbbreviations[normalized];
  }

  // Replace any internal periods with hyphens, eliminate duplicate hyphens and edge hyphens
  normalized = normalized.replace(/\./g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  return normalized;
}

/**
 * Formats a Registration ID from authoritative master data codes, year, and sequential number.
 * Example: 'NIBS/BTH/2026/1'
 */
export function buildRegistrationId(
  institutionCode: string,
  programCode: string,
  year: number,
  sequence: number
): string {
  const inst = normalizeAcademicCode(institutionCode);
  const prog = normalizeAcademicCode(programCode);
  if (!inst) throw new Error('Institution code is required for Registration ID');
  if (!prog) throw new Error('Program code is required for Registration ID');
  if (!year || isNaN(year)) throw new Error('Valid year is required for Registration ID');
  if (!sequence || sequence < 1) throw new Error('Sequence must be a positive integer');

  return `${inst}/${prog}/${year}/${sequence}`;
}

/**
 * Parses a Registration ID into its components if it matches the standard format.
 */
export function parseRegistrationId(
  regNumber: string
): { institutionCode: string; programCode: string; year: number; sequence: number } | null {
  if (!regNumber) return null;
  const parts = regNumber.split('/');
  if (parts.length !== 4) return null;

  const [institutionCode, programCode, yearStr, seqStr] = parts;
  const year = parseInt(yearStr, 10);
  const sequence = parseInt(seqStr, 10);

  if (isNaN(year) || isNaN(sequence)) return null;

  return {
    institutionCode: normalizeAcademicCode(institutionCode),
    programCode: normalizeAcademicCode(programCode),
    year,
    sequence,
  };
}

/**
 * Deterministically finds the lowest unused sequential integer >= 1 for a given intake year,
 * returning the formatted Permanent Student UID: STU-YYYY-XXXXX (e.g. STU-2026-00001).
 * Never uses Math.random().
 */
export function findLowestUnusedUidSequence(existingUids: string[], year: number): string {
  const prefix = `STU-${year}-`;
  const usedNumbers = new Set<number>();

  for (const uid of existingUids) {
    if (uid && uid.startsWith(prefix)) {
      const suffix = uid.slice(prefix.length);
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num > 0) {
        usedNumbers.add(num);
      }
    }
  }

  let seq = 1;
  while (usedNumbers.has(seq)) {
    seq++;
  }

  return `STU-${year}-${String(seq).padStart(5, '0')}`;
}

/**
 * Computes the next sequential registration number scoped by:
 * Institution Code + Program Code + Year
 * Example:
 * NIBS/BTH/2026/1
 * NIBS/BTH/2026/2
 * But NIBS/MDIV/2026/1 starts at 1.
 * And UBS/BTH/2026/1 starts at 1.
 */
export function findNextRegistrationSequence(
  existingRegistrationNumbers: string[],
  institutionCode: string,
  programCode: string,
  year: number
): { nextSeq: number; registrationNumber: string } {
  const inst = normalizeAcademicCode(institutionCode);
  const prog = normalizeAcademicCode(programCode);
  const prefix = `${inst}/${prog}/${year}/`;
  let maxSeq = 0;

  for (const regNum of existingRegistrationNumbers) {
    if (regNum && regNum.toUpperCase().startsWith(prefix)) {
      const suffix = regNum.slice(prefix.length);
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  return {
    nextSeq,
    registrationNumber: `${prefix}${nextSeq}`,
  };
}
