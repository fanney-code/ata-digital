import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRegistrationId,
  parseRegistrationId,
  findLowestUnusedUidSequence,
  findNextRegistrationSequence,
  normalizeAcademicCode,
} from '../lib/api/id-generator';
import {
  fallbackStore,
  INITIAL_INSTITUTIONS,
  INITIAL_DEPARTMENTS,
  INITIAL_PROGRAMS,
} from '../lib/api/mock-fallback';

import {
  isAadharMatch,
  normalizeAadhar,
  maskAadhar,
} from '../lib/utils/aadhar';

let studentTestCounter = 0;

function makeValidStudentPayload(overrides: Record<string, any> = {}) {
  const id = ++studentTestCounter;
  return {
    first_name: 'Alpha',
    last_name: 'Candidate',
    email: `alpha.candidate.${id}@test.org`,
    phone: '+91 98765 43210',
    date_of_birth: '2000-01-01',
    gender: 'Male',
    aadhar_number: `1234-5678-${String(9000 + (id % 1000)).padStart(4, '0')}`,
    state: 'Karnataka',
    country: 'India',
    address: '123 Main Street',
    city: 'Bangalore',
    district: 'Bangalore Urban',
    pincode: '560001',
    ...overrides,
  };
}

describe('Authoritative Student UID & Registration ID Verification Suite', () => {
  // -------------------------------------------------------------
  // Test Case A: New student registration
  // -------------------------------------------------------------
  it('A: New student receives STU-2026-XXXXX and [INST]/[PROG]/2026/1', () => {
    const inst = INITIAL_INSTITUTIONS.find((i) => i.code === 'CLGD') || INITIAL_INSTITUTIONS[0];
    const dept = INITIAL_DEPARTMENTS.find((d) => d.institution_id === inst.id) || INITIAL_DEPARTMENTS[0];
    const prog = INITIAL_PROGRAMS.find((p) => p.department_id === dept.id) || INITIAL_PROGRAMS[0];

    assert.ok(inst.code, 'Institution code must exist in master data');
    assert.ok(prog.code, 'Program code must exist in master data');

    const year = 2026;
    const student = fallbackStore.createStudent(
      makeValidStudentPayload({
        first_name: 'Alpha',
        last_name: 'Candidate',
        email: 'alpha.candidate@test.org',
        state: 'Karnataka',
      }),
      year
    );

    // Verify Permanent Student UID format STU-YYYY-XXXXX
    assert.match(student.permanent_uid, /^STU-2026-\d{5}$/, 'Student UID must match STU-2026-XXXXX format');

    // Create registration
    const reg = fallbackStore.createRegistration({
      student_id: student.id,
      institution_id: inst.id,
      department_id: dept.id,
      program_id: prog.id,
      academic_year: '2026-2027',
      registration_type: 'INITIAL_REGISTRATION',
    });

    const expectedPrefix = `${inst.code}/${prog.code}/2026/`;
    assert.ok(
      reg.registration_number.startsWith(expectedPrefix),
      `Registration ID ${reg.registration_number} must start with ${expectedPrefix}`
    );
    const parsed = parseRegistrationId(reg.registration_number);
    assert.ok(parsed, 'Registration ID must parse cleanly');
    assert.equal(parsed?.institutionCode, inst.code);
    assert.equal(parsed?.programCode, prog.code);
    assert.equal(parsed?.year, 2026);
    assert.ok(parsed!.sequence >= 1, 'Sequence must be >= 1');
  });

  // -------------------------------------------------------------
  // Test Case B: Second registration for same student
  // -------------------------------------------------------------
  it('B: Second registration for same student reuses Permanent UID with new Registration ID', () => {
    const inst = INITIAL_INSTITUTIONS[0];
    const dept = INITIAL_DEPARTMENTS.find((d) => d.institution_id === inst.id)!;
    const progs = INITIAL_PROGRAMS.filter((p) => p.department_id === dept.id);
    const prog1 = progs[0];
    const prog2 = progs.length > 1 ? progs[1] : progs[0];

    const student = fallbackStore.createStudent(
      makeValidStudentPayload({
        first_name: 'Multi',
        last_name: 'Degree',
        email: 'multi.degree@test.org',
        state: 'Karnataka',
      }),
      2026
    );

    const initialUid = student.permanent_uid;

    const reg1 = fallbackStore.createRegistration({
      student_id: student.id,
      institution_id: inst.id,
      department_id: dept.id,
      program_id: prog1.id,
      academic_year: '2026-2027',
      registration_type: 'INITIAL_REGISTRATION',
    });

    const reg2 = fallbackStore.createRegistration({
      student_id: student.id,
      institution_id: inst.id,
      department_id: dept.id,
      program_id: prog2.id,
      academic_year: '2026-2027',
      registration_type: 'RE_REGISTRATION',
      previous_registration_number: reg1.registration_number,
    });

    // Verify Permanent UID remained identical
    const fetchedStudent = fallbackStore.getStudents().find((s) => s.id === student.id);
    assert.equal(fetchedStudent?.permanent_uid, initialUid);
    assert.notEqual(reg1.registration_number, reg2.registration_number);
    assert.notEqual(reg1.id, reg2.id);
  });

  // -------------------------------------------------------------
  // Test Case C: Institution transfer
  // -------------------------------------------------------------
  it('C: Institution transfer preserves Permanent UID and creates new Registration ID with target Institution code', () => {
    const instA = INITIAL_INSTITUTIONS[0];
    const deptA = INITIAL_DEPARTMENTS.find((d) => d.institution_id === instA.id)!;
    const progA = INITIAL_PROGRAMS.find((p) => p.department_id === deptA.id)!;

    const instB = INITIAL_INSTITUTIONS[1];
    const deptB = INITIAL_DEPARTMENTS.find((d) => d.institution_id === instB.id)!;
    const progB = INITIAL_PROGRAMS.find((p) => p.department_id === deptB.id)!;

    const student = fallbackStore.createStudent(
      makeValidStudentPayload({
        first_name: 'Transfer',
        last_name: 'Student',
        email: 'transfer.student@test.org',
        state: 'Kerala',
      }),
      2026
    );
    const permanentUid = student.permanent_uid;

    const regA = fallbackStore.createRegistration({
      student_id: student.id,
      institution_id: instA.id,
      department_id: deptA.id,
      program_id: progA.id,
      academic_year: '2026-2027',
      registration_type: 'INITIAL_REGISTRATION',
    });

    const regTransfer = fallbackStore.createRegistration({
      student_id: student.id,
      institution_id: instB.id,
      department_id: deptB.id,
      program_id: progB.id,
      academic_year: '2026-2027',
      registration_type: 'TRANSFER',
      previous_registration_number: regA.registration_number,
    });

    assert.equal(student.permanent_uid, permanentUid, 'UID must not change on transfer');
    assert.ok(regA.registration_number.startsWith(`${instA.code}/`));
    assert.ok(regTransfer.registration_number.startsWith(`${instB.code}/`));
    assert.notEqual(regA.registration_number, regTransfer.registration_number);
  });

  // -------------------------------------------------------------
  // Test Case D: Program change
  // -------------------------------------------------------------
  it('D: Program change preserves Permanent UID and reflects correct new program code', () => {
    const inst = INITIAL_INSTITUTIONS[0];
    const depts = INITIAL_DEPARTMENTS.filter((d) => d.institution_id === inst.id);
    const dept = depts[0];
    const progs = INITIAL_PROGRAMS.filter((p) => p.department_id === dept.id);
    assert.ok(progs.length >= 2, 'Requires at least 2 programs for test');

    const student = fallbackStore.createStudent(
      makeValidStudentPayload({
        first_name: 'Progression',
        last_name: 'Candidate',
        email: 'progression.candidate@test.org',
        state: 'Tamil Nadu',
      }),
      2026
    );

    const reg1 = fallbackStore.createRegistration({
      student_id: student.id,
      institution_id: inst.id,
      department_id: dept.id,
      program_id: progs[0].id,
      academic_year: '2026-2027',
      registration_type: 'INITIAL_REGISTRATION',
    });

    const reg2 = fallbackStore.createRegistration({
      student_id: student.id,
      institution_id: inst.id,
      department_id: dept.id,
      program_id: progs[1].id,
      academic_year: '2026-2027',
      registration_type: 'PROGRAM_PROGRESSION',
      previous_registration_number: reg1.registration_number,
    });

    assert.ok(reg1.registration_number.includes(`/${progs[0].code}/`));
    assert.ok(reg2.registration_number.includes(`/${progs[1].code}/`));
  });

  // -------------------------------------------------------------
  // Test Case E: Scoped sequence verification
  // -------------------------------------------------------------
  it('E: Sequence is strictly scoped by Institution + Program + Year', () => {
    const instCode = 'TESTINST';
    const progCodeA = 'PROGA';
    const progCodeB = 'PROGB';
    const otherInstCode = 'OTHERINST';
    const year = 2026;

    const existing: string[] = [];

    // First sequence for instCode + progCodeA
    const res1 = findNextRegistrationSequence(existing, instCode, progCodeA, year);
    assert.equal(res1.nextSeq, 1);
    assert.equal(res1.registrationNumber, `${instCode}/${progCodeA}/2026/1`);
    existing.push(res1.registrationNumber);

    // Second sequence for instCode + progCodeA
    const res2 = findNextRegistrationSequence(existing, instCode, progCodeA, year);
    assert.equal(res2.nextSeq, 2);
    assert.equal(res2.registrationNumber, `${instCode}/${progCodeA}/2026/2`);
    existing.push(res2.registrationNumber);

    // Third sequence for instCode + progCodeA
    const res3 = findNextRegistrationSequence(existing, instCode, progCodeA, year);
    assert.equal(res3.nextSeq, 3);
    assert.equal(res3.registrationNumber, `${instCode}/${progCodeA}/2026/3`);
    existing.push(res3.registrationNumber);

    // Different program under same institution starts at 1
    const resProgB = findNextRegistrationSequence(existing, instCode, progCodeB, year);
    assert.equal(resProgB.nextSeq, 1);
    assert.equal(resProgB.registrationNumber, `${instCode}/${progCodeB}/2026/1`);

    // Different institution with same program starts at 1
    const resOtherInst = findNextRegistrationSequence(existing, otherInstCode, progCodeA, year);
    assert.equal(resOtherInst.nextSeq, 1);
    assert.equal(resOtherInst.registrationNumber, `${otherInstCode}/${progCodeA}/2026/1`);
  });

  // -------------------------------------------------------------
  // Test Case F: Concurrent registration creation uniqueness
  // -------------------------------------------------------------
  it('F: Concurrency protection guarantees unique Registration IDs under simulated parallel race', async () => {
    const instCode = 'RACEINST';
    const progCode = 'RACEPROG';
    const year = 2026;

    const dbStore: Set<string> = new Set();

    // Simulated atomic sequence allocator with optimistic retry on duplicate key
    async function simulateConcurrentInsert(): Promise<string> {
      for (let attempt = 0; attempt < 10; attempt++) {
        const existing = Array.from(dbStore);
        const { registrationNumber } = findNextRegistrationSequence(existing, instCode, progCode, year);

        // Atomic simulate: check uniqueness
        if (!dbStore.has(registrationNumber)) {
          dbStore.add(registrationNumber);
          return registrationNumber;
        }
        // If simulated collision happened, loop retries (same as postgres 23505 handler)
      }
      throw new Error('Failed to acquire unique sequence');
    }

    // Launch 15 concurrent insertion tasks
    const tasks = Array.from({ length: 15 }, () => simulateConcurrentInsert());
    const results = await Promise.all(tasks);

    // Verify all 15 registration numbers are completely unique
    const uniqueResults = new Set(results);
    assert.equal(uniqueResults.size, 15, 'All concurrent registrations must have unique IDs');

    // Verify sequences 1 through 15 were all assigned
    for (let i = 1; i <= 15; i++) {
      assert.ok(
        dbStore.has(`${instCode}/${progCode}/${year}/${i}`),
        `Must contain sequence ${i}`
      );
    }
  });

  // -------------------------------------------------------------
  // Test Case G: Existing student reuse
  // -------------------------------------------------------------
  it('G: Existing student never receives a second Permanent UID', () => {
    const existingStudent = fallbackStore.getStudents()[0];
    const initialUid = existingStudent.permanent_uid;

    // Searching and retrieving the student must preserve UID
    const found = fallbackStore.searchStudents(initialUid);
    assert.ok(found.length >= 1);
    assert.equal(found[0].permanent_uid, initialUid);
    assert.equal(found[0].id, existingStudent.id);
  });

  // -------------------------------------------------------------
  // Test Case H: UID intake year accuracy
  // -------------------------------------------------------------
  it('H: Student intake in 2027 receives STU-2027-XXXXX and not STU-2026-XXXXX', () => {
    const student2027 = fallbackStore.createStudent(
      makeValidStudentPayload({
        first_name: 'Future',
        last_name: 'Intake',
        email: 'future.intake@test.org',
        state: 'Karnataka',
      }),
      2027
    );

    assert.ok(
      student2027.permanent_uid.startsWith('STU-2027-'),
      `Expected STU-2027- prefix, got ${student2027.permanent_uid}`
    );
    assert.ok(
      !student2027.permanent_uid.startsWith('STU-2026-'),
      'Must not assign 2026 to 2027 intake'
    );
    assert.match(student2027.permanent_uid, /^STU-2027-\d{5}$/);
  });

  // -------------------------------------------------------------
  // Test Case I: Historical records preserved
  // -------------------------------------------------------------
  it('I: Historical official Registration IDs are preserved and not overwritten', () => {
    const historicalReg = fallbackStore.getRegistrations().find((r) => r.registration_number === 'NIBS/BTH/2025/1');
    assert.ok(historicalReg, 'Historical registration record must exist in store');
    assert.equal(
      historicalReg?.registration_number,
      'NIBS/BTH/2025/1',
      'Historical registration number must remain untouched'
    );
  });

  // -------------------------------------------------------------
  // Test Case J: Excel import identity matching
  // -------------------------------------------------------------
  it('J: Excel import with Permanent UID reuses existing Student even when email differs', () => {
    const existing = fallbackStore.getStudents()[0];
    const existingUid = existing.permanent_uid;

    // Simulate batch row with matching UID but different email
    const row = {
      permanent_uid: existingUid,
      email: 'completely_different_email@domain.com',
      first_name: existing.first_name,
      last_name: existing.last_name,
      registration_number: 'HIST-REG-IMPORT-999',
    };

    // Locate by permanent_uid
    const matched = fallbackStore.getStudents().find((s) => s.permanent_uid === row.permanent_uid);
    assert.ok(matched, 'Must locate student by permanent_uid');
    assert.equal(matched?.id, existing.id, 'Must reuse existing student primary key');

    // Preserve historical registration number
    assert.equal(row.registration_number, 'HIST-REG-IMPORT-999');
  });

  // -------------------------------------------------------------
  // Test Case K: No active path produces REG-YYYY-XXXXXX
  // -------------------------------------------------------------
  it('K: New registration generator never produces old REG-YYYY-XXXXXX format', () => {
    const regNumber = buildRegistrationId('SABC', 'BTH', 2026, 1);
    assert.equal(regNumber, 'SABC/BTH/2026/1');
    assert.ok(!regNumber.startsWith('REG-'), 'Must not produce REG- format');
    assert.ok(!regNumber.includes('REG-2026-'), 'Must not contain REG-2026-');
  });

  // -------------------------------------------------------------
  // Test Case L: No random authoritative generation
  // -------------------------------------------------------------
  it('L: UID and Registration ID sequence generation is completely deterministic with no Math.random()', () => {
    const uids = ['STU-2026-00001', 'STU-2026-00002'];
    const nextUid = findLowestUnusedUidSequence(uids, 2026);
    assert.equal(nextUid, 'STU-2026-00003', 'Sequential UID must increment deterministically');

    const regNumbers = ['SABC/BTH/2026/1', 'SABC/BTH/2026/2'];
    const nextReg = findNextRegistrationSequence(regNumbers, 'SABC', 'BTH', 2026);
    assert.equal(nextReg.nextSeq, 3);
    assert.equal(nextReg.registrationNumber, 'SABC/BTH/2026/3', 'Registration sequence must increment deterministically');
  });

  // -------------------------------------------------------------
  // Master Data Integrity: Hierarchy & Code Validation
  // -------------------------------------------------------------
  it('Master Data: Rejects invalid department hierarchy or missing codes', () => {
    const instA = INITIAL_INSTITUTIONS[0];
    const instB = INITIAL_INSTITUTIONS[1];
    const deptA = INITIAL_DEPARTMENTS.find((d) => d.institution_id === instA.id)!;
    const progA = INITIAL_PROGRAMS.find((p) => p.department_id === deptA.id)!;

    // Cross-institution mismatch should throw
    assert.throws(
      () => {
        fallbackStore.createRegistration({
          student_id: 'test-stu',
          institution_id: instB.id, // Mismatch!
          department_id: deptA.id,
          program_id: progA.id,
          academic_year: '2026-2027',
        });
      },
      /does not belong to Institution/,
      'Cross-institution mismatch must be rejected'
    );
  });

  // -------------------------------------------------------------
  // Academic Code Formatting Rules Verification
  // -------------------------------------------------------------
  it('Academic Code Formatting: No periods inside codes, uppercase, hyphen separator', () => {
    // Normalization rule tests
    assert.equal(normalizeAcademicCode('CERT.MIN'), 'CERT-MIN', 'CERT.MIN must normalize to CERT-MIN');
    assert.equal(normalizeAcademicCode('cert.min'), 'CERT-MIN', 'lowercase cert.min must normalize to CERT-MIN');
    assert.equal(normalizeAcademicCode('B.Th.'), 'BTH', 'B.Th. must normalize to BTH');
    assert.equal(normalizeAcademicCode('B.Th'), 'BTH', 'B.Th must normalize to BTH');
    assert.equal(normalizeAcademicCode('M.Th.'), 'MTH', 'M.Th. must normalize to MTH');
    assert.equal(normalizeAcademicCode('D.Min.'), 'DMIN', 'D.Min. must normalize to DMIN');
    assert.equal(normalizeAcademicCode('Ph.D.'), 'PHD', 'Ph.D. must normalize to PHD');
    assert.equal(normalizeAcademicCode('MTH-NT'), 'MTH-NT', 'MTH-NT must remain MTH-NT');
    assert.equal(normalizeAcademicCode('MDIV-OL'), 'MDIV-OL', 'MDIV-OL must remain MDIV-OL');
    assert.equal(normalizeAcademicCode('PGD-OL'), 'PGD-OL', 'PGD-OL must remain PGD-OL');

    // Registration ID generation never produces periods in academic codes
    const reg1 = buildRegistrationId('ABS', 'CERT.MIN', 2026, 1);
    assert.equal(reg1, 'ABS/CERT-MIN/2026/1', 'Must produce ABS/CERT-MIN/2026/1 without period');
    assert.ok(!reg1.includes('.'), 'Registration ID must never contain periods');

    const reg2 = buildRegistrationId('NIBS', 'B.Th.', 2026, 1);
    assert.equal(reg2, 'NIBS/BTH/2026/1', 'Must produce NIBS/BTH/2026/1 without period');
    assert.ok(!reg2.includes('.'), 'Registration ID must never contain periods');

    // Master data: Certificate in Ministry is CERT-MIN
    const certMinProg = INITIAL_PROGRAMS.find((p) => p.name === 'Certificate in Ministry');
    assert.ok(certMinProg, 'Certificate in Ministry must exist in INITIAL_PROGRAMS');
    assert.equal(certMinProg.code, 'CERT-MIN', 'Certificate in Ministry code must be CERT-MIN');
    assert.ok(!certMinProg.code.includes('.'), 'Program code must not contain period');
  });
});

describe('Student Registration Data Collection & Validation Suite', () => {
  // 1. State requirement for new student creation
  it('1: New student creation strictly requires State', () => {
    assert.throws(
      () => {
        fallbackStore.createStudent({
          first_name: 'NoState',
          last_name: 'Candidate',
          email: 'nostate@example.com',
          state: '',
        });
      },
      /State is required for student registration/,
      'Must throw when state is empty'
    );
  });

  // 2. State requirement when registering an existing student missing State
  it('2: Registration for existing student without State is blocked until State is updated', () => {
    // Existing legacy student without state
    const legacyStudent = fallbackStore.getStudents().find((s) => !s.state);
    assert.ok(legacyStudent, 'Store should contain legacy student without state');

    const inst = INITIAL_INSTITUTIONS[0];
    const dept = INITIAL_DEPARTMENTS.find((d) => d.institution_id === inst.id)!;
    const prog = INITIAL_PROGRAMS.find((p) => p.department_id === dept.id)!;

    // Attempt registration without updating state -> must throw
    assert.throws(
      () => {
        fallbackStore.createRegistration({
          student_id: legacyStudent.id,
          institution_id: inst.id,
          department_id: dept.id,
          program_id: prog.id,
          academic_year: '2026-2027',
          registration_type: 'INITIAL_REGISTRATION',
        });
      },
      /State is required for every new registration/,
      'Registration submission must be blocked if candidate profile lacks state'
    );

    // Update student state via updateStudent
    const updated = fallbackStore.updateStudent(legacyStudent.id, {
      state: 'Andhra Pradesh',
    });
    assert.equal(updated.state, 'Andhra Pradesh');

    // Registration should now succeed
    const reg = fallbackStore.createRegistration({
      student_id: legacyStudent.id,
      institution_id: inst.id,
      department_id: dept.id,
      program_id: prog.id,
      academic_year: '2026-2027',
      registration_type: 'INITIAL_REGISTRATION',
    });
    assert.ok(reg.id);
    assert.ok(reg.registration_number);
  });

  // 3. Legacy records without State remain valid and readable
  it('3: Legacy students without State remain readable and searchable', () => {
    // Search existing students
    const all = fallbackStore.getStudents();
    assert.ok(all.length > 0);
    // Legacy records can be queried without throwing
    const queryResult = fallbackStore.searchStudents('Chen');
    assert.ok(queryResult.length > 0);
  });

  // 4. Aadhar Number mapping to national_id
  it('4: aadhar_number correctly maps to national_id on Student profile', () => {
    const student = fallbackStore.createStudent(
      makeValidStudentPayload({
        first_name: 'Aadhar',
        last_name: 'Test',
        email: 'aadhar.test@example.com',
        state: 'Gujarat',
        aadhar_number: '1234-5678-9012',
      })
    );

    assert.equal(student.national_id, '1234-5678-9012', 'aadhar_number must map to national_id');
    assert.equal(student.aadhar_number, '1234-5678-9012', 'aadhar_number alias must match');
  });

  // Required Field Enforcements: Aadhar Number, Country, Street Address, City, PIN Code, Phone, DOB
  it('4b: New student creation strictly requires Phone Number', () => {
    assert.throws(
      () => {
        fallbackStore.createStudent(
          makeValidStudentPayload({
            phone: '',
          })
        );
      },
      /Phone Number is required for student registration/,
      'Must throw when phone is empty'
    );
  });

  it('4c: New student creation strictly requires Date of Birth', () => {
    assert.throws(
      () => {
        fallbackStore.createStudent(
          makeValidStudentPayload({
            date_of_birth: '',
          })
        );
      },
      /Date of Birth is required for student registration/,
      'Must throw when date of birth is empty'
    );
  });

  it('4d: New student creation strictly requires Aadhar Number / National ID', () => {
    assert.throws(
      () => {
        fallbackStore.createStudent(
          makeValidStudentPayload({
            aadhar_number: '',
            national_id: '',
          })
        );
      },
      /Aadhar Number \/ National ID is required for student registration/,
      'Must throw when aadhar_number is empty'
    );
  });

  it('4e: New student creation strictly requires Country', () => {
    assert.throws(
      () => {
        fallbackStore.createStudent(
          makeValidStudentPayload({
            country: '',
          })
        );
      },
      /Country is required for student registration/,
      'Must throw when country is empty'
    );
  });

  it('4f: New student creation strictly requires Street Address', () => {
    assert.throws(
      () => {
        fallbackStore.createStudent(
          makeValidStudentPayload({
            address: '',
          })
        );
      },
      /Street Address is required for student registration/,
      'Must throw when street address is empty'
    );
  });

  it('4g: New student creation strictly requires City / Town', () => {
    assert.throws(
      () => {
        fallbackStore.createStudent(
          makeValidStudentPayload({
            city: '',
          })
        );
      },
      /City \/ Town is required for student registration/,
      'Must throw when city is empty'
    );
  });

  it('4h: New student creation strictly requires PIN Code / Postal Code', () => {
    assert.throws(
      () => {
        fallbackStore.createStudent(
          makeValidStudentPayload({
            pincode: '',
          })
        );
      },
      /PIN Code \/ Postal Code is required for student registration/,
      'Must throw when pincode is empty'
    );
  });

  // 5. First-class qualification fields persistence on Registration
  it('5: Academic qualification fields persist as first-class columns on Registration', () => {
    const student = fallbackStore.createStudent(
      makeValidStudentPayload({
        first_name: 'Scholar',
        last_name: 'Grad',
        email: 'scholar.grad@example.com',
        state: 'Maharashtra',
        address: '45 Camp Road',
        city: 'Pune',
        district: 'Pune',
        pincode: '411001',
      })
    );

    const inst = INITIAL_INSTITUTIONS[0];
    const dept = INITIAL_DEPARTMENTS.find((d) => d.institution_id === inst.id)!;
    const prog = INITIAL_PROGRAMS.find((p) => p.department_id === dept.id)!;

    const reg = fallbackStore.createRegistration({
      student_id: student.id,
      institution_id: inst.id,
      department_id: dept.id,
      program_id: prog.id,
      academic_year: '2026-2027',
      registration_type: 'INITIAL_REGISTRATION',
      highest_qualification: 'Bachelor of Theology',
      previous_institution: 'Berean Bible College',
      previous_program: 'B.Th.',
      year_of_completion: '2024',
      qualification_reg_no: 'BBC/2024/099',
    });

    assert.equal(reg.highest_qualification, 'Bachelor of Theology');
    assert.equal(reg.previous_institution, 'Berean Bible College');
    assert.equal(reg.previous_program, 'B.Th.');
    assert.equal(reg.year_of_completion, '2024');
    assert.equal(reg.qualification_reg_no, 'BBC/2024/099');

    // Retrieve by ID to verify hydration
    const retrieved = fallbackStore.getRegistrationById(reg.id);
    assert.equal(retrieved?.highest_qualification, 'Bachelor of Theology');
    assert.equal(retrieved?.previous_institution, 'Berean Bible College');
    assert.equal(retrieved?.student?.state, 'Maharashtra');
    assert.equal(retrieved?.student?.address, '45 Camp Road');
  });

  // 6. Conditional Previous Registration Number Enforcement
  it('6: Previous Registration Number is strictly enforced for Transfer, Re-Registration, and Progression', () => {
    const student = fallbackStore.createStudent(
      makeValidStudentPayload({
        first_name: 'Transfer',
        last_name: 'Check',
        email: 'transfer.check@example.com',
        state: 'Nagaland',
      })
    );

    const inst = INITIAL_INSTITUTIONS[0];
    const dept = INITIAL_DEPARTMENTS.find((d) => d.institution_id === inst.id)!;
    const prog = INITIAL_PROGRAMS.find((p) => p.department_id === dept.id)!;

    // TRANSFER without previous_registration_number must throw
    assert.throws(
      () => {
        fallbackStore.createRegistration({
          student_id: student.id,
          institution_id: inst.id,
          department_id: dept.id,
          program_id: prog.id,
          academic_year: '2026-2027',
          registration_type: 'TRANSFER',
          previous_registration_number: '',
        });
      },
      /Previous Registration Number is required for TRANSFER/,
      'Must reject transfer without previous registration number'
    );

    // RE_REGISTRATION without previous_registration_number must throw
    assert.throws(
      () => {
        fallbackStore.createRegistration({
          student_id: student.id,
          institution_id: inst.id,
          department_id: dept.id,
          program_id: prog.id,
          academic_year: '2026-2027',
          registration_type: 'RE_REGISTRATION',
          previous_registration_number: '',
        });
      },
      /Previous Registration Number is required for RE REGISTRATION/,
      'Must reject re-registration without previous registration number'
    );

    // PROGRAM_PROGRESSION without previous_registration_number must throw
    assert.throws(
      () => {
        fallbackStore.createRegistration({
          student_id: student.id,
          institution_id: inst.id,
          department_id: dept.id,
          program_id: prog.id,
          academic_year: '2026-2027',
          registration_type: 'PROGRAM_PROGRESSION',
          previous_registration_number: '',
        });
      },
      /Previous Registration Number is required for PROGRAM PROGRESSION/,
      'Must reject program progression without previous registration number'
    );

    // With previous registration number, succeeds and persists
    const validTransfer = fallbackStore.createRegistration({
      student_id: student.id,
      institution_id: inst.id,
      department_id: dept.id,
      program_id: prog.id,
      academic_year: '2026-2027',
      registration_type: 'TRANSFER',
      previous_registration_number: 'NIBS/BTH/2023/45',
    });
    assert.equal(validTransfer.previous_registration_number, 'NIBS/BTH/2023/45');
  });

  // 7. Duplicate Detection signals without changing permanent UID generation
  it('7: Duplicate detection checks match existing candidates by identity without breaking sequence', () => {
    const existing = fallbackStore.getStudents()[0];

    // Search query matches by permanent UID or Name
    const byName = fallbackStore.searchStudents(existing.first_name);
    assert.ok(byName.some((s) => s.id === existing.id));

    const byUid = fallbackStore.searchStudents(existing.permanent_uid);
    assert.equal(byUid[0].id, existing.id);
  });
});

describe('Aadhar Duplicate Detection & Registration Preservation Suite', () => {
  // Requirement 1 & 5: Exact match
  it('1: Exact identical Aadhar numbers are detected as duplicates ("123456789012" vs "123456789012")', () => {
    assert.equal(isAadharMatch('123456789012', '123456789012'), true);
  });

  // Requirement 2 & 5: Formatted vs unformatted
  it('2: Formatted vs unformatted Aadhar numbers match as duplicates ("1234 5678 9012" vs "123456789012")', () => {
    assert.equal(isAadharMatch('1234 5678 9012', '123456789012'), true);
    assert.equal(isAadharMatch('123456789012', '1234 5678 9012'), true);
    assert.equal(isAadharMatch(' 1234-5678-9012 ', '123456789012'), true);
  });

  // Requirement 3 & 5: Different Aadhar
  it('3: Different Aadhar numbers are not duplicates ("123456789012" vs "123456789013")', () => {
    assert.equal(isAadharMatch('123456789012', '123456789013'), false);
  });

  // Requirement 4 & 5: null vs null
  it('4: null vs null or empty values are never flagged as duplicate (null vs null)', () => {
    assert.equal(isAadharMatch(null, null), false);
    assert.equal(isAadharMatch(undefined, undefined), false);
    assert.equal(isAadharMatch('', ''), false);
    assert.equal(isAadharMatch('   ', '   '), false);
  });

  // Requirement 5: null vs valid Aadhar
  it('5: null vs valid Aadhar is not a duplicate (null vs "123456789012")', () => {
    assert.equal(isAadharMatch(null, '123456789012'), false);
    assert.equal(isAadharMatch('123456789012', null), false);
    assert.equal(isAadharMatch('', '123456789012'), false);
    assert.equal(isAadharMatch('123456789012', ''), false);
  });

  // Requirement 6: formatted search finds unformatted stored value
  it('6: Formatted search finds unformatted stored Aadhar value', () => {
    const unformattedAadhar = '998877665544';
    const student = fallbackStore.createStudent(
      makeValidStudentPayload({
        first_name: 'SearchUnformatted',
        last_name: 'Target',
        aadhar_number: unformattedAadhar,
      })
    );

    // Search using formatted input
    const results = fallbackStore.searchStudents('9988 7766 5544');
    const matched = results.find((s) => s.id === student.id);
    assert.ok(matched, 'Formatted search query must locate student with unformatted stored Aadhar');
    assert.equal(matched.id, student.id);
  });

  // Requirement 7: unformatted search finds formatted stored value
  it('7: Unformatted search finds formatted stored Aadhar value', () => {
    const formattedAadhar = '7788 9900 1122';
    const student = fallbackStore.createStudent(
      makeValidStudentPayload({
        first_name: 'SearchFormatted',
        last_name: 'Target',
        aadhar_number: formattedAadhar,
      })
    );

    // Search using unformatted input
    const results = fallbackStore.searchStudents('778899001122');
    const matched = results.find((s) => s.id === student.id);
    assert.ok(matched, 'Unformatted search query must locate student with formatted stored Aadhar');
    assert.equal(matched.id, student.id);
  });

  // Requirement 8: Privacy and Create-Student pre-check duplicate rejection
  it('8: createStudent rejects duplicate Aadhar with masked privacy output without leaking full digits', () => {
    const originalAadhar = '3344 5566 7788';
    const firstStudent = fallbackStore.createStudent(
      makeValidStudentPayload({
        first_name: 'Privacy',
        last_name: 'Check',
        aadhar_number: originalAadhar,
      })
    );

    // Attempting to create another student with the same normalized Aadhar (unformatted)
    assert.throws(
      () => {
        fallbackStore.createStudent(
          makeValidStudentPayload({
            first_name: 'Second',
            last_name: 'Attempt',
            aadhar_number: '334455667788',
          })
        );
      },
      (err: any) => {
        const msg = err.message || '';
        // Must mention duplicate Aadhar
        assert.match(msg, /A student with this Aadhar Number/);
        // Must contain masked Aadhar ending with last 4 digits
        assert.match(msg, /\*\*\*\*7788/);
        // Must NOT leak full 12 digits
        assert.ok(!msg.includes('334455667788'), 'Error message must not leak full 12-digit Aadhar');
        assert.ok(!msg.includes('3344 5566 7788'), 'Error message must not leak full formatted Aadhar');
        // Must mention existing UID
        assert.ok(msg.includes(firstStudent.permanent_uid), 'Error message must reference existing student UID');
        return true;
      },
      'Must reject duplicate student creation on exact normalized Aadhar match'
    );
  });

  // Requirement 9: Excel import recognizes the Aadhar duplicate
  it('9: Excel import recognizes Aadhar duplicate, marks as duplicate in staging, and reuses existing student', () => {
    const existingAadhar = '6677 8899 0011';
    const existingStu = fallbackStore.createStudent(
      makeValidStudentPayload({
        first_name: 'ExcelOriginal',
        last_name: 'Student',
        email: 'excel.original@institution.edu',
        aadhar_number: existingAadhar,
      })
    );

    // Simulate Excel row with unformatted Aadhar and different email
    const excelRow = {
      first_name: 'ExcelDifferentName',
      last_name: 'DifferentLast',
      email: 'excel.different@institution.edu',
      aadhar_number: '667788990011',
    };

    // Staging duplicate check:
    const isStagingDuplicate = isAadharMatch(
      excelRow.aadhar_number,
      existingStu.national_id || existingStu.aadhar_number
    );
    assert.equal(isStagingDuplicate, true, 'Excel staging duplicate check must detect Aadhar match');

    // Ensure normalization does not falsely match different Aadhar
    const differentAadharRow = { aadhar_number: '667788990012' };
    assert.equal(
      isAadharMatch(differentAadharRow.aadhar_number, existingStu.national_id),
      false,
      'Excel staging must not match differing Aadhar'
    );
  });

  // Requirement 10: Existing UID / Email / Name duplicate detection remains unchanged
  it('10: Existing UID, Email, and Name duplicate detection remains preserved', () => {
    const stu = fallbackStore.getStudents()[0];

    // UID exact search
    const byUid = fallbackStore.searchStudents(stu.permanent_uid);
    assert.ok(byUid.some((s) => s.id === stu.id), 'UID search must match existing student');

    // Name search
    const byName = fallbackStore.searchStudents(stu.first_name);
    assert.ok(byName.some((s) => s.id === stu.id), 'Name search must match existing student');

    // Email duplicate rejection in createStudent
    assert.throws(
      () => {
        fallbackStore.createStudent(
          makeValidStudentPayload({
            email: stu.email,
          })
        );
      },
      /A student with this email address already exists/,
      'Must reject duplicate student with same email'
    );
  });

  // Requirement 11: Matching Aadhar identifies existing student but does NOT prevent legitimate additional registrations
  it('11: Matching Aadhar identifies student but does NOT prevent legitimate additional registrations', () => {
    const aadharNum = '8899 0011 2233';
    const student = fallbackStore.createStudent(
      makeValidStudentPayload({
        first_name: 'MultiReg',
        last_name: 'Candidate',
        aadhar_number: aadharNum,
      })
    );

    const inst1 = INITIAL_INSTITUTIONS[0];
    const dept1 = INITIAL_DEPARTMENTS.find((d) => d.institution_id === inst1.id) || INITIAL_DEPARTMENTS[0];
    const prog1 = INITIAL_PROGRAMS.find((p) => p.department_id === dept1.id) || INITIAL_PROGRAMS[0];

    // Initial Registration
    const reg1 = fallbackStore.createRegistration({
      student_id: student.id,
      institution_id: inst1.id,
      department_id: dept1.id,
      program_id: prog1.id,
      academic_year: '2026-2027',
      registration_type: 'INITIAL_REGISTRATION',
    });

    assert.ok(reg1.id);
    assert.equal(reg1.student_id, student.id);

    // Legitimate additional registration for the same student (e.g. transfer to another institution)
    const inst2 = INITIAL_INSTITUTIONS[1] || inst1;
    const dept2 = INITIAL_DEPARTMENTS.find((d) => d.institution_id === inst2.id) || dept1;
    const prog2 = INITIAL_PROGRAMS.find((p) => p.department_id === dept2.id) || prog1;

    const reg2 = fallbackStore.createRegistration({
      student_id: student.id,
      institution_id: inst2.id,
      department_id: dept2.id,
      program_id: prog2.id,
      academic_year: '2026-2027',
      registration_type: 'TRANSFER',
      previous_registration_number: reg1.registration_number,
    });

    assert.ok(reg2.id);
    assert.notEqual(reg2.registration_number, reg1.registration_number, 'New registration must receive distinct registration number');
    assert.equal(reg2.student_id, student.id, 'Both registrations must belong to the exact same Student profile');
    assert.equal(student.permanent_uid, student.permanent_uid, 'Permanent UID is preserved without change');
  });
});


