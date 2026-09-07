import { describe, it } from 'node:test';
import assert from 'node:assert';
import { assertPermission } from '../lib/api/supabase-service';
import { fallbackStore, INITIAL_INSTITUTIONS, INITIAL_DEPARTMENTS, INITIAL_PROGRAMS } from '../lib/api/mock-fallback';
import { ActorContext } from '../lib/types';

describe('Authoritative Role-Based Permission Scope & Security Boundary Suite', () => {
  // South Asia Institute of Advanced Christian Studies (SAIACS)
  const saiacsInst = INITIAL_INSTITUTIONS.find((i) => i.code === 'SAIACS') || INITIAL_INSTITUTIONS[0];
  const saiacsDept = INITIAL_DEPARTMENTS.find((d) => d.institution_id === saiacsInst.id) || INITIAL_DEPARTMENTS[0];
  const saiacsProg = INITIAL_PROGRAMS.find((p) => p.department_id === saiacsDept.id) || INITIAL_PROGRAMS[0];

  // Allahabad Bible Seminary (ABS)
  const absInst = INITIAL_INSTITUTIONS.find((i) => i.code === 'ABS') || INITIAL_INSTITUTIONS[1];

  // Test Actor Contexts
  const adminActor: ActorContext = {
    role: 'ADMINISTRATOR',
    userId: 'admin-001',
    email: 'admin@atadigital.org',
  };

  const saiacsRegistrarActor: ActorContext = {
    role: 'REGISTRAR',
    institutionId: saiacsInst.id,
    userId: 'reg-saiacs-001',
    email: 'registrar@saiacs.edu',
  };

  const absRegistrarActor: ActorContext = {
    role: 'REGISTRAR',
    institutionId: absInst.id,
    userId: 'reg-abs-001',
    email: 'registrar@abs.edu',
  };

  const universalActor: ActorContext = {
    role: 'UNIVERSAL',
    userId: 'univ-001',
    email: 'universal@ataindia.org',
  };

  /* ------------------------------------------------------------------
   * 1. ADMINISTRATOR Role Tests
   * ------------------------------------------------------------------ */
  describe('1. Administrator Governance Scope', () => {
    it('Administrator CAN approve a submitted registration', async () => {
      const reg = fallbackStore.getRegistrations()[0];
      const updated = fallbackStore.updateRegistrationStatus(
        reg.id,
        'APPROVED',
        'Approved by Academic Governance Council',
        adminActor
      );
      assert.strictEqual(updated.status, 'APPROVED');
    });

    it('Administrator CAN request correction (CORRECTION_REQUIRED)', async () => {
      const reg = fallbackStore.getRegistrations()[0];
      const updated = fallbackStore.updateRegistrationStatus(
        reg.id,
        'CORRECTION_REQUIRED',
        'High school transcript is illegible.',
        adminActor
      );
      assert.strictEqual(updated.status, 'CORRECTION_REQUIRED');
      assert.strictEqual(updated.rejection_reason, 'High school transcript is illegible.');
    });

    it('Administrator CAN perform controlled unlock (UNDER_REVIEW) on approved record', async () => {
      const reg = fallbackStore.getRegistrations()[0];
      // First ensure it is approved
      fallbackStore.updateRegistrationStatus(reg.id, 'APPROVED', 'Approved', adminActor);

      // Now admin performs controlled unlock
      const unlocked = fallbackStore.updateRegistrationStatus(
        reg.id,
        'UNDER_REVIEW',
        'Controlled Admin Unlock: candidate requested name correction',
        adminActor
      );
      assert.strictEqual(unlocked.status, 'UNDER_REVIEW');
    });

    it('Administrator CANNOT create new student registration (403 Forbidden)', () => {
      assert.throws(
        () => {
          fallbackStore.createRegistration(
            {
              student_id: 'test-stu-1',
              institution_id: saiacsInst.id,
              department_id: saiacsDept.id,
              program_id: saiacsProg.id,
              academic_year: '2026–2027',
              registration_type: 'INITIAL_REGISTRATION',
            },
            adminActor
          );
        },
        /403 Forbidden.*Administrators are restricted from creating registrations/
      );
    });

    it('Administrator CANNOT edit draft registration (403 Forbidden)', () => {
      const reg = fallbackStore.getRegistrations()[0];
      assert.throws(
        () => {
          fallbackStore.updateRegistrationDraft(
            reg.id,
            { academic_year: '2027–2028' },
            adminActor
          );
        },
        /403 Forbidden.*Administrators cannot edit registration/
      );
    });

    it('Administrator CANNOT transition status to RESUBMITTED (403 Forbidden)', () => {
      const reg = fallbackStore.getRegistrations()[0];
      assert.throws(
        () => {
          fallbackStore.updateRegistrationStatus(
            reg.id,
            'RESUBMITTED',
            'Admin resubmit attempt',
            adminActor
          );
        },
        /403 Forbidden.*Administrators cannot perform RESUBMITTED/
      );
    });

    it('Administrator CAN view registrations across all institutions', () => {
      const allRegs = fallbackStore.getRegistrations(adminActor);
      assert.ok(allRegs.length > 0);
    });
  });

  /* ------------------------------------------------------------------
   * 2. REGISTRAR Role Scoped Scope & Cross-Institution Boundary Tests
   * ------------------------------------------------------------------ */
  describe('2. Registrar Operational Scope & Institution Boundary', () => {
    it('Registrar CAN view registrations within assigned institution', () => {
      const saiacsRegs = fallbackStore.getRegistrations(saiacsRegistrarActor);
      for (const r of saiacsRegs) {
        assert.strictEqual(r.institution_id, saiacsInst.id);
      }
    });

    it('Registrar WITHOUT assigned institution gets empty list', () => {
      const unassignedActor: ActorContext = {
        role: 'REGISTRAR',
        userId: 'reg-unassigned',
        email: 'unassigned@example.edu',
      };
      const regs = fallbackStore.getRegistrations(unassignedActor);
      assert.deepStrictEqual(regs, []);
    });

    it('Registrar CANNOT access another institution registration by ID', () => {
      const allRegs = fallbackStore.getRegistrations();
      const saiacsReg = allRegs.find((r) => r.institution_id === saiacsInst.id);
      if (saiacsReg) {
        assert.throws(
          () => {
            fallbackStore.getRegistrationById(saiacsReg.id, absRegistrarActor);
          },
          /403 Forbidden.*Access denied to other institutions/
        );
      }
    });

    it('Registrar CANNOT create registration for another institution (403 Forbidden)', () => {
      assert.throws(
        () => {
          fallbackStore.createRegistration(
            {
              student_id: 'test-stu-saiacs',
              institution_id: saiacsInst.id, // Target SAIACS, but actor is ABS
              department_id: saiacsDept.id,
              program_id: saiacsProg.id,
              academic_year: '2026–2027',
              registration_type: 'INITIAL_REGISTRATION',
            },
            absRegistrarActor
          );
        },
        /403 Forbidden.*Registrars can only create registrations for their assigned institution/
      );
    });

    it('Registrar CAN submit draft and resubmit corrected records for assigned institution', () => {
      const saiacsRegs = fallbackStore.getRegistrations(saiacsRegistrarActor);
      if (saiacsRegs.length > 0) {
        const targetReg = saiacsRegs[0];
        const resubmitted = fallbackStore.updateRegistrationStatus(
          targetReg.id,
          'RESUBMITTED',
          'Updated with missing high school certificates',
          saiacsRegistrarActor
        );
        assert.strictEqual(resubmitted.status, 'RESUBMITTED');
      }
    });

    it('Registrar CANNOT perform controlled unlock from APPROVED (403 Forbidden)', () => {
      const saiacsRegs = fallbackStore.getRegistrations(saiacsRegistrarActor);
      if (saiacsRegs.length > 0) {
        const targetReg = saiacsRegs[0];
        // Set to APPROVED
        fallbackStore.updateRegistrationStatus(targetReg.id, 'APPROVED', undefined, adminActor);

        // Registrar attempts controlled unlock
        assert.throws(
          () => {
            fallbackStore.updateRegistrationStatus(
              targetReg.id,
              'UNDER_REVIEW',
              'Registrar unlock attempt',
              saiacsRegistrarActor
            );
          },
          /403 Forbidden.*Only Administrators can perform a Controlled Unlock/
        );
      }
    });
  });

  /* ------------------------------------------------------------------
   * 3. UNIVERSAL Role Tests (Strict Read-Only Oversight)
   * ------------------------------------------------------------------ */
  describe('3. Universal Read-Only Oversight Scope', () => {
    it('Universal CAN view all registrations and students across all institutions', () => {
      const regs = fallbackStore.getRegistrations(universalActor);
      const students = fallbackStore.getStudents(universalActor);
      assert.ok(regs.length > 0);
      assert.ok(students.length > 0);
    });

    it('Universal CANNOT create registrations (403 Forbidden)', () => {
      assert.throws(
        () => {
          fallbackStore.createRegistration(
            {
              student_id: 'test-stu',
              institution_id: saiacsInst.id,
              department_id: saiacsDept.id,
              program_id: saiacsProg.id,
              academic_year: '2026–2027',
              registration_type: 'INITIAL_REGISTRATION',
            },
            universalActor
          );
        },
        /403 Forbidden.*Universal role is read-only/
      );
    });

    it('Universal CANNOT edit registrations (403 Forbidden)', () => {
      const reg = fallbackStore.getRegistrations()[0];
      assert.throws(
        () => {
          fallbackStore.updateRegistrationDraft(
            reg.id,
            { academic_year: '2027–2028' },
            universalActor
          );
        },
        /403 Forbidden.*Universal role is read-only/
      );
    });

    it('Universal CANNOT update workflow status (403 Forbidden)', () => {
      const reg = fallbackStore.getRegistrations()[0];
      assert.throws(
        () => {
          fallbackStore.updateRegistrationStatus(
            reg.id,
            'APPROVED',
            'Universal approve attempt',
            universalActor
          );
        },
        /403 Forbidden.*Universal role is read-only/
      );
    });

    it('Universal CANNOT delete registrations (403 Forbidden)', () => {
      const reg = fallbackStore.getRegistrations()[0];
      assert.throws(
        () => {
          fallbackStore.deleteRegistration(reg.id, universalActor);
        },
        /403 Forbidden.*Universal role is read-only/
      );
    });

    it('Universal CANNOT create student profiles (403 Forbidden)', () => {
      assert.throws(
        () => {
          fallbackStore.createStudent(
            {
              first_name: 'Test',
              last_name: 'Candidate',
              email: 'test@candidate.org',
              state: 'Karnataka',
            },
            undefined, // intakeYear (2nd positional param)
            universalActor
          );
        },
        /403 Forbidden.*Universal role is read-only/
      );
    });
  });

  /* ------------------------------------------------------------------
   * 4. assertPermission Centralized Security Invariant Tests
   * ------------------------------------------------------------------ */
  describe('4. Centralized assertPermission Invariants', () => {
    it('Blocks non-admin from MANAGE_USERS', () => {
      assert.throws(
        () => assertPermission('MANAGE_USERS', saiacsRegistrarActor),
        /403 Forbidden.*Only Administrators can manage user accounts/
      );
      assert.throws(
        () => assertPermission('MANAGE_USERS', universalActor),
        /403 Forbidden/
      );
      assert.doesNotThrow(() => assertPermission('MANAGE_USERS', adminActor));
    });

    it('Blocks non-admin from ASSIGN_NOTICE', () => {
      assert.throws(
        () => assertPermission('ASSIGN_NOTICE', saiacsRegistrarActor),
        /403 Forbidden.*Only Administrators can manage user accounts and assign notices/
      );
      assert.doesNotThrow(() => assertPermission('ASSIGN_NOTICE', adminActor));
    });

    it('Blocks non-registrar from IMPORT_BATCH', () => {
      assert.throws(
        () => assertPermission('IMPORT_BATCH', adminActor),
        /403 Forbidden.*Administrators cannot import registration batches/
      );
      assert.throws(
        () => assertPermission('IMPORT_BATCH', universalActor),
        /403 Forbidden.*Universal role is read-only/
      );
      assert.doesNotThrow(() =>
        assertPermission('IMPORT_BATCH', saiacsRegistrarActor, saiacsInst.id)
      );
    });
  });
});
