import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import {
  assertPermission,
  fetchStudents,
  fetchStudentById,
  fetchRegistrations,
  fetchRegistrationById,
  fetchDocuments,
  createRegistration,
  updateRegistrationDraft,
  updateRegistrationStatus,
  uploadDocumentAttachment,
  createStudent,
  batchImportStudentRegistrations,
} from '../lib/api/supabase-service';
import {
  fallbackStore,
  INITIAL_INSTITUTIONS,
  INITIAL_DEPARTMENTS,
  INITIAL_PROGRAMS,
} from '../lib/api/mock-fallback';
import { ActorContext, Registration, Student } from '../lib/types';

describe('Registrar Institution Isolation & Cross-Institution Access Suite', () => {
  // 1. Authoritative Institutions
  const saiacsInst = INITIAL_INSTITUTIONS.find((i) => i.code === 'SAIACS') || {
    id: '32de4338-962a-4b12-ba2d-4e2dc2dcb7da',
    name: 'South Asia Institute of Advanced Christian Studies',
    code: 'SAIACS',
  };
  const ubsInst = INITIAL_INSTITUTIONS.find((i) => i.code === 'UBS') || {
    id: '8dcc7eac-69df-4cd1-b687-65fe76f14b97',
    name: 'Union Biblical Seminary',
    code: 'UBS',
  };
  const absInst = INITIAL_INSTITUTIONS.find((i) => i.code === 'ABS') || {
    id: '50a48f4a-7142-4462-97ab-bc06aaf0036b',
    name: 'Allahabad Bible Seminary',
    code: 'ABS',
  };

  // Departments and Programs
  const saiacsDept = INITIAL_DEPARTMENTS.find((d) => d.institution_id === saiacsInst.id) || INITIAL_DEPARTMENTS[0];
  const saiacsProg = INITIAL_PROGRAMS.find((p) => p.department_id === saiacsDept.id) || INITIAL_PROGRAMS[0];

  const ubsDept = INITIAL_DEPARTMENTS.find((d) => d.institution_id === ubsInst.id) || INITIAL_DEPARTMENTS[0];
  const ubsProg = INITIAL_PROGRAMS.find((p) => p.department_id === ubsDept.id) || INITIAL_PROGRAMS[0];

  const absDept = INITIAL_DEPARTMENTS.find((d) => d.institution_id === absInst.id) || INITIAL_DEPARTMENTS[0];
  const absProg = INITIAL_PROGRAMS.find((p) => p.department_id === absDept.id) || INITIAL_PROGRAMS[0];

  // 2. Three Demo Registrar Identities (Assigned by Administrator, authoritative server-backed profile)
  const saiacsRegistrarActor: ActorContext = {
    role: 'REGISTRAR',
    institutionId: saiacsInst.id,
    userId: 'reg-saiacs-demo',
    email: 'm.thomas@saiacs.org',
  };

  const ubsRegistrarActor: ActorContext = {
    role: 'REGISTRAR',
    institutionId: ubsInst.id,
    userId: 'reg-ubs-demo',
    email: 'ashishc@ubs.ac.in',
  };

  const absRegistrarActor: ActorContext = {
    role: 'REGISTRAR',
    institutionId: absInst.id,
    userId: 'reg-abs-demo',
    email: 'registrar@abseminary.edu.ph',
  };

  // 3. Administrator & Universal Actors
  const adminActor: ActorContext = {
    role: 'ADMINISTRATOR',
    userId: 'admin-council-dir',
    email: 'admin@ataportal.edu',
  };

  const universalActor: ActorContext = {
    role: 'UNIVERSAL',
    userId: 'universal-auditor',
    email: 'universal@ataportal.edu',
  };

  // Pre-seed sample records for SAIACS, UBS, and ABS in fallbackStore
  let saiacsStudent: Student;
  let ubsStudent: Student;
  let absStudent: Student;
  let saiacsReg: Registration;
  let ubsReg: Registration;
  let absReg: Registration;

  before(() => {
    // Create SAIACS student & registration
    saiacsStudent = fallbackStore.createStudent(
      {
        first_name: 'Timothy',
        last_name: 'Kallu',
        email: 'timothy.kallu@saiacs-test.edu',
        state: 'Karnataka',
        phone: '+91 98801 11222',
        date_of_birth: '2000-03-15',
        aadhar_number: '9123 4567 8901',
        country: 'India',
        address: 'Hennur Main Road',
        city: 'Bengaluru',
        pincode: '560077',
      },
      2026,
      saiacsRegistrarActor
    );

    saiacsReg = fallbackStore.createRegistration(
      {
        student_id: saiacsStudent.id,
        institution_id: saiacsInst.id,
        department_id: saiacsDept.id,
        program_id: saiacsProg.id,
        academic_year: '2026-2027',
        registration_type: 'INITIAL_REGISTRATION',
        status: 'DRAFT',
        highest_qualification: 'Bachelor of Arts',
        previous_institution: 'Bangalore University',
        previous_program: 'B.A.',
        year_of_completion: '2023',
      },
      saiacsRegistrarActor
    );

    // Create UBS student & registration
    ubsStudent = fallbackStore.createStudent(
      {
        first_name: 'Priyanka',
        last_name: 'Gaikwad',
        email: 'priyanka.gaikwad@ubs-test.edu',
        state: 'Maharashtra',
        phone: '+91 98230 33445',
        date_of_birth: '1999-07-22',
        aadhar_number: '9234 5678 9012',
        country: 'India',
        address: 'Bibwewadi Road',
        city: 'Pune',
        pincode: '411037',
      },
      2026,
      ubsRegistrarActor
    );

    ubsReg = fallbackStore.createRegistration(
      {
        student_id: ubsStudent.id,
        institution_id: ubsInst.id,
        department_id: ubsDept.id,
        program_id: ubsProg.id,
        academic_year: '2026-2027',
        registration_type: 'INITIAL_REGISTRATION',
        status: 'SUBMITTED',
        highest_qualification: 'Bachelor of Commerce',
        previous_institution: 'Pune University',
        previous_program: 'B.Com',
        year_of_completion: '2022',
      },
      ubsRegistrarActor
    );

    // Create ABS student & registration
    absStudent = fallbackStore.createStudent(
      {
        first_name: 'Anugrah',
        last_name: 'Masihi',
        email: 'anugrah.masihi@abs-test.edu',
        state: 'Uttar Pradesh',
        phone: '+91 94150 55667',
        date_of_birth: '2001-11-10',
        aadhar_number: '9345 6789 0123',
        country: 'India',
        address: '20 Stanley Road',
        city: 'Prayagraj',
        pincode: '211002',
      },
      2026,
      absRegistrarActor
    );

    absReg = fallbackStore.createRegistration(
      {
        student_id: absStudent.id,
        institution_id: absInst.id,
        department_id: absDept.id,
        program_id: absProg.id,
        academic_year: '2026-2027',
        registration_type: 'INITIAL_REGISTRATION',
        status: 'UNDER_REVIEW',
        highest_qualification: 'Bachelor of Science',
        previous_institution: 'Allahabad University',
        previous_program: 'B.Sc',
        year_of_completion: '2024',
      },
      absRegistrarActor
    );
  });

  /* ------------------------------------------------------------------
   * Mandatory Isolation Requirements 1-9: 3x3 Cross-Institution Access Matrix
   * ------------------------------------------------------------------ */

  it('1. SAIACS Registrar can access SAIACS records', () => {
    const regs = fallbackStore.getRegistrations(saiacsRegistrarActor);
    assert(regs.some((r) => r.id === saiacsReg.id), 'SAIACS registrar should see SAIACS registration');

    const fetchedReg = fallbackStore.getRegistrationById(saiacsReg.id, saiacsRegistrarActor);
    assert.strictEqual(fetchedReg?.id, saiacsReg.id);

    const students = fallbackStore.getStudents(saiacsRegistrarActor);
    assert(students.some((s) => s.id === saiacsStudent.id), 'SAIACS registrar should see SAIACS student');
  });

  it('2. SAIACS Registrar cannot access UBS records', () => {
    const regs = fallbackStore.getRegistrations(saiacsRegistrarActor);
    assert(!regs.some((r) => r.id === ubsReg.id), 'SAIACS registrar MUST NOT see UBS registration in listing');

    assert.throws(
      () => fallbackStore.getRegistrationById(ubsReg.id, saiacsRegistrarActor),
      /403 Forbidden.*Access denied to other institutions' registrations/
    );

    const students = fallbackStore.getStudents(saiacsRegistrarActor);
    assert(!students.some((s) => s.id === ubsStudent.id), 'SAIACS registrar MUST NOT see UBS student');
  });

  it('3. SAIACS Registrar cannot access ABS records', () => {
    const regs = fallbackStore.getRegistrations(saiacsRegistrarActor);
    assert(!regs.some((r) => r.id === absReg.id), 'SAIACS registrar MUST NOT see ABS registration in listing');

    assert.throws(
      () => fallbackStore.getRegistrationById(absReg.id, saiacsRegistrarActor),
      /403 Forbidden.*Access denied to other institutions' registrations/
    );

    const students = fallbackStore.getStudents(saiacsRegistrarActor);
    assert(!students.some((s) => s.id === absStudent.id), 'SAIACS registrar MUST NOT see ABS student');
  });

  it('4. UBS Registrar can access UBS records', () => {
    const regs = fallbackStore.getRegistrations(ubsRegistrarActor);
    assert(regs.some((r) => r.id === ubsReg.id), 'UBS registrar should see UBS registration');

    const fetchedReg = fallbackStore.getRegistrationById(ubsReg.id, ubsRegistrarActor);
    assert.strictEqual(fetchedReg?.id, ubsReg.id);

    const students = fallbackStore.getStudents(ubsRegistrarActor);
    assert(students.some((s) => s.id === ubsStudent.id), 'UBS registrar should see UBS student');
  });

  it('5. UBS Registrar cannot access SAIACS records', () => {
    const regs = fallbackStore.getRegistrations(ubsRegistrarActor);
    assert(!regs.some((r) => r.id === saiacsReg.id), 'UBS registrar MUST NOT see SAIACS registration in listing');

    assert.throws(
      () => fallbackStore.getRegistrationById(saiacsReg.id, ubsRegistrarActor),
      /403 Forbidden.*Access denied to other institutions' registrations/
    );

    const students = fallbackStore.getStudents(ubsRegistrarActor);
    assert(!students.some((s) => s.id === saiacsStudent.id), 'UBS registrar MUST NOT see SAIACS student');
  });

  it('6. UBS Registrar cannot access ABS records', () => {
    const regs = fallbackStore.getRegistrations(ubsRegistrarActor);
    assert(!regs.some((r) => r.id === absReg.id), 'UBS registrar MUST NOT see ABS registration in listing');

    assert.throws(
      () => fallbackStore.getRegistrationById(absReg.id, ubsRegistrarActor),
      /403 Forbidden.*Access denied to other institutions' registrations/
    );

    const students = fallbackStore.getStudents(ubsRegistrarActor);
    assert(!students.some((s) => s.id === absStudent.id), 'UBS registrar MUST NOT see ABS student');
  });

  it('7. ABS Registrar can access ABS records', () => {
    const regs = fallbackStore.getRegistrations(absRegistrarActor);
    assert(regs.some((r) => r.id === absReg.id), 'ABS registrar should see ABS registration');

    const fetchedReg = fallbackStore.getRegistrationById(absReg.id, absRegistrarActor);
    assert.strictEqual(fetchedReg?.id, absReg.id);

    const students = fallbackStore.getStudents(absRegistrarActor);
    assert(students.some((s) => s.id === absStudent.id), 'ABS registrar should see ABS student');
  });

  it('8. ABS Registrar cannot access SAIACS records', () => {
    const regs = fallbackStore.getRegistrations(absRegistrarActor);
    assert(!regs.some((r) => r.id === saiacsReg.id), 'ABS registrar MUST NOT see SAIACS registration in listing');

    assert.throws(
      () => fallbackStore.getRegistrationById(saiacsReg.id, absRegistrarActor),
      /403 Forbidden.*Access denied to other institutions' registrations/
    );

    const students = fallbackStore.getStudents(absRegistrarActor);
    assert(!students.some((s) => s.id === saiacsStudent.id), 'ABS registrar MUST NOT see SAIACS student');
  });

  it('9. ABS Registrar cannot access UBS records', () => {
    const regs = fallbackStore.getRegistrations(absRegistrarActor);
    assert(!regs.some((r) => r.id === ubsReg.id), 'ABS registrar MUST NOT see UBS registration in listing');

    assert.throws(
      () => fallbackStore.getRegistrationById(ubsReg.id, absRegistrarActor),
      /403 Forbidden.*Access denied to other institutions' registrations/
    );

    const students = fallbackStore.getStudents(absRegistrarActor);
    assert(!students.some((s) => s.id === ubsStudent.id), 'ABS registrar MUST NOT see UBS student');
  });

  /* ------------------------------------------------------------------
   * Mandatory Requirements 10-14: Scoping, Direct Access & Mutation Invariants
   * ------------------------------------------------------------------ */

  it("10. Registrar search cannot return another institution's student", () => {
    // SAIACS registrar searches for Priyanka (UBS student) -> must return empty
    const saiacsSearchResults = fallbackStore.searchStudents('Priyanka', saiacsRegistrarActor);
    assert.strictEqual(
      saiacsSearchResults.length,
      0,
      'SAIACS Registrar search for UBS student "Priyanka" MUST return empty'
    );

    // UBS registrar searches for Timothy (SAIACS student) -> must return empty
    const ubsSearchResults = fallbackStore.searchStudents('Timothy', ubsRegistrarActor);
    assert.strictEqual(
      ubsSearchResults.length,
      0,
      'UBS Registrar search for SAIACS student "Timothy" MUST return empty'
    );

    // ABS registrar searches for Timothy (SAIACS student) -> must return empty
    const absSearchResults = fallbackStore.searchStudents('Timothy', absRegistrarActor);
    assert.strictEqual(
      absSearchResults.length,
      0,
      'ABS Registrar search for SAIACS student "Timothy" MUST return empty'
    );

    // Searching within own institution finds the student
    const saiacsOwnSearch = fallbackStore.searchStudents('Timothy', saiacsRegistrarActor);
    assert.strictEqual(saiacsOwnSearch.length, 1);
    assert.strictEqual(saiacsOwnSearch[0].id, saiacsStudent.id);
  });

  it('11. Direct record-ID access across institutions is denied', () => {
    // Attempt to access by registration ID or permanent UID directly
    assert.throws(
      () => fallbackStore.getRegistrationById(ubsReg.id, saiacsRegistrarActor),
      /403 Forbidden/
    );
    assert.throws(
      () => fallbackStore.getRegistrationById(saiacsReg.id, ubsRegistrarActor),
      /403 Forbidden/
    );
    assert.throws(
      () => fallbackStore.getRegistrationById(saiacsReg.id, absRegistrarActor),
      /403 Forbidden/
    );

    const studentDirect = fallbackStore.getStudentById(ubsStudent.id, saiacsRegistrarActor);
    assert.strictEqual(studentDirect, null, 'Direct getStudentById across institutions must return null');
  });

  it('12. Direct document access across institutions is denied', () => {
    // Assert UPLOAD_DOCUMENT fails if targetInstitutionId does not match
    assert.throws(
      () => assertPermission('UPLOAD_DOCUMENT', saiacsRegistrarActor, ubsInst.id),
      /403 Forbidden: Cannot upload documents for another institution/
    );
    assert.throws(
      () => assertPermission('UPLOAD_DOCUMENT', ubsRegistrarActor, saiacsInst.id),
      /403 Forbidden: Cannot upload documents for another institution/
    );
    assert.throws(
      () => assertPermission('UPLOAD_DOCUMENT', absRegistrarActor, saiacsInst.id),
      /403 Forbidden: Cannot upload documents for another institution/
    );

    // Own institution upload permission succeeds
    assert.doesNotThrow(() => assertPermission('UPLOAD_DOCUMENT', saiacsRegistrarActor, saiacsInst.id));
    assert.doesNotThrow(() => assertPermission('UPLOAD_DOCUMENT', ubsRegistrarActor, ubsInst.id));
    assert.doesNotThrow(() => assertPermission('UPLOAD_DOCUMENT', absRegistrarActor, absInst.id));
  });

  it('13. Cross-institution mutation attempts are denied', () => {
    // Attempt cross-institution registration status change
    assert.throws(
      () =>
        fallbackStore.updateRegistrationStatus(
          ubsReg.id,
          'SUBMITTED',
          'Attempted by SAIACS registrar',
          saiacsRegistrarActor
        ),
      /403 Forbidden: Cannot alter status of registration belonging to another institution/
    );

    // Attempt cross-institution draft edit
    assert.throws(
      () =>
        fallbackStore.updateRegistrationDraft(
          ubsReg.id,
          { notes: 'Hacked notes by another registrar' },
          saiacsRegistrarActor
        ),
      /403 Forbidden: Cannot modify registration belonging to another institution/
    );

    // Attempt cross-institution registration creation
    assert.throws(
      () =>
        fallbackStore.createRegistration(
          {
            student_id: saiacsStudent.id,
            institution_id: ubsInst.id, // target UBS while actor is SAIACS
            department_id: ubsDept.id,
            program_id: ubsProg.id,
            academic_year: '2026-2027',
          },
          saiacsRegistrarActor
        ),
      /403 Forbidden: Registrars can only create registrations for their assigned institution/
    );
  });

  it('14. Manipulating a client-supplied institution_id cannot bypass authorization', () => {
    // Simulate malicious client attempting to send institution_id = UBS while actor institution is SAIACS
    assert.throws(
      () =>
        assertPermission('CREATE_REGISTRATION', saiacsRegistrarActor, ubsInst.id),
      /403 Forbidden: Registrars can only create registrations for their assigned institution/
    );

    assert.throws(
      () =>
        assertPermission('EDIT_REGISTRATION', saiacsRegistrarActor, ubsInst.id),
      /403 Forbidden: Cannot modify registration belonging to another institution/
    );

    assert.throws(
      () =>
        assertPermission('UPDATE_STATUS', saiacsRegistrarActor, ubsInst.id),
      /403 Forbidden: Cannot alter status of registration belonging to another institution/
    );

    assert.throws(
      () =>
        assertPermission('DELETE_REGISTRATION', saiacsRegistrarActor, ubsInst.id),
      /403 Forbidden: Cannot delete registration belonging to another institution/
    );

    // An unassigned registrar (no institutionId) is strictly blocked from all operations
    const unassignedActor: ActorContext = {
      role: 'REGISTRAR',
      userId: 'reg-no-inst',
      email: 'unassigned@test.edu',
    };
    assert.throws(
      () => assertPermission('CREATE_REGISTRATION', unassignedActor, saiacsInst.id),
      /403 Forbidden: Registrar has no assigned institution/
    );
  });

  /* ------------------------------------------------------------------
   * Mandatory Requirements 15-16: Cross-Institution Administrator & Universal Read-Only
   * ------------------------------------------------------------------ */

  it('15. Administrator can search/view across all institutions', () => {
    // Admin listing includes SAIACS, UBS, and ABS
    const allRegs = fallbackStore.getRegistrations(adminActor);
    assert(allRegs.some((r) => r.id === saiacsReg.id), 'Admin must see SAIACS registration');
    assert(allRegs.some((r) => r.id === ubsReg.id), 'Admin must see UBS registration');
    assert(allRegs.some((r) => r.id === absReg.id), 'Admin must see ABS registration');

    // Admin direct access to records of any institution
    const fetchedSaiacs = fallbackStore.getRegistrationById(saiacsReg.id, adminActor);
    const fetchedUbs = fallbackStore.getRegistrationById(ubsReg.id, adminActor);
    const fetchedAbs = fallbackStore.getRegistrationById(absReg.id, adminActor);
    assert.strictEqual(fetchedSaiacs?.id, saiacsReg.id);
    assert.strictEqual(fetchedUbs?.id, ubsReg.id);
    assert.strictEqual(fetchedAbs?.id, absReg.id);

    // Admin cross-institution search
    const saiacsStudentSearch = fallbackStore.searchStudents('Timothy', adminActor);
    const ubsStudentSearch = fallbackStore.searchStudents('Priyanka', adminActor);
    const absStudentSearch = fallbackStore.searchStudents('Anugrah', adminActor);
    assert.strictEqual(saiacsStudentSearch.length, 1);
    assert.strictEqual(ubsStudentSearch.length, 1);
    assert.strictEqual(absStudentSearch.length, 1);

    // Admin governance actions across institutions (Approve / Correction Required)
    const approvedUbs = fallbackStore.updateRegistrationStatus(
      ubsReg.id,
      'APPROVED',
      'Council approval',
      adminActor
    );
    assert.strictEqual(approvedUbs.status, 'APPROVED');

    const correctionAbs = fallbackStore.updateRegistrationStatus(
      absReg.id,
      'CORRECTION_REQUIRED',
      'Please attach authenticated seal',
      adminActor
    );
    assert.strictEqual(correctionAbs.status, 'CORRECTION_REQUIRED');
  });

  it('16. Universal remains read-only and retains its existing cross-institution read access', () => {
    // Universal sees all institutions
    const allRegs = fallbackStore.getRegistrations(universalActor);
    assert(allRegs.some((r) => r.id === saiacsReg.id), 'Universal must see SAIACS registration');
    assert(allRegs.some((r) => r.id === ubsReg.id), 'Universal must see UBS registration');
    assert(allRegs.some((r) => r.id === absReg.id), 'Universal must see ABS registration');

    // Universal direct access across institutions
    const fetchedSaiacs = fallbackStore.getRegistrationById(saiacsReg.id, universalActor);
    const fetchedUbs = fallbackStore.getRegistrationById(ubsReg.id, universalActor);
    assert.strictEqual(fetchedSaiacs?.id, saiacsReg.id);
    assert.strictEqual(fetchedUbs?.id, ubsReg.id);

    // Universal cross-institution search
    const saiacsSearch = fallbackStore.searchStudents('Timothy', universalActor);
    const ubsSearch = fallbackStore.searchStudents('Priyanka', universalActor);
    assert.strictEqual(saiacsSearch.length, 1);
    assert.strictEqual(ubsSearch.length, 1);

    // Universal is strictly READ-ONLY (all mutations throw 403)
    assert.throws(
      () =>
        fallbackStore.createRegistration(
          {
            student_id: saiacsStudent.id,
            institution_id: saiacsInst.id,
            department_id: saiacsDept.id,
            program_id: saiacsProg.id,
            academic_year: '2026-2027',
          },
          universalActor
        ),
      /403 Forbidden: Universal role is read-only/
    );

    assert.throws(
      () =>
        fallbackStore.updateRegistrationStatus(
          saiacsReg.id,
          'APPROVED',
          'Universal attempt',
          universalActor
        ),
      /403 Forbidden: Universal role is read-only/
    );

    assert.throws(
      () =>
        fallbackStore.updateRegistrationDraft(
          saiacsReg.id,
          { notes: 'Universal attempt' },
          universalActor
        ),
      /403 Forbidden: Universal role is read-only/
    );
  });
});
